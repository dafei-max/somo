import React, { useState } from 'react';

export default function LiveCard({ imageUrl, cardTitle, cardMoodColor }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const fallbackBg = cardMoodColor || '#A8C5DA';

  return (
    <div style={{ ...styles.container, '--card-color': fallbackBg }}>
      {!loaded && !errored && (
        <div style={{ ...styles.placeholder, background: `${fallbackBg}33` }}>
          <div className="loader">
            <span /><span /><span />
          </div>
        </div>
      )}

      {errored ? (
        <div
          style={{
            ...styles.placeholder,
            background: `${fallbackBg}44`,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>🌿</span>
          <p style={styles.fallbackTitle}>{cardTitle}</p>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={cardTitle}
          style={{ ...styles.image, opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}

      {cardTitle && (
        <div style={styles.titleBadge}>
          <span style={styles.titleText}>{cardTitle}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '70%',
    margin: '0 auto',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
    aspectRatio: '16 / 9',
    background: '#F0F0EE',
  },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.4s ease',
    display: 'block',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  titleBadge: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 99,
    padding: '6px 18px',
    whiteSpace: 'nowrap',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
};
