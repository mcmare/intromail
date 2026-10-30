// Pure, synchronous, side-effect-free compose initializer. It never changes sent messages.
export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function greetingBody(text, plaintextEmail = false) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (plaintextEmail) return trimmed + '\n\n';
  // One paragraph per input line; final empty paragraph leaves a caret-ready blank line.
  const paragraphs = trimmed.split(/\r?\n/).map(line =>
    '<p>' + (line ? escapeHtml(line) : '<br>') + '</p>'
  );
  return paragraphs.join('') + '<p></p>';
}

export function applyGreeting(composeData, config, { plaintextEmail = false } = {}) {
  const input = composeData && typeof composeData === 'object' ? composeData : {};

  // Anything that is already being edited must be preserved exactly as it arrived.
  if (input.draftUid != null || input.draftFolder || input.restored ||
      input.scheduled || input.unsupportedFrom || input.persistedKey) return composeData;
  if (typeof input.body === 'string' && input.body.trim()) return composeData;

  const isReply = !!(input.isReply || input.isReplyAll);
  const isForward = !!input.isForward;
  if (isReply ? !config?.onReply : isForward ? !config?.onForward : !config?.onNew)
    return composeData;

  const body = greetingBody(config?.text || '', plaintextEmail);
  if (!body) return composeData;

  return { ...input, body };
}
