"""Generate raster FX / UI textures (glows, spotlights, crowd, note gems, logo, icons)."""
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

OUT = sys.argv[1]
FONTS = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
DJ = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
random.seed(7)


def save(im, n):
    im.save(os.path.join(OUT, n + '.png'), optimize=True)


def radial(size, power=2.0, color=(255, 255, 255)):
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2
    r = np.sqrt((x - c) ** 2 + (y - c) ** 2) / c
    a = np.clip(1 - r, 0, 1) ** power
    im = np.zeros((size, size, 4), np.uint8)
    im[..., :3] = color
    im[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(im, 'RGBA')


save(radial(128, 2.2), 'glow')
save(radial(64, 1.2), 'dot')

# sparkle star
s = 128
st = Image.new('RGBA', (s, s))
d = ImageDraw.Draw(st)
c = s / 2
for ang, ln, w in ((0, 60, 7), (90, 60, 7), (45, 30, 4), (135, 30, 4)):
    a = math.radians(ang)
    dx, dy = math.cos(a) * ln, math.sin(a) * ln
    px, py = -math.sin(a) * w, math.cos(a) * w
    d.polygon([(c - dx, c - dy), (c + px, c + py), (c + dx, c + dy), (c - px, c - py)], fill=(255, 255, 255, 255))
st = Image.alpha_composite(st.filter(ImageFilter.GaussianBlur(3)), st)
st = Image.alpha_composite(radial(s, 3.0), st)
save(st, 'star')

# confetti piece (tinted at runtime)
cf = Image.new('RGBA', (24, 12), (255, 255, 255, 255))
save(cf, 'confetti')

# spotlight beam (additive), tall cone
W, H = 360, 1200
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
t = y / H
half = 18 + t * (W / 2 - 18)
dx = np.abs(x - W / 2) / half
edge = np.clip(1 - dx, 0, 1) ** 1.6
fade = (1 - t) ** 0.6 * np.clip(t * 6, 0, 1) * 0.9 + 0.1 * (1 - t)
a = edge * fade
beam = np.zeros((H, W, 4), np.uint8)
beam[..., :3] = 255
beam[..., 3] = (a * 200).astype(np.uint8)
save(Image.fromarray(beam, 'RGBA').filter(ImageFilter.GaussianBlur(4)), 'beam')

# vignette
W, H = 960, 540
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / 1.414
a = np.clip((r - 0.45) / 0.55, 0, 1) ** 1.5
v = np.zeros((H, W, 4), np.uint8)
v[..., 3] = (a * 235).astype(np.uint8)
save(Image.fromarray(v, 'RGBA'), 'vignette')

# floor glow ellipse
fg = radial(256, 1.5).resize((512, 128))
save(fg, 'floorglow')

# crowd silhouettes, two frames (arms down / some arms up), backlit rim
def crowd(frame):
    W, H = 1920, 360
    im = Image.new('RGBA', (W, H))
    rim = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(im)
    dr = ImageDraw.Draw(rim)
    rnd = random.Random(42)
    for row in range(3):
        n = 22 + (2 - row) * 6
        for i in range(n):
            cx = (i + 0.2 + rnd.random() * 0.6) * W / n
            hs = 22 + row * 9 + rnd.random() * 6
            cy = 110 + row * 75 + rnd.random() * 20
            col = (14 - row * 4, 8 - row * 2, 28 - row * 6, 255)
            up = frame == 1 and rnd.random() < 0.45
            d.ellipse([cx - hs * 2.1, cy + hs * 0.9, cx + hs * 2.1, cy + hs * 4.5], fill=col)
            d.rectangle([cx - hs * 2.1, min(cy + hs * 2.6, H - 1), cx + hs * 2.1, H], fill=col)
            d.ellipse([cx - hs, cy - hs, cx + hs, cy + hs * 1.1], fill=col)
            dr.ellipse([cx - hs - 3, cy - hs - 4, cx + hs + 3, cy + hs * 0.6], fill=(255, 200, 255, 110))
            if up:
                side = rnd.choice((-1, 1))
                ax = cx + side * hs * 1.4
                d.line([(ax, cy + hs * 2), (ax + side * hs * 0.6, cy - hs * 2.4)], fill=col, width=int(hs * 0.7))
                d.ellipse([ax + side * hs * 0.6 - hs * 0.45, cy - hs * 3.0, ax + side * hs * 0.6 + hs * 0.45, cy - hs * 2.0], fill=col)
                if rnd.random() < 0.35:
                    lx, ly = ax + side * hs * 0.6, cy - hs * 2.6
                    dr.ellipse([lx - 7, ly - 7, lx + 7, ly + 7], fill=(255, 255, 240, 255))
    rim = rim.filter(ImageFilter.GaussianBlur(5))
    out = Image.alpha_composite(rim, im)
    return out


save(crowd(0), 'crowd0')
save(crowd(1), 'crowd1')

# note gems (shaded orbs) for rhythm lanes
COLORS = {'pink': (255, 70, 160), 'cyan': (40, 210, 255), 'gold': (255, 200, 40), 'violet': (170, 90, 255),
          'green': (60, 230, 120), 'white': (240, 240, 255)}


def gem(col, s=128):
    y, x = np.mgrid[0:s, 0:s].astype(np.float32)
    c = (s - 1) / 2
    r = np.sqrt((x - c) ** 2 + (y - c) ** 2) / (c * 0.78)
    inside = np.clip((1 - r) * 30, 0, 1)
    # lighting from top-left
    nx, ny = (x - c) / (c * 0.78), (y - c) / (c * 0.78)
    nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
    l = np.clip(-0.4 * nx - 0.5 * ny + 0.75 * nz, 0, 1)
    spec = np.clip(-0.45 * nx - 0.55 * ny + 0.7 * nz, 0, 1) ** 30
    base = np.array(col, np.float32) / 255
    rgb = base * (0.35 + 0.75 * l)[..., None] + spec[..., None] * 1.0
    ring = np.exp(-((r - 1.0) / 0.06) ** 2)
    rgb = rgb * (1 - ring[..., None] * 0.5) + ring[..., None] * 0.95
    glow = np.clip(1 - (r - 1) / 0.28, 0, 1) ** 2 * (r >= 1)
    a = np.maximum(inside, glow * 0.6)
    rgb = np.where((r >= 1)[..., None], base[None, None, :] * 1.0 + 0.2, rgb)
    out = np.zeros((s, s, 4), np.uint8)
    out[..., :3] = np.clip(rgb * 255, 0, 255)
    out[..., 3] = np.clip(a * 255, 0, 255)
    return Image.fromarray(out, 'RGBA')


for n, col in COLORS.items():
    save(gem(col), 'gem_' + n)

# target ring for hit line
s = 128
ring = Image.new('RGBA', (s, s))
d = ImageDraw.Draw(ring)
d.ellipse([10, 10, s - 10, s - 10], outline=(255, 255, 255, 230), width=6)
ring = Image.alpha_composite(ring.filter(ImageFilter.GaussianBlur(4)), ring)
save(ring, 'ring')

# hold trail
tr = np.zeros((64, 48, 4), np.uint8)
xx = np.abs(np.arange(48) - 23.5) / 24
tr[..., :3] = 255
tr[..., 3] = (np.clip(1 - xx, 0, 1) ** 0.8 * 200).astype(np.uint8)[None, :]
save(Image.fromarray(tr, 'RGBA'), 'trail')

# dance arrows (pointing up; rotated at runtime) with gradient + glow
def arrow(col, s=140):
    m = Image.new('L', (s, s))
    d = ImageDraw.Draw(m)
    c = s / 2
    pts = [(c, 12), (s - 16, c + 4), (c + 22, c + 4), (c + 22, s - 14), (c - 22, s - 14), (c - 22, c + 4), (16, c + 4)]
    d.polygon(pts, fill=255)
    grad = np.linspace(1.25, 0.55, s)[:, None] * np.ones((1, s))
    base = np.array(col, np.float32)
    rgb = np.clip(base[None, None, :] * grad[..., None], 0, 255).astype(np.uint8)
    body = Image.fromarray(np.dstack([rgb, np.asarray(m)]), 'RGBA')
    out = Image.new('RGBA', (s, s))
    edge = m.filter(ImageFilter.MaxFilter(9))
    glow = Image.new('RGBA', (s, s), col + (0,))
    glow.putalpha(edge.filter(ImageFilter.GaussianBlur(6)).point(lambda v: v * 0.9))
    out = Image.alpha_composite(out, glow)
    outline = Image.new('RGBA', (s, s), (255, 255, 255, 0))
    outline.putalpha(m.filter(ImageFilter.MaxFilter(5)))
    out = Image.alpha_composite(out, outline)
    out = Image.alpha_composite(out, body)
    return out


for n, col in (('pink', (255, 60, 150)), ('cyan', (30, 200, 255)), ('gold', (255, 190, 30)), ('violet', (160, 80, 255)), ('grey', (90, 90, 120))):
    save(arrow(col), 'arrow_' + n)

# UI panel (nine-slice source) and button
def panel(w, h, r, top, bot, border, alpha=235):
    m = Image.new('L', (w, h))
    ImageDraw.Draw(m).rounded_rectangle([2, 2, w - 3, h - 3], r, fill=255)
    g = np.linspace(0, 1, h)[:, None, None]
    rgb = (np.array(top)[None, None, :] * (1 - g) + np.array(bot)[None, None, :] * g) * np.ones((1, w, 1))
    im = Image.fromarray(np.dstack([rgb.astype(np.uint8), (np.asarray(m).astype(np.float32) * alpha / 255).astype(np.uint8)]), 'RGBA')
    bd = Image.new('RGBA', (w, h))
    ImageDraw.Draw(bd).rounded_rectangle([2, 2, w - 3, h - 3], r, outline=border, width=3)
    hl = Image.new('RGBA', (w, h))
    ImageDraw.Draw(hl).rounded_rectangle([6, 5, w - 7, h // 2], r - 4, fill=(255, 255, 255, 28))
    return Image.alpha_composite(Image.alpha_composite(im, hl), bd)


save(panel(96, 96, 22, (34, 18, 64), (14, 8, 30), (255, 140, 230, 200)), 'panel')
save(panel(96, 96, 22, (255, 255, 255), (235, 228, 250), (255, 255, 255, 255), 245), 'panel_light')
save(panel(96, 64, 30, (255, 92, 170), (190, 30, 120), (255, 210, 240, 255), 255), 'btn')
save(panel(96, 64, 30, (120, 70, 255), (60, 20, 170), (210, 190, 255, 255), 255), 'btn2')
save(panel(96, 64, 30, (70, 70, 90), (40, 40, 55), (150, 150, 170, 255), 255), 'btn_off')
save(panel(96, 64, 30, (40, 200, 120), (10, 130, 70), (190, 255, 220, 255), 255), 'btn_ok')
save(panel(96, 64, 30, (230, 60, 60), (150, 20, 30), (255, 200, 200, 255), 255), 'btn_bad')

# Logo
def logo():
    W, H = 1500, 520
    big = ImageFont.truetype(os.path.join(FONTS, 'Montserrat-Black.ttf'), 210)
    script = ImageFont.truetype(os.path.join(FONTS, 'Pacifico-Regular.ttf'), 150)
    m = Image.new('L', (W, H))
    d = ImageDraw.Draw(m)
    t1 = 'NOVA'
    bb = d.textbbox((0, 0), t1, font=big)
    d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], 20), t1, font=big, fill=255)
    m2 = Image.new('L', (W, H))
    d2 = ImageDraw.Draw(m2)
    t2 = 'Académie'
    bb = d2.textbbox((0, 0), t2, font=script)
    d2.text(((W - (bb[2] - bb[0])) / 2 - bb[0], 225), t2, font=script, fill=255)
    g = np.linspace(0, 1, H)[:, None]
    top = np.array([255, 240, 160]); bot = np.array([255, 120, 40])
    rgb1 = (top * (1 - g[..., None]) + bot * g[..., None]) * np.ones((1, W, 1))
    top2 = np.array([255, 150, 230]); bot2 = np.array([170, 80, 255])
    rgb2 = (top2 * (1 - g[..., None]) + bot2 * g[..., None]) * np.ones((1, W, 1))
    l1 = Image.fromarray(np.dstack([rgb1.astype(np.uint8), np.asarray(m)]), 'RGBA')
    l2 = Image.fromarray(np.dstack([rgb2.astype(np.uint8), np.asarray(m2)]), 'RGBA')
    both = ImageChops.lighter(m, m2)
    out = Image.new('RGBA', (W, H))
    glow = Image.new('RGBA', (W, H), (255, 80, 200, 0))
    glow.putalpha(both.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(18)))
    out = Image.alpha_composite(out, glow)
    stroke = Image.new('RGBA', (W, H), (40, 10, 60, 0))
    stroke.putalpha(both.filter(ImageFilter.MaxFilter(11)))
    out = Image.alpha_composite(out, stroke)
    out = Image.alpha_composite(out, l1)
    out = Image.alpha_composite(out, l2)
    # sheen
    sh = np.zeros((H, W), np.float32)
    yy = np.arange(H)[:, None]
    sh[:] = np.clip(1 - np.abs(yy - 95) / 18, 0, 1) * 0.35
    shine = Image.fromarray(np.dstack([np.full((H, W, 3), 255, np.uint8), (sh * np.asarray(m)).astype(np.uint8)]), 'RGBA')
    out = Image.alpha_composite(out, shine)
    starim = Image.open(os.path.join(OUT, 'star.png')).resize((150, 150))
    out.alpha_composite(starim, (W - 330, 10))
    out.alpha_composite(starim.resize((90, 90)), (250, 300))
    return out.crop(out.getbbox())


