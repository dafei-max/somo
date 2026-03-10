import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopBar from './components/TopBar';
import ChatMessage from './components/ChatMessage';
import LiveCardInline from './components/LiveCardInline';
import ImageConfirmCard from './components/ImageConfirmCard';
import OracleCard from './components/OracleCard';
import ChatInput from './components/ChatInput';
import AmbientOverlay from './ambient/AmbientOverlay';
import useAmbientEffect from './ambient/useAmbientEffect';

const STORAGE_KEY = 'somo_chat_v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savedOrNew() {
  const saved = loadSaved();
  if (saved) return saved;
  return {
    sessionId: crypto.randomUUID(),
    messages: [],
    history: [],
    actionFired: null,
  };
}

export default function App() {
  const [state, setState] = useState(savedOrNew);
  const { sessionId, messages, history, actionFired } = state;
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const bottomRef = useRef(null);
  const pollingRefs = useRef({});
  const audioRef = useRef(null);

  // Init background audio
  useEffect(() => {
    const audio = new Audio('/audio/bg.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay blocked — wait for first user gesture
      const start = () => { audio.play().catch(() => {}); };
      window.addEventListener('pointerdown', start, { once: true });
    });
    return () => { audio.pause(); };
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.pause();
      setSoundOn(false);
    } else {
      audio.play().catch(() => {});
      setSoundOn(true);
    }
  };
  const { ambientState, onAmbientComplete, tryKeywordTrigger, tryTriggerAmbient, resetAmbientSession } = useAmbientEffect();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  const startPolling = useCallback((cardId, msgIndex) => {
    if (pollingRefs.current[cardId]) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/card/${cardId}`);
        const data = await res.json();
        if (data.status === 'ready' || data.status === 'failed') {
          clearInterval(interval);
          delete pollingRefs.current[cardId];
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m, i) =>
              i === msgIndex
                ? { ...m, cardStatus: data.status, imageUrl: data.imageUrl || null }
                : m
            ),
          }));
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);
    pollingRefs.current[cardId] = interval;
  }, []);

  const handleSend = async (text) => {
    if (loading) return;

    const userMsg = { type: 'user', text };

    // Keyword-based ambient trigger — fires immediately on send
    tryKeywordTrigger(text);

    // 答案之书 — inject oracle card immediately before AI response
    if (text.includes('答案之书')) {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg, { type: 'oracle' }],
      }));
      setLoading(false);
      return;
    }

    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }));
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text,
          history,
          actionFired,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `错误 ${res.status}`);

      const aiMsg = { type: 'ai', text: data.reply };
      const extraMsgs = [];

      if (data.action === 'image_confirm') {
        extraMsgs.push({
          type: 'image_confirm',
          cardId: data.cardId,
          cardTitle: data.cardTitle,
        });
      }

      const dividerMsg = data.topicShift ? [{ type: 'divider' }] : [];

      // Update history only after successful response
      const newHistory = [...history, { role: 'user', text }, { role: 'assistant', text: data.reply }];

      setState((prev) => {
        const updatedMessages = [...prev.messages, aiMsg, ...extraMsgs, ...dividerMsg];
        return {
          ...prev,
          messages: updatedMessages,
          history: data.topicShift
            ? [{ role: 'user', text }, { role: 'assistant', text: data.reply }]
            : newHistory,
          sessionId: data.newSessionId || prev.sessionId,
          actionFired: data.topicShift ? null : (data.action || prev.actionFired),
        };
      });

      // Evaluate ambient effect after AI responds
      const turn = Math.floor(newHistory.length / 2);
      tryTriggerAmbient({
        turn,
        emotionScore: data.emotionScore ?? 0.5,
        emotionIntensity: data.emotionIntensity ?? 0.5,
        mainEmotion: data.mainEmotion ?? '',
        strategy: data.strategy ?? 'listen',
        isUserTyping: false,
      });
    } catch (err) {
      console.error('[Somo] 请求失败:', err);
      const errorText = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
        ? '连接不上服务器，请检查后端是否启动'
        : `出了点问题：${err.message || '再说一遍试试？'}`;
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, { type: 'ai', text: errorText, isError: true }],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleImageConfirm = useCallback((cardId, cardTitle, msgIndex) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m, i) =>
        i === msgIndex
          ? { type: 'card', cardId, cardTitle, cardStatus: 'generating', imageUrl: null }
          : m
      ),
    }));
    setTimeout(() => startPolling(cardId, msgIndex), 500);
  }, [startPolling]);

  const handleImageCancel = useCallback((msgIndex) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== msgIndex),
    }));
  }, []);

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ sessionId: crypto.randomUUID(), messages: [], history: [], actionFired: null });
    resetAmbientSession();
  };

  return (
    <div className="app-shell">
      {/* Background */}
      <div className="bg-layer">
        <img src="/images/bg.png" alt="" className="bg-layer__img" />
        <div className="bg-layer__overlay" />
      </div>

      <TopBar onClear={clearChat} soundOn={soundOn} onToggleSound={toggleSound} />

      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>说说你现在的感受吧</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'user') {
            return <ChatMessage key={i} role="user" text={msg.text} />;
          }
          if (msg.type === 'ai') {
            return <ChatMessage key={i} role="ai" text={msg.text} />;
          }
          if (msg.type === 'image_confirm') {
            return (
              <ImageConfirmCard
                key={i}
                cardId={msg.cardId}
                cardTitle={msg.cardTitle}
                onConfirm={() => handleImageConfirm(msg.cardId, msg.cardTitle, i)}
                onCancel={() => handleImageCancel(i)}
              />
            );
          }
          if (msg.type === 'card') {
            return (
              <LiveCardInline
                key={i}
                cardId={msg.cardId}
                cardTitle={msg.cardTitle}
                cardStatus={msg.cardStatus}
                imageUrl={msg.imageUrl}
              />
            );
          }

          if (msg.type === 'oracle') {
            return <OracleCard key={i} />;
          }
          if (msg.type === 'divider') {
            return <div key={i} className="topic-divider"><span>新话题</span></div>;
          }
          return null;
        })}

        {loading && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />

      <AmbientOverlay
        effect={ambientState.effect}
        open={ambientState.open}
        onComplete={onAmbientComplete}
      />
    </div>
  );
}
