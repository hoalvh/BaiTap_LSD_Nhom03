/* app.js — hàm dùng chung cho mọi trang.
   Script thường (không dùng module) để mở trực tiếp file index.html từ bản .zip vẫn chạy. */
(function () {
  'use strict';

  const D = window.DAI_HOI;
  if (!D) {
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:1rem;background:#fde;color:#600">Thiếu dữ liệu assets/js/data.js — hãy chạy: node tools/build-data.mjs</p>');
    return;
  }

  const nf = new Intl.NumberFormat('vi-VN');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const ICONS = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    compare: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    flip: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>'
  };
  const icon = (name, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const C = D.congresses;
  const byId = id => C.find(c => c.id === String(id || '').toLowerCase());
  const phaseOf = c => D.phases.find(p => p.id === c.phase);
  const url = c => `dai-hoi.html#${c.id}`;
  const headLeader = c => c.leadership.leaders.find(l => l.title !== 'Chủ tịch Đảng') || c.leadership.leaders[0];
  const leaderLine = c => c.leadership.leaders.map(l => `${l.title} ${l.name}`).join(' · ');
  const membersPhrase = c => (c.delegates.members ? `${c.delegates.members.text} đảng viên` : '');
  const phaseRange = p => p.range.replace(' – ', '–').replace(/nay$/, 'nay');

  function compact(v) {
    if (v >= 1e6) return (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu';
    return nf.format(v);
  }

  // Ảnh phủ đỏ; size = 'mini' | 'thumb' | 'full'
  function duo(c, size = 'thumb', opts = {}) {
    const img = c.image;
    const max = { mini: 320, thumb: 720, full: 1600 }[size];
    let w = img.width, h = img.height;
    if (w && h && w > max) { h = Math.round(h * max / w); w = max; }
    const dims = w && h ? ` width="${w}" height="${h}"` : '';
    const loading = opts.eager ? 'eager' : 'lazy';
    const alt = opts.alt != null ? opts.alt : img.caption;
    return `<span class="duo ${opts.cls || ''}"><img src="${img[size]}" alt="${esc(alt)}"${dims} loading="${loading}" decoding="async"></span>`;
  }

  // ---------- Hiệu ứng xuất hiện khi cuộn ----------
  let io = null;
  function reveal(root = document) {
    const els = $$('[data-reveal]:not(.is-visible)', root);
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return; }
    if (!io) {
      io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach((el, i) => {
      if (el.dataset.delay == null && el.parentElement && el.parentElement.hasAttribute('data-stagger')) {
        el.style.transitionDelay = (Math.min(i, 6) * 70) + 'ms';
      }
      io.observe(el);
    });
    // Dự phòng: nếu vì lý do nào đó observer không báo, không để nội dung bị ẩn.
    clearTimeout(reveal.t);
    reveal.t = setTimeout(sweep, 1500);
  }
  function sweep() {
    const limit = window.innerHeight * 1.05;
    $$('[data-reveal]:not(.is-visible)').forEach(el => {
      if (el.getBoundingClientRect().top < limit) el.classList.add('is-visible');
    });
  }
  window.addEventListener('scroll', () => { clearTimeout(sweep.t); sweep.t = setTimeout(sweep, 250); }, { passive: true });

  // ---------- Thông báo nhỏ ----------
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  // ---------- Chia sẻ ----------
  async function share({ title, text, link }) {
    const href = link || location.href;
    if (navigator.share && location.protocol !== 'file:') {
      try { await navigator.share({ title, text, url: href }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(href);
      toast('Đã sao chép liên kết');
    } catch (e) {
      window.prompt('Sao chép liên kết:', href);
    }
  }

  // ---------- Xem ảnh lớn ----------
  let lb;
  function lightbox(src, captionHtml, alt) {
    if (!lb) {
      lb = document.createElement('dialog');
      lb.className = 'lightbox';
      lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Đóng">×</button><img alt=""><div class="lightbox__cap"></div>';
      document.body.appendChild(lb);
      lb.querySelector('.lightbox__close').addEventListener('click', () => lb.close());
      lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    }
    const img = lb.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    lb.querySelector('.lightbox__cap').innerHTML = captionHtml || '';
    if (typeof lb.showModal === 'function') lb.showModal(); else window.open(src, '_blank');
  }

  // ---------- Đầu trang: menu + chế độ tối ----------
  function initChrome() {
    const menuBtn = $('#menu-btn'), nav = $('#site-nav');
    if (menuBtn && nav) {
      const setOpen = open => {
        nav.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      };
      menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
      nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    }
    const themeBtn = $('#theme-toggle');
    if (themeBtn) {
      const root = document.documentElement;
      const sync = () => {
        const dark = root.getAttribute('data-theme') === 'dark';
        themeBtn.setAttribute('aria-pressed', String(dark));
        themeBtn.setAttribute('aria-label', dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
        const meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#17110F' : '#7A1F16');
      };
      themeBtn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('dhd-theme', next); } catch (e) { /* trình duyệt chặn lưu trữ */ }
        sync();
      });
      sync();
    }
    $$('[data-generated]').forEach(el => {
      const d = new Date(D.generatedAt);
      el.textContent = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    });
  }

  window.App = {
    D, C, nf, esc, $, $$, icon, byId, phaseOf, url, headLeader, leaderLine, membersPhrase, phaseRange,
    compact, duo, reveal, toast, share, lightbox, reduceMotion
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChrome);
  else initChrome();
})();
