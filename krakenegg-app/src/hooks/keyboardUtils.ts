export const joinPath = (dir: string, file: string) => dir === "/" ? `/${file}` : `${dir}/${file}`;

// Helper function to normalize keyboard event and compare with stored hotkey string
export const isHotkeyMatched = (e: KeyboardEvent, storedHotkey: string): boolean => {
  if (!storedHotkey) return false;

  const parts = storedHotkey.split('+').map(p => p.toLowerCase());
  let key = e.key.toLowerCase();

  // Normalize special keys from event
  if (key === ' ') key = 'Space'.toLowerCase();
  if (key === 'arrowup') key = 'ArrowUp'.toLowerCase();
  if (key === 'arrowdown') key = 'ArrowDown'.toLowerCase();
  if (key === 'arrowleft') key = 'ArrowLeft'.toLowerCase();
  if (key === 'arrowright') key = 'ArrowRight'.toLowerCase();
  if (key === 'delete') key = 'Delete'.toLowerCase();
  if (key === 'backspace') key = 'Backspace'.toLowerCase();
  if (key.startsWith('f') && key.length > 1 && parseInt(key.substring(1))) key = key; // F1, F2, ...
  if (key === 'escape') key = 'Escape'.toLowerCase();
  if (key === 'enter') key = 'Enter'.toLowerCase();
  if (key === 'tab') key = 'Tab'.toLowerCase();


  // Check modifiers
  const hasCmd = e.metaKey && navigator.platform.includes('Mac');
  const hasCtrl = e.ctrlKey && !navigator.platform.includes('Mac');
  const hasCmdOrCtrl = hasCmd || hasCtrl;
  const hasShift = e.shiftKey;
  const hasAlt = e.altKey;

  const hotkeyModifiers: string[] = [];
  if (parts.includes('cmdorctrl')) hotkeyModifiers.push('cmdorctrl');
  if (parts.includes('shift')) hotkeyModifiers.push('shift');
  if (parts.includes('alt')) hotkeyModifiers.push('alt');
  if (parts.includes('cmd')) hotkeyModifiers.push('cmd');
  if (parts.includes('ctrl')) hotkeyModifiers.push('ctrl');


  // Match modifiers
  if (hotkeyModifiers.includes('cmdorctrl') && !hasCmdOrCtrl) return false;
  if (hotkeyModifiers.includes('cmd') && !hasCmd) return false;
  if (hotkeyModifiers.includes('ctrl') && !hasCtrl) return false;
  if (hotkeyModifiers.includes('shift') && !hasShift) return false;
  if (hotkeyModifiers.includes('alt') && !hasAlt) return false;

  // Ensure no extra modifiers are pressed that are not in the hotkey
  if (!hotkeyModifiers.includes('cmdorctrl') && !hotkeyModifiers.includes('cmd') && hasCmd) return false;
  if (!hotkeyModifiers.includes('cmdorctrl') && !hotkeyModifiers.includes('ctrl') && hasCtrl) return false;
  if (!hotkeyModifiers.includes('shift') && hasShift) return false;
  if (!hotkeyModifiers.includes('alt') && hasAlt) return false;

  // Extract the main key from the stored hotkey (e.g., 'f' from 'CmdOrCtrl+f')
  const hotkeyKey = parts.find(p => !['cmdorctrl', 'shift', 'alt', 'cmd', 'ctrl'].includes(p));

  // If the event key is a modifier itself (e.g., just 'Shift' is pressed),
  // and the hotkey string specifies only modifiers, then it's a match.
  // Otherwise, if the hotkey expects a non-modifier key, and the event key IS a modifier, it's not a match.
  if (['control', 'shift', 'alt', 'meta'].includes(e.key.toLowerCase())) {
    return !hotkeyKey && hotkeyModifiers.length > 0; // Match if only modifiers are in hotkey
  }

  return hotkeyKey === key;
};
