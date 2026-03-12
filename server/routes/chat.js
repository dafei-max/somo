const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();

const { chat, clearSession } = require('../services/conversationEngine');
const { decideAction } = require('../services/actionRouter');
const { generateCardImage } = require('../services/imageGenerator');
const { selectSkill } = require('../services/skillRouter');

// ── Card store: pending confirmation OR generating ────────────────────────────
// status: 'confirm' | 'generating' | 'ready' | 'failed'
const pendingCards = new Map();

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { sessionId, text, history, actionFired: clientActionFired } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const result = await chat(sessionId, text.trim(), history, clientActionFired);
    const {
      session, reply, emotionScore, emotionIntensity,
      mainEmotion, strategy, actionTip, cardTitle, topicShift,
    } = result;

    // ── Topic shift: start fresh session ────────────────────────────────────
    let newSessionId = null;
    if (topicShift) {
      clearSession(sessionId);
      newSessionId = randomUUID();
      console.log(`[chat] topic shift detected — new session: ${newSessionId}`);
    }

    // ── Decide action ────────────────────────────────────────────────────────
    // Explicit user request → auto-generate (skip confirm)
    // Emotion threshold → ask user to confirm first
    const EXPLICIT_IMAGE_RE = /生图|生成.{0,6}图|给我.{0,6}图|帮.{0,6}图|来.{0,4}张?图|画.{0,6}图|想(要|看).{0,6}图/;
    // Explicit requests always fire regardless of prior actionFired state
    const isExplicit = EXPLICIT_IMAGE_RE.test(text.trim());
    const action = isExplicit ? 'image_auto' : decideAction(session, { emotionScore, emotionIntensity, strategy });

    console.log(
      `[actionRouter] turn=${session.turns} score=${emotionScore?.toFixed(2)} intensity=${emotionIntensity?.toFixed(2)} strategy=${strategy} actionFired=${session.actionFired || 'none'} topicShift=${topicShift} explicit=${isExplicit} → ${action || 'no action'}`
    );

    const responsePayload = {
      reply,
      emotionScore,
      emotionIntensity,
      mainEmotion,
      strategy,
      action: null,
      topicShift: !!topicShift,
      newSessionId,
    };

    if (action === 'image_auto') {
      // ── User explicitly asked for image — start generating immediately ────
      session.actionFired = 'image';
      const cardId = randomUUID();
      const skill = selectSkill(emotionScore);
      const title = cardTitle || mainEmotion + '的此刻';
      const moodColor = skill === 'comfort' ? '#A8C5DA' : skill === 'inspire' ? '#F5C842' : '#B8D4C8';

      pendingCards.set(cardId, {
        status: 'generating',
        cardTitle: title,
        mainEmotion,
        cardMoodColor: moodColor,
        skill,
        emotionScore,
        sessionId,
      });

      generateCardImage({ cardTitle: title, mainEmotion, cardMoodColor: moodColor, skill, emotionScore })
        .then((imageUrl) => {
          const card = pendingCards.get(cardId);
          if (card) { card.status = 'ready'; card.imageUrl = imageUrl; }
        })
        .catch((err) => {
          console.warn('[chat] auto image generation failed:', err.message);
          const card = pendingCards.get(cardId);
          if (card) card.status = 'failed';
        });

      responsePayload.action = 'image_auto';
      responsePayload.cardId = cardId;
      responsePayload.cardTitle = title;

    } else if (action === 'image') {
      // ── Emotion-triggered — ask user to confirm first ─────────────────────
      session.actionFired = 'image';
      const cardId = randomUUID();
      const skill = selectSkill(emotionScore);
      const title = cardTitle || mainEmotion + '的此刻';
      const moodColor = skill === 'comfort' ? '#A8C5DA' : skill === 'inspire' ? '#F5C842' : '#B8D4C8';

      pendingCards.set(cardId, {
        status: 'confirm',
        cardTitle: title,
        mainEmotion,
        cardMoodColor: moodColor,
        skill,
        emotionScore,
        sessionId,
      });

      responsePayload.action = 'image_confirm';
      responsePayload.cardId = cardId;
      responsePayload.cardTitle = title;
    }

    return res.json(responsePayload);

  } catch (err) {
    console.error('[/api/chat] error:', err.message);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ── POST /api/chat/confirm/:cardId ── User confirmed image generation ─────────
router.post('/confirm/:cardId', (req, res) => {
  const card = pendingCards.get(req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (card.status !== 'confirm') return res.json({ status: card.status });

  card.status = 'generating';

  generateCardImage({
    cardTitle: card.cardTitle,
    mainEmotion: card.mainEmotion,
    cardMoodColor: card.cardMoodColor,
    skill: card.skill,
    emotionScore: card.emotionScore,
  })
    .then((imageUrl) => {
      card.status = 'ready';
      card.imageUrl = imageUrl;
    })
    .catch((err) => {
      console.warn('[chat] image generation failed:', err.message);
      card.status = 'failed';
    });

  return res.json({ ok: true, cardTitle: card.cardTitle });
});

// ── POST /api/chat/cancel/:cardId ── User cancelled image generation ──────────
router.post('/cancel/:cardId', (req, res) => {
  pendingCards.delete(req.params.cardId);
  return res.json({ ok: true });
});

// ── GET /api/chat/card/:cardId ── Poll for image status ──────────────────────
router.get('/card/:cardId', (req, res) => {
  const card = pendingCards.get(req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  return res.json({ status: card.status, imageUrl: card.imageUrl, cardTitle: card.cardTitle });
});

// ── DELETE /api/chat/session/:sessionId ── Clear session ─────────────────────
router.delete('/session/:sessionId', (req, res) => {
  clearSession(req.params.sessionId);
  return res.json({ ok: true });
});

module.exports = router;
