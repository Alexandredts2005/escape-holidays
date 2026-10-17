"""Tiny numpy synthesizer used to render all of the game's original music."""
import math
import numpy as np
import scipy.signal as ss

SR = 44100
RNG = np.random.default_rng(1234)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def tt(n):
    return np.arange(n) / SR


def blep_saw(freq):
    dt = np.asarray(freq, np.float64) / SR
    ph = np.cumsum(dt) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    x = ph[m1] / dt[m1]
    y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]
    y[m2] -= x * x + x + x + 1
    return y


def blep_square(freq, width=0.5):
    f = np.asarray(freq, np.float64)
    a = blep_saw(f)
    dt = f / SR
    ph = (np.cumsum(dt) + width) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    x = ph[m1] / dt[m1]
    y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]
    y[m2] -= x * x + x + x + 1
    return (a - y) * 0.5


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.05, gate=None):
    """gate = samples the note is held; release after."""
    if gate is None:
        gate = max(1, n - int(r * SR))
    e = np.zeros(n)
    ia, idd = max(1, int(a * SR)), max(1, int(d * SR))
    seg = np.arange(n)
    e = np.where(seg < ia, seg / ia, np.where(seg < ia + idd, 1 - (1 - s) * (seg - ia) / idd, s))
    rel = seg >= gate
    if rel.any():
        lvl = e[min(gate, n - 1)]
        e[rel] = lvl * np.exp(-(seg[rel] - gate) / max(1, r * SR) * 4)
    return e


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    b, a = ss.butter(order, fc / (SR / 2))
    return ss.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = ss.butter(order, fc / (SR / 2), 'high')
    return ss.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = ss.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band')
    return ss.lfilter(b, a, x)


def noise(n):
    return RNG.standard_normal(n)


# ---------------------------------------------------------------- drums
def kick(v=1.0):
    n = int(0.42 * SR)
    t = tt(n)
    f = 46 + 120 * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.0)
    y += hp(noise(n), 2000) * np.exp(-t * 350) * 0.35
    return np.tanh(1.6 * y) * v


def snare(v=1.0):
    n = int(0.3 * SR)
    t = tt(n)
    tone = np.sin(2 * np.pi * 186 * t) * np.exp(-t * 26) * 0.55 + np.sin(2 * np.pi * 330 * t) * np.exp(-t * 34) * 0.25
    nz = bp(noise(n), 1500, 9500) * np.exp(-t * 15) * 0.9
    return (tone + nz) * v


def clap(v=1.0):
    n = int(0.35 * SR)
    t = tt(n)
    nz = bp(noise(n), 900, 5000)
    e = np.zeros(n)
    for k, t0 in enumerate((0, 0.011, 0.023)):
        m = t >= t0
        e[m] += np.exp(-(t[m] - t0) * (160 if k < 2 else 20))
    return nz * e * 0.9 * v


def hat(v=1.0, open_=False):
    n = int((0.55 if open_ else 0.08) * SR)
    t = tt(n)
    y = hp(noise(n), 7500, 4) * np.exp(-t * (8 if open_ else 70))
    return y * 0.55 * v


def crash(v=1.0):
    n = int(2.6 * SR)
    t = tt(n)
    y = hp(noise(n), 3500, 2) * np.exp(-t * 2.0)
    y += hp(noise(n), 8000) * np.exp(-t * 4) * 0.5
    return y * 0.45 * v


def rim(v=1.0):
    n = int(0.08 * SR)
    t = tt(n)
    y = bp(noise(n), 1500, 4000) * np.exp(-t * 90) + np.sin(2 * np.pi * 820 * t) * np.exp(-t * 60) * 0.6
    return y * 0.6 * v


def tom(v=1.0, f0=150):
    n = int(0.4 * SR)
    t = tt(n)
    f = f0 * (0.65 + 0.35 * np.exp(-t * 12))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * v


def shaker(v=1.0):
    n = int(0.09 * SR)
    t = tt(n)
    e = np.minimum(t / 0.012, 1) * np.exp(-t * 45)
    return bp(noise(n), 5000, 12000) * e * 0.5 * v


def snap(v=1.0):
    n = int(0.12 * SR)
    t = tt(n)
    return bp(noise(n), 1800, 6000) * np.exp(-t * 70) * v


# ---------------------------------------------------------------- tonal
def bass(m, dur, kind='synth'):
    n = int((dur + 0.08) * SR)
    f = np.full(n, mtof(m))
    t = tt(n)
    gate = int(dur * SR)
    if kind == 'sub':
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        y = y * adsr(n, 0.005, 0.2, 0.85, 0.06, gate)
        return np.tanh(y * 1.3) * 0.8
    y = blep_saw(f) * 0.55 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.7
    cut = 380 if kind == 'round' else 900
    y = lp(y, cut + 1200 * (kind == 'bright'))
    y = y * adsr(n, 0.004, 0.18, 0.7, 0.05, gate)
    return np.tanh(y * 1.4) * 0.75


