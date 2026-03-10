const axios = require('axios');

/**
 * Generates a personalized emotional response based on the selected skill.
 *
 * @param {string} skill        - 'comfort' | 'reflect' | 'inspire'
 * @param {string} userText     - original user input
 * @param {string} mainEmotion  - detected main emotion
 * @returns {Promise<{responseText, actionTip, cardTitle, cardMoodColor}>}
 */
async function generateResponse(skill, userText, mainEmotion) {
  const prompt = buildResponsePrompt(skill, userText, mainEmotion);
  const raw = await callLLM(prompt);
  return parseJSON(raw);
}

function buildResponsePrompt(skill, userText, mainEmotion) {
  const toneGuide = {
    comfort: '温柔、安抚、接纳，语气像一位贴心朋友，不给建议，只是陪伴和理解',
    reflect: '理性、温和、结构清晰，帮用户整理思路，提出一个可操作的自我复盘问题',
    inspire: '充满能量、鼓励行动、简洁有力，帮用户把情绪转化为具体行动',
  };

  const colorGuide = {
    comfort: '#A8C5DA（柔蓝）',
    reflect: '#B8D4C8（薄荷绿）',
    inspire: '#F5C842（暖金）',
  };

  return `你是 Somo，一位多模态情绪陪伴助手。当前激活的 skill 是「${skill}」。

用户输入：
"${userText}"

检测到的主要情绪：${mainEmotion}

语气要求：${toneGuide[skill]}

请严格输出以下 JSON（不要有任何额外文字，不要 markdown 代码块）：
{
  "responseText": "<情绪回应正文，100-150字，符合语气要求>",
  "actionTip": "<微行动建议，一句话，20-40字，具体可操作>",
  "cardTitle": "<Live Card 标题，10字以内>",
  "cardMoodColor": "<推荐卡片主色调十六进制，参考：${colorGuide[skill]}>"
}`;
}

async function callLLM(prompt) {
  const res = await axios.post(
    `${process.env.LLM_API_BASE}/responses`,
    {
      model: process.env.LLM_MODEL,
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }],
        },
      ],
      thinking: { type: 'disabled' },
    },
    {
      headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}` },
      timeout: 15000,
    }
  );
  const message = res.data.output.find((o) => o.type === 'message');
  return message.content[0].text;
}

function parseJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    throw new Error('Failed to parse response JSON from LLM.');
  }
}

module.exports = { generateResponse };
