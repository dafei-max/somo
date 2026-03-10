/**
 * Ambient effect strategy layer — pure logic, no React.
 *
 * StrategyResult shape:
 * {
 *   shouldTrigger: boolean,
 *   emotion:       string,
 *   imagery_tags:  string[],
 *   recommended_effect: string | null,  // "firefly" | "aurora" | "bonfire"
 *   confidence:    number,              // 0-1
 *   text:          string | null,
 * }
 */

// ── Keyword → Effect mapping ──────────────────────────────────────────────────

const KEYWORD_TRIGGERS = [
  {
    id: 'firefly',
    keywords: ['夜晚', '微光', '风', '草地', '安静', '萤火', '星空', '月光', '黄昏', '晚风'],
    imagery: ['night', 'quiet', 'glow'],
  },
  {
    id: 'aurora',
    keywords: ['极光', '天空', '绚烂', '色彩', '北极', '光幕', '彩色', '壮观', '辽阔', '奇幻'],
    imagery: ['sky', 'color', 'flow'],
  },
  {
    id: 'meteor',
    keywords: ['流星', '流星雨', '许愿', '划过', '坠落', '陨石', '彗星', '愿望', '夜空', '闪耀'],
    imagery: ['sky', 'speed', 'wish'],
  },
  {
    id: 'galaxy',
    keywords: ['银河', '宇宙', '星河', '深空', '浩瀚', '星云', '星系', '太空', '无垠', '星辰'],
    imagery: ['space', 'vast', 'deep'],
  },
  {
    id: 'fireworks',
    keywords: ['新年快乐', '烟花', '烟火', '跨年', '除夕', '庆祝', '放烟花'],
    imagery: ['celebration', 'light', 'night'],
  },
  {
    id: 'valentine',
    keywords: ['情人节', '爱心', '我爱你', '心动', '爱情', '520', '七夕', '表白', '喜欢你', '爱你'],
    imagery: ['love', 'heart', 'romance'],
  },
];

/**
 * Check user input text for keyword matches.
 * No gates — if a keyword hits, it triggers immediately.
 *
 * @param {string} userText - the raw text the user just sent
 * @returns {object} StrategyResult
 */
export function matchKeywordTrigger(userText) {
  const noResult = {
    shouldTrigger: false,
    emotion: '',
    imagery_tags: [],
    recommended_effect: null,
    confidence: 0,
    text: null,
  };

  if (!userText) return noResult;

  for (const rule of KEYWORD_TRIGGERS) {
    const matched = rule.keywords.filter((kw) => userText.includes(kw));
    if (matched.length > 0) {
      return {
        shouldTrigger: true,
        emotion: '',
        imagery_tags: rule.imagery,
        recommended_effect: rule.id,
        confidence: Math.min(1, 0.6 + matched.length * 0.15),
        text: null,
      };
    }
  }

  return noResult;
}

// ── Score-based strategy (preserved for future use) ───────────────────────────

const EFFECT_RULES = [
  {
    id: 'firefly',
    match: (ctx) =>
      ctx.emotionScore < 0.45 ||
      (ctx.emotionIntensity > 0.5 && ctx.strategy !== 'inspire'),
    imagery: ['night', 'quiet', 'glow'],
    textPool: [
      '夜色轻了一点，情绪也在慢慢落下',
      '萤火微光，陪你度过这一刻',
      '有些夜晚，只需要一点点光就够了',
      '让微光替你说那些说不出口的话',
    ],
  },
  {
    id: 'aurora',
    match: (ctx) =>
      ctx.emotionScore > 0.7 && ctx.emotionIntensity > 0.6,
    imagery: ['sky', 'color', 'flow'],
    textPool: [
      '此刻的情绪，像极光一样绚烂',
      '让色彩替你诉说这份喜悦',
    ],
  },
  {
    id: 'bonfire',
    match: (ctx) =>
      ctx.strategy === 'comfort' && ctx.emotionIntensity > 0.55,
    imagery: ['warmth', 'fire', 'shelter'],
    textPool: [
      '围一团温暖的火光，慢慢暖回来',
      '此刻不需要任何言语，只是陪着你',
    ],
  },
];

const RISK_EMOTIONS = ['愤怒', '恐惧', '厌恶', '绝望'];

/** Score-based evaluation (gated, for future re-enable) */
export function evaluateStrategy(ctx) {
  const noResult = {
    shouldTrigger: false,
    emotion: ctx.mainEmotion || '',
    imagery_tags: [],
    recommended_effect: null,
    confidence: 0,
    text: null,
  };

  if (ctx.turn < 2 || ctx.turn > 4) return noResult;
  if (ctx.isUserTyping) return noResult;
  const now = Date.now();
  if (ctx.lastTriggerTs && now - ctx.lastTriggerTs < 30_000) return noResult;
  if (ctx.sessionTriggerCount >= 2) return noResult;
  if (RISK_EMOTIONS.includes(ctx.mainEmotion)) return noResult;

  for (const rule of EFFECT_RULES) {
    if (rule.match(ctx)) {
      const text = rule.textPool[Math.floor(Math.random() * rule.textPool.length)];
      return {
        shouldTrigger: true,
        emotion: ctx.mainEmotion || '',
        imagery_tags: rule.imagery,
        recommended_effect: rule.id,
        confidence: 0.7 + Math.random() * 0.25,
        text,
      };
    }
  }

  return noResult;
}
