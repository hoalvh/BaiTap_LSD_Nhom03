/* quiz.js — ôn tập: trắc nghiệm, thẻ ghi nhớ, xếp theo thời gian.
   Mọi câu hỏi được tạo từ dữ liệu đã đối chiếu nguồn (data.js), không có câu hỏi viết tay. */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { C, nf, esc, $, $$, icon } = A;

  const rand = n => Math.floor(Math.random() * n);
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, k) => shuffle(arr).slice(0, k);
  const KEYS = ['A', 'B', 'C', 'D'];
  const label = c => `Đại hội ${c.roman}`;
  const explain = c => `<a href="${A.url(c)}">Đại hội ${c.roman}</a> (${esc(c.time)}, ${esc(c.place)}) — ${esc(c.highlight)}.`;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };

  // Ý chung chung hoặc trùng giữa các kỳ -> không dùng làm câu hỏi "thuộc kỳ nào".
  const AMBIGUOUS = [/^Thông qua Điều lệ Đảng \(sửa đổi\)/, /^Xác định 6 nhiệm vụ trọng tâm/, /^Ba đột phá chiến lược/, /^Đột phá về thể chế/, /^Mục tiêu đến năm 2030/];

  function buildBank() {
    const qs = [];
    const others = c => C.filter(x => x !== c);
    const byCongress = (c, type, prompt, quote) => ({
      type, prompt, quote: quote || '', answer: label(c),
      options: shuffle([label(c), ...sample(others(c), 3).map(label)]), explain: explain(c), id: c.id
    });

    C.forEach(c => qs.push(byCongress(c, 'Dấu ấn', `“${esc(c.highlight)}” là dấu ấn của kỳ Đại hội nào?`)));
    C.forEach(c => qs.push({
      type: 'Thời gian', prompt: `${esc(c.title)} của Đảng diễn ra vào thời gian nào?`, quote: '',
      answer: c.time, options: shuffle([c.time, ...sample(others(c), 3).map(x => x.time)]), explain: explain(c), id: c.id
    }));
    const heads = [...new Set(C.map(c => A.headLeader(c).name))];
    C.forEach(c => {
      const h = A.headLeader(c);
      qs.push({
        type: 'Nhân vật', prompt: `Tại Đại hội ${c.roman} (${c.year}), ai được bầu làm ${esc(h.title)}?`, quote: '',
        answer: h.name, options: shuffle([h.name, ...sample(heads.filter(n => n !== h.name), 3)]), explain: explain(c), id: c.id
      });
    });
    C.forEach(c => c.pointsPlain.forEach(p => {
      if (p.length <= 260 && !/Đại hội [IVXL]+\b/.test(p) && !AMBIGUOUS.some(re => re.test(p))) {
        qs.push(byCongress(c, 'Nội dung', 'Nội dung sau thuộc kỳ Đại hội nào?', p));
      }
    }));
    const counts = C.map(c => c.delegates.official);
    C.forEach(c => {
      const v = c.delegates.official;
      if (counts.filter(x => x === v).length === 1) {
        qs.push(byCongress(c, 'Số liệu', `Kỳ Đại hội nào có ${nf.format(v)} đại biểu${c.delegates.alternate ? ' chính thức' : ''} tham dự?`));
      }
    });
    C.filter(c => c.place !== 'Hà Nội').forEach(c => qs.push(byCongress(c, 'Địa điểm', `Kỳ Đại hội nào họp tại ${esc(c.place)}?`)));
    return qs;
  }
  const BANK = buildBank();

  function makeRound() {
    const pick = (type, k) => sample(BANK.filter(q => q.type === type), k);
    return shuffle([
      ...pick('Dấu ấn', 3), ...pick('Thời gian', 2), ...pick('Nhân vật', 2), ...pick('Nội dung', 2),
      ...sample(BANK.filter(q => q.type === 'Số liệu' || q.type === 'Địa điểm'), 1)
    ]).map(q => Object.assign({}, q, { options: shuffle(q.options) }));
  }

  // ---------- Trắc nghiệm ----------
  const quizBox = $('#quiz-box');
  let round = [], qi = 0, score = 0, answers = [], locked = false;

  function quizStart() {
    const best = store.get('dhd-best');
    quizBox.innerHTML = `
      <div class="quiz-start">
        <div class="quiz-start__big">10</div>
        <p class="q-prompt" style="margin-bottom:.2rem">câu hỏi trắc nghiệm</p>
        <ul>
          <li>4 lựa chọn mỗi câu</li><li>Có giải thích ngay sau khi trả lời</li><li>Ngân hàng ${BANK.length} câu, mỗi lần một đề mới</li>
        </ul>
        ${best ? `<p class="muted small">Kỷ lục của bạn trên máy này: <strong>${best}/10</strong></p>` : ''}
        <button class="btn btn--primary" type="button" id="quiz-go">${icon('quiz')}Bắt đầu làm bài</button>
      </div>`;
    $('#quiz-go').addEventListener('click', () => { round = makeRound(); qi = 0; score = 0; answers = []; quizQuestion(); });
  }

  function quizQuestion() {
    const q = round[qi];
    locked = false;
    quizBox.innerHTML = `
      <div class="quiz-top"><span>Câu ${qi + 1}/${round.length}</span><span>Đúng: ${score}</span></div>
      <div class="progress" aria-hidden="true"><i style="width:${(qi / round.length) * 100}%"></i></div>
      <span class="q-type">${esc(q.type)}</span>
      <p class="q-prompt" id="q-prompt">${q.prompt}</p>
      ${q.quote ? `<blockquote class="q-quote">${esc(q.quote)}</blockquote>` : ''}
      <div class="opts" role="group" aria-labelledby="q-prompt">
        ${q.options.map((o, k) => `<button class="opt" type="button" data-k="${k}"><span class="opt__key">${KEYS[k]}</span><span>${esc(o)}</span></button>`).join('')}
      </div>
      <div id="feedback" aria-live="polite"></div>
      <div class="quiz-nav"><button class="btn btn--primary" type="button" id="quiz-next" disabled>${qi + 1 < round.length ? 'Câu tiếp theo' : 'Xem kết quả'} →</button></div>`;
    $$('.opt', quizBox).forEach(b => b.addEventListener('click', () => choose(+b.dataset.k)));
    $('#quiz-next').addEventListener('click', next);
    const first = $('.opt', quizBox);
    if (first && qi > 0) first.focus({ preventScroll: true });
  }

  function choose(k) {
    if (locked) return;
    locked = true;
    const q = round[qi];
    const picked = q.options[k];
    const ok = picked === q.answer;
    if (ok) score++;
    answers.push({ q, picked, ok });
    $$('.opt', quizBox).forEach((b, j) => {
      b.disabled = true;
      if (q.options[j] === q.answer) b.classList.add('is-correct');
      else if (j === k) b.classList.add('is-wrong');
    });
    $('#feedback').innerHTML = `<div class="feedback ${ok ? 'is-ok' : 'is-bad'}"><b>${ok ? 'Chính xác!' : `Chưa đúng — đáp án: ${esc(q.answer)}`}</b>${q.explain}</div>`;
    $('.quiz-top span:last-child', quizBox).textContent = `Đúng: ${score}`;
    const nb = $('#quiz-next');
    nb.disabled = false;
    nb.focus({ preventScroll: true });
  }

  function next() {
    if (!locked) return;
    qi++;
    if (qi < round.length) quizQuestion(); else quizEnd();
  }

  function quizEnd() {
    const best = store.get('dhd-best') || 0;
    if (score > best) store.set('dhd-best', score);
    const msg = score === 10 ? 'Xuất sắc! Bạn nắm rất chắc 14 kỳ Đại hội.'
      : score >= 8 ? 'Rất tốt! Chỉ cần xem lại vài chi tiết.'
      : score >= 5 ? 'Khá! Ôn lại các kỳ bạn trả lời sai bên dưới nhé.'
      : 'Cần ôn thêm — hãy đọc lại hành trình rồi làm đề mới.';
    const wrong = answers.filter(a => !a.ok);
    quizBox.innerHTML = `
      <div class="score">
        <div class="score__num">${score}<small>/10</small></div>
        <p class="score__msg">${msg}</p>
        <p class="muted small">${score > best ? 'Kỷ lục mới trên máy này!' : best ? `Kỷ lục trên máy này: ${Math.max(best, score)}/10` : ''}</p>
        ${wrong.length ? `<ul class="review">${wrong.map(a => `<li>${a.q.prompt}${a.q.quote ? `<br><em>“${esc(a.q.quote)}”</em>` : ''}<br>Bạn chọn: <s>${esc(a.picked)}</s> · Đáp án: <b>${esc(a.q.answer)}</b><br>${a.q.explain}</li>`).join('')}</ul>` : ''}
        <div class="hero__actions" style="justify-content:center">
          <button class="btn btn--primary" type="button" id="quiz-again">${icon('shuffle')}Làm đề mới</button>
          <a class="btn btn--ghost" href="index.html#hanh-trinh">Xem lại hành trình</a>
        </div>
      </div>`;
    $('#quiz-again').addEventListener('click', () => { round = makeRound(); qi = 0; score = 0; answers = []; quizQuestion(); });
  }

  document.addEventListener('keydown', e => {
    if ($('#panel-quiz').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }[e.key.toLowerCase()];
    if (k != null && $('.opt', quizBox) && !locked) { e.preventDefault(); choose(k); }
  });

  // ---------- Thẻ ghi nhớ ----------
  const flashBox = $('#flash-box');
  let deck = C.slice(), fi = 0, flipped = false;

  function flashRender() {
    const c = deck[fi];
    const h = A.leaderLine(c);
    flashBox.innerHTML = `
      <div class="flash${flipped ? ' is-flipped' : ''}" id="flash-card" role="button" tabindex="0" aria-label="Thẻ Đại hội ${c.roman}. Nhấn để lật thẻ.">
        <div class="flash__inner">
          <div class="flash__face flash__front" aria-hidden="${flipped}">
            <span>Đại hội</span><b>${c.roman}</b><span>Năm ${c.year} · chạm để lật</span>
          </div>
          <div class="flash__face flash__back" aria-hidden="${!flipped}">
            <span class="eyebrow">Đại hội ${c.roman} · ${c.year}</span>
            <p class="hl">${esc(c.highlight)}</p>
            <p class="meta">${esc(c.time)} · ${esc(c.place)}<br>${esc(h)}</p>
            <a class="link-arrow" href="${A.url(c)}">Xem chi tiết</a>
          </div>
        </div>
      </div>
      <div class="flash-ctrl">
        <button class="btn btn--ghost btn--sm" type="button" id="f-prev" aria-label="Thẻ trước">${icon('left')}</button>
        <span class="flash-count">${fi + 1}/${deck.length}</span>
        <button class="btn btn--primary btn--sm" type="button" id="f-flip">${icon('flip')}Lật thẻ</button>
        <button class="btn btn--ghost btn--sm" type="button" id="f-next" aria-label="Thẻ sau">${icon('right')}</button>
        <button class="btn btn--ghost btn--sm" type="button" id="f-shuffle">${icon('shuffle')}Trộn thẻ</button>
      </div>
      <p class="kbd-hint">Phím tắt: <kbd>Space</kbd> lật thẻ, <kbd>←</kbd> <kbd>→</kbd> chuyển thẻ.</p>`;
    const card = $('#flash-card');
    card.addEventListener('click', e => { if (!e.target.closest('a')) flip(); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    $('#f-flip').addEventListener('click', flip);
    $('#f-prev').addEventListener('click', () => move(-1));
    $('#f-next').addEventListener('click', () => move(1));
    $('#f-shuffle').addEventListener('click', () => { deck = shuffle(C); fi = 0; flipped = false; flashRender(); A.toast('Đã trộn thẻ'); });
  }
  function flip() {
    flipped = !flipped;
    const card = $('#flash-card');
    card.classList.toggle('is-flipped', flipped);
    $('.flash__front', card).setAttribute('aria-hidden', String(flipped));
    $('.flash__back', card).setAttribute('aria-hidden', String(!flipped));
  }
  function move(d) { fi = (fi + d + deck.length) % deck.length; flipped = false; flashRender(); $('#flash-card').focus({ preventScroll: true }); }
  document.addEventListener('keydown', e => {
    if ($('#panel-flash').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('[role="tab"]')) return;
    if (e.target.closest('button, a') && e.key === ' ') return;
    if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === ' ' && !e.target.closest('#flash-card')) { e.preventDefault(); flip(); }
  });

  // ---------- Xếp theo thời gian ----------
  const orderBox = $('#order-box');
  let items = [], picks = [], checked = false;

  function orderNew() {
    items = shuffle(sample(C, 5));
    picks = [];
    checked = false;
    orderRender();
  }
  function orderRender() {
    const correct = items.slice().sort((a, b) => a.number - b.number);
    orderBox.innerHTML = `
      <div class="quiz-top"><span>Chạm lần lượt từ kỳ SỚM NHẤT đến MUỘN NHẤT</span><span>${picks.length}/5</span></div>
      <ol class="order-list">${items.map(c => {
        const n = picks.indexOf(c.id);
        const state = checked ? (correct[n] === c ? ' is-correct' : ' is-wrong') : '';
        return `<li><button class="order-item${n >= 0 ? ' is-picked' : ''}${state}" type="button" data-id="${c.id}" ${checked ? 'disabled' : ''} aria-pressed="${n >= 0}">
          <span class="order-item__n">${n >= 0 ? n + 1 : ''}</span><span>${esc(c.highlight)}</span>
          ${checked ? `<span class="order-item__ans">Đại hội ${c.roman} · ${c.year}</span>` : ''}</button></li>`;
      }).join('')}</ol>
      <div id="order-result" aria-live="polite"></div>
      <div class="quiz-nav" style="gap:.6rem">
        ${checked ? `<button class="btn btn--primary" type="button" id="order-new">${icon('shuffle')}Lượt mới</button>`
          : `<button class="btn btn--ghost" type="button" id="order-reset" ${picks.length ? '' : 'disabled'}>Chọn lại</button><button class="btn btn--primary" type="button" id="order-check" ${picks.length === 5 ? '' : 'disabled'}>Kiểm tra</button>`}
      </div>`;
    if (checked) {
      const right = items.filter(c => correct[picks.indexOf(c.id)] === c).length;
      $('#order-result').innerHTML = `<div class="feedback ${right === 5 ? 'is-ok' : 'is-bad'}"><b>${right === 5 ? 'Hoàn hảo! Đúng cả 5 vị trí.' : `Đúng ${right}/5 vị trí.`}</b>Thứ tự đúng: ${correct.map(c => `<a href="${A.url(c)}">Đại hội ${c.roman} (${c.year})</a>`).join(' → ')}</div>`;
      $('#order-new').addEventListener('click', orderNew);
      return;
    }
    $$('.order-item', orderBox).forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id, at = picks.indexOf(id);
      if (at >= 0) picks.splice(at, 1); else if (picks.length < 5) picks.push(id);
      orderRender();
      const again = $(`.order-item[data-id="${id}"]`, orderBox);
      if (again) again.focus({ preventScroll: true });
    }));
    $('#order-reset').addEventListener('click', () => { picks = []; orderRender(); });
    $('#order-check').addEventListener('click', () => { checked = true; orderRender(); });
  }

  // ---------- Thẻ chọn chế độ ----------
  const tabs = $$('[role="tab"]');
  function selectTab(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    const mode = tab.id.replace('tab-', '');
    history.replaceState(null, '', mode === 'quiz' ? location.pathname : `#${mode}`);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n); n.focus(); }
    });
  });

  quizStart();
  flashRender();
  orderNew();
  const initial = $('#tab-' + location.hash.slice(1));
  if (initial) selectTab(initial);
})();
