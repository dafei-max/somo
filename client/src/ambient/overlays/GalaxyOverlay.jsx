import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DURATION_MS = 3400;

function createStars(count, width, height) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1 + Math.random() * 3,
    duration: 1.8 + Math.random() * 1.4,
    delay: Math.random() * 1,
    maxOpacity: 0.4 + Math.random() * 0.6,
  }));
}

function createNebulae(width, height) {
  const hues = [240, 270, 210, 290];
  return hues.map((hue, i) => ({
    id: i,
    cx: width * (0.2 + Math.random() * 0.6),
    cy: height * (0.25 + Math.random() * 0.4),
    rx: 90 + Math.random() * 80,
    ry: 50 + Math.random() * 40,
    hue,
    duration: 2.6 + Math.random() * 1,
    delay: i * 0.25,
  }));
}

export default function GalaxyOverlay({ open, onComplete }) {
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

  const stars = useMemo(
    () => createStars(50, size.width, size.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, open]
  );

  const nebulae = useMemo(
    () => createNebulae(size.width, size.height),
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
            {/* Nebula clouds */}
            {nebulae.map((n) => (
              <motion.div
                key={`neb${n.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.35, 0.5, 0.3, 0],
                  scale: [0.8, 1.05, 1.1, 1, 0.9],
                }}
                transition={{
                  duration: n.duration,
                  delay: n.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  left: n.cx - n.rx,
                  top: n.cy - n.ry,
                  width: n.rx * 2,
                  height: n.ry * 2,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse, hsla(${n.hue},60%,50%,0.35) 0%, hsla(${n.hue},50%,40%,0.1) 50%, transparent 100%)`,
                  filter: 'blur(30px)',
                }}
              />
            ))}

            {/* Milky Way band */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0.35, 0.2, 0] }}
              transition={{ duration: 3, delay: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: '-10%',
                top: '25%',
                width: '120%',
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(90deg, transparent 5%, rgba(180,200,255,0.12) 30%, rgba(200,180,255,0.18) 50%, rgba(180,200,255,0.12) 70%, transparent 95%)',
                filter: 'blur(18px)',
                transform: 'rotate(-15deg)',
              }}
            />

            {/* Star particles */}
            {stars.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, s.maxOpacity, s.maxOpacity * 0.3, s.maxOpacity * 0.8, 0],
                }}
                transition={{
                  duration: s.duration,
                  delay: s.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  left: s.x,
                  top: s.y,
                  width: s.size,
                  height: s.size,
                  borderRadius: 999,
                  background: 'rgba(220,225,255,0.95)',
                  boxShadow: `0 0 ${s.size + 2}px rgba(200,210,255,0.4)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
