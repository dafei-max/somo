const axios = require('axios');

const IMAGE_API_KEY = '7978eff571c9436abf9e241f7a1db984';
const GENERATE_URL = 'https://runway.devops.xiaohongshu.com/openai/liblibai/generate/comfyui/app';
const STATUS_URL = 'https://runway.devops.xiaohongshu.com/openai/liblibai/generate/comfy/status';
const FALLBACK_URL =
  'https://liblibai-tmp-image.liblib.cloud/img/b0f7bec31f2f4196829467be29ae1347/16b36c0929b55216956fe7effa0483bd9a974856b921c52c9b4a4b7ddc63d792.png';

const HEADERS = {
  'api-key': IMAGE_API_KEY,
  'Content-Type': 'application/json',
};

/**
 * Generates a Live Card image and returns the image URL.
 * Internally: submits a generation job, then polls for completion.
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

  const generateUuid = await submitJob(prompt);
  if (!generateUuid) {
    console.warn('[imageGenerator] submitJob 返回空 uuid，使用 fallback');
    return FALLBACK_URL;
  }

  const imageUrl = await pollForResult(generateUuid);
  if (!imageUrl) {
    console.warn('[imageGenerator] 轮询未拿到图片，使用 fallback');
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

/** Step 1: Submit generation job, return generateUuid */
async function submitJob(prompt) {
  const payload = {
    templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
    generateParams: {
      '27': {
        class_type: 'EmptySD3LatentImage',
        inputs: { width: 1080, height: 1440 },
      },
      '45': {
        class_type: 'CLIPTextEncode',
        inputs: { text: prompt },
      },
      workflowUuid: 'acf2eb0285904477bb0abd3734466c8c',
    },
  };

  try {
    console.log('[imageGenerator] ── submitJob payload ──');
    console.log(JSON.stringify(payload, null, 2));
    const res = await axios.post(GENERATE_URL, payload, { headers: HEADERS, timeout: 30000 });
    const data = res.data;
    console.log('[imageGenerator] ── submitJob 返回 ──');
    console.log(JSON.stringify(data, null, 2));

    if (!data || data.code !== 0) {
      console.warn('[imageGenerator] submitJob failed:', data?.msg ?? data);
      return null;
    }

    const uuid = data.data?.generateUuid;
    if (!uuid) {
      console.warn('[imageGenerator] No generateUuid in response:', data);
      return null;
    }

    console.log('[imageGenerator] Job submitted, uuid:', uuid);
    return uuid;
  } catch (err) {
    console.warn('[imageGenerator] submitJob error:', err.message);
    return null;
  }
}

/** Step 2: Poll status until done (status=5) or failed */
async function pollForResult(generateUuid, maxAttempts = 60, intervalMs = 10000) {
  // Initial wait before first poll
  await sleep(10000);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[imageGenerator] Polling attempt ${attempt}/${maxAttempts} for uuid: ${generateUuid}`);

    try {
      const res = await axios.post(
        STATUS_URL,
        { generateUuid },
        { headers: HEADERS, timeout: 15000 }
      );

      const data = res.data;
      const generateStatus = data?.data?.generateStatus;
      console.log(`[imageGenerator] 轮询 ${attempt}/${maxAttempts} status=${generateStatus} 完整返回:`, JSON.stringify(data?.data, null, 2));

      if ([1, 2, 3, 4].includes(generateStatus)) {
        // Still in progress
        await sleep(intervalMs);
        continue;
      }

      if (generateStatus === 5) {
        // Done — extract first image URL
        const images = data?.data?.images ?? [];
        for (const img of images) {
          if (img?.imageUrl) {
            console.log('[imageGenerator] Image ready:', img.imageUrl);
            return img.imageUrl;
          }
        }
        console.warn('[imageGenerator] Status 5 but no imageUrl found');
        return null;
      }

      // Any other status = failure
      console.warn('[imageGenerator] Unexpected generateStatus:', generateStatus);
      return null;
    } catch (err) {
      console.warn(`[imageGenerator] Poll attempt ${attempt} error:`, err.message);
      await sleep(intervalMs);
    }
  }

  console.warn('[imageGenerator] Max polling attempts exceeded');
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { generateCardImage };
