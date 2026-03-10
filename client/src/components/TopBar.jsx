import React from 'react';

export default function TopBar({ onClear, soundOn, onToggleSound }) {
  return (
    <>
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-bar__time">9:41</div>
        <div className="status-bar__island" />
        <div className="status-bar__icons">
          <img src="/images/icon-signal.svg" alt="" />
          <img src="/images/icon-wifi.svg" alt="" />
          <img src="/images/icon-battery.svg" alt="" />
        </div>
      </div>

      {/* Header */}
      <header className="chat-header">
        <div className="glass-btn" aria-label="返回">
          <img src="/images/icon-back.svg" alt="" style={{ width: 18, height: 18 }} />
        </div>
        <div className="header-actions">
          <div
            className="glass-btn"
            aria-label={soundOn ? '关闭音效' : '开启音效'}
            onClick={onToggleSound}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={soundOn ? '/images/icon-speaker.svg' : '/images/icon-speaker-off.svg'}
              alt=""
              style={{ width: 36, height: 36 }}
            />
          </div>
          <div className="glass-btn" aria-label="新对话" onClick={onClear} style={{ cursor: 'pointer' }}>
            <img src="/images/icon-menu.svg" alt="" style={{ width: 36, height: 36 }} />
          </div>
        </div>
      </header>
    </>
  );
}
