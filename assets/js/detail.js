/* detail.js — trang chi tiết một kỳ Đại hội: dai-hoi.html#vi */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { C, nf, esc, $, icon } = A;

  const current = () => A.byId(decodeURIComponent(location.hash.slice(1))) || C[0];

  // Chế độ xem nội dung: "tom-tat" (ngắn, để ôn nhanh) hoặc "chi-tiet" (đầy đủ, ghi nguồn từng đoạn). Nhớ lựa chọn của người xem.
  const VIEW_KEY = 'dhd-view';
  const store = {
    get() { try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) { /* bỏ qua */ } }
  };
  let view = store.get() === 'tom-tat' ? 'tom-tat' : 'chi-tiet';
  const minutes = words => Math.max(1, Math.round(words / 220));

  const detailHtml = d => d.sections.map(s => `
          <section class="dt-section${/^Ý nghĩa/.test(s.title) ? ' significance' : ''}">
            <h2 class="dt-h2">${esc(s.title)}</h2>
            ${s.blocks.map(b => (b.type === 'ul'
              ? `<ul class="dt-list">${b.items.map(x => `<li>${x}</li>`).join('')}</ul>`
              : `<p class="dt-prose">${b.html}</p>`)).join('')}
          </section>`).join('');

  // Mục sách viết về kỳ này: tên mục nguyên văn + số trang (ĐH XIV chưa có trong sách -> chỉ ghi chú)
  const bookSection = s => !s ? '' :
    `<p class="dt-book">${icon('book')}<span><small>Mục trong sách${s.page ? ` · tr.&nbsp;${esc(s.page)}` : ''}</small>${
      s.page ? `“${esc(s.title)}”` : esc(s.note.charAt(0).toUpperCase() + s.note.slice(1))}</span></p>`;

  function render() {
    const c = current();
    const i = C.indexOf(c), prev = C[i - 1], next = C[i + 1];
    const p = A.phaseOf(c);
    const img = c.image;
    document.title = `Đại hội ${c.roman} (${c.year}) — 14 kỳ Đại hội Đảng Cộng sản Việt Nam`;

    $('#dots').innerHTML = C.map(x =>
      `<a href="${A.url(x)}" title="Đại hội ${x.roman} (${x.year})"${x === c ? ' aria-current="page"' : ''}>${x.roman}</a>`).join('');

    const credit = img.credit ? ` — <b>Ảnh: ${esc(img.credit)}</b>` : '';
    const srcLink = img.sourceUrl ? ` · <a href="${esc(img.sourceUrl)}" target="_blank" rel="noopener">Nguồn ảnh</a>` : '';
    const del = c.delegates;
    const delRest = del.text.replace(/^[\d.]+\s*/, '');
    const leaders = c.leadership.leaders.map(l =>
      `<li class="is-leader">${esc(l.title)} ${esc(l.name)}${l.note ? ` <span class="muted">(${esc(l.note)})</span>` : ''}</li>`).join('');
    const organs = c.leadership.organs.map(o => `<li>${esc(o)}</li>`).join('');
    const other = next || prev;

    $('#detail').innerHTML = `
      <header class="dt-hero">
        <div data-reveal="fade">
          <div class="dt-roman" aria-hidden="true">${c.roman}</div>
          <p class="eyebrow dt-kicker">Kỳ thứ ${c.number}/${C.length} · Giai đoạn ${esc(p.range)}</p>
          <h1 class="dt-title">${esc(c.title)}</h1>
          <div class="dt-meta">
            <span>${icon('calendar')}${esc(c.time)}</span>
            <span>${icon('pin')}${esc(c.place)}</span>
          </div>
          ${bookSection(c.bookSection)}
        </div>
        <figure class="dt-figure" data-reveal="fade">
          <button class="dt-figure__btn" type="button" id="zoom" aria-label="Phóng to ảnh">${A.duo(c, 'full', { eager: true, cls: 'is-color' })}</button>
          <figcaption>${esc(img.caption)}${credit}${srcLink}</figcaption>
        </figure>
      </header>

      <p class="dt-quote" data-reveal><small>Điểm nhấn</small>${esc(c.highlight)}</p>

      <div class="facts" data-reveal>
        <div class="fact">
          <div class="fact__label">${icon('users')}Đại biểu</div>
          <div class="fact__value"><span class="fact__big">${nf.format(del.official)}</span>${esc(delRest)}</div>
        </div>
        <div class="fact">
          <div class="fact__label">${icon('star')}Lãnh đạo được bầu</div>
          <div class="fact__value"><ul class="fact__list">${leaders}${organs}</ul></div>
        </div>
      </div>

      <div class="dt-layout">
        <div class="dt-main">
          <div class="view-bar no-print">
            <div class="view-switch" role="tablist" aria-label="Chế độ xem nội dung">
              <button type="button" role="tab" id="tab-tom-tat" aria-controls="view-tom-tat" data-view="tom-tat">Tóm tắt<small>${minutes(c.summaryWords)} phút đọc</small></button>
              <button type="button" role="tab" id="tab-chi-tiet" aria-controls="view-chi-tiet" data-view="chi-tiet"${c.detail ? '' : ' aria-disabled="true" title="Phần chi tiết của kỳ này đang được nhóm biên soạn"'}>Chi tiết<small>${c.detail ? `${minutes(c.detail.words)} phút đọc` : 'đang cập nhật'}</small></button>
            </div>
            <span class="view-bar__label">Đại hội ${c.roman} · ${c.year}</span>
          </div>
          <div class="dt-view" id="view-tom-tat" role="tabpanel" aria-labelledby="tab-tom-tat">
            <section class="dt-section">
              <h2 class="dt-h2">Bối cảnh</h2>
              <p class="dt-prose">${c.context}</p>
            </section>
            <section class="dt-section">
              <h2 class="dt-h2">Nội dung nổi bật</h2>
              <ol class="points">${c.points.map(pt => `<li><span>${pt}</span></li>`).join('')}</ol>
            </section>
            <section class="dt-section significance">
              <h2 class="dt-h2">Ý nghĩa</h2>
              <p>${c.significance}</p>
            </section>
            ${c.detail ? `<button class="btn btn--ghost btn--sm dt-more no-print" type="button" data-go-view="chi-tiet">Đọc bản chi tiết (${minutes(c.detail.words)} phút) ↓</button>` : ''}
          </div>
          ${c.detail ? `<div class="dt-view" id="view-chi-tiet" role="tabpanel" aria-labelledby="tab-chi-tiet">${detailHtml(c.detail)}
            <p class="dt-note">Mỗi đoạn ghi nguồn ở cuối: <span class="cite">Sách, tr. …</span> là sách <em>Lịch sử Đảng Cộng sản Việt Nam</em> (NXB ĐHQG TP.HCM, 2025); các nguồn khác xem ở khung <b>Nguồn tư liệu</b>.</p>
          </div>` : ''}
        </div>
        <aside class="aside" aria-label="Nguồn và công cụ">
          <div class="box">
            <p class="box__title">Nguồn tư liệu</p>
            <ul class="src-list">${c.sources.map(s => `<li>${s.label ? `<b>${esc(s.label)}</b>` : ''}${s.html}</li>`).join('')}</ul>
          </div>
          <div class="box actions no-print">
            <button class="btn btn--primary btn--sm" type="button" id="btn-share">${icon('share')}Chia sẻ kỳ Đại hội này</button>
            <a class="btn btn--ghost btn--sm" href="so-sanh.html#${c.id},${other.id}">${icon('compare')}So sánh với kỳ khác</a>
            <button class="btn btn--ghost btn--sm" type="button" id="btn-print">${icon('print')}In hoặc lưu PDF</button>
          </div>
        </aside>
      </div>`;

    const pcard = (x, cls, label) =>
      `<a class="${cls}" href="${A.url(x)}" rel="${cls === 'is-prev' ? 'prev' : 'next'}">${A.duo(x, 'mini', { alt: '' })}` +
      `<span><small>${label}</small><strong>Đại hội ${x.roman}</strong><span class="hl">${esc(x.highlight)}</span></span></a>`;
    $('#pager').innerHTML =
      (prev ? pcard(prev, 'is-prev', '← Kỳ trước')
        : `<a class="is-prev" href="index.html#mo-dau"><span><small>← Trước đó</small><strong>Mốc mở đầu 1930</strong><span class="hl">Hội nghị thành lập Đảng</span></span></a>`) +
      (next ? pcard(next, 'is-next', 'Kỳ sau →')
        : `<a class="is-next" href="on-tap.html"><span><small>Tiếp theo →</small><strong>Ôn tập</strong><span class="hl">Kiểm tra nhanh 14 kỳ Đại hội</span></span></a>`);

    $('#zoom').addEventListener('click', () =>
      A.lightbox(img.full, `${esc(img.caption)}${credit}${srcLink}`, img.caption));
    $('#btn-share').addEventListener('click', () =>
      A.share({ title: `Đại hội ${c.roman} (${c.year})`, text: `Đại hội ${c.roman} (${c.time}): ${c.highlight}`, link: location.href }));
    $('#btn-print').addEventListener('click', () => window.print());

    setView(c.detail ? view : 'tom-tat', false);
    const tabs = [...document.querySelectorAll('.view-switch [role="tab"]')];
    tabs.forEach(t => t.addEventListener('click', () => pick(t.dataset.view)));
    // phím ← → giữa hai tab (không chuyển sang kỳ khác khi đang ở trên tab)
    $('.view-switch').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = tabs.find(t => t.getAttribute('aria-selected') !== 'true' && t.getAttribute('aria-disabled') !== 'true');
      if (next) { pick(next.dataset.view); next.focus(); }
    });
    const more = document.querySelector('[data-go-view]');
    if (more) more.addEventListener('click', () => { pick('chi-tiet'); $('#tab-chi-tiet').focus(); });

    function pick(v) {
      if (v === 'chi-tiet' && !c.detail) return;
      view = v;
      store.set(v);
      setView(v, true);
    }

    A.reveal($('#detail'));
  }

  // Hiện đúng một bảng nội dung; khi đổi chế độ thì đưa người đọc về đầu phần nội dung nếu đang ở dưới.
  function setView(v, scroll) {
    document.querySelectorAll('.view-switch [role="tab"]').forEach(t => {
      const on = t.dataset.view === v;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.dt-view').forEach(p => { p.hidden = p.id !== 'view-' + v; });
    document.documentElement.dataset.view = v;
    if (scroll) {
      const main = document.querySelector('.dt-main');
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      const top = main.getBoundingClientRect().top + window.scrollY - header - 16;
      if (window.scrollY > top) window.scrollTo({ top, behavior: A.reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function go(delta) {
    const i = C.indexOf(current()) + delta;
    if (i >= 0 && i < C.length) location.hash = C[i].id;
  }

  // thanh chọn chế độ dính dưới đầu trang: có viền và nhãn kỳ Đại hội khi đã dính
  window.addEventListener('scroll', () => {
    const bar = document.querySelector('.view-bar');
    if (!bar) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= header + 1);
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    render();
    window.scrollTo({ top: 0, behavior: A.reduceMotion ? 'auto' : 'smooth' });
  });

  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest && e.target.closest('input, select, textarea, dialog, [role="tab"]')) return;
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  let sx = 0, sy = 0, st = 0;
  document.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  document.addEventListener('touchend', e => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Date.now() - st < 600 && Math.abs(dx) > 80 && Math.abs(dy) < 50 && !e.target.closest('.dots-nav, .relay, .chips')) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
