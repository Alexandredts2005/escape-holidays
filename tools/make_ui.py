"""Generate the 2D UI art (logo, HUD icons, paper texture, favicon) with PIL. Usage: python3 tools/make_ui.py"""
import math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
OUT = os.path.join(ROOT, 'assets', 'ui')
FONTS = os.path.join(ROOT, 'assets', 'fonts')
INK = (42, 34, 51, 255)
os.makedirs(OUT, exist_ok=True)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def outlined(im, w=6, color=INK):
    """sticker outline around the alpha of im"""
    a = im.split()[-1]
    big = a.filter(ImageFilter.MaxFilter(w * 2 + 1))
    base = Image.new('RGBA', im.size, color)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(base, (0, 0), big)
    out.alpha_composite(im)
    return out


def text_layer(size, xy, text, fnt, fill, anchor='mm', stroke=0, stroke_fill=INK):
    lay = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.text(xy, text, font=fnt, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=stroke_fill)
    return lay


def gradient_text(size, xy, text, fnt, top, bottom, anchor='mm'):
    mask = text_layer(size, xy, text, fnt, (255, 255, 255, 255), anchor).split()[-1]
    grad = Image.new('RGBA', size)
    gd = ImageDraw.Draw(grad)
    bb = mask.getbbox() or (0, 0, size[0], size[1])
    for y in range(size[1]):
        k = min(1, max(0, (y - bb[1]) / max(1, bb[3] - bb[1])))
        c = tuple(int(top[i] + (bottom[i] - top[i]) * k) for i in range(3)) + (255,)
        gd.line([(0, y), (size[0], y)], fill=c)
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def palm(d, x, y, s, lean=0.2):
    # trunk
    pts = []
    for i in range(12):
        k = i / 11
        pts.append((x + math.sin(k * 1.4) * lean * 120 * s, y - k * 230 * s))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=(201, 138, 90, 255), width=int(26 * s * (1 - i / 16)))
        d.line([pts[i], pts[i + 1]], fill=INK, width=2)
    tx, ty = pts[-1]
    for a in [-2.6, -2.0, -1.4, -0.9, -0.4, 0.3]:
        ex = tx + math.cos(a) * 150 * s
        ey = ty + math.sin(a) * 70 * s + 40 * s
        d.polygon([(tx, ty), (ex, ey), (tx + math.cos(a + 0.25) * 90 * s, ty + math.sin(a + 0.25) * 30 * s)], fill=(79, 200, 160, 255), outline=INK)


