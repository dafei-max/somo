const axios = require('axios');

const FALLBACK_URL =
  'https://liblibai-tmp-image.liblib.cloud/img/b0f7bec31f2f4196829467be29ae1347/16b36c0929b55216956fe7effa0483bd9a974856b921c52c9b4a4b7ddc63d792.png';

/**
 * Generates a Live Card image and returns the image URL.
 * Calls the aiplat image generation workflow pipeline.
 *
 * @param {object} params
 * @param {string} params.cardTitle
 * @param {string} params.mainEmotion
 * @param {string} params.cardMoodColor
 * @returns {Promise<string>} - image URL
 */
async function generateCardImage({ cardTitle, mainEmotion, cardMoodColor, skill, emotionScore }) {
  const prompt = buildImagePrompt({ mainEmotion, skill, emotionScore });
  console.log('[imageGenerator] ── 输入参数 ──');
  console.log('  skill       :', skill);
  console.log('  emotionScore:', emotionScore);
  console.log('  mainEmotion :', mainEmotion);
  console.log('  cardMoodColor:', cardMoodColor);
  console.log('[imageGenerator] ── 生成 Prompt ──');
  console.log(' ', prompt);

  const imageUrl = await callImageWorkflow(prompt);
  if (!imageUrl) {
    console.warn('[imageGenerator] workflow 未返回图片 URL，使用 fallback');
    return FALLBACK_URL;
  }
  console.log('[imageGenerator] ✅ 最终图片 URL:', imageUrl);
  return imageUrl;
}

function buildImagePrompt({ mainEmotion, skill, emotionScore }) {
  // Base scene vocabulary keyed by skill
  const scenesBySkill = {
    comfort: [
      'soft rain falling on a mossy stone path through a quiet bamboo grove, diffused grey-white light, shallow depth of field',
      'warm candlelight reflected in a rain-streaked window, blurred city lights beyond, intimate and still',
      'low-angle view of morning mist drifting across a glassy mountain lake, pale gold dawn light, mirror reflection',
      'close-up of wet petals after rain, single droplet suspended mid-fall, cool blue-green background, ultra macro',
      'solitary wooden pier extending into a calm misty lake at dusk, warm amber glow on the horizon',
    ],
    reflect: [
      'empty winding gravel path through an autumn forest, fallen leaves in muted ochre and rust, soft overcast light, wide angle',
      'top-down view of a single leaf floating on still dark water, concentric ripples, desaturated palette',
      'bare minimalist tree silhouette against a pale winter sky, high contrast, negative space composition',
      'stone steps disappearing into mountain fog, ancient moss-covered walls, cool blue-grey tones',
      'solitary figure seen from behind gazing at a vast silent valley, low saturation, cinematic crop',
    ],
    inspire: [
      'golden sunrise bursting over jagged mountain peaks, rays of light piercing through clouds, warm amber and crimson',
      'wide open wheat field under a dramatic stormy sky breaking into sunlight, rays of god light, high contrast',
      'ocean cliff edge at sunrise, waves crashing far below, deep blue sea meeting a blazing horizon',
      'blooming cherry blossom branch backlit against a clear azure sky, petals drifting, shallow focus',
      'bird flock in perfect murmuration over a glowing sunset estuary, silhouettes, orange and violet sky',
    ],
  };

  // Emotion-specific texture overrides
  const emotionOverride = {
    '疲惫': 'soft warm bedroom light, unmade linen sheets, late afternoon dust motes, slow and quiet',
    '焦虑': 'tangled bare branches against a stormy overcast sky, high contrast black and white, tension in every line',
    '失望': 'the silhouette of two mandarin ducks, pool surface texture with refracted water caustics, top-down close shot, star-shaped specular highlights, low saturation warm beige and cream tones with soft green accents',
    '迷茫': 'crossroads in a dense foggy forest, paths disappearing into mist, cool desaturated blue-green, ambiguous and open',
    '孤独': 'single lantern glowing on an empty night street after rain, wet cobblestones reflecting light, long exposure',
    '难过': 'close-up of raindrops racing down a cold window pane, blurred city lights beyond, muted blues',
    '积极': 'lush green hillside with wildflowers under bright morning light, bokeh, vibrant saturated greens',
    '开心': 'sunlight through fresh green leaves creating a natural kaleidoscope, warm yellow-green, joyful and light',
    '平静': 'zen rock garden raked in perfect parallel lines, a single smooth stone, raking shadows at golden hour',
  };

  const scenes = scenesBySkill[skill] || scenesBySkill.reflect;
  const idx = Math.floor(Math.random() * scenes.length);
  const baseScene = emotionOverride[mainEmotion] || scenes[idx];

  const qualityTags = 'no text, no watermark, no human faces, photorealistic, award-winning nature photography, 8k, vertical portrait 3:4';

  return `${baseScene}, ${qualityTags}`;
}

/** Call the aiplat image generation workflow and return the image URL */
async function callImageWorkflow(prompt) {
  try {
    console.log('[imageGenerator] ── callImageWorkflow ──');
    console.log('  url:', process.env.IMAGE_WORKFLOW_URL);
    console.log('  prompt:', prompt);

    const res = await axios.post(
      process.env.IMAGE_WORKFLOW_URL,
      { query: prompt, chat_history: [] },
      {
        headers: {
          APP_ID: process.env.IMAGE_WORKFLOW_APP_ID,
          APP_KEY: process.env.IMAGE_WORKFLOW_APP_KEY,
        },
        timeout: 60000,
      }
    );

    console.log('[imageGenerator] workflow raw response:', JSON.stringify(res.data).slice(0, 500));

    // Extract text from workflow response: replies[0].content[0].text
    const rawText = res.data?.replies?.[0]?.content?.[0]?.text;
    if (!rawText) {
      console.warn('[imageGenerator] Unexpected workflow response shape:', JSON.stringify(res.data).slice(0, 300));
      return null;
    }

    // The workflow may return a direct URL or a JSON object containing the URL
    const trimmed = rawText.trim();
    if (trimmed.startsWith('http')) {
      return trimmed;
    }

    // Try to parse as JSON and extract image_url / url field
    try {
      const cleaned = trimmed.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const data = JSON.parse(match ? match[0] : cleaned);
      const url = data?.image_url || data?.url || data?.imageUrl || data?.image;
      if (url) return url;
      console.warn('[imageGenerator] Parsed JSON but no URL field found:', data);
    } catch {
      console.warn('[imageGenerator] Could not parse workflow response as JSON:', trimmed.slice(0, 200));
    }

    return null;
  } catch (err) {
    console.warn('[imageGenerator] callImageWorkflow error:', err.message);
    return null;
  }
}

module.exports = { generateCardImage };
