#!/usr/bin/env python3
"""Run the DebateVision data build step."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

subprocess.run(
    ["node", str(ROOT / "scripts" / "build-lexicons.mjs")],
    cwd=ROOT,
    check=True,
)
