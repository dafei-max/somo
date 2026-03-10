import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DURATION_MS = 3200;
const ANGLE_DEG = 32;
const ANGLE_RAD = (ANGLE_DEG * Math.PI) / 180;

function createMeteors(count, width, height) {
  return Array.from({ length: count }, (_, i) => {
    const startX = width * 0.1 + Math.random() * width * 0.65;
    const startY = -20 - Math.random() * 80;
    const travel = height * 0.35 + Math.random() * height * 0.3;
    const dx = Math.cos(ANGLE_RAD) * travel;
    const dy = Math.sin(ANGLE_RAD) * travel;
    const isPrimary = i < 2;
    return {
      id: i,
      startX,
      startY,
      endX: startX + dx,
      endY: startY + dy,
      tailLen: isPrimary ? 90 + Math.random() * 50 : 35 + Math.random() * 45,
      headSize: isPrimary ? 3 : 1.5 + Math.random() * 1,
      brightness: isPrimary ? 1 : 0.5 + Math.random() * 0.35,
      duration: 0.45 + Math.random() * 0.35,
      delay: isPrimary ? Math.random() * 0.6 : 0.3 + Math.random() * 2.2,
    };
  });
}

function createStars(count, width, height) {
  return Array.from({ length: count }, (_, i) => {
    const isBright = i < 8;
    return {
      id: i,
      x: Math.random() * width,
      y: Math.random() * height * 0.75,
      size: isBright ? 1.5 + Math.random() * 2 : 0.8 + Math.random() * 1.2,
      peak: isBright ? 0.6 + Math.random() * 0.4 : 0.25 + Math.random() * 0.35,
      dur: 1.8 + Math.random() * 2,
      delay: Math.random() * 1.5,
    };
  });
}

function Meteor({ m }) {
  return (
    <motion.div
      initial={{ x: m.startX, y: m.startY, opacity: 0 }}
      animate={{
        x: [m.startX, m.endX],
        y: [m.startY, m.endY],
        opacity: [0, m.brightness, m.brightness * 0.85, 0],
      }}
      transition={{
        duration: m.duration,
        delay: m.delay,
        ease: [0.1, 0, 0.9, 1],
      }}
      style={{
        position: 'absolute',
        transform: `rotate(${ANGLE_DEG}deg)`,
        transformOrigin: 'right center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: m.headSize,
          height: m.headSize,
          borderRadius: '50%',
          background: `rgba(255,255,255,${m.brightness})`,
          boxShadow: `0 0 ${m.headSize + 2}px rgba(220,235,255,${0.7 * m.brightness}), 0 0 ${m.headSize * 3}px rgba(200,220,255,${0.25 * m.brightness})`,
        }}
      />
    </motion.div>
  );
}

export default function MeteorShowerOverlay({ open, onComplete }) {
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

  const meteors = useMemo(
    () => createMeteors(6, size.width, size.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, open]
  );

  const stars = useMemo(
    () => createStars(50, size.width, size.height),
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
            transition={{ duration: 0.3 }}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              zIndex: 999,
              overflow: 'hidden',
            }}
          >
            {/* Dense star field */}
            {stars.map((s) => (
              <motion.div
                key={`s${s.id}`}
                animate={{ opacity: [0, s.peak, s.peak * 0.3, s.peak * 0.8, 0] }}
                transition={{ duration: s.dur, delay: s.delay, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: s.x,
                  top: s.y,
                  width: s.size,
                  height: s.size,
                  borderRadius: 999,
                  background: 'rgba(230,235,255,0.95)',
                  boxShadow: s.size > 2
                    ? `0 0 ${s.size + 1}px rgba(220,230,255,0.5)`
                    : 'none',
                }}
              />
            ))}

            {/* Meteors with head + tapered tail */}
            {meteors.map((m) => (
              <Meteor key={m.id} m={m} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
