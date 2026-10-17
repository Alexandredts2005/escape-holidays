"""Process CC0 visual-novel character art into game-ready WebP sprites.

Sources (all CC0, OpenGameArt.org):
  - "VN Characters" by cabbit KusSv  https://opengameart.org/content/vn-characters
  - "Visual Novel Style Characters" (Set 1) by MadameBerry https://opengameart.org/content/visual-novel-style-characters
  - "The Corporation Secretary Character" (Raquel) https://opengameart.org/content/the-corporation-secretary-character
Usage: python3 tools/make_characters.py <cabbit_dir> <berry_dir> <raquel_png> <out_dir>
"""
import os, sys, glob, json
import numpy as np
from PIL import Image

H = 1100  # display height of full-body sprites

CABBIT = {  # file prefix -> game id
    'Anna': 'lea', 'Dasha': 'mia', 'Student': 'hugo',
    'Visiter_A': 'victor', 'Visiter_B': 'ines', 'Visiter_C': 'zack',
}
EXPR = {'Duty_Smile': 'neutre', 'Broad_Smile': 'joie', 'Wide_Smile': 'joie',
        'Unhappy': 'triste', 'Blushing': 'gene', 'Puzzled': 'doute', '': 'neutre'}


def fit(im, h=H):
    im = im.crop(im.getbbox())
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def hue_shift(im, deg):
    a = np.asarray(im.convert('RGBA')).copy()
    hsv = np.asarray(Image.fromarray(a[..., :3]).convert('HSV')).astype(np.int16)
    hsv[..., 0] = (hsv[..., 0] + int(deg / 360 * 255)) % 256
    rgb = np.asarray(Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB'))
    a[..., :3] = rgb
    return Image.fromarray(a, 'RGBA')


def save(im, path):
    im.save(path, 'WEBP', quality=88, method=6)


def main(cab, berry, raquel, out):
    os.makedirs(out, exist_ok=True)
    meta = {'sprites': {}, 'berry': {}}
    for f in sorted(glob.glob(os.path.join(cab, 'VN_*.png'))):
        base = os.path.basename(f)[3:-4]
        name, _, expr = base.partition('--')
        cid, e = CABBIT[name], EXPR[expr]
        im = fit(Image.open(f).convert('RGBA'))
        key = f'{cid}_{e}'
        if key in meta['sprites']:
            continue
        save(im, os.path.join(out, key + '.webp'))
        meta['sprites'][key] = [im.width, im.height]
        print('sprite', key, im.size)
    im = fit(Image.open(raquel).convert('RGBA'))
    save(im, os.path.join(out, 'helene_neutre.webp'))
    meta['sprites']['helene_neutre'] = [im.width, im.height]

    # MadameBerry layered set: common crop so layers stack at the same origin
    files = sorted(glob.glob(os.path.join(berry, '*.png')))
    files = [f for f in files if 'PREVIEW' not in f]
    box = None
    for f in files:
        b = Image.open(f).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    sc = H / (box[3] - box[1])
    size = (round((box[2] - box[0]) * sc), H)
    bdir = os.path.join(out, 'berry')
    os.makedirs(bdir, exist_ok=True)

    def layer(f):
        return Image.open(f).convert('RGBA').crop(box).resize(size, Image.LANCZOS)

    for f in files:
        n = os.path.basename(f)[:-4].replace('Set1_', '')
        im = layer(f)
        if n.endswith('_outline'):
            b = n.split('_')[0]
            for v, deg in enumerate((0, 110, 220)):
                save(hue_shift(im, deg) if deg else im, os.path.join(bdir, f'{b}_outfit{v}.webp'))
        else:
            save(im, os.path.join(bdir, n + '.webp'))
        print('berry', n)
    meta['berry'] = {'size': list(size)}
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:5])
