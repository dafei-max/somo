const axios = require('axios');
const { randomUUID } = require('crypto');

// ── In-memory session store (MVP) ────────────────────────────────────────────
const sessions = new Map();

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

  console.log(`[conversationEngine] turn=${session.turns} history_len=${session.messages.length}`);
  session.messages.forEach((m, i) =>
    console.log(`  [${i}] ${m.role}: ${m.text.slice(0, 40)}...`)
  );

  // Build chat_history: all messages except the current user message (sent as query)
  const chatHistory = session.messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.text,
  }));

  const res = await axios.post(
    process.env.WORKFLOW_URL,
    {
      query: userText,
      chat_history: chatHistory,
    },
    {
      headers: {
        APP_ID: process.env.WORKFLOW_APP_ID,
        APP_KEY: process.env.WORKFLOW_APP_KEY,
      },
      timeout: 30000,
    }
  );

  console.log('[conversationEngine] workflow raw response:', JSON.stringify(res.data).slice(0, 500));

  // Extract text from workflow response: replies[0].content[0].text
  const rawText = res.data?.replies?.[0]?.content?.[0]?.text;
  if (!rawText) {
    throw new Error(`Unexpected workflow response shape: ${JSON.stringify(res.data).slice(0, 300)}`);
  }

  // Parse the inner JSON returned by the workflow
  let workflowData;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    workflowData = JSON.parse(match ? match[0] : cleaned);
  } catch {
    throw new Error('Failed to parse workflow response JSON');
  }

  // Map workflow fields → app's internal format
  const STRATEGY_MAP = { '1': 'listen', '2': 'comfort', '3': 'understand', '4': 'guide', '5': 'inspire' };
  const MOOD_SCORE = { positive: 0.85, happy: 0.85, joy: 0.85, neutral: 0.5, sad: 0.2, depressed: 0.15, angry: 0.25, anxious: 0.3, negative: 0.2 };
  const ENERGY_INTENSITY = { high: 0.85, medium: 0.55, low: 0.3 };

  const moodKey = (workflowData.mood || '').toLowerCase();
  const energyKey = (workflowData.energy || '').toLowerCase();

  const parsed = {
    reply: workflowData.assistant_reply || workflowData.reply || '',
    mainEmotion: workflowData.mood || '平静',
    strategy: STRATEGY_MAP[String(workflowData.strategy)] || workflowData.strategy || 'listen',
    emotionScore: MOOD_SCORE[moodKey] ?? 0.5,
    emotionIntensity: ENERGY_INTENSITY[energyKey] ?? 0.5,
    actionTip: workflowData.actionTip || '',
    cardTitle: workflowData.cardTitle || workflowData.mood || '',
    topicShift: workflowData.topicShift ?? false,
  };

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
