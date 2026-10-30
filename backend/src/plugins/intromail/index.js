import { Router } from 'express';
import { requireAuth, storage } from '../api.js';

const ID = 'intromail';
const MAX_GREETING_LENGTH = 1000;
const DEFAULT_CONFIG = Object.freeze({
  text: 'Добрый день коллеги,',
  onNew: true,
  onReply: false,
  onForward: false,
});

const router = Router();
router.use(requireAuth);

function keyFor(userId) {
  return 'user:' + userId + ':config';
}

function normalizeConfig(value) {
  return {
    text: typeof value?.text === 'string' ? value.text.slice(0, MAX_GREETING_LENGTH) : DEFAULT_CONFIG.text,
    onNew: typeof value?.onNew === 'boolean' ? value.onNew : DEFAULT_CONFIG.onNew,
    onReply: typeof value?.onReply === 'boolean' ? value.onReply : DEFAULT_CONFIG.onReply,
    onForward: typeof value?.onForward === 'boolean' ? value.onForward : DEFAULT_CONFIG.onForward,
  };
}

// The plugin_data key includes the authenticated user id; owner_id ensures cascade cleanup.
router.get('/config', async (req, res) => {
  try {
    const row = await storage.getValue(ID, keyFor(req.session.userId));
    if (row && row.owner_id !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });
    return res.json({ config: normalizeConfig(row?.value) });
  } catch (error) {
    console.error('IntroMail config read failed:', error);
    return res.status(500).json({ error: 'Could not load IntroMail settings' });
  }
});

router.put('/config', async (req, res) => {
  const input = req.body?.config;
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || typeof input.text !== 'string' || input.text.length > MAX_GREETING_LENGTH
    || typeof input.onNew !== 'boolean'
    || typeof input.onReply !== 'boolean'
    || typeof input.onForward !== 'boolean') {
    return res.status(400).json({ error: 'Invalid IntroMail configuration' });
  }
  const config = normalizeConfig(input);
  try {
    await storage.put(ID, keyFor(req.session.userId), {
      value: config,
      ownerId: req.session.userId,
      visibility: 'private',
    });
    return res.json({ config });
  } catch (error) {
    console.error('IntroMail config write failed:', error);
    return res.status(500).json({ error: 'Could not save IntroMail settings' });
  }
});

export const introMailPlugin = {
  id: ID,
  name: 'IntroMail',
  version: '0.1.0',
  tier: 1,
  router: { base: '/api/intromail', handler: router },
};
