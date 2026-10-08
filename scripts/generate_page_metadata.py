from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_ROOT = PROJECT_ROOT / "docs"
OUTPUT_FILE = DOCS_ROOT / "javascripts" / "page-metadata.js"


def route_for(source: Path) -> str:
    relative = source.relative_to(DOCS_ROOT).with_suffix("")
    parts = list(relative.parts)
    if parts[-1] == "index":
        parts.pop()
    return f"/{'/'.join(parts)}/" if parts else "/"


def run_git(*arguments: str) -> str | None:
    result = subprocess.run(
        ["git", *arguments],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def modified_at(source: Path, has_git: bool) -> str:
    relative = source.relative_to(PROJECT_ROOT).as_posix()
    if has_git:
        dirty = run_git("status", "--porcelain", "--", relative)
        if dirty == "":
            committed = run_git("log", "-1", "--format=%cI", "--", relative)
            if committed:
                return committed
    return datetime.fromtimestamp(source.stat().st_mtime).astimezone().isoformat()


def page_title(source: Path) -> str:
    for line in source.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return source.stem.replace("-", " ").title()


def count_units(source: Path) -> int:
    text = source.read_text(encoding="utf-8")
    text = re.sub(r"\A---\s.*?\s---\s", "", text, flags=re.DOTALL)
    han_characters = len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff]", text))
    latin_words = len(re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", text))
    return han_characters + latin_words


def generate() -> None:
    has_git = run_git("rev-parse", "--is-inside-work-tree") == "true"
    sources = sorted(DOCS_ROOT.rglob("*.md"))
    metadata = {
        route_for(source): modified_at(source, has_git)
        for source in sources
    }
    titles = {route_for(source): page_title(source) for source in sources}
    page_units = {route_for(source): count_units(source) for source in sources}
    newest = (
        max(metadata.values(), key=datetime.fromisoformat)
        if metadata
        else None
    )
    site_stats = {
        "pageCount": len(sources),
        "totalUnits": sum(count_units(source) for source in sources),
        "startedAt": "2026-10-07T00:00:00+08:00",
        "updatedAt": newest,
    }
    payload = "window.__PAGE_UPDATED__ = " + json.dumps(
        metadata,
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\nwindow.__PAGE_TITLES__ = " + json.dumps(
        titles,
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\nwindow.__PAGE_UNITS__ = " + json.dumps(
        page_units,
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\nwindow.__SITE_STATS__ = " + json.dumps(
        site_stats,
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\n"
    if not OUTPUT_FILE.exists() or OUTPUT_FILE.read_text(encoding="utf-8") != payload:
        OUTPUT_FILE.write_text(payload, encoding="utf-8")


def snapshot() -> tuple[tuple[str, int], ...]:
    return tuple(
        (source.as_posix(), source.stat().st_mtime_ns)
        for source in sorted(DOCS_ROOT.rglob("*.md"))
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--watch", action="store_true")
    arguments = parser.parse_args()

    generate()
    if not arguments.watch:
        return

    previous = snapshot()
    while True:
        time.sleep(0.75)
        current = snapshot()
        if current != previous:
            generate()
            previous = current


if __name__ == "__main__":
    main()
