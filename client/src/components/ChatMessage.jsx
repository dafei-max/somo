import React from 'react';

export default function ChatMessage({ role, text }) {
  if (role === 'user') {
    return (
      <div className="message-row message-row--right">
        <div className="bubble bubble--user">{text}</div>
      </div>
    );
  }

  return (
    <div className="message-row message-row--left">
      <div className="bubble bubble--ai">{text}</div>
    </div>
  );
}
