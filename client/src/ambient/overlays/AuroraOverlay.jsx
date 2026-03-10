import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DURATION_MS = 4200;

function createPillars(width, height) {
  const count = 12;
  return Array.from({ length: count }, (_, i) => {
    const baseX = (width / count) * i + Math.random() * (width / count) * 0.5;
    return {
      id: i,
      x: baseX,
      w: 25 + Math.random() * 35,
      h: height * (0.45 + Math.random() * 0.4),
      sway: 8 + Math.random() * 14,
      dur: 2.6 + Math.random() * 1.2,
      delay: Math.random() * 0.3,
    };
  });
}

export default function AuroraOverlay({ open, onComplete }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 393, height: 852 });
  const timerRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current?.parentElement;
      if (el) setSize({ width: el.offsetWidth, height: el.offsetHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    timerRef.current = window.setTimeout(() => onComplete(), DURATION_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [open, onComplete]);

  const pillars = useMemo(
    () => createPillars(size.width, size.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, open]
  );

  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * size.width,
      y: Math.random() * size.height * 0.45,
      s: 1 + Math.random() * 2.5,
      p: 0.5 + Math.random() * 0.5,
      d: 1.5 + Math.random() * 2,
      dl: Math.random() * 1,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, open]
  );

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: [0.42, 0, 0.58, 1] } }}
            transition={{ duration: 0.5 }}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              zIndex: 999,
              overflow: 'hidden',
            }}
          >
            {/* Green atmospheric tint */}
            <motion.div
              animate={{ opacity: [0, 0.5, 0.6, 0.4, 0] }}
              transition={{ duration: 3.8, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(20,180,90,0.55) 0%, rgba(30,160,100,0.2) 40%, rgba(40,100,140,0.08) 70%, transparent 100%)',
              }}
            />

            {/* Bright bottom horizon glow */}
            <motion.div
              animate={{ opacity: [0, 0.85, 1, 0.7, 0] }}
              transition={{ duration: 3.6, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '40%',
                background: 'radial-gradient(ellipse 120% 100% at 50% 100%, rgba(10,255,120,0.65) 0%, rgba(20,220,100,0.3) 35%, transparent 65%)',
                filter: 'blur(25px)',
              }}
            />

            {/* Vertical curtain pillars */}
            {pillars.map((p) => (
              <motion.div
                key={p.id}
                initial={{ scaleY: 0.1 }}
                animate={{
                  opacity: [0, 0.65, 0.85, 0.55, 0],
                  x: [p.x, p.x + p.sway, p.x - p.sway * 0.5, p.x + p.sway * 0.7, p.x],
                  scaleY: [0.1, 0.7, 1, 0.85, 0.3],
                }}
                transition={{ duration: p.dur, delay: p.delay, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: p.w,
                  height: p.h,
                  transformOrigin: 'bottom center',
                  borderRadius: `${p.w}px ${p.w}px 0 0`,
                  background: 'linear-gradient(to top, rgba(10,255,120,0.85) 0%, rgba(30,230,140,0.5) 18%, rgba(50,200,160,0.25) 40%, rgba(60,150,190,0.08) 65%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              />
            ))}

            {/* Mid-band glow */}
            <motion.div
              animate={{ opacity: [0, 0.55, 0.7, 0.4, 0] }}
              transition={{ duration: 3.2, delay: 0.2, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                bottom: '20%',
                left: '5%',
                width: '90%',
                height: '25%',
                borderRadius: '50%',
                background: 'rgba(20,200,140,0.4)',
                filter: 'blur(50px)',
              }}
            />

            {/* Upper cyan glow */}
            <motion.div
              animate={{ opacity: [0, 0.25, 0.35, 0.2, 0] }}
              transition={{ duration: 3, delay: 0.4, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: '5%',
                left: '10%',
                width: '80%',
                height: '20%',
                borderRadius: '50%',
                background: 'rgba(60,120,200,0.3)',
                filter: 'blur(50px)',
              }}
            />

            {/* Stars */}
            {stars.map((s) => (
              <motion.div
                key={`s${s.id}`}
                animate={{ opacity: [0, s.p, s.p * 0.2, s.p * 0.7, 0] }}
                transition={{ duration: s.d, delay: s.dl, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: s.x,
                  top: s.y,
                  width: s.s,
                  height: s.s,
                  borderRadius: 999,
                  background: '#e8f4ff',
                  boxShadow: `0 0 ${s.s + 2}px rgba(230,245,255,0.6)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
