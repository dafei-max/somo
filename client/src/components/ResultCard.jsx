import React from 'react';
import EmotionBadge from './EmotionBadge';
import LiveCard from './LiveCard';
import AudioPlayer from './AudioPlayer';

export default function ResultCard({ data }) {
  const {
    emotionScore,
    energyLevel,
    mainEmotion,
    skill,
    responseText,
    actionTip,
    cardImageUrl,
    cardTitle,
    cardMoodColor,
    soundUrl,
    soundLabel,
    _mock,
  } = data;

  return (
    <div style={styles.wrapper}>
      {_mock && (
        <div style={styles.mockBadge}>Mock 模式 — 填入 API Key 后使用真实数据</div>
      )}

      {/* Emotion analysis summary */}
      <section style={styles.card} className="fade-up">
        <EmotionBadge
          emotionScore={emotionScore}
          energyLevel={energyLevel}
          mainEmotion={mainEmotion}
          skill={skill}
        />
      </section>

      {/* Live Card image */}
      {cardImageUrl && (
        <section className="fade-up fade-up-delay-1">
          <LiveCard
            imageUrl={cardImageUrl}
            cardTitle={cardTitle}
            cardMoodColor={cardMoodColor}
          />
        </section>
      )}

      {/* Response text */}
      {responseText && (
        <section style={styles.card} className="fade-up fade-up-delay-2">
          <p style={styles.sectionLabel}>情绪回应</p>
          <p style={styles.responseText}>{responseText}</p>
        </section>
      )}

      {/* Action tip */}
      {actionTip && (
        <section style={styles.actionCard} className="fade-up fade-up-delay-3">
          <span style={styles.actionIcon}>✦</span>
          <p style={styles.actionText}>{actionTip}</p>
        </section>
      )}

      {/* Audio player */}
      {soundUrl && (
        <section style={styles.card} className="fade-up fade-up-delay-4">
          <AudioPlayer src={soundUrl} label={soundLabel} />
        </section>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  mockBadge: {
    textAlign: 'center',
    fontSize: 12,
    color: '#B8860B',
    background: '#FEF9E7',
    border: '1px solid #F5C84240',
    borderRadius: 99,
    padding: '5px 14px',
    alignSelf: 'center',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-card)',
    padding: '20px 22px',
    boxShadow: 'var(--shadow)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-hint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 1.75,
    color: 'var(--text-primary)',
  },
  actionCard: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-card)',
    padding: '18px 22px',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    borderLeft: '3px solid var(--accent)',
  },
  actionIcon: {
    fontSize: 18,
    color: 'var(--accent)',
    flexShrink: 0,
    marginTop: 1,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text-primary)',
  },
};
