/**
 * Sound presets — royalty-free ambient audio.
 * Sourced from Mixkit (https://mixkit.co/free-sound-effects/) — free for use in any project.
 *
 * No external API needed. Selects a preset based on skill + mainEmotion.
 */

const PRESETS = {
  // 自然声音
  rain: {
    label: '雨声',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-and-thunder-ambience-1270.mp3',
  },
  birds: {
    label: '鸟鸣',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3',
  },
  fire: {
    label: '篝火',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3',
  },
  water: {
    label: '流水',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-small-stream-ambience-1244.mp3',
  },
  wind: {
    label: '微风',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-calm-forest-ambience-868.mp3',
  },
  // 轻音乐
  softBells: {
    label: '轻柔铃声',
    url: 'https://assets.mixkit.co/music/preview/mixkit-soft-bells-588.mp3',
  },
  dreamyPiano: {
    label: '梦幻钢琴',
    url: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  },
  morningLight: {
    label: '晨光',
    url: 'https://assets.mixkit.co/music/preview/mixkit-morning-routine-14.mp3',
  },
};

/**
 * Skill → sound mapping.
 * comfort  → calming nature / soft music
 * reflect  → neutral nature sounds
 * inspire  → uplifting light music
 */
const SKILL_MAP = {
  comfort: ['rain', 'softBells', 'fire'],
  reflect: ['birds', 'water', 'wind'],
  inspire: ['morningLight', 'dreamyPiano', 'birds'],
};

/**
 * Emotion keyword → preferred sound overrides.
 */
const EMOTION_OVERRIDES = {
  疲惫: 'rain',
  焦虑: 'rain',
  难过: 'softBells',
  失落: 'softBells',
  迷茫: 'water',
  平静: 'birds',
  开心: 'morningLight',
  兴奋: 'morningLight',
  愤怒: 'water',
  孤独: 'fire',
};

/**
 * Returns a sound preset based on skill and detected emotion.
 *
 * @param {string} skill        - 'comfort' | 'reflect' | 'inspire'
 * @param {string} mainEmotion  - Chinese emotion word
 * @returns {{ label: string, url: string }}
 */
function selectSound(skill, mainEmotion) {
  // Emotion-specific override first
  if (mainEmotion && EMOTION_OVERRIDES[mainEmotion]) {
    const key = EMOTION_OVERRIDES[mainEmotion];
    return PRESETS[key];
  }

  // Fall back to skill mapping (pick first)
  const keys = SKILL_MAP[skill] ?? SKILL_MAP.comfort;
  return PRESETS[keys[0]];
}

/**
 * Main export — mirrors the async signature expected by the route.
 *
 * @param {string} skill
 * @param {string} mainEmotion
 * @returns {Promise<{ label: string, url: string }>}
 */
async function generateSound(skill, mainEmotion) {
  const preset = selectSound(skill, mainEmotion);
  return preset;
}

module.exports = { generateSound, PRESETS };
