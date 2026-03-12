import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveCardInline({ cardTitle, cardStatus, imageUrl }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const isReady = cardStatus === 'ready' && imageUrl;
  const isFailed = cardStatus === 'failed';
  const isGenerating = cardStatus === 'generating';

  return (
    <div className="message-row message-row--left msg-row--card">
      <motion.div
        className="gen-card"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0.2, 1] }}
      >
        {/* Bokeh background — always shown until real image fully loaded */}
        <AnimatePresence>
          {!imgLoaded && (
            <motion.img
              key="bg"
              src="/images/card-generating.png"
              alt=""
              className="gen-card__bg"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
            />
          )}
        </AnimatePresence>

        {/* Generated image — fades in when loaded */}
        {isReady && (
          <motion.img
            key="result"
            src={imageUrl}
            alt={cardTitle}
            className="gen-card__result"
            initial={{ opacity: 0 }}
            animate={{ opacity: imgLoaded ? 1 : 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {/* Generating overlay */}
        {isGenerating && !isReady && (
          <div className="gen-card__loading">
            <div className="gen-card__loading-dots">
              <span /><span /><span />
            </div>
            <p className="gen-card__loading-text">正在生成...</p>
          </div>
        )}

        {/* Failed overlay */}
        {isFailed && !isReady && (
          <div className="gen-card__failed">
            <p>生成失败</p>
            <p className="gen-card__failed-sub">somo is always with you</p>
          </div>
        )}

        {/* Title badge — appears when ready */}
        {isReady && imgLoaded && cardTitle && (
          <motion.div
            className="gen-card__title"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {cardTitle}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
