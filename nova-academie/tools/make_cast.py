"""Bake layered (MadameBerry) NPC sprites per expression + circular-ready head portraits for every character."""
import os, sys, json, glob
import numpy as np
from PIL import Image

ROOT = sys.argv[1]  # public/
CH = os.path.join(ROOT, 'assets', 'chars')
cast = json.load(open(os.path.join(ROOT, 'data', 'cast.json')))
faces = {}
for k, v in cast['berryFaces'].items():
    faces.setdefault(v, k)


def berry(spec, face):
    out = None
    for L in (f"body{spec['body']}_skin{spec['skin']}", f"body{spec['body']}_outfit{spec['outfit']}", f"face{face}", spec['hair']):
        im = Image.open(os.path.join(CH, 'berry', L + '.webp')).convert('RGBA')
        out = im if out is None else Image.alpha_composite(out, im)
    return out


def head_box(im, frac):
    a = np.asarray(im)[..., 3]
    rows = np.where(a.max(1) > 40)[0]
    top = rows[0]
    size = int(im.height * frac)
    band = a[top:top + int(size * 0.7)]
    cols = np.where(band.max(0) > 40)[0]
    cx = (cols[0] + cols[-1]) // 2 if len(cols) else im.width // 2
    # weight toward densest columns (face, not raised hand)
    w = (band > 40).sum(0).astype(float)
    if w.sum() > 0:
        cx = int((w * np.arange(len(w))).sum() / w.sum())
    y0 = max(0, top - int(size * 0.06))
    return (cx - size // 2, y0, cx + size // 2, y0 + size)


meta = {}
for cid, c in cast['chars'].items():
    if c['src'] == 'berry':
        for name, f in cast['berryFaces'].items():
            im = berry(c['berry'], f)
            im.save(os.path.join(CH, f'{cid}_{name}.webp'), 'WEBP', quality=88, method=6)
        base = berry(c['berry'], cast['berryFaces']['sourire'])
        frac = 0.30
    else:
        cands = sorted(glob.glob(os.path.join(CH, f'{cid}_joie.webp'))) or sorted(glob.glob(os.path.join(CH, f'{cid}_neutre.webp')))
        base = Image.open(cands[0]).convert('RGBA')
        frac = 0.215
    box = head_box(base, frac)
    por = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]))
    por.alpha_composite(base.crop(box), (0, 0))
    por = por.resize((256, 256), Image.LANCZOS)
    cm = Image.new("L", (1024, 1024)); __import__("PIL.ImageDraw").ImageDraw.Draw(cm).ellipse([8, 8, 1016, 1016], fill=255)
    por.putalpha(Image.fromarray(np.minimum(np.asarray(por)[..., 3], np.asarray(cm.resize((256, 256), Image.LANCZOS)))))
    por.save(os.path.join(CH, f'portrait_{cid}.webp'), 'WEBP', quality=90, method=6)
    exprs = sorted(os.path.basename(p)[len(cid) + 1:-5] for p in glob.glob(os.path.join(CH, f'{cid}_*.webp')))
    meta[cid] = {'exprs': exprs, 'size': list(base.size)}
    print(cid, box, exprs)
json.dump(meta, open(os.path.join(ROOT, 'data', 'sprites.json'), 'w'), indent=1)