def logo():
    W, H = 1440, 600
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # sun
    d.ellipse((520, 40, 920, 440), fill=(255, 194, 61, 255))
    for i in range(10):
        a = i / 10 * math.pi * 2
        d.line([(720 + math.cos(a) * 220, 240 + math.sin(a) * 220), (720 + math.cos(a) * 280, 240 + math.sin(a) * 280)], fill=(255, 154, 60, 255), width=18)
    palm(d, 210, 520, 1.25, 0.35)
    palm(d, 1250, 520, 1.15, -0.35)
    # title
    title = gradient_text((W, H), (W // 2, 250), 'Escape Holidays', font('Pacifico-Regular.ttf', 190), (255, 140, 110), (232, 53, 43))
    title = outlined(title, 12)
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow.paste((42, 34, 51, 160), (0, 0), title.split()[-1])
    im.alpha_composite(shadow, (0, 14))
    im.alpha_composite(title)
    # ribbon
    rib = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rib)
    rd.polygon([(330, 410), (1110, 410), (1150, 455), (1110, 500), (330, 500), (290, 455)], fill=(36, 167, 160, 255), outline=INK, width=8)
    rd.text((W // 2, 457), 'HÔTEL LES MIRAGES', font=font('BebasNeue-Regular.ttf', 84), fill=(255, 246, 227, 255), anchor='mm')
    im.alpha_composite(rib)
    # five little stars
    for i in range(5):
        cx, cy = 560 + i * 80, 545
        pts = []
        for k in range(10):
            a = -math.pi / 2 + k / 10 * math.pi * 2
            r = 26 if k % 2 == 0 else 11
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        d2 = ImageDraw.Draw(im)
        d2.polygon(pts, fill=(255, 194, 61, 255), outline=INK, width=4)
    im = outlined(im, 3)
    im.save(os.path.join(OUT, 'logo.png'))


def icon_biscuit(S=128):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((12, 18, 116, 110), fill=(217, 160, 91, 255), outline=INK, width=6)
    d.ellipse((24, 26, 104, 96), outline=(186, 128, 66, 255), width=4)
    for x, y in [(44, 48), (78, 42), (62, 70), (40, 82), (86, 76), (62, 38)]:
        d.ellipse((x - 7, y - 6, x + 7, y + 6), fill=(90, 52, 32, 255))
    return im


def icon_duck(S=128):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((14, 56, 104, 112), fill=(255, 207, 58, 255), outline=INK, width=6)
    d.polygon([(16, 70), (6, 52), (30, 64)], fill=(255, 207, 58, 255), outline=INK)
    d.ellipse((56, 16, 106, 66), fill=(255, 207, 58, 255), outline=INK, width=6)
    d.ellipse((96, 38, 124, 54), fill=(255, 122, 42, 255), outline=INK, width=4)
    d.ellipse((80, 30, 90, 40), fill=INK)
    d.arc((30, 64, 80, 100), 200, 330, fill=(232, 170, 30, 255), width=6)
    return im


def icon_clock(S=128):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((12, 12, 116, 116), fill=(36, 167, 160, 255), outline=INK, width=6)
    d.ellipse((24, 24, 104, 104), fill=(255, 246, 227, 255), outline=INK, width=4)
    for i in range(12):
        a = i / 12 * math.pi * 2
        d.line([(64 + math.cos(a) * 32, 64 + math.sin(a) * 32), (64 + math.cos(a) * 38, 64 + math.sin(a) * 38)], fill=INK, width=4)
    d.line([(64, 64), (64, 36)], fill=INK, width=7)
    d.line([(64, 64), (84, 72)], fill=(232, 53, 43, 255), width=6)
    return im


def paper():
    W, H = 800, 1000
    random.seed(4)
    im = Image.new('RGB', (W, H), (251, 238, 210))
    d = ImageDraw.Draw(im)
    for _ in range(9000):
        x, y = random.randrange(W), random.randrange(H)
        c = random.choice([(240, 222, 186), (255, 246, 226), (236, 214, 176)])
        d.point((x, y), fill=c)
    for i in range(14):
        y = 120 + i * 62
        d.line([(40, y), (W - 40, y)], fill=(225, 205, 168), width=2)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    vign = Image.new('L', (W, H), 0)
    vd = ImageDraw.Draw(vign)
    for k in range(40):
        vd.rectangle((k * 3, k * 3, W - k * 3, H - k * 3), outline=int(110 * (1 - k / 40)))
    tint = Image.new('RGB', (W, H), (214, 178, 120))
    im = Image.composite(tint, im, vign.filter(ImageFilter.GaussianBlur(18)))
    im.save(os.path.join(OUT, 'paper.png'), optimize=True)


def favicon():
    S = 256
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((8, 8, 248, 248), fill=(255, 116, 88, 255), outline=INK, width=10)
    # key
    d.ellipse((50, 70, 130, 150), outline=(255, 194, 61, 255), width=22)
    d.line([(124, 124), (206, 206)], fill=(255, 194, 61, 255), width=24)
    d.line([(178, 178), (204, 152)], fill=(255, 194, 61, 255), width=18)
    d.line([(196, 196), (220, 172)], fill=(255, 194, 61, 255), width=18)
    im.save(os.path.join(OUT, 'icon.png'))


logo()
for name, fn in [('biscuit', icon_biscuit), ('duck', icon_duck), ('clock', icon_clock)]:
    outlined(fn(), 2).save(os.path.join(OUT, name + '.png'))
paper()
favicon()
print('ui ok', os.listdir(OUT))
