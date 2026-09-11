"use client";

import { useState, useRef, useEffect } from 'react';

const MENUS = {
  File: [
    { label: 'New File', shortcut: 'Ctrl+N', action: 'new_file' },
    { label: 'Open File...', shortcut: 'Ctrl+O', action: 'open' },
    { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'save_as' },
    { divider: true },
    { label: 'Auto Save', shortcut: '', action: 'autosave', checked: true },
    { divider: true },
    { label: 'Exit', shortcut: '', action: 'exit' },
  ],
  Edit: [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
    { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
    { divider: true },
    { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
    { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
    { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
    { divider: true },
    { label: 'Find', shortcut: 'Ctrl+F', action: 'find' },
    { label: 'Replace', shortcut: 'Ctrl+H', action: 'replace' },
  ],
  Selection: [
    { label: 'Select All', shortcut: 'Ctrl+A', action: 'select_all' },
    { label: 'Expand Selection', shortcut: 'Shift+Alt+→', action: 'expand' },
    { label: 'Shrink Selection', shortcut: 'Shift+Alt+←', action: 'shrink' },
    { divider: true },
    { label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', action: 'copy_up' },
    { label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', action: 'copy_down' },
  ],
  View: [
    { label: 'Command Palette', shortcut: 'Ctrl+Shift+P', action: 'palette' },
    { divider: true },
    { label: 'Zoom In', shortcut: 'Ctrl++', action: 'zoom_in' },
    { label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoom_out' },
    { divider: true },
    { label: 'Word Wrap', shortcut: 'Alt+Z', action: 'word_wrap' },
    { label: 'Minimap', shortcut: '', action: 'minimap', checked: false },
  ],
  Terminal: [
    { label: 'New Terminal', shortcut: 'Ctrl+`', action: 'new_terminal' },
    { label: 'Split Terminal', shortcut: '', action: 'split_terminal' },
    { divider: true },
    { label: 'Run Task...', shortcut: '', action: 'run_task' },
    { label: 'Run Build Task', shortcut: 'Ctrl+Shift+B', action: 'build' },
  ],
  Help: [
    { label: 'Welcome', shortcut: '', action: 'welcome' },
    { label: 'Documentation', shortcut: '', action: 'docs' },
    { label: 'Release Notes', shortcut: '', action: 'release' },
    { divider: true },
    { label: 'About Code Red', shortcut: '', action: 'about' },
  ],
};

const SNARKY_MESSAGES = [
  "Nice try. This is Code Red. Features are a privilege, not a right.",
  "That feature was purged for insufficient productivity.",
  "Access denied. Try typing faster.",
  "The management team has declined your request.",
  "Feature budget exhausted. Only chaos remains.",
  "Congratulations, you clicked a button. Now get back to typing.",
  "Error 418: I'm a teapot, not a real IDE.",
  "This action requires a valid developer license. Yours expired.",
];

export default function MenuBar({ onSnarkyToast }) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuBarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMenuClick(menuName) {
    setOpenMenu(openMenu === menuName ? null : menuName);
  }

  function handleItemClick(item) {
    setOpenMenu(null);
    if (item.action) {
      const msg = SNARKY_MESSAGES[Math.floor(Math.random() * SNARKY_MESSAGES.length)];
      onSnarkyToast(msg);
    }
  }

  return (
    <div className="menu-bar" ref={menuBarRef}>
      {Object.keys(MENUS).map((menuName) => (
        <div key={menuName} className="menu-item-wrapper">
          <button
            className={`menu-trigger ${openMenu === menuName ? 'active' : ''}`}
            onClick={() => handleMenuClick(menuName)}
            onMouseEnter={() => { if (openMenu) setOpenMenu(menuName); }}
          >
            {menuName}
          </button>

          {openMenu === menuName && (
            <div className="menu-dropdown">
              {MENUS[menuName].map((item, idx) =>
                item.divider ? (
                  <div key={idx} className="menu-divider" />
                ) : (
                  <button
                    key={idx}
                    className="menu-dropdown-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="menu-dropdown-label">
                      {item.checked !== undefined && (
                        <span className="menu-check">{item.checked ? '✓' : ''}</span>
                      )}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span className="menu-shortcut">{item.shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
