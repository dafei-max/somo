import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function createFireflies(count, width, height) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: height * 0.5 + Math.random() * height * 0.35,
    size: 3 + Math.random() * 7,
    duration: 1.6 + Math.random() * 1.1,
    delay: Math.random() * 0.5,
    driftX: -24 + Math.random() * 48,
    driftY: -60 - Math.random() * 90,
    twinkle: 0.35 + Math.random() * 0.45,
  }));
}

const DURATION_MS = 2800;

export default function FireflyOverlay({ open, onComplete }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 393, height: 852 });
  const timerRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current?.parentElement;
      if (el) {
        setSize({ width: el.offsetWidth, height: el.offsetHeight });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    timerRef.current = window.setTimeout(() => onComplete(), DURATION_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, onComplete]);

  const fireflies = useMemo(
    () => createFireflies(16, size.width, size.height),
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
            {/* Slight vignette darkening — no blur */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 50% 80%, rgba(255,214,102,0.08), transparent 40%), ' +
                  'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.12) 100%)',
              }}
            />

            {/* Firefly particles */}
            {fireflies.map((f) => (
              <motion.div
                key={f.id}
                initial={{ x: f.x, y: f.y, opacity: 0, scale: 0.8 }}
                animate={{
                  x: [f.x, f.x + f.driftX * 0.4, f.x + f.driftX],
                  y: [f.y, f.y + f.driftY * 0.45, f.y + f.driftY],
                  opacity: [0, f.twinkle, 0.15, 0.85, 0],
                  scale: [0.8, 1, 0.95, 1.08, 0.9],
                }}
                transition={{
                  duration: f.duration,
                  delay: f.delay,
                  repeat: 1,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: f.size,
                  height: f.size,
                  borderRadius: 999,
                  background:
                    'radial-gradient(circle, rgba(255,245,190,1) 0%, rgba(255,224,130,0.96) 35%, rgba(255,224,130,0.24) 62%, rgba(255,224,130,0) 100%)',
                  boxShadow:
                    '0 0 6px rgba(255,224,130,0.45), 0 0 14px rgba(255,224,130,0.18)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
