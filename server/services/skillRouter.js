/**
 * Routes to a skill based on the emotion score.
 *
 * Thresholds:
 *   < 0.3  → comfort   (gentle, soothing)
 *   0.3–0.7 → reflect  (structured reflection)
 *   > 0.7  → inspire   (encouraging, action-oriented)
 *
 * @param {number} emotionScore - 0 to 1
 * @returns {'comfort' | 'reflect' | 'inspire'}
 */
function selectSkill(emotionScore) {
  if (emotionScore < 0.3) return 'comfort';
  if (emotionScore <= 0.7) return 'reflect';
  return 'inspire';
}

module.exports = { selectSkill };
