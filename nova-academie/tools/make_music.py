"""Compose + render all original music for NOVA Académie, with rhythm-game charts.

Usage: python3 tools/make_music.py <out_dir> [ids...]
Writes <id>.ogg/.mp3 (backing), <id>_voice.ogg/.mp3 (sung lead) and charts/<id>.json.
"""
import os, sys, json, math, hashlib, random, subprocess, tempfile
import numpy as np
from scipy.io import wavfile
import synth as S
from synth import SR, Bus, reverb, delay
from songs import SONGS, VOCALISES, DANCE, BGM

MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
ROMAN = {'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6}


def seeded(*parts):
    h = hashlib.md5('|'.join(map(str, parts)).encode()).hexdigest()
    return random.Random(int(h[:12], 16))


def parse_chord(sym, key, mode):
    s = sym
    flat = 0
    if s.startswith('b'):
        flat, s = -1, s[1:]
    ext = ''
    for e in ('maj7', '7', 'sus4', '°'):
        if s.endswith(e):
            ext, s = e, s[:-len(e)]
            break
    deg = ROMAN[s.lower()]
    scale = MAJOR if mode == 'major' else MINOR
    root = key + scale[deg] + flat
    minor = s.islower()
    tri = [0, 3, 7] if minor else [0, 4, 7]
    if ext == '°':
        tri = [0, 3, 6]
    if ext == 'sus4':
        tri = [0, 5, 7]
    if ext == '7':
        tri = tri + [10]
    if ext == 'maj7':
        tri = tri + [11]
    return root, tri


def voicing(root, tri, prev, center=60):
    pcs = [(root + i) % 12 for i in tri]
    best, bscore = None, 1e9
    for base in range(center - 10, center + 6):
        v = []
        for pc in pcs:
            n = base + ((pc - base) % 12)
            v.append(n)
        v.sort()
        score = abs(sum(v) / len(v) - center) * 0.6
        if prev:
            score += sum(min(abs(a - b) for b in prev) for a in v) * 0.4
        if score < bscore:
            best, bscore = v, score
    return best


def syllables(line):
    out = []
    for w in line.split():
        out.extend([p for p in w.split('-') if p])
    return out


class Song:
    def __init__(self, spec):
        self.spec = spec
        self.id = spec['id']
        self.bpm = spec['bpm']
        self.beat = 60.0 / self.bpm
        self.key = spec['key']
        self.mode = spec['mode']
        self.scale = MAJOR if self.mode == 'major' else MINOR
        self.sections = []  # (kind, start_bar, bars, lyric_key)
        bar = 0
        for kind, arg in spec['form']:
            if isinstance(arg, int):
                bars, lk = arg, None
            else:
                lk = arg
                if 'lyrics' in spec:
                    bars = 2 * len(spec['lyrics'][arg])
                else:
                    bars = 2 * len(spec['melody'][arg])
            self.sections.append((kind, bar, bars, lk))
            bar += bars
        self.bars = bar
        self.tail = 4.0 if not spec.get('loop') else 0.0
        self.length = self.bars * 4 * self.beat + self.tail
        self.n = int(self.length * SR) + SR // 2
        self.chords = []  # per bar (root, tri)
        for kind, start, bars, lk in self.sections:
            prog = spec['prog'][kind]
            for b in range(bars):
                self.chords.append(parse_chord(prog[b % len(prog)], self.key, self.mode))

    def s(self, beats):
        return int(round(beats * self.beat * SR))

    def section_at(self, bar):
        for sec in self.sections:
            if sec[1] <= bar < sec[1] + sec[2]:
                return sec
        return self.sections[-1]

    # ------------------------------------------------------------ melody
    def scale_notes(self, lo, hi):
        return [m for m in range(lo, hi + 1) if (m - self.key) % 12 in self.scale]

    def melody_line(self, text, start_bar, kind, sylls, degrees=None, last=False):
        rng = seeded(self.id, text, kind)
        S_ = len(sylls)
        if S_ == 0:
            return []
        grid16 = S_ > 12
        nslots = 32 if grid16 else 16
        unit = 0.25 if grid16 else 0.5
        maxslot = nslots - (5 if grid16 else 3)
        strong = [i for i in range(nslots) if i % (4 if grid16 else 2) == 0 and i <= maxslot]
        final_cands = [i for i in strong if i >= S_ - 1 and i >= maxslot - (6 if grid16 else 4)]
        final = rng.choice(final_cands) if final_cands else maxslot
        start = 0 if rng.random() < 0.7 else 1
        pool = list(range(start, final))
        if len(pool) < S_ - 1:
            pool = list(range(0, final))
        chosen = [start] if start in pool else []
        rest = [p for p in pool if p not in chosen]
        weights = [3.0 if p % 2 == 0 else 1.6 for p in rest]
        while len(chosen) < S_ - 1 and rest:
            tot = sum(weights)
            r = rng.random() * tot
            acc = 0
            for i, w in enumerate(weights):
                acc += w
                if acc >= r:
                    chosen.append(rest.pop(i))
                    weights.pop(i)
                    break
        chosen = sorted(chosen)[:S_ - 1] + [final]
        # pitches
        center = self.key + (7 if kind == 'chorus' else 4 if kind == 'bridge' else 2)
        while center > 72:
            center -= 12
        while center < 60:
            center += 12
        notes_avail = self.scale_notes(center - 9, center + 9)
        notes = []
        prev = None
        amp = rng.choice((2, 3, 4))
        for i, slot in enumerate(chosen):
            beat = start_bar * 4 + slot * unit
            bar = int(beat // 4)
            root, tri = self.chords[min(bar, len(self.chords) - 1)]
            ctones = [m for m in notes_avail if (m - root) % 12 in [t % 12 for t in tri]]
            if degrees:
                d = degrees[i]
                oct_, dd = divmod(d, 7)
                pitch = self.key + 12 * oct_ + self.scale[dd]
                while pitch < 57:
                    pitch += 12
            else:
                x = i / max(1, S_ - 1)
                target = center + amp * math.sin(math.pi * x) - (2 if i == S_ - 1 else 0)
                is_strong = (slot % (4 if grid16 else 2) == 0)
                if i == S_ - 1:
                    cand = [m for m in ctones if (m - root) % 12 in (0, tri[1] % 12)] or ctones
                    if last:
                        cand = [m for m in notes_avail if (m - self.key) % 12 == 0] or cand
                    pitch = min(cand, key=lambda m: abs(m - target))
                elif prev is None or is_strong:
                    pitch = min(ctones or notes_avail, key=lambda m: abs(m - target) + rng.random() * 1.5)
                else:
                    idx = min(range(len(notes_avail)), key=lambda k: abs(notes_avail[k] - prev))
                    step = 1 if target > prev else -1
                    if rng.random() < 0.25:
                        step = -step
                    if rng.random() < 0.2:
                        step *= 2
                    idx = max(0, min(len(notes_avail) - 1, idx + step))
                    pitch = notes_avail[idx]
            notes.append([beat, 0, pitch, sylls[i]])
            prev = pitch
        line_end = start_bar * 4 + 8
        for i, nt in enumerate(notes):
            nxt = notes[i + 1][0] if i + 1 < len(notes) else min(line_end - 0.5, nt[0] + 3)
            nt[1] = max(0.25, min(nxt - nt[0], 3.0) * (0.92 if i + 1 < len(notes) else 1.0))
        return notes

    def build_melody(self):
        spec = self.spec
        mel = []  # [beat, dur, midi, syl, line_index]
        lines = []
        for kind, start, bars, lk in self.sections:
            if lk is None:
                continue
            if 'lyrics' in spec:
                texts = spec['lyrics'][lk]
                degs = spec.get('degrees', {}).get(lk)
            else:
                counts = spec['melody'][lk]
                texts = ['~'.join(['la'] * c) for c in counts]
                texts = [' '.join(['la'] * c) + f'#{lk}{i}' for i, c in enumerate(counts)]
                degs = None
            for i, text in enumerate(texts):
                clean = text.split('#')[0]
                sy = syllables(clean) if clean.strip() else []
                nb = start + 2 * i
                last = (i == len(texts) - 1)
                ns = self.melody_line(text, nb, kind, sy, degs[i] if degs else None, last)
                li = len(lines)
                lines.append(dict(text=clean.replace('-', ''), beat0=nb * 4, beat1=nb * 4 + 8, notes=len(ns)))
                for n in ns:
                    mel.append(n + [li])
        self.melody = mel
        self.lines = lines

    # ------------------------------------------------------------ render
    def render(self):
        spec = self.spec
        n = self.n
        drums, bassb, keys, padb, voiceb, leadb = (Bus(n) for _ in range(6))
        kicks = []
        rng = seeded(self.id, 'render')
        dstyle = spec.get('drums', 'pop')
        K, SN, CL, HC, HO, RM, SH = S.kick(), S.snare(), S.clap(), S.hat(), S.hat(open_=True), S.rim(), S.shaker()
        CR = S.crash()
        for bar in range(self.bars):
            kind, sstart, sbars, _ = self.section_at(bar)
            pos_in = bar - sstart
            last_bar = pos_in == sbars - 1
            inten = {'intro': 0.5, 'verse': 0.8, 'chorus': 1.0, 'bridge': 0.6, 'outro': 0.5}[kind]
            b0 = bar * 4

            def at(step, sig, g=1.0, pan=0.0, swing=0.0):
                beat = b0 + step / 4.0 + (swing if step % 2 else 0)
                drums.add(self.s(beat), sig, g * (0.9 + rng.random() * 0.2), pan)

            if pos_in == 0 and kind in ('chorus', 'outro') and dstyle not in ('none', 'heart', 'lofi', 'light'):
                at(0, CR, 0.7, -0.3)
            if dstyle == 'none':
                pass
            elif dstyle == 'heart':
                for st in (0, 3, 8, 11):
                    at(st, S.kick(), 0.8 if st in (0, 8) else 0.55)
                    kicks.append(self.s(b0 + st / 4))
            else:
                if dstyle == 'four':
                    ksteps, ssteps = [0, 4, 8, 12], [4, 12]
                    if kind == 'intro' or kind == 'bridge':
                        ksteps = [0, 8] if kind == 'bridge' else [0, 4, 8, 12]
                    for st in ksteps:
                        at(st, K, 1.0)
                        kicks.append(self.s(b0 + st / 4))
                    if kind != 'intro':
                        for st in ssteps:
                            at(st, CL, 0.75)
                    for st in (2, 6, 10, 14):
                        at(st, HO, 0.45 * inten, 0.25)
                    if kind == 'chorus':
                        for st in range(0, 16, 1):
                            if st % 2 == 1:
                                at(st, HC, 0.25, -0.2)
                elif dstyle in ('pop', 'rock', 'light', 'lofi'):
                    ks = [0, 8] + ([10] if dstyle != 'lofi' and rng.random() < 0.6 else []) + ([6] if dstyle == 'rock' else [])
                    if dstyle == 'lofi':
                        ks = [0, 7, 10]
                    if dstyle == 'light':
                        ks = [0, 8]
                    for st in ks:
                        at(st, K, 0.95 if dstyle != 'lofi' else 0.7)
                        kicks.append(self.s(b0 + st / 4))
                    if kind != 'intro' or dstyle == 'lofi':
                        for st in (4, 12):
                            at(st, SN if dstyle != 'light' else RM, 0.7 if dstyle != 'lofi' else 0.45)
                            if dstyle == 'pop' and kind == 'chorus':
                                at(st, CL, 0.35)
                    sw = 0.06 if dstyle == 'lofi' else 0.0
                    for st in range(0, 16, 2):
                        at(st, HC, (0.4 if st % 4 == 0 else 0.28) * (inten + 0.2), 0.2, sw)
                        if st % 4 == 2 and kind == 'chorus' and dstyle == 'rock':
                            at(st, HC, 0.3, 0.2)
                    if kind == 'chorus' and dstyle == 'pop':
                        at(14, HO, 0.3, 0.25)
                elif dstyle == 'ballad':
                    if kind in ('chorus', 'bridge') or pos_in >= 2:
                        at(0, K, 0.8)
                        kicks.append(self.s(b0))
                        if kind == 'chorus':
                            at(10, K, 0.6)
                        at(8, SN if kind == 'chorus' else RM, 0.55)
                    for st in range(0, 16, 2):
                        at(st, HC, 0.18 * inten, 0.2)
                elif dstyle == 'dembow':
                    for st in (0, 4, 8, 12):
                        at(st, K, 0.9)
                        kicks.append(self.s(b0 + st / 4))
                    if kind != 'intro':
                        for st in (3, 6, 11, 14):
                            at(st, SN, 0.5)
                    for st in range(16):
                        at(st, SH, 0.5 if st % 2 else 0.3, 0.3)
                # fills before choruses
                if last_bar and kind != 'outro':
                    nxt = self.section_at(bar + 1)[0] if bar + 1 < self.bars else 'outro'
                    if nxt == 'chorus' and dstyle not in ('lofi', 'light', 'ballad'):
                        for st in range(8, 16):
                            at(st, SN, 0.25 + 0.05 * (st - 8))
                        drums.add(self.s(b0), S.riser(self.beat * 4), 0.55)
                    elif nxt == 'chorus':
                        for st in (12, 14):
                            at(st, S.tom(f0=150 - st * 3), 0.5)
        # final hit
        end = self.s(self.bars * 4)
        if not spec.get('loop') and dstyle not in ('none', 'heart'):
            drums.add(end, CR, 0.6)
            drums.add(end, K, 1.0)

        # bass + chords
        bstyle = spec.get('bass', 'pop')
        kstyle = spec.get('keys', 'epiano')
        prev_v = None
        for bar in range(self.bars + (0 if spec.get('loop') else 1)):
            kind = self.section_at(min(bar, self.bars - 1))[0]
            final = bar == self.bars
            root, tri = self.chords[min(bar, self.bars - 1)] if not final else parse_chord('i' if self.mode == 'minor' else 'I', self.key, self.mode)
            b0 = bar * 4
            broot = root - 24 if root - 24 >= 33 else root - 12
            while broot > 45:
                broot -= 12
            inten = {'intro': 0.6, 'verse': 0.85, 'chorus': 1.0, 'bridge': 0.7, 'outro': 0.6}[kind]
            # bass
            pat = {
                'pop': [(0, 3, 0), (3, 1, 0), (6, 2, 0), (8, 3, 0), (11, 2, 7), (14, 2, 12)],
                'eighths': [(i, 1.7, 0) for i in range(0, 16, 2)],
                'rock': [(i, 1.8, 0) for i in range(0, 16, 2)],
                'four': [(2, 1.5, 0), (6, 1.5, 0), (10, 1.5, 0), (14, 1.5, 12)],
                'ballad': [(0, 7.5, 0), (8, 7.5, 7)],
                'dembow': [(0, 2.5, 0), (3, 2.5, 0), (6, 1.5, 0), (8, 2.5, 0), (11, 2.5, 0), (14, 1.5, 7)],
                'disco': [(i, 1.6, 0 if i % 4 == 0 else 12) for i in range(0, 16, 2)],
                'funk': [(0, 1.5, 0), (3, 1, 12), (4, 1, 0), (7, 1, 10), (10, 1.5, 0), (12, 1, 7), (14, 1, 12)],
                'round': [(0, 6, 0), (7, 1, 0), (8, 6, 7), (14, 2, 0)],
                'sub': [(0, 15.5, 0)],
            }[bstyle]
            if final:
                pat = [(0, 14, 0)]
            if kind == 'intro' and bstyle not in ('ballad', 'round', 'sub'):
                pat = pat[:2] if bar < 2 else pat
            for st, du, iv in pat:
                kind_b = 'round' if bstyle in ('ballad', 'round') else 'sub' if bstyle == 'sub' else 'bright' if bstyle in ('funk', 'disco') else 'synth'
                sig = S.bass(broot + iv, du * self.beat / 4, kind_b)
                bassb.add(self.s(b0 + st / 4), sig, 0.75)
            # chords
            v = voicing(root, tri, prev_v, 62 if kstyle not in ('power',) else 52)
            prev_v = v
            dur_bar = 4 * self.beat
            if final:
                for m in v:
                    keys.add(self.s(b0), S.piano(m, 3.0), 0.7)
                    if spec.get('pad'):
                        padb.add(self.s(b0), S.pad(m, 3.0), 0.6)
                continue
            if kstyle in ('epiano', 'epiano_soft'):
                hits = [(0, 1.4), (1.5, 1.0), (2.5, 1.4)] if kstyle == 'epiano' else [(0, 3.8)]
                for hb, hd in hits:
                    for j, m in enumerate(v):
                        keys.add(self.s(b0 + hb) + j * 90, S.epiano(m, hd * self.beat, 0.8 * inten + 0.2), 0.9, -0.2 + 0.2 * j)
            elif kstyle == 'piano':
                for hb, hd in ((0, 2.0), (2, 1.0), (3, 1.0)):
                    for j, m in enumerate(v):
                        keys.add(self.s(b0 + hb) + j * 60, S.piano(m, hd * self.beat, 0.7 + 0.3 * inten), 1.0, -0.15 + 0.15 * j)
                keys.add(self.s(b0), S.piano(root - 12 + 12 * (root < 48), 4 * self.beat, 0.6), 0.6)
            elif kstyle == 'piano_arp':
                arp = v + [v[0] + 12, v[1] + 12] + v[::-1][1:]
                for k in range(8):
                    m = arp[k % len(arp)]
                    keys.add(self.s(b0 + k * 0.5), S.piano(m, 0.9 * self.beat, 0.55 + 0.1 * (k == 0)), 1.0, -0.3 + 0.08 * k)
            elif kstyle == 'pluck_arp':
                arp = v + [v[0] + 12]
                for k in range(16):
                    m = arp[(k * 3) % len(arp)] + (12 if k % 8 >= 6 else 0)
                    keys.add(self.s(b0 + k * 0.25), S.pluck(m, 0.2, 2500 + 1500 * inten), 0.75, 0.4 * math.sin(k))
            elif kstyle == 'stabs':
                for st in (2, 6, 10, 14) if bstyle == 'four' or kind == 'chorus' else (0, 6, 10):
                    for j, m in enumerate(v):
                        keys.add(self.s(b0 + st / 4), S.pluck(m + 12, 0.3, 4000), 0.55, -0.3 + 0.3 * j)
            elif kstyle == 'guitar':
                for st, dn in ((0, 1), (3, 0), (6, 1), (8, 1), (11, 0), (14, 1)):
                    order = v if dn else v[::-1]
                    for j, m in enumerate(order + [order[0] + 12]):
                        keys.add(self.s(b0 + st / 4) + j * 260, S.pluck(m, 0.4, 2400), 0.55, 0.35)
            elif kstyle == 'power':
                for st in range(0, 16, 2):
                    for m in (root - 12, root - 5, root):
                        sig = np.tanh(S.brass(m, 0.45 * self.beat) * 6) * 0.12
                        keys.add(self.s(b0 + st / 4), sig, 0.9 * inten, -0.4 if m == root else 0.4)
            elif kstyle == 'supersaw':
                if kind in ('chorus', 'bridge', 'outro'):
                    for j, m in enumerate(v):
                        keys.add(self.s(b0), S.pad(m + 12, dur_bar * 0.98, 5200, 0.02), 0.55, -0.4 + 0.4 * j)
                else:
                    for st in (0, 3, 6, 10, 12):
                        for j, m in enumerate(v):
                            keys.add(self.s(b0 + st / 4), S.pluck(m + 12, 0.25, 3000), 0.5, -0.3 + 0.3 * j)
            if spec.get('pad') and kstyle != 'supersaw':
                for j, m in enumerate(v):
                    padb.add(self.s(b0), S.pad(m, dur_bar * 0.98, 1800 + 900 * inten), 0.5 * inten, -0.5 + 0.5 * j)
            if spec.get('strings') and kind in ('chorus', 'bridge', 'outro', 'verse'):
                for j, m in enumerate(v):
                    padb.add(self.s(b0), S.strings(m + 12 * (kind == 'chorus'), dur_bar * 0.98), 0.45 * inten, -0.6 + 0.6 * j)

        # hook motif in intro/outro (instrumental)
        hook = spec.get('hook')
        if hook and self.melody:
            first_line = [m for m in self.melody if m[4] == self.first_chorus_line()]
            if first_line:
                base = first_line[0][0]
                for kind, start, bars, lk in self.sections:
                    if kind not in ('intro', 'outro') or bars < 2:
                        continue
                    for b, d, m, syl, li in first_line:
                        beat = start * 4 + (b - base)
                        if beat >= (start + bars) * 4:
                            break
                        leadb.add(self.s(beat), self.inst(hook, m, d * self.beat), 0.55, 0.1)

        # sung or instrumental lead
        li_inst = spec.get('lead_inst')
        prev = None
        for b, d, m, syl, li in self.melody:
            if li_inst:
                if li_inst != 'none':
                    leadb.add(self.s(b), self.inst(li_inst, m, d * self.beat), 0.6, 0.05)
            else:
                sig = S.voice(m, d * self.beat, prev, S.vowel_of(syl))
                voiceb.add(self.s(b), sig, 0.85, 0.0)
                prev = m

        # mixdown
        if spec.get('sidechain') and kicks:
            g = S.sidechain(n, kicks, 0.6)
            for bus in (padb, keys):
                bus.l *= g
                bus.r *= g
            bassb.l *= (0.4 + 0.6 * g)
            bassb.r *= (0.4 + 0.6 * g)
        padb.apply(lambda x: S.hp(x, 180))
        keys.apply(lambda x: S.hp(x, 120))
        ir = S.make_ir(2.4 if self.bpm < 90 else 1.8, 2.6 if self.bpm < 90 else 3.4)
        back = Bus(n)
        back.mix(drums, 0.9)
        back.mix(bassb, 0.85)
        back.mix(keys, 0.7)
        back.mix(padb, 0.55)
        back.mix(leadb, 0.65)
        send = Bus(n)
        send.mix(keys, 0.6)
        send.mix(padb, 0.8)
        send.mix(leadb, 0.8)
        send.mix(drums, 0.12)
        back.mix(reverb(send, ir, 0.55))
        voc = Bus(n)
        if not li_inst:
            vs = Bus(n)
            vs.mix(voiceb, 2.1)
            vs.apply(lambda x: S.hp(x, 160))
            voc.mix(vs, 1.0)
            voc.mix(delay(vs, self.beat * 0.75, 0.35, 0.22))
            voc.mix(reverb(vs, S.make_ir(2.2, 3.0, 9), 0.45))
        if spec.get('loop'):
            L = self.s(self.bars * 4)
            for bus in (back, voc):
                for ch in ('l', 'r'):
                    arr = getattr(bus, ch)
                    tail = arr[L:].copy()
                    arr = arr[:L]
                    arr[:len(tail)] += tail[:L]
                    setattr(bus, ch, arr)
        mixl = back.l + voc.l
        mixr = back.r + voc.r
        peak = max(np.abs(mixl).max(), np.abs(mixr).max(), 1e-6)
        gain = 0.92 / peak
        # gentle loudness push via soft clip on backing only
        out_back = np.stack([np.tanh(back.l * gain * 1.25) / 1.12, np.tanh(back.r * gain * 1.25) / 1.12], 1)
        out_voc = np.stack([voc.l * gain, voc.r * gain], 1)
        return out_back, (out_voc if not li_inst else None)

    def first_chorus_line(self):
        idx = 0
        for kind, start, bars, lk in self.sections:
            if lk is None:
                continue
            if kind == 'chorus':
                return idx
            idx += bars // 2
        return 0

    def inst(self, name, m, dur):
        if name == 'bell':
            return S.bell(m + 12, dur)
        if name == 'pluck':
            return S.pluck(m + 12, dur, 4200)
        if name == 'brass':
            return S.brass(m, dur)
        if name == 'epiano':
            return S.epiano(m + 12, dur, 0.9)
        if name == 'piano':
            return S.piano(m + 12, dur, 0.8)
        return S.pluck(m, dur)

    # ------------------------------------------------------------ charts
    def charts(self):
        t = lambda beat: round(beat * self.beat, 4)
        mel = self.melody
        pitches = sorted(m[2] for m in mel) or [60]
        qs = [pitches[int(len(pitches) * q)] for q in (0.25, 0.5, 0.75)]

        def lane(p):
            return sum(p > q for q in qs) if len(set(qs)) > 1 else (p % 4)
        notes = {'easy': [], 'normal': [], 'hard': []}
        last_t = {'easy': -9, 'normal': -9, 'hard': -9}
        for i, (b, d, m, syl, li) in enumerate(mel):
            ln = lane(m)
            ts, dd = t(b), round(d * self.beat, 3)
            hold = dd if dd >= 0.6 else 0
            on_beat = abs(b - round(b)) < 1e-6
            last_in_line = i + 1 >= len(mel) or mel[i + 1][4] != li
            for lv, ok, gap in (('hard', True, 0.1), ('normal', True, 0.16), ('easy', on_beat or last_in_line, 0.38)):
                if ok and ts - last_t[lv] >= gap:
                    notes[lv].append([ts, ln, hold, syl, li])
                    last_t[lv] = ts
        # hard: extra percussion notes in instrumental sections
        for kind, start, bars, lk in self.sections:
            if lk is not None:
                continue
            for bb in range(bars):
                for st in (0, 2) if kind != 'outro' else (0,):
                    beat = (start + bb) * 4 + st
                    notes['hard'].append([t(beat), (bb + st) % 4, 0, '', -1])
                    if st == 0:
                        notes['normal'].append([t(beat), (bb * 3) % 4, 0, '', -1])
        for k in notes:
            notes[k].sort(key=lambda x: x[0])
        dance = {'easy': [], 'normal': [], 'hard': []}
        rng = seeded(self.id, 'dance')
        lastd = []

        def pick():
            while True:
                d_ = rng.randrange(4)
                if lastd[-2:] != [d_, d_]:
                    lastd.append(d_)
                    return d_
        for bar in range(self.bars):
            kind = self.section_at(bar)[0]
            b0 = bar * 4
            for beat in range(4):
                bb = b0 + beat
                if kind == 'intro' and bar < 1:
                    continue
                dirn = pick()
                if beat in (0, 2) or kind == 'chorus':
                    dance['easy'].append([t(bb), dirn, 0])
                dance['normal'].append([t(bb), dirn, 0])
                dance['hard'].append([t(bb), dirn, 0])
                if kind == 'chorus' and beat == 0:
                    dance['hard'].append([t(bb), (dirn + 2) % 4, 0])
                if kind in ('chorus', 'verse') and beat in (1, 3) and rng.random() < (0.6 if kind == 'chorus' else 0.35):
                    dance['hard'].append([t(bb + 0.5), pick(), 0])
                if kind == 'chorus' and beat == 3 and rng.random() < 0.3:
                    dance['normal'].append([t(bb + 0.5), pick(), 0])
        for k in dance:
            dance[k].sort(key=lambda x: x[0])
        lines = []
        for i, L in enumerate(self.lines):
            sy = [[t(b), syl] for (b, d, m, syl, li) in mel if li == i]
            lines.append(dict(t0=t(L['beat0']), t1=t(L['beat1']), text=L['text'], syl=sy))
        secs = [dict(kind=k, t=t(s * 4)) for k, s, b, lk in self.sections]
        return dict(id=self.id, title=self.spec.get('title', self.id), bpm=self.bpm, duration=round(self.bars * 4 * self.beat, 3),
                    length=round(self.length, 3), notes=notes, dance=dance, lines=lines, sections=secs)


def encode(data, path_noext, vbr=4, mp3k=128):
    tmp = tempfile.mktemp(suffix='.wav')
    wavfile.write(tmp, SR, (np.clip(data, -1, 1) * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'libvorbis', '-q:a', str(vbr), path_noext + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', f'{mp3k}k', path_noext + '.mp3'], check=True)
    os.remove(tmp)


# ------------------------------------------------------------ one-shots
def fanfare(out, name, key=67, length=7.0, minor=False):
    n = int((length + 2.5) * SR)
    b = Bus(n)
    sc = MINOR if minor else MAJOR
    beat = 60 / 120
    seq = [(0, 0, 0.5), (0.5, 0, 0.5), (1, 4, 0.5), (1.5, 7, 1.5), (3, 4, 0.5), (3.5, 7, 0.5), (4, 12, 3.0)] if not minor else \
          [(0, 0, 1.0), (1, 3, 1.0), (2, 7, 1.0), (3, 6, 2.5)]
    for st, iv, du in seq:
        for harm in (0, -5 if not minor else -9, -12):
            b.add(int(st * beat * SR), S.brass(key + iv + harm, du * beat), 0.8 if harm == 0 else 0.5, -0.3 if harm else 0.3)
        b.add(int(st * beat * SR), S.kick() if st in (0, 4, 3) else S.snare(), 0.7)
    for m in ((key - 12, key - 5, key + 4) if not minor else (key - 12, key - 9, key - 5)):
        b.add(int(4 * beat * SR), S.strings(m, 3.0), 0.7)
        b.add(int(4 * beat * SR), S.pad(m + 12, 3.0, 3000), 0.6)
    b.add(int(4 * beat * SR), S.crash(), 0.7)
    rv = reverb(b, S.make_ir(2.5, 2.5), 0.5)
    b.mix(rv)
    pk = max(np.abs(b.l).max(), np.abs(b.r).max())
    encode(np.stack([b.l, b.r], 1) / pk * 0.9, os.path.join(out, name))


def suspense(out):
    beat = 60 / 90
    bars = 8
    n = int((bars * 4 * beat) * SR)
    b = Bus(n)
    SN = S.snare(0.5)
    steps = bars * 16
    for i in range(steps):
        tt_ = i * beat / 4
        v = 0.15 + 0.6 * (i / steps) ** 2
        b.add(int(tt_ * SR), SN, v, math.sin(i) * 0.2)
    for bar in range(bars):
        root = [62, 62, 58, 58, 55, 55, 57, 57][bar]
        for m in (root - 12, root - 9 + (bar % 2), root - 5):
            b.add(int(bar * 4 * beat * SR), S.strings(m, 4 * beat * 0.98, 0.6), 0.5)
        b.add(int(bar * 4 * beat * SR), S.kick(0.8), 0.9)
        b.add(int((bar * 4 + 2) * beat * SR), S.kick(0.5), 0.6)
    rv = reverb(b, S.make_ir(2.0, 3.0), 0.4)
    b.mix(rv)
    L = n
    pk = max(np.abs(b.l).max(), np.abs(b.r).max())
    encode(np.stack([b.l[:L], b.r[:L]], 1) / pk * 0.85, os.path.join(out, 'bgm_suspense'))


def sting(out):
    n = int(3.5 * SR)
    b = Bus(n)
    b.add(0, S.impact(), 1.0)
    for m in (38, 45, 50, 53):
        b.add(0, S.strings(m, 1.8, 0.01), 0.6)
        b.add(0, S.brass(m + 12, 1.2), 0.4)
    b.mix(reverb(b, S.make_ir(2.5, 2.4), 0.5))
    pk = max(np.abs(b.l).max(), np.abs(b.r).max())
    encode(np.stack([b.l, b.r], 1) / pk * 0.9, os.path.join(out, 'sting_verdict'))


def applause(out, name='applause', length=6.0, density=55, cheer=True):
    n = int(length * SR)
    b = Bus(n)
    rng = np.random.default_rng(5)
    clapper = [S.bp(S.noise(int(0.04 * SR)), 700 + 300 * k, 3500 + 400 * k) * np.exp(-np.arange(int(0.04 * SR)) / (0.006 * SR)) for k in range(6)]
    env_t = np.arange(n) / SR
    env = np.minimum(env_t / 0.6, 1) * np.clip((length - env_t) / 1.8, 0, 1)
    count = int(length * density * 10)
    for i in range(count):
        t0 = rng.random() * length
        k = int(t0 * SR)
        if rng.random() > env[min(k, n - 1)]:
            continue
        b.add(k, clapper[rng.integers(6)], 0.25 + rng.random() * 0.35, rng.random() * 2 - 1)
    if cheer:
        for i in range(14):
            t0 = 0.3 + rng.random() * (length - 2.5)
            d = 0.6 + rng.random() * 1.2
            m = 62 + rng.integers(0, 14)
            sig = S.voice(m, d, m - 5, rng.choice(list('aoe')), breath=0.4, timbre=0.4)
            sig = S.bp(sig, 300, 4000) * np.linspace(1, 0.2, len(sig))
            b.add(int(t0 * SR), sig, 0.12, rng.random() * 2 - 1)
        crowd = S.bp(S.noise(n), 300, 2500) * env * 0.08
        b.add(0, crowd, 1.0)
    b.mix(reverb(b, S.make_ir(1.6, 4.0), 0.35))
    pk = max(np.abs(b.l).max(), np.abs(b.r).max())
    encode(np.stack([b.l, b.r], 1) / pk * 0.8, os.path.join(out, name), 3, 112)


def main():
    out = sys.argv[1]
    only = set(sys.argv[2:])
    os.makedirs(os.path.join(out, 'charts'), exist_ok=True)
    index = []
    for spec in SONGS + VOCALISES + DANCE + BGM:
        if only and spec['id'] not in only:
            continue
        song = Song(spec)
        song.build_melody()
        back, voc = song.render()
        encode(back, os.path.join(out, spec['id']))
        if voc is not None:
            encode(voc, os.path.join(out, spec['id'] + '_voice'), 3, 112)
        if spec in SONGS or spec in VOCALISES or spec in DANCE:
            ch = song.charts()
            json.dump(ch, open(os.path.join(out, 'charts', spec['id'] + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        print('rendered', spec['id'], round(song.length, 1), 's', flush=True)
    if 'oneshots' in only:
        fanfare(out, 'jingle_prime', 67)
        fanfare(out, 'jingle_victoire', 72, 6.0)
        fanfare(out, 'jingle_elimine', 62, 5.0, minor=True)
        suspense(out)
        sting(out)
        applause(out, 'applause', 6.0)
        applause(out, 'applause_big', 9.0, 85)
        applause(out, 'applause_small', 3.5, 30, cheer=False)
        print('oneshots ok')
    if only == {'index'}:
        order = [s['id'] for s in SONGS + VOCALISES + DANCE]
        idx = []
        for spec in SONGS + VOCALISES + DANCE:
            p = os.path.join(out, 'charts', spec['id'] + '.json')
            if os.path.exists(p):
                ch = json.load(open(p))
                idx.append(dict(id=spec['id'], title=spec.get('title'), bpm=spec['bpm'], duration=ch['duration'],
                                kind='song' if spec in SONGS else 'vocalise' if spec in VOCALISES else 'dance',
                                voice=os.path.exists(os.path.join(out, spec['id'] + '_voice.mp3'))))
        json.dump(idx, open(os.path.join(out, 'charts', 'index.json'), 'w'), ensure_ascii=False, indent=1)
        print('index', len(idx))

if __name__ == '__main__':
    main()
