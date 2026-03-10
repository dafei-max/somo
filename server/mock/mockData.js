const { PRESETS } = require('../services/soundGenerator');

const mockBySkill = {
  comfort: {
    emotionScore: 0.22,
    energyLevel: 'Low',
    mainEmotion: '疲惫',
    reasoning: '用户描述了持续的忙碌感和方向感缺失，能量较低。',
    responseText:
      '你已经很努力了。忙碌本身不是问题，但忘了为什么而忙，才是最累的地方。先停下来喘口气吧，什么都可以等一等。',
    actionTip: '现在花 2 分钟，写下今天你做了哪一件让自己感到还不错的小事。',
    cardTitle: '给忙碌的你，一刻喘息',
    cardMoodColor: '#A8C5DA',
    soundPreset: PRESETS.rain,
  },
  reflect: {
    emotionScore: 0.50,
    energyLevel: 'Medium',
    mainEmotion: '迷茫',
    reasoning: '用户情绪中性，存在自我审视和复盘需求。',
    responseText:
      '感觉到迷茫，其实是你开始认真思考的信号。不妨把最近占用你时间最多的三件事写下来，看看它们是否真的值得你这样投入。',
    actionTip: '列出本周三件「我做了但好像不必要」的事，给自己减减负。',
    cardTitle: '慢下来，看清楚方向',
    cardMoodColor: '#B8D4C8',
    soundPreset: PRESETS.water,
  },
  inspire: {
    emotionScore: 0.80,
    energyLevel: 'High',
    mainEmotion: '积极',
    reasoning: '用户情绪高涨，适合激励行动。',
    responseText:
      '你现在的状态很好！这种能量正是做大事的时候。把它转化成一个具体的行动，今天就开始。',
    actionTip: '挑一件你一直想做却没做的事，今天完成它的第一步。',
    cardTitle: '行动起来，就是现在',
    cardMoodColor: '#F5C842',
    soundPreset: PRESETS.morningLight,
  },
};

function getMockResponse(text) {
  const low = ['累', '迷', '忙', '不知道', '空', '失落', '难过', '焦虑'];
  const high = ['开心', '兴奋', '太好了', '棒', '成功', '加油'];

  const isLow = low.some((kw) => text.includes(kw));
  const isHigh = high.some((kw) => text.includes(kw));

  let skill = 'reflect';
  if (isLow) skill = 'comfort';
  if (isHigh) skill = 'inspire';

  const base = mockBySkill[skill];
  const hex = base.cardMoodColor.replace('#', '');

  return {
    emotionScore: base.emotionScore,
    energyLevel: base.energyLevel,
    mainEmotion: base.mainEmotion,
    reasoning: base.reasoning,
    skill,
    responseText: base.responseText,
    actionTip: base.actionTip,
    cardTitle: base.cardTitle,
    cardMoodColor: base.cardMoodColor,
    cardImageUrl: `https://placehold.co/600x400/${hex}/${hex}?text=Somo+Card`,
    soundUrl: base.soundPreset.url,
    soundLabel: base.soundPreset.label,
    _mock: true,
  };
}

module.exports = { getMockResponse, mockBySkill };
