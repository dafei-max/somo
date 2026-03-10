/**
 * Decides which action to trigger based on emotion intensity and context.
 * Only one action fires per session — never repeats.
 *
 * Action: image — intensity ≥ 0.68, extreme score (≤ 0.22 or ≥ 0.80), turn ≥ 2
 */
function decideAction(session, emotionData) {
  if (session.actionFired) return null;

  const { emotionScore, emotionIntensity } = emotionData;
  const turns = session.turns;

  if (turns < 2) return null;

  if (
    emotionIntensity >= 0.68 &&
    (emotionScore <= 0.22 || emotionScore >= 0.80)
  ) {
    return 'image';
  }

  return null;
}

module.exports = { decideAction };