def epiano(m, dur, vel=1.0):
    n = int((dur + 0.6) * SR)
    t = tt(n)
    f = mtof(m)
    gate = int(dur * SR)
    idx = 2.2 * np.exp(-t * 2.5) * vel
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    y += 0.18 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 24)
    y *= np.exp(-t * (1.3 + f / 900))
    rel = np.ones(n)
    rel[gate:] = np.exp(-np.arange(n - gate) / (0.12 * SR))
    y *= rel * (1 + 0.08 * np.sin(2 * np.pi * 4.5 * t))
    return y * 0.33 * vel


def piano(m, dur, vel=1.0):
    n = int((dur + 1.0) * SR)
    t = tt(n)
    f = mtof(m)
    gate = int(dur * SR)
    y = np.zeros(n)
    for k, (amp, dec) in enumerate(((1.0, 1.0), (0.45, 1.8), (0.25, 2.6), (0.12, 3.5), (0.06, 5.0))):
        y += amp * np.sin(2 * np.pi * f * (k + 1) * (1 + 0.0004 * k * k) * t) * np.exp(-t * dec * (0.6 + f / 1200))
    y += hp(noise(n), 3000) * np.exp(-t * 80) * 0.05
    rel = np.ones(n)
    rel[gate:] = np.exp(-np.arange(n - gate) / (0.18 * SR))
    return y * rel * 0.22 * vel


def pad(m, dur, bright=2200, att=0.35):
    n = int((dur + 0.6) * SR)
    gate = int(dur * SR)
    f0 = mtof(m)
    y = np.zeros(n)
    for c in (-13, -6, 0, 6, 13):
        y += blep_saw(np.full(n, f0 * 2 ** (c / 1200)))
    y = lp(y / 5, bright)
    return y * adsr(n, att, 0.3, 0.85, 0.5, gate) * 0.32


def strings(m, dur, att=0.45):
    n = int((dur + 0.8) * SR)
    gate = int(dur * SR)
    t = tt(n)
    f0 = mtof(m) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t - 0.3, 0, 1))
    y = sum(blep_saw(f0 * 2 ** (c / 1200)) for c in (-9, 0, 8)) / 3
    y = lp(y, 3200)
    return y * adsr(n, att, 0.2, 0.9, 0.6, gate) * 0.3


def pluck(m, dur, bright=3500):
    n = int((min(dur, 0.6) + 0.4) * SR)
    t = tt(n)
    y = blep_square(np.full(n, mtof(m)), 0.3)
    y = lp(y, bright) * np.exp(-t * 7)
    return y * 0.3


def bell(m, dur):
    n = int((dur + 1.4) * SR)
    t = tt(n)
    f = mtof(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) \
        + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 7)
    return y * 0.22


def brass(m, dur):
    n = int((dur + 0.25) * SR)
    gate = int(dur * SR)
    t = tt(n)
    f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t))
    y = blep_saw(f) + 0.6 * blep_saw(f * 1.004)
    e = adsr(n, 0.04, 0.15, 0.8, 0.12, gate)
    y = lp(y, 900 + 2600 * min(1.0, dur)) * e
    return y * 0.22


def organ(m, dur):
    n = int((dur + 0.15) * SR)
    gate = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    y = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in ((0.5, 0.6), (1, 1), (2, 0.6), (3, 0.3), (4, 0.25)))
    return y * adsr(n, 0.01, 0.05, 1, 0.08, gate) * 0.14


VOWELS = {
    'a': ((800, 80, 1.0), (1150, 90, 0.55), (2900, 120, 0.3)),
    'e': ((420, 60, 1.0), (1700, 90, 0.4), (2700, 120, 0.3)),
    'i': ((300, 50, 1.0), (2200, 100, 0.35), (3000, 110, 0.3)),
    'o': ((460, 70, 1.0), (820, 80, 0.55), (2830, 100, 0.25)),
    'u': ((330, 50, 1.0), (720, 60, 0.35), (2700, 160, 0.15)),
}


def vowel_of(syl):
    s = syl.lower()
    for k, v in (('ou', 'u'), ('au', 'o'), ('eau', 'o'), ('ai', 'e'), ('ei', 'e'), ('oi', 'a'), ('an', 'a'), ('en', 'a'),
                 ('on', 'o'), ('in', 'e'), ('un', 'e'), ('eu', 'e'), ('œu', 'e')):
        if k in s:
            return v
    for ch in s:
        if ch in 'aàâä':
            return 'a'
        if ch in 'eéèêë':
            return 'e'
        if ch in 'iîïy':
            return 'i'
        if ch in 'oôö':
            return 'o'
        if ch in 'uùûü':
            return 'u'
    return 'a'


