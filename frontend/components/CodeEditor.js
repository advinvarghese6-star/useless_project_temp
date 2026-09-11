"use client";

import { useRef, useEffect, useCallback } from 'react';

const INITIAL_CODE = `function saveProject() {
  console.log("Building something amazing...");
}

function calculateProductivity() {
  return "100%";
}

saveProject();`;

export default function CodeEditor({
  code,
  onCodeChange,
  onActivity,
  state,
  editorRef,
}) {
  const lineNumbersRef = useRef(null);
  const isDanger = state === 'WARNING' || state === 'PURGING';

  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleKeyDown = useCallback((e) => {
    const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'];
    if (ignoredKeys.includes(e.key)) return;
    onActivity();
  }, [onActivity]);

  const handleMouseMove = useCallback(() => {
    onActivity();
  }, [onActivity]);

  const handleScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, [editorRef]);

  useEffect(() => {
    const textarea = editorRef.current;
    if (!textarea) return;
    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [editorRef, handleScroll]);

  return (
    <div className={`editor-wrapper ${isDanger ? 'danger' : ''}`}>
      <div className="editor-tab-bar">
        <div className="editor-tab">⚡ workspace.js</div>
      </div>

      <div className="editor-body">
        <div className="line-numbers" ref={lineNumbersRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={editorRef}
          className="code-textarea"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onMouseMove={handleMouseMove}
          onSelect={() => onActivity()}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="// Start typing to anchor the watchdog..."
          aria-label="Code Editor"
        />
      </div>
    </div>
  );
}

CodeEditor.INITIAL_CODE = INITIAL_CODE;
