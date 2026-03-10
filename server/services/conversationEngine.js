const axios = require('axios');
const { randomUUID } = require('crypto');

// ── In-memory session store (MVP) ────────────────────────────────────────────
const sessions = new Map();

const SYSTEM_PROMPT = `你是 Somo，一位温柔的情绪陪伴助手。你的核心原则：
1. 先倾听，不急于给建议或解决方案
2. 准确感知用户当前的情绪状态
3. 每一轮回应都要自然、口语化，像朋友一样说话，不说废话
4. 随着对话深入，逐渐更贴近用户的真实情绪

策略说明：
- listen（倾听）：用户刚开始说，先反射情绪，不给建议，只是陪伴
- comfort（安慰）：用户情绪低落，给予温暖和接纳，不评判
- understand（理解）：帮用户更清晰地看见自己的情绪，可以提问
- guide（引导）：温和地帮用户找到一个可行的小方向
- inspire（激励）：用户有正向能量，给予鼓励和共鸣

每次回复必须严格以 JSON 格式输出（不要有任何额外文字，不要 markdown 代码块）：
{
  "reply": "<回复文字，自然口语化，80-120字，不说废话>",
  "emotionScore": <0到1浮点数，0=极度负面，1=极度正面>,
  "emotionIntensity": <0到1浮点数，0=情绪平淡，1=情绪极度强烈>,
  "mainEmotion": "<主要情绪，中文一词>",
  "strategy": "<listen|comfort|understand|guide|inspire>",
  "actionTip": "<微行动建议，一句话，20-40字，具体可操作，只在strategy为guide或inspire时认真写，其余可简略>",
  "cardTitle": "<情绪卡片标题，8字以内，诗意，只在情绪浓烈时认真写>",
  "topicShift": <true 或 false，当用户明显切换到与当前对话完全无关的新话题时为 true，自然的话题延伸不算，且至少已有3轮对话才可能为 true>
}`;

// ── Session management ────────────────────────────────────────────────────────

function createSession() {
  const id = randomUUID();
  sessions.set(id, {
    id,
    messages: [],
    turns: 0,
    emotionHistory: [],
    actionFired: null,
    createdAt: Date.now(),
  });
  return id;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

// ── Main chat function ────────────────────────────────────────────────────────

async function chat(sessionId, userText, clientHistory, clientActionFired) {
  let session = sessions.get(sessionId);
  if (!session) {
    // Restore from client-provided history (e.g. after server restart)
    const restoredMessages = Array.isArray(clientHistory) ? clientHistory : [];
    sessions.set(sessionId, {
      id: sessionId,
      messages: restoredMessages,
      turns: restoredMessages.filter((m) => m.role === 'user').length,
      emotionHistory: [],
      actionFired: clientActionFired || null,
      createdAt: Date.now(),
    });
    session = sessions.get(sessionId);
    if (restoredMessages.length > 0) {
      console.log(`[conversationEngine] restored session ${sessionId} with ${restoredMessages.length} messages`);
    }
  }

  // Add user message to history
  session.messages.push({ role: 'user', text: userText });
  session.turns += 1;

  // Build input array — use plain string content so Responses API
  // correctly distinguishes user (input_text) vs assistant (output_text)
  const input = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...session.messages.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  ];

  console.log(`[conversationEngine] turn=${session.turns} history_len=${session.messages.length}`);
  session.messages.forEach((m, i) =>
    console.log(`  [${i}] ${m.role}: ${m.text.slice(0, 40)}...`)
  );

  const res = await axios.post(
    `${process.env.LLM_API_BASE}/responses`,
    {
      model: process.env.LLM_MODEL,
      input,
      thinking: { type: 'disabled' },
    },
    {
      headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}` },
      timeout: 30000,
    }
  );

  const message = res.data.output.find((o) => o.type === 'message');
  const rawText = message.content[0].text;

  // Parse structured JSON from LLM
  let parsed;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : cleaned);
  } catch {
    throw new Error('Failed to parse LLM response JSON');
  }

  // Store assistant reply in history
  session.messages.push({ role: 'assistant', text: parsed.reply });

  // Track emotion history
  session.emotionHistory.push({
    turn: session.turns,
    score: parsed.emotionScore,
    intensity: parsed.emotionIntensity,
    emotion: parsed.mainEmotion,
    strategy: parsed.strategy,
  });

  const topicShift = parsed.topicShift === true && session.turns >= 3;
  return { session, ...parsed, topicShift };
}

module.exports = { chat, createSession, getSession, clearSession };
