#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGET_DIRS = [
    ROOT / "assets" / "backgrounds" / "modes",
]
SOURCE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
QUALITY = 82


def webp_path_for(source: Path) -> Path:
    return source.with_suffix(".webp")


def should_convert(source: Path, target: Path) -> bool:
    return not target.exists() or source.stat().st_mtime > target.stat().st_mtime


def convert(source: Path) -> tuple[int, int] | None:
    target = webp_path_for(source)
    if not should_convert(source, target):
        return None

    with Image.open(source) as image:
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(target, "WEBP", quality=QUALITY, method=6)

    return source.stat().st_size, target.stat().st_size


def main() -> None:
    total_before = 0
    total_after = 0
    converted = 0

    for target_dir in TARGET_DIRS:
        for source in sorted(target_dir.rglob("*")):
            if not source.is_file() or source.suffix.lower() not in SOURCE_EXTENSIONS:
                continue
            result = convert(source)
            if result is None:
                continue
            before, after = result
            total_before += before
            total_after += after
            converted += 1
            saved = before - after
            print(f"{source.relative_to(ROOT)} -> {webp_path_for(source).relative_to(ROOT)} saved {saved / 1024:.1f} KB")

    if converted:
        print(f"Converted {converted} images. Saved {(total_before - total_after) / 1024 / 1024:.2f} MB.")
    else:
        print("No images needed conversion.")


if __name__ == "__main__":
    main()
