"""Equirectangular (CC0 Poly Haven HDRI tonemapped JPG) -> perspective background renderer."""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None


def load_pano(path, max_w=8192):
    im = Image.open(path)
    if im.width > max_w:
        im.draft('RGB', (max_w, max_w // 2))
    im = im.convert('RGB')
    if im.width > max_w:
        im = im.resize((max_w, max_w // 2), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def render(pano, yaw=0.0, pitch=0.0, fov=75.0, out_w=1920, out_h=1080, ss=1):
    H, W, _ = pano.shape
    ow, oh = out_w * ss, out_h * ss
    f = (ow / 2) / math.tan(math.radians(fov) / 2)
    xs = (np.arange(ow) - ow / 2 + 0.5) / f
    ys = (np.arange(oh) - oh / 2 + 0.5) / f
    x, y = np.meshgrid(xs, ys)
    z = np.ones_like(x)
    d = np.stack([x, -y, z], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = math.radians(pitch)
    cp, sp = math.cos(p), math.sin(p)
    dy = d[..., 1] * cp + d[..., 2] * sp
    dz = -d[..., 1] * sp + d[..., 2] * cp
    dx = d[..., 0]
    yw = math.radians(yaw)
    cy, sy = math.cos(yw), math.sin(yw)
    dx2 = dx * cy + dz * sy
    dz2 = -dx * sy + dz * cy
    lon = np.arctan2(dx2, dz2)
    lat = np.arcsin(np.clip(dy, -1, 1))
    u = (0.5 + lon / (2 * math.pi)) * W - 0.5
    v = (0.5 - lat / math.pi) * H - 0.5
    u0 = np.floor(u).astype(int); v0 = np.floor(v).astype(int)
    fu = (u - u0)[..., None]; fv = (v - v0)[..., None]
    u1 = (u0 + 1) % W; u0 %= W
    v0c = np.clip(v0, 0, H - 1); v1c = np.clip(v0 + 1, 0, H - 1)
    a = pano[v0c, u0]; b = pano[v0c, u1]; c = pano[v1c, u0]; e = pano[v1c, u1]
    out = (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + e * fu) * fv
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    if ss > 1:
        img = img.resize((out_w, out_h), Image.LANCZOS)
    return img


def preview(path, out):
    im = Image.open(path)
    im.draft('RGB', (2048, 1024))
    im = im.convert('RGB').resize((1600, 800))
    d = ImageDraw.Draw(im)
    for yaw in range(-180, 181, 30):
        x = (0.5 + yaw / 360) * 1600
        d.line([(x, 0), (x, 800)], fill=(255, 0, 0), width=1)
        d.text((x + 3, 5), str(yaw), fill=(255, 255, 0))
    for pt in (-30, 0, 30):
        yv = (0.5 - pt / 180) * 800
        d.line([(0, yv), (1600, yv)], fill=(0, 255, 0), width=1)
    im.save(out, quality=80)


if __name__ == '__main__':
    preview(sys.argv[1], sys.argv[2])
