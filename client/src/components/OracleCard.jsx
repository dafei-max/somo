import React, { useState, useRef, useEffect } from 'react';

const ORACLE_ANSWERS = [
  '时间会证明一切',
  '顺其自然',
  '相信自己的直觉',
  '答案就在你心中',
  '放下执念，方得自在',
  '此刻即是礼物',
  '静待花开',
  '行动胜于等待',
  '你已比昨天更勇敢',
  '有些事，沉默胜过千言',
  '转折点已经很近了',
  '内心的声音最诚实',
  '此路虽难，但你不孤单',
  '放开双手，宇宙自有安排',
  '你所期待的，正在路上',
  '先照顾好自己',
  '这一次，试着说是',
  '相信过程，结果会到来',
];

function pick() {
  return ORACLE_ANSWERS[Math.floor(Math.random() * ORACLE_ANSWERS.length)];
}

const REVEAL_MS = 2000; // hold → reveal speed
const HIDE_MS   = 1200; // release → disappear speed (slow)

export default function OracleCard({ answer: propAnswer }) {
  const [answer] = useState(() => propAnswer || pick());

  // progress: 0 = fully hidden, 100 = fully revealed
  const [progress, setProgress] = useState(0);
  // phase: 'idle' | 'revealing' | 'hiding'
  const [phase, setPhase] = useState('idle');

  const rafRef  = useRef(null);
  const t0Ref   = useRef(0);
  const p0Ref   = useRef(0);

  const cancelRaf = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  // Drive progress toward a target over a given duration
  const animate = (from, to, duration, onDone) => {
    cancelRaf();
    p0Ref.current = from;
    t0Ref.current = performance.now();

    const tick = (now) => {
      const frac = Math.min((now - t0Ref.current) / duration, 1);
      const next = from + (to - from) * frac;
      setProgress(next);
      if (frac < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Long press (hold) → reveal
  const handleDown = (e) => {
    e.preventDefault();
    cancelRaf();
    const from = progress;
    const remaining = ((100 - from) / 100) * REVEAL_MS;
    setPhase('revealing');
    animate(from, 100, remaining, () => setPhase('revealing')); // stay in revealing when done
  };

  // Release → slow disappear
  const handleUp = () => {
    if (phase === 'idle') return;
    cancelRaf();
    const from = progress;
    const remaining = (from / 100) * HIDE_MS;
    if (remaining < 10) { setProgress(0); setPhase('idle'); return; }
    setPhase('hiding');
    animate(from, 0, remaining, () => setPhase('idle'));
  };

  useEffect(() => () => cancelRaf(), []);

  const showText = progress > 0;
  const showHint = phase === 'idle' || phase === 'hiding';

  // Soft-edge reveal masks based on progress
  const p = progress;
  const clearMask = `linear-gradient(to right,
    black 0%,
    black ${Math.max(0, p - 4)}%,
    transparent ${p + 6}%,
    transparent 100%)`;

  const blurMask = `linear-gradient(to right,
    transparent 0%,
    transparent ${Math.max(0, p - 6)}%,
    black ${p + 4}%,
    black ${p + 28}%,
    transparent ${p + 42}%,
    transparent 100%)`;

  return (
    <div className="message-row message-row--left">
      <div
        className="oracle-card"
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchEnd={handleUp}
        onTouchCancel={handleUp}
      >
        <img src="/images/oracle-bg.png" alt="" className="oracle-card__bg" draggable={false} />

        {/* Hint — same center position as text, fades out while text is visible */}
        <div
          className="oracle-card__hint"
          style={{
            opacity: showHint ? 1 : 0,
            transition: phase === 'revealing'
              ? 'opacity 0.25s ease'
              : `opacity ${HIDE_MS}ms ease`,
          }}
        >
          长按揭晓
        </div>

        {/* Two-layer progressive reveal */}
        {showText && (
          <div className="oracle-card__text-wrap">
            <span
              className="oracle-card__text oracle-card__text--clear"
              style={{ WebkitMaskImage: clearMask, maskImage: clearMask }}
            >
              {answer}
            </span>
            <span
              className="oracle-card__text oracle-card__text--blur"
              style={{
                WebkitMaskImage: blurMask,
                maskImage: blurMask,
                filter: 'blur(5px)',
                opacity: 0.5,
              }}
            >
              {answer}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
