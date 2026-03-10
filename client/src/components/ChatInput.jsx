import React, { useState, useRef } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasText = value.trim().length > 0;

  return (
    <footer className="input-area">
      <div className={`input-bar ${hasText ? 'input-bar--has-text' : ''}`}>
        <input
          ref={inputRef}
          className="input-bar__field"
          type="text"
          placeholder="描述下你当下的情绪"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
        />
        <img
          src="/images/icon-voice.svg"
          alt=""
          className="input-bar__icon"
        />
        <button
          className="input-bar__send"
          onClick={submit}
          disabled={!hasText || disabled}
          aria-label="发送"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="home-indicator" />
    </footer>
  );
}
