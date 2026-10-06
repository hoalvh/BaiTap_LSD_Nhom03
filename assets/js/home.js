/* home.js — trang chủ: mở đầu, mốc 1930, trục thời gian, biểu đồ, người đứng đầu */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { D, C, nf, esc, $, $$, icon } = A;
  const first = C[0];
  const last = C[C.length - 1];
  const SPEEDS = [-0.06, 0.045, -0.03, 0.07];

  const shortPlace = p => (/tỉnh/.test(p)
    ? p.split(',').slice(-2).map(s => s.replace(/^\s*(xã|huyện|tỉnh)\s+/i, '').trim()).join(', ')
    : p);

  // ---------- Mở đầu ----------
  function renderHero() {
    $('#hero-lead').innerHTML =
      `Từ <strong>${nf.format(first.delegates.official)} đại biểu</strong> họp tại ${esc(shortPlace(first.place).replace(/\s*\(.*\)$/, ''))} năm ${first.year} ` +
      `đến <strong>${nf.format(last.delegates.official)} đại biểu</strong> tại ${esc(last.place)} năm ${last.year}. ` +
      `Mỗi kỳ Đại hội gắn với những quyết định lớn về đường lối của Đảng — xem bối cảnh, nội dung, ý nghĩa và số liệu từng kỳ, có dẫn nguồn đầy đủ.`;

    const cols = [[], [], [], []];
    C.forEach((c, i) => cols[i % 4].push(c));
    const tile = (c, dup) =>
      `<a class="tile" href="${A.url(c)}"${dup ? ' tabindex="-1" aria-hidden="true"' : ` aria-label="Đại hội ${c.roman} (${c.year})"`}>` +
      A.duo(c, 'mini', { cls: c.number % 3 === 0 ? 'duo--flat' : '', alt: '', eager: !dup }) +
      `<span class="tile__label" aria-hidden="true">${c.roman}<span class="tile__year">${c.year}</span></span></a>`;
    $('#mosaic').innerHTML =
      '<div class="mosaic__track">' +
      cols.map((col, i) => `<div class="mosaic__col" data-speed="${SPEEDS[i]}">${col.map(c => tile(c)).join('')}</div>`).join('') +
      `<div class="mosaic__dups">${cols.flat().map(c => tile(c, true)).join('')}</div>` +
      '</div>';
  }

  function initParallax() {
    if (A.reduceMotion) return;
    const mq = window.matchMedia('(min-width: 901px)');
    const cols = $$('.mosaic__col');
    const hero = $('.hero');
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!mq.matches) { cols.forEach(c => { c.style.transform = ''; }); return; }
      const y = window.scrollY;
      if (y > hero.offsetHeight + 200) return;
      cols.forEach(c => { c.style.transform = `translate3d(0, ${(y * parseFloat(c.dataset.speed)).toFixed(1)}px, 0)`; });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
    update();
  }

  // ---------- Con số chính ----------
  function renderStats() {
    const places = [...new Set(C.map(c => shortPlace(c.place).replace(/\s*\(.*\)$/, '')))];
    const yearsOf = p => C.filter(c => shortPlace(c.place).replace(/\s*\(.*\)$/, '') === p).map(c => c.year);
    const placeText = places.map(p => {
      const ys = yearsOf(p);
      return `${p} (${ys.length > 1 ? ys[0] + ' – ' + ys[ys.length - 1] : ys[0]})`;
    }).join(', ');
    const stats = [
      { num: `<span data-count="${C.length}">${C.length}</span>`, label: `kỳ Đại hội đại biểu toàn quốc, ${first.year} – ${last.year}` },
      { num: `<span data-count="${last.year - first.year}">${last.year - first.year}</span>`, label: `năm từ Đại hội ${first.roman} đến Đại hội ${last.roman}` },
      { num: `${nf.format(first.delegates.official)}<span class="stat__arrow">→</span><span data-count="${last.delegates.official}">${nf.format(last.delegates.official)}</span>`, label: `đại biểu dự Đại hội, từ ${first.year} đến ${last.year}` },
      { num: `<span data-count="${places.length}">${places.length}</span>`, label: `nơi họp Đại hội: ${esc(placeText)}` }
    ];
    const box = $('#stats');
    box.innerHTML = stats.map(s => `<div class="stat" data-reveal><div class="stat__num">${s.num}</div><div class="stat__label">${s.label}</div></div>`).join('');
    box.setAttribute('data-stagger', '');

    const run = () => $$('[data-count]', box).forEach(countUp);
    if (!('IntersectionObserver' in window)) return run();
    const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { run(); o.disconnect(); } }, { threshold: 0.4 });
    o.observe(box);
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const fmt = v => nf.format(Math.round(v));
    if (A.reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1500;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Mốc mở đầu 1930 ----------
  function renderFounding() {
    const f = D.founding, sec = $('#mo-dau');
    if (!f) { sec.remove(); return; }
    const year = (f.time.match(/(\d{4})\s*$/) || [])[1] || '';
    const src = f.sources.map(s => `${s.label ? esc(s.label) + ': ' : ''}${s.html}`).join(' · ');
    sec.innerHTML = `
      <div class="container founding__grid">
        <div data-reveal>
          <p class="eyebrow">Mốc mở đầu · trước Đại hội I</p>
          <p class="founding__year" aria-hidden="true">${year}</p>
          <h2 class="founding__title" id="founding-title">${esc(f.title.replace(/\s*\(\d{4}\)\s*$/, ''))}</h2>
          <div class="founding__meta">
            <span>${esc(f.time)}</span><span>${esc(f.place)}</span><span>Ngày kỷ niệm thành lập Đảng: ${esc(f.anniversary)}</span>
          </div>
          <p class="founding__people"><strong>Thành phần:</strong> ${f.people}</p>
        </div>
        <div data-reveal>
          <p class="founding__quote">${f.significance}</p>
          <ul class="founding__list">${f.points.map(p => `<li>${p}</li>`).join('')}</ul>
          <p class="founding__src">Nguồn: ${src} — sách <em>Lịch sử Đảng Cộng sản Việt Nam</em>.</p>
        </div>
      </div>`;
  }

  // ---------- Trục thời gian ----------
  function renderTimeline() {
    const chips = $('#phase-chips'), list = $('#tl-list'), rail = $('#tl-rail'), bar = $('#tl-bar');
    const count = id => C.filter(c => c.phase === id).length;

    chips.innerHTML =
      `<button class="chip" type="button" data-phase="all" aria-pressed="true">Tất cả <span class="chip__count">${C.length}</span></button>` +
      D.phases.filter(p => count(p.id)).map(p =>
        `<button class="chip" type="button" data-phase="${p.id}" aria-pressed="false" title="${esc(p.short)}">${esc(p.range)} <span class="chip__count">${count(p.id)}</span></button>`
      ).join('');

    let html = '', k = 0;
    D.phases.forEach(p => {
      const items = C.filter(c => c.phase === p.id);
      if (!items.length) return;
      html += `
        <div class="phase" data-phase="${p.id}" data-reveal>
          <div class="phase__range">${esc(p.range)}</div>
          <div>
            <h3 class="phase__title">${esc(p.short)}</h3>
            <p class="phase__book">Sách: “${esc(p.book)}”, tr. ${esc(p.page)}</p>
          </div>
        </div>`;
      items.forEach(c => { html += card(c, k++ % 2 === 1); });
    });
    list.innerHTML = html;

    rail.innerHTML = `
      <p class="tl-rail__label">Đang xem</p>
      <div class="tl-rail__year" id="rail-year">${first.year}</div>
      <div class="tl-rail__roman" id="rail-roman">Đại hội ${first.roman}</div>
      <ol class="tl-rail__list">${C.map(c => `<li><a href="#dh-${c.id}" data-id="${c.id}"><span>Đại hội ${c.roman}</span><span>${c.year}</span></a></li>`).join('')}</ol>`;
    bar.innerHTML = `<span class="tl-bar__year" id="bar-year">${first.year}</span><span id="bar-text"></span><span class="tl-bar__progress" id="bar-progress"></span>`;

    let current = null;
    const setActive = id => {
      if (!id || id === current) return;
      current = id;
      const c = A.byId(id);
      const y = $('#rail-year');
      y.textContent = c.year;
      y.classList.remove('is-changing'); void y.offsetWidth; y.classList.add('is-changing');
      $('#rail-roman').textContent = `Đại hội ${c.roman}`;
      $$('.tl-rail__list a', rail).forEach(a => a.classList.toggle('is-active', a.dataset.id === id));
      $('#bar-year').textContent = c.year;
      $('#bar-text').textContent = `Đại hội ${c.roman} · ${shortPlace(c.place)}`;
      $('#bar-progress').style.transform = `scaleX(${c.number / C.length})`;
    };
    setActive(first.id);
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.id); }),
        { rootMargin: '-42% 0px -52% 0px' });
      $$('.tl-card', list).forEach(el => obs.observe(el));
    }

    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const ph = b.dataset.phase;
      $$('.chip', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $$('.phase, .tl-card', list).forEach(el => el.classList.toggle('is-hidden', ph !== 'all' && el.dataset.phase !== ph));
      $$('.tl-rail__list a', rail).forEach(a => a.classList.toggle('is-dim', ph !== 'all' && A.byId(a.dataset.id).phase !== ph));
      $$('[data-reveal]', list).forEach(el => el.classList.add('is-visible'));
      const top = list.getBoundingClientRect().top + window.scrollY - 150;
      if (window.scrollY > top + 40) window.scrollTo({ top, behavior: A.reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function card(c, alt) {
    return `
      <article class="tl-card${alt ? ' is-alt' : ''}" id="dh-${c.id}" data-id="${c.id}" data-phase="${c.phase}" data-reveal>
        <a class="tl-card__media" href="${A.url(c)}" tabindex="-1" aria-hidden="true">${A.duo(c, 'thumb', { alt: '' })}</a>
        <div class="tl-card__body">
          <span class="tl-card__roman" aria-hidden="true">${c.roman}</span>
          <h3 class="tl-card__h">
            <span class="tl-card__label">Đại hội ${c.roman}</span>
            <a class="tl-card__hl" href="${A.url(c)}">${esc(c.highlight)}</a>
          </h3>
          <p class="tl-card__meta"><span>${icon('calendar')}${esc(c.time)}</span><span>${icon('pin')}${esc(shortPlace(c.place))}</span></p>
          <p class="tl-card__leader">${esc(A.leaderLine(c))}</p>
          <div class="tl-card__foot">
            <span class="tl-card__num">Kỳ thứ ${c.number}/${C.length} · ${nf.format(c.delegates.official)} đại biểu</span>
            <span class="link-arrow" aria-hidden="true">Xem chi tiết</span>
          </div>
        </div>
      </article>`;
  }

  // ---------- Biểu đồ ----------
  function renderChart() {
    const box = $('#chart'), kpi = $('#chart-kpi'), foot = $('#chart-foot'), table = $('#chart-table');
    const seg = $$('.seg button');
    let mode = 'members', activeIdx = -1, lastPointer = 'mouse';

    const S = {
      members: C.map(c => ({ c, v: c.delegates.members ? c.delegates.members.value : null, label: c.delegates.members ? c.delegates.members.text : '—' })),
      delegates: C.map(c => ({ c, v: c.delegates.official, label: nf.format(c.delegates.official) }))
    };
    const unit = () => (mode === 'members' ? 'đảng viên' : 'đại biểu');
    const shortVal = v => (mode === 'members'
      ? (v >= 1e6 ? (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr' : v >= 1e4 ? Math.round(v / 1000) + ' ng' : nf.format(v))
      : nf.format(v));

    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    box.appendChild(tip);

    function draw() {
      const W = Math.max(300, Math.round(box.clientWidth));
      const H = Math.round(Math.min(430, Math.max(290, W * 0.46)));
      const narrow = W < 620;
      const m = { t: 40, r: 6, b: narrow ? 34 : 50, l: narrow ? 42 : 64 };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const data = S[mode];
      const max = Math.max(...data.map(d => d.v || 0));
      const step = mode === 'members' ? 1e6 : 400;
      const ymax = Math.ceil(max / step) * step;
      const bw = iw / data.length;
      const x = i => m.l + i * bw;
      const y = v => m.t + ih - (v / ymax) * ih;
      const romanSize = bw < 30 ? 10.5 : 14;

      let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Biểu đồ số ${unit()} qua 14 kỳ Đại hội">`;
      D.phases.forEach((p, pi) => {
        const idx = data.map((d, i) => (d.c.phase === p.id ? i : -1)).filter(i => i >= 0);
        if (!idx.length) return;
        const x0 = x(idx[0]), x1 = x(idx[idx.length - 1] + 1);
        if (pi % 2 === 0) s += `<rect class="band" x="${x0}" y="${m.t - 26}" width="${x1 - x0}" height="${ih + 26}"/>`;
        const tight = (x1 - x0) < 70;
        const label = tight ? p.range.split(/[–-]/)[0].trim() : p.range;
        s += `<text class="band-label" x="${(x0 + x1) / 2}" y="${m.t - (tight && pi % 2 ? 4 : 13)}" text-anchor="middle">${esc(label)}</text>`;
      });
      s += '<g class="grid">';
      for (let t = 0; t <= ymax; t += step) {
        const ty = y(t);
        const lab = mode === 'members' ? (t === 0 ? '0' : (t / 1e6) + (narrow ? ' tr' : ' triệu')) : nf.format(t);
        s += `<line x1="${m.l}" x2="${W - m.r}" y1="${ty}" y2="${ty}"/><text x="${m.l - 8}" y="${ty + 4}" text-anchor="end">${lab}</text>`;
      }
      s += '</g>';
      data.forEach((d, i) => {
        const cx = x(i) + bw / 2;
        s += `<g class="axis"><text class="roman" x="${cx}" y="${H - m.b + 18}" text-anchor="middle" style="font-size:${romanSize}px">${d.c.roman}</text>` +
          (narrow ? '' : `<text x="${cx}" y="${H - m.b + 34}" text-anchor="middle">${d.c.year}</text>`) + '</g>';
        if (d.v == null) return;
        const bwid = Math.max(6, bw * 0.58), bx = cx - bwid / 2, by = y(d.v), bh = Math.max(2, m.t + ih - by);
        const star = mode === 'members' && d.c.id === 'ii' ? '*' : '';
        s += `<g class="bar-g" data-i="${i}" tabindex="0" role="button" aria-label="Đại hội ${d.c.roman}, năm ${d.c.year}: ${esc(d.label)} ${unit()}. Nhấn để xem chi tiết.">` +
          `<rect x="${x(i)}" y="${m.t}" width="${bw}" height="${ih}" fill="transparent"/>` +
          `<rect class="bar${i === data.length - 1 ? ' is-last' : ''}${i === activeIdx ? ' is-active' : ''}" x="${bx}" y="${by}" width="${bwid}" height="${bh}" rx="${Math.min(5, bwid / 4)}" style="--i:${i}"/>` +
          (bw >= 56 ? `<text class="val" x="${cx}" y="${by - 7}" text-anchor="middle">${shortVal(d.v)}${star}</text>` : '') +
          '</g>';
      });
      s += '</svg>';
      [...box.querySelectorAll('svg')].forEach(n => n.remove());
      box.insertAdjacentHTML('afterbegin', s);
    }

    function describe() {
      const f = S[mode][0], l = S[mode][S[mode].length - 1];
      if (mode === 'members') {
        kpi.innerHTML = `${esc(f.label)} <span class="stat__arrow">→</span> ${esc(l.label)}<small>đảng viên · Đại hội ${first.roman} (${first.year}) → Đại hội ${last.roman} (${last.year})</small>`;
        foot.innerHTML = 'Số liệu: trang <em>Niên biểu toàn khóa</em> và bài tổng quan từng kỳ trên tulieuvankien.dangcongsan.vn; Đại hội XIV theo Diễn văn bế mạc. (*) Năm 1951: số đảng viên của Đảng bộ toàn Đông Dương. Các số ghi “hơn/gần” được vẽ theo giá trị làm tròn; xem con số gốc ở bảng bên dưới. Đơn vị trên cột: tr = triệu, ng = nghìn.';
      } else {
        kpi.innerHTML = `${esc(f.label)} <span class="stat__arrow">→</span> ${esc(l.label)}<small>đại biểu chính thức · Đại hội ${first.roman} (${first.year}) → Đại hội ${last.roman} (${last.year})</small>`;
        const alt = C.filter(c => c.delegates.alternate).map(c => `Đại hội ${c.roman} có thêm ${c.delegates.alternate} đại biểu dự khuyết`).join('; ');
        foot.innerHTML = `Số đại biểu chính thức. ${esc(alt)}. Nguồn: tulieuvankien.dangcongsan.vn và báo chí chính thống — xem trang từng kỳ.`;
      }
      table.innerHTML = `<table><thead><tr><th>Kỳ</th><th>Thời gian</th><th>Đại biểu</th><th>Đảng viên</th></tr></thead><tbody>` +
        C.map(c => `<tr><td><a href="${A.url(c)}">Đại hội ${c.roman}</a></td><td>${esc(c.time)}</td><td>${nf.format(c.delegates.official)}${c.delegates.alternate ? ` (+${c.delegates.alternate} dự khuyết)` : ''}</td><td>${c.delegates.members ? esc(c.delegates.members.text) : '—'}</td></tr>`).join('') +
        '</tbody></table>';
    }

    function showTip(i) {
      const d = S[mode][i];
      const g = box.querySelector(`.bar-g[data-i="${i}"]`);
      if (!d || d.v == null || !g) return;
      const note = mode === 'members' && d.c.id === 'ii' ? '<br><em>Đảng bộ toàn Đông Dương</em>' : '';
      tip.innerHTML = `<b>Đại hội ${d.c.roman} · ${d.c.year}</b>${esc(d.label)} ${unit()}${note}<br><span style="opacity:.78">${esc(d.c.highlight)}</span>`;
      const r = g.querySelector('.bar').getBoundingClientRect(), br = box.getBoundingClientRect();
      const half = Math.min(130, br.width / 2 - 4);
      tip.style.left = Math.min(Math.max(r.left - br.left + r.width / 2, half), br.width - half) + 'px';
      tip.style.top = (r.top - br.top) + 'px';
      tip.classList.add('is-on');
      $$('.bar', box).forEach((b, k) => b.classList.toggle('is-active', b.closest('.bar-g').dataset.i === String(i)));
    }
    const hideTip = () => { tip.classList.remove('is-on'); activeIdx = -1; $$('.bar.is-active', box).forEach(b => b.classList.remove('is-active')); };
    const go = i => { location.href = A.url(S[mode][i].c); };

    box.addEventListener('pointerdown', e => { lastPointer = e.pointerType; });
    box.addEventListener('pointerover', e => { const g = e.target.closest('.bar-g'); if (g && e.pointerType !== 'touch') showTip(+g.dataset.i); });
    box.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') hideTip(); });
    box.addEventListener('focusin', e => { const g = e.target.closest('.bar-g'); if (g) showTip(+g.dataset.i); });
    box.addEventListener('focusout', hideTip);
    box.addEventListener('click', e => {
      const g = e.target.closest('.bar-g');
      if (!g) return;
      const i = +g.dataset.i;
      if (lastPointer === 'touch' && activeIdx !== i) { activeIdx = i; showTip(i); return; }
      go(i);
    });
    box.addEventListener('keydown', e => {
      const g = e.target.closest('.bar-g');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(+g.dataset.i); }
    });

    seg.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      seg.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      hideTip(); draw(); describe();
    }));

    draw(); describe();
    let lastW = box.clientWidth, t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(box.clientWidth - lastW) > 8) { lastW = box.clientWidth; hideTip(); draw(); } }, 150); };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(box); else window.addEventListener('resize', onResize);

    if ('IntersectionObserver' in window && !A.reduceMotion) {
      const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { box.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.3 });
      o.observe(box);
    } else box.classList.add('is-in');
  }

  // ---------- Người đứng đầu qua các kỳ ----------
  function renderRelay() {
    const groups = [];
    C.forEach((c, i) => {
      const h = A.headLeader(c);
      const g = groups[groups.length - 1];
      if (g && g.name === h.name) { g.end = i; g.titles.push(`${h.title} (Đại hội ${c.roman})`); }
      else groups.push({ name: h.name, start: i, end: i, titles: [`${h.title} (Đại hội ${c.roman})`] });
    });
    const chairs = [];
    C.forEach((c, i) => {
      const ch = c.leadership.leaders.find(l => l.title === 'Chủ tịch Đảng');
      if (!ch) return;
      const g = chairs[chairs.length - 1];
      if (g && g.name === ch.name && g.end === i - 1) g.end = i; else chairs.push({ name: ch.name, start: i, end: i });
    });
    const range = g => (g.start === g.end ? C[g.start].roman : `${C[g.start].roman} – ${C[g.end].roman}`);
    const pill = (g, row, cls) =>
      `<a class="relay__pill ${cls}${g.start === g.end ? ' relay__pill--single' : ''}" href="${A.url(C[g.start])}" style="grid-column:${g.start + 2} / ${g.end + 3};grid-row:${row}"${g.titles ? ` title="${esc(g.titles.join('; '))}"` : ''}>${esc(g.name)}<small>${range(g)}</small></a>`;

    $('#relay').innerHTML =
      '<div class="relay__grid">' +
      '<div style="grid-row:1;grid-column:1"></div>' +
      C.map((c, i) => `<div class="relay__head" style="grid-row:1;grid-column:${i + 2}"><b>${c.roman}</b><span>${c.year}</span></div>`).join('') +
      '<div class="relay__rowlabel" style="grid-row:2;grid-column:1">Tổng Bí thư /<br>Bí thư thứ nhất</div>' +
      groups.map(g => pill(g, 2, '')).join('') +
      '<div class="relay__rowlabel" style="grid-row:3;grid-column:1">Chủ tịch Đảng</div>' +
      chairs.map(g => pill(g, 3, 'relay__pill--alt')).join('') +
      '</div>';
    $('#relay-note').innerHTML =
      'Bảng chỉ ghi chức danh được bầu tại các kỳ Đại hội (Đại hội III bầu chức danh Bí thư thứ nhất). ' +
      'Giữa hai kỳ Đại hội vẫn có thay đổi, ví dụ: tháng 7/1986, Hội nghị bất thường của Ban Chấp hành Trung ương bầu Trường Chinh làm Tổng Bí thư (Sách, tr. 168); ' +
      'tháng 12/1997, Hội nghị Trung ương 4 bầu Lê Khả Phiêu làm Tổng Bí thư (Sách, tr. 178).';
  }

  function init() {
    renderHero();
    renderStats();
    renderFounding();
    renderTimeline();
    renderChart();
    renderRelay();
    A.reveal();
    initParallax();
    if (location.hash.length > 1) {
      const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) setTimeout(() => window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 76, behavior: 'auto' }), 60);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
