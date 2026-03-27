import React, { useEffect } from 'react';
import { KeyboardShortcuts } from '../../types';

interface KeyboardHandlerProps {
  shortcuts: KeyboardShortcuts;
  onKeyboardAction: (action: string) => void;
}

const KeyboardHandler: React.FC<KeyboardHandlerProps> = ({
  shortcuts,
  onKeyboardAction
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const key = formatKeyCombo(event);
      const shortcut = shortcuts[key];

      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        onKeyboardAction(shortcut.action);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [shortcuts, onKeyboardAction]);

  return null; // This component doesn't render anything
};

const formatKeyCombo = (event: KeyboardEvent): string => {
  const parts: string[] = [];

  // Modifier keys (order matters for consistency)
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Cmd');

  // Main key
  let mainKey = event.key;

  // Special key mappings
  switch (event.key) {
    case ' ':
      mainKey = 'Space';
      break;
    case 'ArrowUp':
      mainKey = 'ArrowUp';
      break;
    case 'ArrowDown':
      mainKey = 'ArrowDown';
      break;
    case 'ArrowLeft':
      mainKey = 'ArrowLeft';
      break;
    case 'ArrowRight':
      mainKey = 'ArrowRight';
      break;
    case 'PageUp':
      mainKey = 'PageUp';
      break;
    case 'PageDown':
      mainKey = 'PageDown';
      break;
    case 'Home':
      mainKey = 'Home';
      break;
    case 'End':
      mainKey = 'End';
      break;
    case 'Insert':
      mainKey = 'Insert';
      break;
    case 'Delete':
      mainKey = 'Delete';
      break;
    case 'Backspace':
      mainKey = 'Backspace';
      break;
    case 'Enter':
      mainKey = 'Enter';
      break;
    case 'Escape':
      mainKey = 'Escape';
      break;
    case 'Tab':
      mainKey = 'Tab';
      break;
    case '+':
      if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        mainKey = 'NumpadAdd';
      }
      break;
    case '-':
      if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        mainKey = 'NumpadSubtract';
      }
      break;
    case '*':
      if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        mainKey = 'NumpadMultiply';
      }
      break;
    case '/':
      if (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        mainKey = 'NumpadDivide';
      } else {
        mainKey = '/';
      }
      break;
    case '\\':
      mainKey = '\\';
      break;
    default:
      // Function keys
      if (event.key.startsWith('F') && event.key.length <= 3) {
        mainKey = event.key;
      }
      // Regular letters and numbers
      else if (event.key.length === 1) {
        mainKey = event.key.toUpperCase();
      }
      break;
  }

  parts.push(mainKey);
  return parts.join('+');
};

export default KeyboardHandler;