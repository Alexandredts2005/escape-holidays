"""Render the original soundtrack of Escape Holidays (reuses the synth/arranger written for the NOVA prototype).

Usage: python3 tools/music.py public/assets/music [ids...]
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'nova-academie', 'tools'))
import synth as S  # noqa: E402
from synth import SR, Bus, reverb  # noqa: E402
from make_music import Song, encode  # noqa: E402

V = lambda a, b: [['verse', 'a'], ['chorus', 'b'], ['verse', 'a'], ['chorus', 'b']]
TRACKS = [
    dict(id='lounge', bpm=92, key=65, mode='major', drums='lofi', bass='round', keys='epiano', pad=True, lead_inst='bell', loop=True,
         form=V(0, 0), prog={'verse': ['Imaj7', 'vi7', 'ii7', 'V7'], 'chorus': ['IVmaj7', 'iii7', 'vi7', 'V7']}, melody={'a': [5, 4, 6, 3], 'b': [4, 5, 4, 6]}),
    dict(id='island', bpm=104, key=62, mode='major', drums='light', bass='pop', keys='guitar', pad=False, lead_inst='pluck', loop=True,
         form=V(0, 0), prog={'verse': ['I', 'IV', 'vi', 'V'], 'chorus': ['IV', 'V', 'I', 'vi']}, melody={'a': [6, 7, 6, 5], 'b': [5, 6, 7, 6]}),
    dict(id='dusk', bpm=78, key=63, mode='major', drums='none', bass='round', keys='piano_arp', pad=True, lead_inst='epiano', loop=True,
         form=[['verse', 'a'], ['verse', 'b'], ['verse', 'a'], ['verse', 'b']], prog={'verse': ['Imaj7', 'IVmaj7', 'vi7', 'V']}, melody={'a': [3, 4, 3, 5], 'b': [4, 3, 5, 3]}),
    dict(id='suite', bpm=86, key=67, mode='major', drums='lofi', bass='round', keys='epiano_soft', pad=True, lead_inst='bell', loop=True,
         form=[['verse', 'a'], ['verse', 'b'], ['verse', 'a'], ['verse', 'b']], prog={'verse': ['IVmaj7', 'iii7', 'ii7', 'Imaj7']}, melody={'a': [4, 3, 5, 3], 'b': [3, 4, 3, 5]}),
    dict(id='spa', bpm=68, key=69, mode='major', drums='none', bass='sub', keys='pluck_arp', pad=True, lead_inst='bell', loop=True,
         form=[['verse', 'a'], ['verse', 'b'], ['verse', 'a'], ['verse', 'b']], prog={'verse': ['Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7']}, melody={'a': [2, 3, 2, 3], 'b': [3, 2, 3, 2]}),
    dict(id='kitchen', bpm=112, key=64, mode='minor', drums='pop', bass='eighths', keys='stabs', pad=False, lead_inst='pluck', loop=True,
         form=V(0, 0), prog={'verse': ['i', 'iv', 'VII', 'III'], 'chorus': ['VI', 'VII', 'i', 'V']}, melody={'a': [7, 6, 8, 5], 'b': [6, 7, 6, 8]}),
    dict(id='office', bpm=88, key=62, mode='minor', drums='heart', bass='sub', keys='piano', pad=True, lead_inst='bell', loop=True,
         form=[['verse', 'a'], ['verse', 'b'], ['verse', 'a'], ['verse', 'b']], prog={'verse': ['i', 'VI', 'iv', 'V']}, melody={'a': [3, 2, 4, 2], 'b': [2, 3, 2, 4]}),
    dict(id='chrono', bpm=140, key=60, mode='minor', drums='four', bass='eighths', keys='stabs', pad=True, lead_inst='pluck', loop=True,
         form=V(0, 0), prog={'verse': ['i', 'i', 'VI', 'VII'], 'chorus': ['iv', 'VI', 'VII', 'V']}, melody={'a': [8, 6, 8, 6], 'b': [8, 8, 7, 8]}),
    dict(id='final', bpm=128, key=69, mode='major', drums='pop', bass='eighths', keys='supersaw', pad=False, lead_inst='brass', loop=True,
         form=V(0, 0), prog={'verse': ['I', 'V', 'vi', 'IV'], 'chorus': ['IV', 'V', 'I', 'I']}, melody={'a': [6, 7, 6, 8], 'b': [7, 8, 7, 8]}),
    dict(id='victory', bpm=116, key=60, mode='major', drums='pop', bass='eighths', keys='piano', pad=True, lead_inst='brass', loop=True, strings=True,
         form=V(0, 0), prog={'verse': ['I', 'iii', 'IV', 'V'], 'chorus': ['vi', 'IV', 'I', 'V']}, melody={'a': [6, 5, 7, 6], 'b': [7, 6, 7, 8]}),
]


def ambience(out, name, kind, length=24.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(11 if kind == 'sea' else 12)
    if kind == 'sea':
        base = S.lp(S.noise(n), 900) * 0.6 + S.lp(S.noise(n), 300) * 0.8
        swell = np.zeros(n)
        k = 0.0
        while k < length:
            per = 5 + rng.random() * 3
            i0 = int(k * SR)
            seg = np.arange(int(per * SR))
            env = np.sin(np.pi * seg / len(seg)) ** 2
            swell[i0:i0 + len(seg)] += env[:max(0, min(len(seg), n - i0))]
            k += per * 0.8
        hiss = S.bp(S.noise(n), 1500, 6000) * 0.25 * swell
        sig = base * (0.35 + 0.65 * swell) + hiss
    else:
        sig = S.bp(S.noise(n), 600, 5000) * 0.5
        for _ in range(int(length * 30)):
            i0 = int(rng.random() * (n - 2000))
            d = int((0.01 + rng.random() * 0.03) * SR)
            f0 = 800 + rng.random() * 2500
            seg = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.6, d)) / SR) * np.exp(-np.arange(d) / (d * 0.3))
            sig[i0:i0 + d] += seg * 0.25
    # seamless loop: crossfade the tail into the head
    xf = int(2.0 * SR)
    sig[:xf] = sig[:xf] * np.linspace(0, 1, xf) + sig[-xf:] * np.linspace(1, 0, xf)
    sig = sig[:-xf]
    sig = sig / np.abs(sig).max() * 0.7
    st = np.stack([sig, np.roll(sig, int(0.013 * SR))], 1)
    encode(st, os.path.join(out, name), 3, 96)


def main():
    out = sys.argv[1]
    only = set(sys.argv[2:])
    os.makedirs(out, exist_ok=True)
    for spec in TRACKS:
        if only and spec['id'] not in only:
            continue
        song = Song(spec)
        song.build_melody()
        back, voc = song.render()
        encode(back, os.path.join(out, spec['id']), 3, 112)
        print('rendered', spec['id'], round(song.length, 1), 's', flush=True)
    if not only or 'ambience' in only:
        ambience(out, 'sea', 'sea')
        ambience(out, 'fountain', 'fountain', 16.0)
        print('ambience ok', flush=True)


if __name__ == '__main__':
    main()
