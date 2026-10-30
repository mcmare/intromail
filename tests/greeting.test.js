import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGreeting, greetingBody } from '../frontend/src/plugins/intromail/greeting.js';
import { normalizeConfig, DEFAULT_CONFIG } from '../frontend/src/plugins/intromail/config.js';

test('new rich-text messages get a visible editable greeting', () => {
  assert.deepEqual(applyGreeting(null, DEFAULT_CONFIG), {
    body: '<p>Добрый день коллеги,</p><p></p>',
  });
});
test('plain-text mode gets two newlines', () => {
  assert.equal(applyGreeting(null, DEFAULT_CONFIG, { plaintextEmail: true }).body,
    'Добрый день коллеги,\n\n');
});
test('existing drafts, restored/scheduled messages and prefilled bodies are untouched', () => {
  const cases = [
    { draftUid: 20, body: '' },
    { draftFolder: 'Drafts', body: '' },
    { restored: true, body: '' },
    { scheduled: { id: 1 }, body: '' },
    { unsupportedFrom: 'x@y', body: '' },
    { persistedKey: 'x', body: '' },
    { body: 'User text' },
    { body: '<p>Message</p>' },
  ];
  for (const item of cases) assert.equal(applyGreeting(item, DEFAULT_CONFIG), item);
});
test('replies/forwards are off by default and independently configurable', () => {
  const reply = { isReply: true, quotedBody: '> quote' };
  const forward = { isForward: true, quotedBody: '> forwarded' };
  assert.equal(applyGreeting(reply, DEFAULT_CONFIG), reply);
  assert.equal(applyGreeting(forward, DEFAULT_CONFIG), forward);
  assert.equal(applyGreeting(reply, { ...DEFAULT_CONFIG, onReply: true }).quotedBody, '> quote');
  assert.match(applyGreeting(forward, { ...DEFAULT_CONFIG, onForward: true }).body, /Добрый день/);
});
test('user text is HTML-escaped; blank greetings do nothing', () => {
  assert.equal(greetingBody('<hello> & "bye"'), '<p>&lt;hello&gt; &amp; &quot;bye&quot;</p><p></p>');
  assert.equal(greetingBody('  '), '');
  assert.equal(applyGreeting(null, { ...DEFAULT_CONFIG, text: '' }), null);
});
test('normalizeConfig supplies defaults and clamps oversized values', () => {
  assert.deepEqual(normalizeConfig({ onReply: true }), { ...DEFAULT_CONFIG, onReply: true });
  assert.equal(normalizeConfig({ text: 'x'.repeat(1001) }).text.length, 1000);
});
