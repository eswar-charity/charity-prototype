/**
 * Chat + / camera attach: authenticated users get a coming-soon toast;
 * guests are sent through the identity gate.
 */
export function handleChatMediaAttach({ isAuthed, onNeedAuth, showToast }) {
  if (isAuthed) {
    showToast?.('Photo sharing is coming soon');
    return 'toast';
  }
  onNeedAuth?.();
  return 'gate';
}
