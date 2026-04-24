#!/usr/bin/env python3
"""Parse TASK_BOARD.md and regenerate index.html"""
from pathlib import Path
from datetime import date

WORKSPACE = Path(__file__).parent.parent

def parse_board():
    content = (WORKSPACE / 'TASK_BOARD.md').read_text()
    sections = {'Todo': [], 'In Progress': [], 'Done': []}
    current = None
    for line in content.splitlines():
        s = line.strip()
        if s.startswith('## '):
            heading = s[3:]
            if heading in sections:
                current = heading
        elif current and s.startswith('|') and '---' not in s:
            cols = [c.strip() for c in s.split('|')[1:-1]]
            if not cols or cols[0] == 'ID':
                continue
            while len(cols) < 6:
                cols.append('')
            sections[current].append({
                'id': cols[0], 'title': cols[1], 'priority': cols[2],
                'assigned': cols[3], 'updated': cols[4], 'due': cols[5]
            })
    return sections

def card_html(t):
    p = t['priority'] or 'Medium'
    due = f'<div class="due">Due {t["due"]}</div>' if t['due'] else ''
    return f"""<div class="card" draggable="true" data-id="{t['id']}" data-priority="{p}">
      <div class="card-top">
        <span class="card-title">{t['title']}</span>
        <span class="priority priority-{p}">{p}</span>
      </div>
      {due}
      <div class="card-meta">
        <span class="card-id">{t['id']}</span>
        <span>{t['assigned']} · {t['updated']}</span>
      </div>
    </div>"""

def col_html(name, tasks, css, color):
    cards = '\n    '.join(card_html(t) for t in tasks) if tasks else '<div class="empty">No tasks</div>'
    return f"""<div class="column {css}" data-column="{name}">
    <div class="column-header">
      <div class="dot" style="background:{color}"></div>
      <h2>{name}</h2>
      <span class="badge">{len(tasks)}</span>
    </div>
    <div class="cards-container" data-column="{name}">
      {cards}
    </div>
  </div>"""

def generate():
    s = parse_board()
    today = date.today().isoformat()
    todo = col_html('Todo', s['Todo'], 'col-todo', '#f59e0b')
    prog = col_html('In Progress', s['In Progress'], 'col-progress', '#38bdf8')
    done = col_html('Done', s['Done'], 'col-done', '#34d399')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Japer Task Board</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0f13;color:#e2e8f0;min-height:100vh;padding:32px 20px}}
    header{{text-align:center;margin-bottom:32px}}
    header h1{{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#818cf8,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px}}
    header p{{color:#64748b;margin-top:6px;font-size:.85rem}}
    .filters{{display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap}}
    .filter{{background:#1a1a24;border:1px solid #2a2a38;color:#94a3b8;padding:5px 16px;border-radius:99px;font-size:.8rem;cursor:pointer;transition:all .2s}}
    .filter:hover{{border-color:#818cf8;color:#818cf8}}
    .filter.active{{background:#818cf8;border-color:#818cf8;color:#fff}}
    .board{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1100px;margin:0 auto}}
    .column{{background:#1a1a24;border-radius:14px;padding:20px;border:1px solid #2a2a38}}
    .column-header{{display:flex;align-items:center;gap:10px;margin-bottom:18px}}
    .column-header h2{{font-size:.9rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em}}
    .col-todo h2{{color:#f59e0b}}.col-progress h2{{color:#38bdf8}}.col-done h2{{color:#34d399}}
    .dot{{width:10px;height:10px;border-radius:50%;flex-shrink:0}}
    .badge{{background:#2a2a38;color:#94a3b8;font-size:.75rem;font-weight:600;padding:2px 8px;border-radius:99px}}
    .cards-container{{min-height:60px;transition:background .15s;border-radius:8px;padding:2px}}
    .cards-container.drag-over{{background:#1e1e2e;outline:2px dashed #3f3f58}}
    .card{{background:#12121a;border:1px solid #2a2a38;border-radius:10px;padding:14px 16px;margin-bottom:12px;cursor:grab;transition:border-color .2s,transform .15s,opacity .2s}}
    .card:last-child{{margin-bottom:0}}
    .card:hover{{border-color:#3f3f58;transform:translateY(-1px)}}
    .card.dragging{{opacity:.4;cursor:grabbing}}
    .card.hidden{{display:none}}
    .card-top{{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}}
    .card-title{{font-size:.92rem;font-weight:500;line-height:1.4;color:#e2e8f0}}
    .priority{{font-size:.7rem;font-weight:600;padding:2px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0}}
    .priority-High{{background:#7f1d1d;color:#fca5a5}}
    .priority-Medium{{background:#78350f;color:#fcd34d}}
    .priority-Low{{background:#14532d;color:#86efac}}
    .due{{font-size:.75rem;color:#f59e0b;margin-bottom:8px}}
    .card-meta{{display:flex;justify-content:space-between;font-size:.75rem;color:#475569}}
    .card-id{{font-family:monospace;background:#1e1e2e;padding:1px 6px;border-radius:4px;color:#818cf8}}
    .empty{{text-align:center;color:#334155;font-size:.85rem;padding:24px 0}}
    .toast{{position:fixed;bottom:24px;right:24px;background:#1a1a24;border:1px solid #3f3f58;color:#e2e8f0;padding:12px 18px;border-radius:10px;font-size:.85rem;opacity:0;transform:translateY(8px);transition:all .3s;pointer-events:none;max-width:320px;z-index:99}}
    .toast.show{{opacity:1;transform:translateY(0)}}
  </style>
</head>
<body>
<header>
  <h1>Japer Task Board</h1>
  <p>Updated: {today}</p>
  <div class="filters">
    <button class="filter active" data-filter="all">All</button>
    <button class="filter" data-filter="High">High</button>
    <button class="filter" data-filter="Medium">Medium</button>
    <button class="filter" data-filter="Low">Low</button>
  </div>
</header>
<div class="board">
  {todo}
  {prog}
  {done}
</div>
<div class="toast" id="toast"></div>
<script>
  // Filter
  document.querySelectorAll('.filter').forEach(btn => {{
    btn.addEventListener('click', () => {{
      document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.card').forEach(card => {{
        card.classList.toggle('hidden', f !== 'all' && card.dataset.priority !== f);
      }});
    }});
  }});

  // Drag and drop
  let dragged = null;
  document.querySelectorAll('.card').forEach(card => {{
    card.addEventListener('dragstart', () => {{ dragged = card; card.classList.add('dragging'); }});
    card.addEventListener('dragend', () => {{ dragged = null; card.classList.remove('dragging'); }});
  }});
  document.querySelectorAll('.cards-container').forEach(col => {{
    col.addEventListener('dragover', e => {{ e.preventDefault(); col.classList.add('drag-over'); }});
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {{
      e.preventDefault();
      col.classList.remove('drag-over');
      if (dragged && dragged.parentNode !== col) {{
        col.appendChild(dragged);
        const colName = col.dataset.column;
        const id = dragged.dataset.id;
        showToast(`Tell Japer: "move ${{id}} to ${{colName}}"`);
      }}
    }});
  }});

  function showToast(msg) {{
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 4000);
  }}
</script>
</body>
</html>"""
    (WORKSPACE / 'index.html').write_text(html)
    print('index.html generated')

if __name__ == '__main__':
    generate()
