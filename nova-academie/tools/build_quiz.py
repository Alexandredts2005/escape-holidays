"""Build public/data/quiz.json from tools/quiz_src.txt (format: difficulty|question|correct|wrong|wrong|wrong[|fact])."""
import json, sys, collections

src, out = sys.argv[1], sys.argv[2]
theme = None
qs = []
errors = 0
seen = set()
for n, line in enumerate(open(src, encoding='utf-8'), 1):
    line = line.strip()
    if not line:
        continue
    if line.startswith('## '):
        theme = line[3:].strip()
        continue
    p = line.split('|')
    if len(p) not in (6, 7) or not p[0].isdigit():
        print('bad line', n, line); errors += 1; continue
    d, q, *rest = p
    a = rest[:4]
    if len(set(x.strip().lower() for x in a)) != 4:
        print('duplicate answers', n, line); errors += 1
    if q in seen:
        print('duplicate question', n, q); errors += 1
    seen.add(q)
    item = {'t': theme, 'd': int(d), 'q': q.strip(), 'a': [x.strip() for x in a]}
    if len(rest) == 5 and rest[4].strip():
        item['f'] = rest[4].strip()
    qs.append(item)
json.dump(qs, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
c = collections.Counter(q['t'] for q in qs)
print(len(qs), 'questions', dict(c))
sys.exit(1 if errors else 0)
