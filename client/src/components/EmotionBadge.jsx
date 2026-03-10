import React from 'react';

const skillLabel = {
  comfort: '安抚',
  reflect: '复盘',
  inspire: '激励',
};

const skillColor = {
  comfort: { bg: '#EBF4FB', text: '#3A80C1' },
  reflect: { bg: '#EBF5F0', text: '#2E8B57' },
  inspire: { bg: '#FEF9E7', text: '#B8860B' },
};

export default function EmotionBadge({ emotionScore, energyLevel, mainEmotion, skill }) {
  const pct = Math.round((emotionScore ?? 0) * 100);
  const color = skillColor[skill] ?? skillColor.reflect;

  return (
    <div style={styles.wrapper}>
      {/* Score bar */}
      <div style={styles.scoreRow}>
        <span style={styles.label}>情绪分数</span>
        <span style={styles.score}>{pct}</span>
        <div style={styles.track}>
          <div
            style={{
              ...styles.fill,
              width: `${pct}%`,
              background: `hsl(${pct * 1.2}, 60%, 52%)`,
            }}
          />
        </div>
      </div>

      {/* Tags */}
      <div style={styles.tags}>
        <Tag label={mainEmotion} />
        <Tag label={energyLevel === 'Low' ? '低能量' : energyLevel === 'High' ? '高能量' : '中等能量'} />
        <span
          style={{
            ...styles.skillTag,
            background: color.bg,
            color: color.text,
          }}
        >
          {skillLabel[skill] ?? skill}
        </span>
      </div>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span style={styles.tag}>{label}</span>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  score: {
    fontSize: 20,
    fontWeight: 600,
    width: 36,
    textAlign: 'right',
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    background: 'var(--border)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.8s ease',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 13,
    padding: '4px 12px',
    borderRadius: 99,
    background: '#F0F0EE',
    color: 'var(--text-secondary)',
  },
  skillTag: {
    fontSize: 13,
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: 99,
  },
};
