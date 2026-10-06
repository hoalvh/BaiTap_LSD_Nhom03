/* about.js — trang Giới thiệu: danh mục nguồn, nguồn ảnh, ghi chú đối chiếu (tạo từ dữ liệu) */
(function () {
  'use strict';
  const A = window.App;
  if (!A) return;
  const { D, C, esc, $ } = A;

  $('#book-cite').innerHTML = `Nguồn chính: ${D.book}`;

  const srcItems = list => list.map(s => `<li>${s.label ? `<strong>${esc(s.label)}:</strong> ` : ''}${s.html}</li>`).join('');
  const linkCount = list => list.reduce((n, s) => n + s.urls.length, 0);
  const secItem = s => (!s ? '' : `<li><strong>Mục trong sách:</strong> ${s.page ? `“${esc(s.title)}”, tr.&nbsp;${esc(s.page)}` : esc(s.note)}</li>`);
  let html = '';
  if (D.founding) {
    html += `<details><summary>Mốc mở đầu: ${esc(D.founding.title)} <span>${D.founding.sources.length} nguồn</span></summary><ul>${srcItems(D.founding.sources)}</ul></details>`;
  }
  html += C.map(c => {
    const n = linkCount(c.sources);
    return `<details><summary>Đại hội ${c.roman} · ${esc(c.time)} <span>sách${n ? ` + ${n} đường dẫn` : ''}</span></summary><ul>${secItem(c.bookSection)}${srcItems(c.sources)}</ul><p class="small" style="margin:.7rem 0 0"><a href="${A.url(c)}">Xem trang Đại hội ${c.roman} →</a></p></details>`;
  }).join('');
  html += `<details><summary>Tên các giai đoạn <span>mục lục sách</span></summary><ul>${D.phases.map(p => `<li>${esc(p.range)}: “${esc(p.book)}” — Sách, tr. ${esc(p.page)}</li>`).join('')}</ul></details>`;
  $('#srcs').innerHTML = html;

  $('#img-credits').innerHTML = `
    <table class="img-credits">
      <thead><tr><th>Kỳ</th><th>Ảnh</th><th>Chú thích</th><th>Nguồn</th></tr></thead>
      <tbody>${C.map(c => {
        const im = c.image;
        const credit = im.credit ? `<span class="tag tag--ok">Ảnh: ${esc(im.credit)}</span> ` : '';
        const link = im.sourceUrl ? `<a href="${esc(im.sourceUrl)}" target="_blank" rel="noopener">Bài gốc</a>` : '<span class="tag">đang bổ sung đường dẫn</span>';
        return `<tr><td><a href="${A.url(c)}">Đại hội ${c.roman}</a></td><td style="width:96px">${A.duo(c, 'mini', { alt: im.caption, cls: 'is-color' })}</td><td>${esc(im.caption)}</td><td>${credit}${link}</td></tr>`;
      }).join('')}</tbody>
    </table>`;

  if (D.notes) {
    $('#notes-intro').innerHTML = 'Những chỗ các nguồn chính thống ghi khác nhau, và con số hay mốc thời gian mà website chọn dùng.';
    $('#notes').innerHTML = D.notes.items.map(n => `<li data-reveal>${n}</li>`).join('');
  } else {
    $('#doi-chieu').remove();
  }

  A.reveal();
})();
