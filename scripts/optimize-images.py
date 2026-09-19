#!/usr/bin/env python3
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
TARGET_DIRS = [
    ROOT / "assets" / "backgrounds" / "modes",
    ROOT / "assets" / "icons",
    ROOT / "assets" / "cards",
    ROOT / "assets" / "backgrounds" / "worlds",
    ROOT / "assets" / "backgrounds" / "locations",
]
SOURCE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
QUALITY = 82
MOBILE_VARIANTS = {
    "thumb": (480, 258),
    "banner": (1080, 580),
}


def webp_path_for(source: Path) -> Path:
    return source.with_suffix(".webp")


def should_convert(source: Path, target: Path) -> bool:
    return not target.exists() or target.stat().st_size == 0 or source.stat().st_mtime > target.stat().st_mtime


def convert(source: Path) -> tuple[int, int] | None:
    target = webp_path_for(source)
    if not should_convert(source, target):
        return None

    with Image.open(source) as image:
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        temporary = target.with_suffix(".webp.tmp")
        image.save(temporary, "WEBP", quality=QUALITY, method=4)
        temporary.replace(target)

    return source.stat().st_size, target.stat().st_size


def build_mobile_variants(source: Path) -> int:
    if source.parent != ROOT / "assets" / "backgrounds" / "modes":
        return 0
    mobile_dir = source.parent / "mobile"
    mobile_dir.mkdir(parents=True, exist_ok=True)
    generated = 0

    with Image.open(source) as image:
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        for variant, size in MOBILE_VARIANTS.items():
            target = mobile_dir / f"{source.stem}-{variant}.webp"
            if not should_convert(source, target):
                continue
            resized = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)
            temporary = target.with_suffix(".webp.tmp")
            resized.save(temporary, "WEBP", quality=QUALITY, method=4)
            temporary.replace(target)
            generated += 1

    return generated


def main() -> None:
    total_before = 0
    total_after = 0
    converted = 0
    mobile_generated = 0

    sources = sorted({
        source
        for target_dir in TARGET_DIRS if target_dir.exists()
        for source in target_dir.rglob("*")
        if source.is_file() and source.suffix.lower() in SOURCE_EXTENSIONS
    })
    # Bound memory usage while encoding independent images.
    with ThreadPoolExecutor(max_workers=4) as pool:
        for source, result in zip(sources, pool.map(convert, sources)):
            if result is not None:
                before, after = result
                total_before += before
                total_after += after
                converted += 1
                print(f"{source.relative_to(ROOT)} saved {(before - after) / 1024:.1f} KB", flush=True)
            mobile_generated += build_mobile_variants(source)

    if converted:
        print(f"Converted {converted} images. Saved {(total_before - total_after) / 1024 / 1024:.2f} MB.")
    else:
        print("No images needed conversion.")
    if mobile_generated:
        print(f"Generated {mobile_generated} mobile mode images.")


if __name__ == "__main__":
    main()
