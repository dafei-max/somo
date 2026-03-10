import React, { useState, useRef } from 'react';

export default function InputSection({ onSubmit, loading }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRef.current?.stop();
      return;
    }

    setRecError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        // For MVP: transcription placeholder
        setText((prev) => prev + (prev ? ' ' : '') + '[语音输入待接入转录接口]');
      };

      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      setRecError('无法访问麦克风，请检查权限');
    }
  };

  const charCount = text.length;
  const maxChars = 200;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.textareaWrapper}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          placeholder="说说你现在的感受…"
          style={styles.textarea}
          rows={4}
          disabled={loading}
        />
        <span style={styles.charCount}>{charCount}/{maxChars}</span>
      </div>

      {recError && <p style={styles.error}>{recError}</p>}

      <div style={styles.actions}>
        {/* Voice button */}
        <button
          type="button"
          onClick={toggleRecording}
          style={{
            ...styles.voiceBtn,
            ...(recording ? styles.voiceBtnActive : {}),
          }}
          aria-label={recording ? '停止录音' : '开始录音'}
          title={recording ? '停止录音' : '语音输入'}
        >
          <MicIcon recording={recording} />
          <span style={styles.voiceBtnLabel}>{recording ? '录音中…' : '语音'}</span>
        </button>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!text.trim() || loading}
          style={{
            ...styles.submitBtn,
            opacity: !text.trim() || loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <div className="loader" style={{ padding: 0 }}>
              <span style={{ background: '#fff' }} />
              <span style={{ background: '#fff' }} />
              <span style={{ background: '#fff' }} />
            </div>
          ) : (
            '开始分析'
          )}
        </button>
      </div>
    </form>
  );
}

function MicIcon({ recording }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={recording ? 'currentColor' : 'none'} />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  textareaWrapper: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    resize: 'none',
    border: '1.5px solid var(--border)',
    borderRadius: 16,
    padding: '14px 16px',
    fontSize: 15,
    lineHeight: 1.6,
    fontFamily: 'var(--font)',
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  charCount: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 12,
    color: 'var(--text-hint)',
  },
  actions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  voiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 14,
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  voiceBtnActive: {
    borderColor: '#E05C5C',
    color: '#E05C5C',
    background: '#FEF2F2',
  },
  voiceBtnLabel: {
    fontSize: 14,
  },
  submitBtn: {
    flex: 1,
    padding: '12px 24px',
    borderRadius: 14,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'var(--font)',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  error: {
    fontSize: 13,
    color: '#E05C5C',
  },
};
