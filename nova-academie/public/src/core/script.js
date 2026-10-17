// Parser for the story DSL.
//  # label                      label
//  @cmd args...                 command (bg, music, sfx, show, hide, hideall, move, expr, wait, shake, flash, stat, if, goto, end, title, confetti, applause, jump)
//  speaker(expr): text          dialogue ("narr" = narration, "player" = the player, [Any Name] = custom)
//  > choice text [effects] -> label
export function parseScript(src) {
  const out = [];
  const labels = {};
  const lines = src.split('\n');
  for (let raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    if (line.startsWith('#')) {
      labels[line.slice(1).trim()] = out.length;
      continue;
    }
    if (line.startsWith('@')) {
      const parts = line.slice(1).split(/\s+/);
      const cmd = parts.shift();
      if (cmd === 'if') {
        const m = line.match(/^@if\s+(.+?)\s*->\s*(\S+)$/);
        if (m) out.push({ t: 'if', cond: m[1], label: m[2] });
        continue;
      }
      if (cmd === 'title' || cmd === 'card') {
        out.push({ t: 'cmd', cmd, args: [line.slice(cmd.length + 2)] });
        continue;
      }
      out.push({ t: 'cmd', cmd, args: parts });
      continue;
    }
    if (line.startsWith('>')) {
      const m = line.match(/^>\s*(.*?)\s*(?:\[(.*?)\])?\s*(?:->\s*(\S+))?$/);
      const opt = { text: m[1], fx: m[2] || '', label: m[3] || null };
      const prev = out[out.length - 1];
      if (prev && prev.t === 'choice') prev.opts.push(opt);
      else out.push({ t: 'choice', opts: [opt] });
      continue;
    }
    const m = line.match(/^(\[[^\]]+\]|\$?[a-zA-Z_]+)(?:\(([a-z]+)\))?\s*:\s*(.*)$/);
    if (m) {
      out.push({ t: 'say', who: m[1], expr: m[2] || null, text: m[3] });
    } else {
      out.push({ t: 'say', who: 'narr', expr: null, text: line });
    }
  }
  return { ops: out, labels };
}
