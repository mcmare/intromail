#!/usr/bin/env python3
"""Install IntroMail as a bundled plugin into a MailFlow source checkout.

Usage: python3 scripts/install.py /path/to/mailflow [--dry-run] [--force]
Only owned plugin files are copied; three small upstream integration points are patched.
"""
import argparse
from pathlib import Path
import sys


PLUGIN_FILES = [
    "backend/src/plugins/intromail/index.js",
    "frontend/src/plugins/intromail/config.js",
    "frontend/src/plugins/intromail/greeting.js",
    "frontend/src/plugins/intromail/IntroMailSettings.jsx",
    "frontend/src/plugins/intromail/IntroMailRuntime.jsx",
    "frontend/src/plugins/intromail/index.jsx",
    "frontend/src/plugins/composeInitializers.js",
]


def replace_once(content, needle, replacement, path):
    if replacement in content:
        return content
    if content.count(needle) != 1:
        raise ValueError(f"{path}: expected exactly one matching upstream integration point")
    return content.replace(needle, replacement, 1)


def build_plan(root: Path, own: Path, force=False):
    """Validate every file before any write, so incompatible versions fail cleanly."""
    changes = {}
    for rel in PLUGIN_FILES:
        source = own / rel
        target = root / rel
        data = source.read_bytes()
        if target.exists():
            current = target.read_bytes()
            if current == data:
                continue
            if not force:
                raise ValueError(f"{rel}: already exists with different content (use --force to replace plugin files)")
        changes[target] = data

    backend_path = root / "backend/src/plugins/loadPlugins.js"
    frontend_path = root / "frontend/src/plugins/index.js"
    store_path = root / "frontend/src/store/index.js"
    for path in [backend_path, frontend_path, store_path]:
        if not path.is_file():
            raise ValueError(f"MailFlow source file missing: {path}")

    backend = backend_path.read_text(encoding="utf-8")
    backend = replace_once(
        backend, "import { gtdPlugin } from './gtd/index.js';",
        "import { gtdPlugin } from './gtd/index.js';\nimport { introMailPlugin } from './intromail/index.js';",
        backend_path,
    )
    backend = replace_once(
        backend, "  registry.register(gtdPlugin);",
        "  registry.register(gtdPlugin);\n  registry.register(introMailPlugin);",
        backend_path,
    )

    frontend = frontend_path.read_text(encoding="utf-8")
    frontend = replace_once(
        frontend, "import './gtd/index.jsx';",
        "import './gtd/index.jsx';\nimport './intromail/index.jsx';",
        frontend_path,
    )

    store = store_path.read_text(encoding="utf-8")
    # The import must be static so Vite includes the seam at build time.
    if "import { applyComposeInitializers } from '../plugins/composeInitializers.js';" not in store:
        store = "import { applyComposeInitializers } from '../plugins/composeInitializers.js';\n" + store
    store = replace_once(
        store,
        "composeData: data, prepareComposeSwitch: null",
        "composeData: applyComposeInitializers(data, state), prepareComposeSwitch: null",
        store_path,
    )

    for path, result in [
        (backend_path, backend.encode()),
        (frontend_path, frontend.encode()),
        (store_path, store.encode()),
    ]:
        if path.read_bytes() != result:
            changes[path] = result
    return changes


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mailflow", type=Path, help="Existing MailFlow source checkout")
    parser.add_argument("--dry-run", action="store_true", help="Validate and list changes without writing")
    parser.add_argument("--force", action="store_true", help="Replace diverged IntroMail plugin files")
    args = parser.parse_args(argv)
    own = Path(__file__).resolve().parents[1]
    root = args.mailflow.expanduser().resolve()
    try:
        if not root.is_dir():
            raise ValueError(f"MailFlow directory not found: {root}")
        changes = build_plan(root, own, force=args.force)
        for path, content in changes.items():
            print(("CHECK " if args.dry_run else "WRITE ") + str(path.relative_to(root)))
            if not args.dry_run:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
        if not changes:
            print("IntroMail is already installed; no changes needed.")
        else:
            print("Validation passed." if args.dry_run else "IntroMail installed. Rebuild MailFlow frontend and backend.")
    except (OSError, ValueError) as exc:
        parser.exit(1, "Install failed: " + str(exc) + "\n")


if __name__ == "__main__":
    main()
