import React, { useRef, useState } from 'react';

export default function AudioPlayer({ src, label }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(console.warn);
    }
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e) => {
    const el = audioRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * el.duration;
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>🎧 {label ? `环境音景 · ${label}` : '环境音景'}</p>
      <div style={styles.player}>
        {/* Play / Pause button */}
        <button style={styles.btn} onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4l14 8-14 8V4z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div style={styles.progressTrack} onClick={handleSeek}>
          <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
        </div>

        {/* Time */}
        <span style={styles.time}>
          {audioRef.current ? fmt(audioRef.current.currentTime) : '0:00'}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={handleEnded}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#F0F0EE',
    borderRadius: 99,
    padding: '10px 16px',
  },
  btn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    background: 'var(--border)',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    background: 'var(--accent)',
    transition: 'width 0.1s linear',
  },
  time: {
    fontSize: 12,
    color: 'var(--text-hint)',
    width: 32,
    textAlign: 'right',
    flexShrink: 0,
  },
};
