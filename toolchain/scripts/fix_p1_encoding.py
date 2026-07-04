#!/usr/bin/env python3
"""Fix mojibake em dashes in P1 screen specs."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MOJIBAKE = "â€”"
EM_DASH = "\u2014"

for app in ("beauty", "layali"):
    screens = ROOT / "products" / app / "docs" / "screens"
    for path in screens.rglob("*.screen.md"):
        text = path.read_text(encoding="utf-8")
        new = text.replace(MOJIBAKE, EM_DASH)
        new = new.replace("P1 " + MOJIBAKE + " Client", "P1 — Client")
        if new != text:
            path.write_text(new, encoding="utf-8-sig")
            print(f"fixed {path.relative_to(ROOT)}")
