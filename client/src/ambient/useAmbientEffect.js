import { useState, useRef, useCallback } from 'react';
import { matchKeywordTrigger, evaluateStrategy } from './strategy';

/**
 * Hook that manages the ambient effect lifecycle.
 *
 * Returns:
 *   ambientState      — { open, effect, text } for rendering AmbientOverlay
 *   onAmbientComplete — callback when overlay finishes
 *   tryKeywordTrigger — call with user text to check keyword-based triggers
 *   tryTriggerAmbient — call after AI response for score-based triggers (future)
 *   resetAmbientSession
 */
export default function useAmbientEffect() {
  const [ambientState, setAmbientState] = useState({
    open: false,
    effect: null,
    text: null,
  });

  const metaRef = useRef({
    lastTriggerTs: 0,
    sessionTriggerCount: 0,
  });

  const onAmbientComplete = useCallback(() => {
    setAmbientState({ open: false, effect: null, text: null });
  }, []);

  const fire = useCallback((result) => {
    metaRef.current.lastTriggerTs = Date.now();
    metaRef.current.sessionTriggerCount += 1;
    setAmbientState({
      open: true,
      effect: result.recommended_effect,
      text: result.text,
    });
  }, []);

  /**
   * Keyword-based: check user input text for trigger words.
   * No gates — instant trigger on keyword match.
   */
  const tryKeywordTrigger = useCallback((userText) => {
    if (ambientState.open) return;

    const result = matchKeywordTrigger(userText);
    console.log('[ambient] keyword match:', JSON.stringify(result));

    if (result.shouldTrigger) {
      fire(result);
    }
  }, [ambientState.open, fire]);

  /**
   * Score-based: evaluate after AI response (gated by turn/cooldown/etc).
   */
  const tryTriggerAmbient = useCallback((params) => {
    if (ambientState.open) return;

    const ctx = {
      ...params,
      lastTriggerTs: metaRef.current.lastTriggerTs,
      sessionTriggerCount: metaRef.current.sessionTriggerCount,
    };

    const result = evaluateStrategy(ctx);
    console.log('[ambient] strategy:', JSON.stringify(result));

    if (result.shouldTrigger && result.recommended_effect) {
      fire(result);
    }
  }, [ambientState.open, fire]);

  const resetAmbientSession = useCallback(() => {
    metaRef.current = { lastTriggerTs: 0, sessionTriggerCount: 0 };
    setAmbientState({ open: false, effect: null, text: null });
  }, []);

  return {
    ambientState,
    onAmbientComplete,
    tryKeywordTrigger,
    tryTriggerAmbient,
    resetAmbientSession,
  };
}
