// Generic MailFlow compose-open extension seam. Registered by bundled frontend plugins.
// Core invokes it once when openCompose installs a new composeData snapshot.
const initializers = [];

export function registerComposeInitializer({ pluginId, apply }) {
  if (!pluginId || typeof apply !== 'function')
    throw new Error('Invalid compose initializer');
  initializers.push({ pluginId, apply });
}

export function applyComposeInitializers(composeData, state) {
  let next = composeData;
  for (const entry of initializers) {
    if (!state.enabledPlugins?.includes(entry.pluginId)) continue;
    try {
      const result = entry.apply({
        composeData: next,
        userId: state.user?.id,
        plaintextEmail: !!state.plaintextEmail,
      });
      if (result !== undefined) next = result;
    } catch (error) {
      console.error('Plugin compose initializer failed:', entry.pluginId, error);
    }
  }
  return next;
}
