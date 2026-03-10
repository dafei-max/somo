const express = require('express');
const router = express.Router();

const { analyzeEmotion } = require('../services/emotionAnalyzer');
const { selectSkill } = require('../services/skillRouter');
const { generateResponse } = require('../services/responseGenerator');
const { generateCardImage } = require('../services/imageGenerator');
const { generateSound } = require('../services/soundGenerator');
const { getMockResponse } = require('../mock/mockData');

const USE_MOCK = process.env.USE_MOCK === 'true';

/**
 * POST /api/emotion
 * Body: { text: string, audioUrl?: string, imageUrl?: string }
 */
router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (USE_MOCK) {
    const mock = getMockResponse(text.trim());
    return res.json(mock);
  }

  try {
    // ── Step 1: Emotion analysis ─────────────────────────────────────────
    let emotionData;
    try {
      emotionData = await analyzeEmotion(text.trim());
    } catch (err) {
      console.warn('[emotionAnalyzer] error, falling back to mock:', err.message);
      return res.json({ ...getMockResponse(text.trim()), _fallback: true });
    }

    const { emotionScore, energyLevel, mainEmotion, reasoning } = emotionData;

    // ── Step 2: Skill routing ────────────────────────────────────────────
    const skill = selectSkill(emotionScore);

    // ── Step 3: Response text generation ────────────────────────────────
    let responseData;
    try {
      responseData = await generateResponse(skill, text.trim(), mainEmotion);
    } catch (err) {
      console.warn('[responseGenerator] error, falling back to mock:', err.message);
      return res.json({
        emotionScore,
        energyLevel,
        mainEmotion,
        skill,
        ...getMockResponse(text.trim()),
        _fallback: true,
      });
    }

    const { responseText, actionTip, cardTitle, cardMoodColor } = responseData;

    // ── Step 4: Image generation (with polling) ──────────────────────────
    // Run in parallel with sound selection to save time
    const [cardImageUrl, soundPreset] = await Promise.all([
      generateCardImage({ cardTitle, mainEmotion, cardMoodColor, skill, emotionScore }).catch((err) => {
        console.warn('[imageGenerator] fallback:', err.message);
        const hex = (cardMoodColor || '#A8C5DA').replace('#', '');
        return `https://placehold.co/600x400/${hex}/${hex}?text=Somo`;
      }),
      // ── Step 5: Sound preset (instant, no API) ─────────────────────────
      generateSound(skill, mainEmotion).catch(() => null),
    ]);

    return res.json({
      emotionScore,
      energyLevel,
      mainEmotion,
      reasoning,
      skill,
      responseText,
      actionTip,
      cardTitle,
      cardMoodColor,
      cardImageUrl,
      soundUrl: soundPreset?.url ?? '',
      soundLabel: soundPreset?.label ?? '',
    });
  } catch (err) {
    console.error('[/api/emotion] unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
