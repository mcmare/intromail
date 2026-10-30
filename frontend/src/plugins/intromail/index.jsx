// IntroMail is a bundled Tier-1 plugin. No modifications to core ComposeModal are required.
import { registerSlot, registerRuntime, registerPluginMeta } from '../registry.js';
import { registerComposeInitializer } from '../composeInitializers.js';
import { readConfig } from './config.js';
import { applyGreeting } from './greeting.js';
import IntroMailSettings from './IntroMailSettings.jsx';
import IntroMailRuntime from './IntroMailRuntime.jsx';

registerPluginMeta('intromail', {
  settingsLocation: { tab: 'categories', subtab: 'intromail', labelKey: 'admin.tabs.categories' },
});

registerRuntime({ pluginId: 'intromail', component: IntroMailRuntime });

registerSlot('settings-categories', {
  pluginId: 'intromail',
  render: () => <IntroMailSettings />,
});

// Called once by openCompose before the editor mounts; no editing of the sent payload.
registerComposeInitializer({
  pluginId: 'intromail',
  apply: ({ composeData, userId, plaintextEmail }) => {
    if (!userId) return composeData;
    return applyGreeting(composeData, readConfig(userId), { plaintextEmail });
  },
});