def voice(m, dur, prev_m=None, vowel='a', breath=0.06, timbre=1.0):
    """Formant 'singing' synth voice with glide + delayed vibrato."""
    n = int((dur + 0.14) * SR)
    gate = int(dur * SR)
    t = tt(n)
    f1 = mtof(m)
    if prev_m is not None and abs(prev_m - m) <= 9:
        f0 = mtof(prev_m)
        glide = np.exp(-t / 0.035)
        f = f1 * (f0 / f1) ** glide
    else:
        f = np.full(n, f1)
    vib_depth = np.clip((t - 0.18) / 0.35, 0, 1) * 28
    f = f * 2 ** (vib_depth * np.sin(2 * np.pi * 5.6 * t) / 1200)
    src = blep_saw(f) * 0.8 + blep_square(f * 1.001, 0.42) * 0.25 * timbre
    out = np.zeros(n)
    for F, BW, g in VOWELS[vowel]:
        b, a = ss.iirpeak(F / (SR / 2), F / BW)
        out += ss.lfilter(b, a, src) * g
    out = out * 2.2 + lp(src, 2600) * 0.18
    out += bp(noise(n), 2000, 7000) * breath * np.exp(-t * 12)
    e = adsr(n, 0.028, 0.15, 0.85, 0.07, gate)
    return out * e * 0.42


# ---------------------------------------------------------------- fx
def riser(dur):
    n = int(dur * SR)
    t = tt(n)
    nz = noise(n)
    out = np.zeros(n)
    steps = 24
    for i in range(steps):
        a, b = i * n // steps, (i + 1) * n // steps
        fc = 300 * (30 ** (i / steps))
        seg = lp(nz[max(0, a - 2000):b], fc)[-(b - a):]
        out[a:b] = seg
    return out * (t / dur) ** 2 * 0.5


def impact():
    n = int(2.5 * SR)
    t = tt(n)
    y = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.5)
    y += lp(noise(n), 1500) * np.exp(-t * 3) * 0.4
    return np.tanh(y * 1.5) * 0.8


def make_ir(sec=2.2, decay=3.0, seed=3, bright=6500):
    n = int(sec * SR)
    t = tt(n)
    rng = np.random.default_rng(seed)
    pre = int(0.018 * SR)
    out = []
    for _ in range(2):
        x = rng.standard_normal(n) * np.exp(-t * decay)
        x = lp(x, bright, 1)
        x[:pre] = 0
        out.append(x)
    norm = math.sqrt(np.sum(out[0] ** 2))
    return out[0] / norm, out[1] / norm


class Bus:
    def __init__(self, n):
        self.l = np.zeros(n)
        self.r = np.zeros(n)

    def add(self, start, sig, gain=1.0, pan=0.0):
        n = len(self.l)
        if start >= n or start + len(sig) <= 0:
            return
        if start < 0:
            sig = sig[-start:]
            start = 0
        end = min(n, start + len(sig))
        sig = sig[:end - start]
        ang = (pan + 1) * math.pi / 4
        self.l[start:end] += sig * math.cos(ang) * gain * 1.414
        self.r[start:end] += sig * math.sin(ang) * gain * 1.414

    def mix(self, other, g=1.0):
        self.l += other.l * g
        self.r += other.r * g

    def apply(self, fn):
        self.l = fn(self.l)
        self.r = fn(self.r)


def reverb(bus, ir, wet=0.25):
    out = Bus(len(bus.l))
    out.l = ss.fftconvolve(bus.l, ir[0])[:len(bus.l)] * wet
    out.r = ss.fftconvolve(bus.r, ir[1])[:len(bus.l)] * wet
    return out


def delay(bus, secs, fb=0.35, wet=0.3, n_taps=5):
    out = Bus(len(bus.l))
    d = int(secs * SR)
    for k in range(1, n_taps + 1):
        g = wet * fb ** (k - 1)
        if k * d >= len(bus.l):
            break
        # ping-pong
        if k % 2:
            out.l[k * d:] += bus.r[:-k * d] * g
            out.r[k * d:] += bus.l[:-k * d] * g * 0.6
        else:
            out.l[k * d:] += bus.l[:-k * d] * g * 0.6
            out.r[k * d:] += bus.r[:-k * d] * g
    out.apply(lambda x: lp(x, 5000, 1))
    return out


def sidechain(n, kick_samples, depth=0.55, rel=0.18):
    g = np.ones(n)
    L = int(rel * SR * 2)
    env = 1 - depth * np.exp(-np.arange(L) / (rel * SR / 2.5))
    for k in kick_samples:
        if k >= n:
            continue
        e = min(n, k + L)
        g[k:e] = np.minimum(g[k:e], env[:e - k])
    return g
