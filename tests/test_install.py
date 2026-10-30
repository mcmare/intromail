"""Install-hook contract tests with a temporary upstream-like source tree."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("intromail_installer", ROOT / "scripts/install.py")
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        sources = {
            "backend/src/plugins/loadPlugins.js":
                "import { gtdPlugin } from './gtd/index.js';\n"
                "export function loadBundledPlugins(registry) {\n"
                "  registry.register(gtdPlugin);\n  return registry;\n}\n",
            "frontend/src/plugins/index.js": "import './gtd/index.jsx';\n",
            "frontend/src/store/index.js":
                "export const openCompose = () => set(state => "
                "({ composeData: data, prepareComposeSwitch: null }));\n",
        }
        for rel, content in sources.items():
            target = self.root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_install_is_idempotent(self):
        changes = installer.build_plan(self.root, ROOT)
        self.assertGreater(len(changes), 4)
        for path, data in changes.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        self.assertEqual(installer.build_plan(self.root, ROOT), {})
        updated = (self.root / "frontend/src/store/index.js").read_text()
        self.assertIn("applyComposeInitializers(data, state)", updated)
        self.assertIn("registry.register(introMailPlugin)", (self.root / "backend/src/plugins/loadPlugins.js").read_text())

    def test_diverged_plugin_file_refused(self):
        path = self.root / "frontend/src/plugins/intromail/greeting.js"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("custom changes")
        with self.assertRaisesRegex(ValueError, "different content"):
            installer.build_plan(self.root, ROOT)
        self.assertIn(path, installer.build_plan(self.root, ROOT, force=True))

    def test_bad_upstream_file_refused_before_any_write(self):
        path = self.root / "frontend/src/store/index.js"
        path.write_text("no compose integration point here")
        with self.assertRaises(ValueError):
            installer.build_plan(self.root, ROOT)
        self.assertFalse((self.root / "frontend/src/plugins/intromail").exists())


if __name__ == "__main__":
    unittest.main()
