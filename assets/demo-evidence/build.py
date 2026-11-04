"""Builds the optimised demo photographs and the fixture masks from the untouched originals.

Usage:  python assets/demo-evidence/build.py <dir-with-originals> [--preview <dir>]

Needs Pillow and numpy. The originals are not committed (see README.md for URLs and SHA-256);
download them first and name them as in ORIGINALS below. The script refuses to run on a file
whose SHA-256 differs from the recorded one, so the committed derivatives are reproducible.

Outputs (relative to the repository root):
  public/demo-assets/evidence/<name>.jpg   optimised photograph the app serves and sends to SAM / Muse Spark
  public/demo-assets/masks/<name>.png      RGBA fixture mask, same pixel size as the photograph
It prints a JSON manifest: sizes, bounding boxes (copied into src/data/fixtures.ts) and file sizes.
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
LONG_EDGE = 1600  # pixels; keeps defect texture legible while each JPEG stays well under 1 MB
JPEG_QUALITY = 82

# name -> SHA-256 of the untouched original as downloaded on 2026-11-04
ORIGINALS = {
    "ceiling-water-damage": "4f1ad9a780a1cb2a28ef1230e8f4c094d544615ef8e8da97edb0739af2f7d6dd",
    "industrial-pipes-corrosion": "c3df8fc66bd36b2511cb17e64296c9b66535d278329622723a31d88b8366d466",
    "bridge-concrete-spalling": "73b4d8d7c6ed63b2783a86ac733c815d75e6881023e30556aa15f1d3fcf10c61",
    "bridge-corrosion-usgs": "d6d5598babb08b55bb2cafba7d182098308dc86465d985a760f3ea96a085e078",
}

# Regions of interest in normalised (0-1) image coordinates, read off the oriented photograph.
# Inside a region a colour test picks the visibly marked pixels; the result is an authored
# demo fixture, not ground truth and not model output.
def _sat(rgb, hsv):
    return hsv[..., 1] > 0.17

def _rust(rgb, hsv):
    return (hsv[..., 0] > 0.02) & (hsv[..., 0] < 0.11) & (hsv[..., 1] > 0.55) & (hsv[..., 2] > 0.35)

def _exposed(rgb, hsv):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return (r > b + 18) & (hsv[..., 2] < 0.5)

MASKS = {
    "ceiling-water-damage": dict(
        regions=[[(0.30, 0.54), (0.34, 0.39), (0.38, 0.29), (0.44, 0.20), (0.52, 0.15), (0.60, 0.17), (0.655, 0.23), (0.655, 0.48), (0.56, 0.50), (0.42, 0.53)]],
        test=_sat, close=9, grow=3,
    ),
    "industrial-pipes-corrosion": dict(
        regions=[[(0.265, 0.50), (0.76, 0.50), (0.76, 0.90), (0.265, 0.90)]],
        test=_rust, close=7, grow=3,
    ),
    "bridge-concrete-spalling": dict(
        regions=[
            [(0.38, 0.52), (0.45, 0.52), (0.45, 0.66), (0.38, 0.66)],
            [(0.47, 0.51), (0.56, 0.51), (0.56, 0.91), (0.47, 0.91)],
        ],
        test=_exposed, close=15, grow=10,
    ),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def optimise(src: Path, dst: Path) -> Image.Image:
    with Image.open(src) as opened:
        im = ImageOps.exif_transpose(opened).convert("RGB")  # applies orientation, drops EXIF/GPS
        icc = opened.info.get("icc_profile")
    scale = LONG_EDGE / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    # No EXIF is passed. The ICC profile is kept so colours stay as shot.
    im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True, subsampling="4:2:0", **({"icc_profile": icc} if icc else {}))
    return im


def build_mask(im: Image.Image, spec: dict) -> Image.Image:
    w, h = im.size
    roi = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(roi)
    for poly in spec["regions"]:
        draw.polygon([(x * w, y * h) for x, y in poly], fill=255)
    rgb = np.asarray(im)
    hsv = np.asarray(im.convert("HSV")).astype(float) / 255
    hit = Image.fromarray((spec["test"](rgb, hsv) & (np.asarray(roi) > 0)).astype(np.uint8) * 255)
    k = spec["close"] | 1
    hit = hit.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k))  # close small gaps
    hit = hit.filter(ImageFilter.MaxFilter(spec["grow"] * 2 + 1))
    hit = Image.fromarray(np.minimum(np.asarray(hit), np.asarray(roi)))
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(hit)
    return out


def main() -> None:
    src_dir = Path(sys.argv[1])
    preview = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None
    manifest = {}
    for name, expected in ORIGINALS.items():
        src = src_dir / f"{name}.jpg"
        digest = sha256(src)
        if expected and digest != expected:
            sys.exit(f"{name}: SHA-256 {digest} does not match the recorded original")
        dst = ROOT / "public/demo-assets/evidence" / f"{name}.jpg"
        im = optimise(src, dst)
        entry = {"sha256": digest, "originalBytes": src.stat().st_size, "width": im.width, "height": im.height, "bytes": dst.stat().st_size}
        if name in MASKS:
            mask = build_mask(im, MASKS[name])
            mpath = ROOT / "public/demo-assets/masks" / f"{name}.png"
            mask.save(mpath, optimize=True)
            x0, y0, x1, y1 = mask.getchannel("A").point(lambda v: 255 if v > 127 else 0).getbbox()
            entry["box"] = {"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}
            entry["maskBytes"] = mpath.stat().st_size
            if preview:
                shade = Image.new("RGB", im.size, (255, 0, 160))
                over = Image.composite(shade, im, mask.getchannel("A").point(lambda v: 110 if v > 127 else 0))
                ImageDraw.Draw(over).rectangle([x0, y0, x1, y1], outline=(255, 255, 0), width=4)
                preview.mkdir(parents=True, exist_ok=True)
                over.save(preview / f"{name}-mask.jpg", quality=80)
        manifest[name] = entry
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
