const axios = require('axios');

/**
 * Calls the LLM to analyze emotional content of the input text.
 *
 * @param {string} text
 * @returns {Promise<{emotionScore, energyLevel, mainEmotion, reasoning}>}
 */
async function analyzeEmotion(text) {
  const prompt = buildEmotionPrompt(text);
  const raw = await callLLM(prompt);
  return parseJSON(raw);
}

function buildEmotionPrompt(text) {
  return `你是一位专业的情绪分析助手。请分析以下用户输入的情绪状态，并严格以 JSON 格式输出结果。

用户输入：
"${text}"

请输出以下 JSON（不要有任何额外文字，不要 markdown 代码块）：
{
  "emotionScore": <0到1之间的浮点数，0=极度负面，1=极度正面>,
  "energyLevel": "<Low | Medium | High>",
  "mainEmotion": "<用中文一个词概括主要情绪>",
  "reasoning": "<简短解释，50字以内>"
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
    // Strip markdown code fences if the model wraps the JSON
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    throw new Error('Failed to parse emotion JSON from LLM response.');
  }
}

module.exports = { analyzeEmotion };