save(logo(), 'logo')

# icons from DejaVu glyphs with gradient fill
ICONS = {'voix': '♫', 'danse': '★', 'scene': '☺', 'culture': '✎', 'pop': '♥', 'forme': '⚡',
         'star': '★', 'lock': '✖', 'check': '✔', 'crown': '♛', 'mic': '♪', 'vote': '✉'}
ICOL = {'voix': ((255, 160, 220), (230, 40, 140)), 'danse': ((140, 240, 255), (20, 140, 230)), 'scene': ((255, 230, 140), (240, 140, 20)),
        'culture': ((200, 255, 180), (40, 170, 80)), 'pop': ((255, 150, 150), (220, 20, 60)), 'forme': ((255, 255, 160), (250, 170, 0)),
        'star': ((255, 250, 190), (255, 170, 20)), 'lock': ((255, 170, 170), (200, 30, 30)), 'check': ((190, 255, 200), (20, 170, 70)),
        'crown': ((255, 250, 190), (230, 150, 0)), 'mic': ((230, 210, 255), (130, 70, 230)), 'vote': ((220, 240, 255), (60, 120, 230))}
for n, ch in ICONS.items():
    s = 96
    f = ImageFont.truetype(DJ, 76)
    m = Image.new('L', (s, s))
    d = ImageDraw.Draw(m)
    bb = d.textbbox((0, 0), ch, font=f)
    d.text(((s - (bb[2] - bb[0])) / 2 - bb[0], (s - (bb[3] - bb[1])) / 2 - bb[1]), ch, font=f, fill=255)
    a, b = ICOL[n]
    g = np.linspace(0, 1, s)[:, None, None]
    rgb = (np.array(a) * (1 - g) + np.array(b) * g) * np.ones((1, s, 1))
    body = Image.fromarray(np.dstack([rgb.astype(np.uint8), np.asarray(m)]), 'RGBA')
    sk = Image.new('RGBA', (s, s), (20, 10, 30, 0))
    sk.putalpha(m.filter(ImageFilter.MaxFilter(7)))
    out = Image.alpha_composite(sk, body)
    save(out, 'ico_' + n)
print('fx done')
