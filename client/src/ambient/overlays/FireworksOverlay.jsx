import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PredyPlayer } from '@predy-js/player';

const SCENE_URL =
  'https://picasso-static.xiaohongshu.com/predy/104102q031tg673qo5s06ai4p1u2g0000000004cvh0m3g';

const LOAD_TIMEOUT_S = 15;
const MAX_PLAY_DURATION_MS = 20000;

export default function FireworksOverlay({ open, onComplete }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    cancelledRef.current = false;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const destroyPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
    };

    const start = async () => {
      destroyPlayer();

      try {
        const player = new PredyPlayer({
          container: containerRef.current,
          transparentBackground: true,
          renderFramework: 'webgl2',
          name: 'fireworks',
        });
        playerRef.current = player;

        console.log('[FireworksOverlay] loading scene...');
        const scene = await player.loadSceneAsync(SCENE_URL, {
          timeout: LOAD_TIMEOUT_S,
        });

        if (cancelledRef.current) {
          destroyPlayer();
          return;
        }

        console.log('[FireworksOverlay] scene loaded, playing...');

        timerRef.current = setTimeout(() => {
          console.log('[FireworksOverlay] max duration reached');
          if (!cancelledRef.current) onComplete();
        }, MAX_PLAY_DURATION_MS);

        await player.playAsync(scene, {
          onEnd: () => {
            console.log('[FireworksOverlay] playback ended');
            clearTimer();
            if (!cancelledRef.current) onComplete();
          },
        });
      } catch (err) {
        console.error('[FireworksOverlay] error:', err);
        if (!cancelledRef.current) onComplete();
      }
    };

    start();

    return () => {
      cancelledRef.current = true;
      clearTimer();
      destroyPlayer();
    };
  }, [open, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1, ease: [0.42, 0, 0.58, 1] } }}
          transition={{ duration: 0.25 }}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            zIndex: 999,
            overflow: 'hidden',
          }}
        >
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
