# IntroMail — greeting at the beginning of MailFlow messages

An opt-in plugin for [MailFlow](https://github.com/maathimself/mailflow) that places an editable greeting at the **top** of a newly composed email, similar to a signature at the bottom.

**Default greeting:** `Добрый день коллеги,`

## Features

- Automatically inserts the greeting when opening a new message.
- Optional insertion for replies and forwards (disabled by default).
- Works in both rich-text and plain-text composition.
- Greeting is ordinary editable message content: change or delete it before sending.
- Never modifies existing drafts, reopened sends, scheduled edits, or messages with an existing body.
- Per-user settings stored through MailFlow's authenticated plugin API and `plugin_data`; browser cache makes insertion immediate.
- No text is injected at send time; messages are not modified behind the user's back.
- Enable/disable from **Settings → Plugins**, edit greeting in **Settings → Categories → IntroMail**.

## Installation (MailFlow built from source)

The current MailFlow plugin system bundles plugins **at build time**. It does not install standalone ZIP plugins in the running UI.

```bash
git clone https://github.com/mcmare/intromail.git
git clone https://github.com/maathimself/mailflow.git
python3 intromail/scripts/install.py mailflow
cd mailflow
docker compose up -d --build frontend backend
```

If MailFlow is already cloned in `~/mailflow`, pass that location to the installer. Review the changes before rebuilding:

```bash
python3 intromail/scripts/install.py /path/to/mailflow --dry-run
```

If your Compose uses only `ghcr.io` images, switch to the upstream **source-build** `docker-compose.yml` (with `build:` definitions), preserving your existing environment variables and database volumes. Do **not** run `docker compose down -v`.

The installer patches **only** these MailFlow integration points:

1. `backend/src/plugins/loadPlugins.js` — bundle IntroMail's backend manifest.
2. `frontend/src/plugins/index.js` — register IntroMail's UI and compose callback.
3. `frontend/src/store/index.js` — call a generic compose-initializer seam on opening a composer.
4. Copies files under `backend/src/plugins/intromail/`, `frontend/src/plugins/intromail/`, plus `frontend/src/plugins/composeInitializers.js`.

The plugin is independent from GTD; both can remain enabled. Running the installer twice is safe; it declines to overwrite diverged existing plugin files.

## Test

```bash
npm test
python3 -m unittest discover -s tests -p 'test_install.py'
```

## Behavior and limitations

By default, greeting is only added to **new blank messages**, not replies or forwards. Turn on replies/forwards separately in IntroMail settings. The greeting is inserted once when the compose window opens. Editing a draft preserves your changes. The config is fetched from the server on sign-in; if you immediately open Compose before the fetch completes on a device that has never loaded your custom settings, it may temporarily use the default greeting.

The source integration is tested against the MailFlow source layout as of October 2026; upstream refactors may require updating the installer.

### License

AGPL-3.0-or-later. This project integrates with the AGPL-licensed MailFlow project.
