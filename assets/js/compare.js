/* compare.js — so sánh hai kỳ Đại hội: so-sanh.html#i,xiv */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { C, nf, esc, $, $$ } = A;
  const selA = $('#sel-a'), selB = $('#sel-b');

  const PRESETS = [
    ['i', 'xiv', 'Ma Cao 1935 và Hà Nội 2026'],
    ['v', 'vi', 'Trước và khi khởi xướng đổi mới'],
    ['vii', 'xi', 'Cương lĩnh 1991 và Cương lĩnh 2011'],
    ['ii', 'iv', 'Hai kỳ Đại hội đổi tên Đảng'],
    ['xiii', 'xiv', 'Hai kỳ gần nhất']
  ];

  const opts = C.map(c => `<option value="${c.id}">Đại hội ${c.roman} (${c.year})</option>`).join('');
  selA.innerHTML = opts;
  selB.innerHTML = opts;
  $('#presets').innerHTML = PRESETS.map(p =>
    `<button class="chip" type="button" data-a="${p[0]}" data-b="${p[1]}" aria-pressed="false">${esc(p[2])}</button>`).join('');

  function pair() {
    const [x, y] = decodeURIComponent(location.hash.slice(1)).split(',');
    const a = A.byId(x) || C[0];
    let b = A.byId(y) || C[C.length - 1];
    if (b === a) b = C[C.indexOf(a) + 1] || C[C.indexOf(a) - 1];
    return [a, b];
  }
  function setPair(a, b) {
    history.replaceState(null, '', `#${a.id},${b.id}`);
    render();
  }

  // "122 lần" khi tăng nhiều lần, "+12%" / "−1%" khi thay đổi ít; "≈" khi nguồn ghi "hơn/gần"
  function change(from, to, approx) {
    const r = to / from;
    const pre = approx ? '≈ ' : '';
    if (r >= 2) return pre + (r >= 10 ? nf.format(Math.round(r)) : r.toLocaleString('vi-VN', { maximumFractionDigits: 1 })) + ' lần';
    const pct = Math.round((r - 1) * 100);
    return pre + (pct > 0 ? '+' : pct < 0 ? '−' : '±') + Math.abs(pct) + '%';
  }
  const verb = (from, to) => (to / from >= 2 ? 'gấp' : 'thay đổi');

  function render() {
    const [a, b] = pair();
    selA.value = a.id;
    selB.value = b.id;
    $$('#presets .chip').forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.a === a.id && ch.dataset.b === b.id)));
    document.title = `So sánh Đại hội ${a.roman} và Đại hội ${b.roman} — 14 kỳ Đại hội Đảng Cộng sản Việt Nam`;

    const [o, n] = a.year <= b.year ? [a, b] : [b, a];
    const mo = o.delegates.members, mn = n.delegates.members;
    const approx = !!((mo && mo.qualifier) || (mn && mn.qualifier));
    $('#cmp-summary').innerHTML = `
      <div><b>${n.year - o.year} năm</b><span>từ Đại hội ${o.roman} (${o.year}) đến Đại hội ${n.roman} (${n.year})</span></div>
      <div><b>${change(o.delegates.official, n.delegates.official)}</b><span>số đại biểu ${verb(o.delegates.official, n.delegates.official)}: ${nf.format(o.delegates.official)} → ${nf.format(n.delegates.official)}</span></div>
      <div><b>${mo && mn ? change(mo.value, mn.value, approx) : '—'}</b><span>số đảng viên${mo && mn ? ' ' + verb(mo.value, mn.value) : ''}: ${mo ? esc(mo.text) : '—'} → ${mn ? esc(mn.text) : '—'}</span></div>`;

    const maxDel = Math.max(a.delegates.official, b.delegates.official);
    const maxMem = Math.max(a.delegates.members ? a.delegates.members.value : 0, b.delegates.members ? b.delegates.members.value : 0);
    const meter = (v, max) => `<div class="meter" aria-hidden="true"><i style="transform:scaleX(${Math.max(0.01, v / max).toFixed(4)})"></i></div>`;
    const head = c => `<div class="cmp-head">${A.duo(c, 'thumb', { alt: c.image.caption })}<b>Đại hội ${c.roman}</b><a href="${A.url(c)}">Xem chi tiết →</a></div>`;
    const del = c => `<strong>${nf.format(c.delegates.official)}</strong> đại biểu${c.delegates.alternate ? ` chính thức (thêm ${c.delegates.alternate} dự khuyết)` : ''}${meter(c.delegates.official, maxDel)}`;
    const mem = c => (c.delegates.members ? `<strong>${esc(c.delegates.members.text)}</strong> đảng viên${meter(c.delegates.members.value, maxMem)}` : '—');
    const lead = c => `<ul>${c.leadership.leaders.map(l => `<li><strong>${esc(l.title)} ${esc(l.name)}</strong>${l.note ? ` (${esc(l.note)})` : ''}</li>`).join('')}${c.leadership.organs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const phase = c => { const p = A.phaseOf(c); return `${esc(p.range)} · ${esc(p.short)}`; };
    const bookSec = c => {
      const s = c.bookSection;
      if (!s) return '—';
      return s.page ? `“${esc(s.title)}” <span class="muted">— Sách,&nbsp;tr.&nbsp;${esc(s.page)}</span>` : esc(s.note.charAt(0).toUpperCase() + s.note.slice(1));
    };
    const list = c => `<ul>${c.points.map(x => `<li>${x}</li>`).join('')}</ul>`;
    const src = c => `<ul>${c.sources.map(s => `<li>${s.label ? esc(s.label) + ': ' : ''}${s.html}</li>`).join('')}</ul>`;
    const row = (label, fa, fb) =>
      `<div class="cmp-row"><div class="cmp-row__label">${label}</div><div class="cmp-row__cell">${fa}</div><div class="cmp-row__cell">${fb}</div></div>`;

    $('#cmp').innerHTML =
      row('<span class="visually-hidden">Kỳ Đại hội</span>', head(a), head(b)) +
      row('Thời gian', esc(a.time), esc(b.time)) +
      row('Địa điểm', esc(a.place), esc(b.place)) +
      row('Giai đoạn', phase(a), phase(b)) +
      row('Mục trong sách', bookSec(a), bookSec(b)) +
      row('Điểm nhấn', `<strong>${esc(a.highlight)}</strong>`, `<strong>${esc(b.highlight)}</strong>`) +
      row('Đại biểu', del(a), del(b)) +
      row('Đảng viên', mem(a), mem(b)) +
      row('Lãnh đạo được bầu', lead(a), lead(b)) +
      row('Bối cảnh', a.context, b.context) +
      row('Nội dung nổi bật', list(a), list(b)) +
      row('Ý nghĩa', a.significance, b.significance) +
      row('Nguồn', src(a), src(b));
  }

  selA.addEventListener('change', () => setPair(A.byId(selA.value), A.byId(selB.value)));
  selB.addEventListener('change', () => setPair(A.byId(selA.value), A.byId(selB.value)));
  $('#swap').addEventListener('click', () => { const [a, b] = pair(); setPair(b, a); });
  $('#presets').addEventListener('click', e => {
    const ch = e.target.closest('.chip');
    if (ch) setPair(A.byId(ch.dataset.a), A.byId(ch.dataset.b));
  });
  window.addEventListener('hashchange', render);

  render();
})();
