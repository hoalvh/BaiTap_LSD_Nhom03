// Chuyển file dữ liệu dai-hoi-dang.md thành assets/js/data.js cho website.
// Chạy:  node tools/build-data.mjs            (đọc ../web-data/dai-hoi-dang.md, nếu không có thì content/dai-hoi-dang.md)
//        node tools/build-data.mjs --images   (tạo lại ảnh bằng tools/optimize-images.ps1 trước — chỉ Windows)
// Không cần cài thêm gói nào: chỉ dùng thư viện có sẵn của Node.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const srcArg = args.find(a => !a.startsWith('--'));
const EXTERNAL = join(ROOT, '..', 'web-data', 'dai-hoi-dang.md');
const SNAPSHOT = join(ROOT, 'content', 'dai-hoi-dang.md');
const SRC = [srcArg && resolve(srcArg), EXTERNAL, SNAPSHOT].filter(Boolean).find(p => existsSync(p));
if (!SRC) fail('Không tìm thấy dai-hoi-dang.md');

const warnings = [];
const warn = msg => warnings.push(msg);
function fail(msg) { console.error('LỖI: ' + msg); process.exit(1); }

// ---------- Ảnh ----------
const IMG = join(ROOT, 'assets', 'img');
if (flags.has('--images')) runImageScript();

function runImageScript() {
  if (process.platform !== 'win32') { warn('Bỏ qua --images: script ảnh chỉ chạy trên Windows.'); return; }
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(ROOT, 'tools', 'optimize-images.ps1')], { stdio: 'inherit' });
  if (r.status !== 0) fail('optimize-images.ps1 chạy lỗi');
}

function jpegSize(file) {
  const buf = readFileSync(file);
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

// ---------- Markdown ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(s) {
  return esc(s.trim())
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
const plain = s => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '').trim();

const md = readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const sections = md.split(/^## /m).slice(1).map(chunk => {
  const nl = chunk.indexOf('\n');
  return { title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).replace(/\n---\s*$/, '').trim() };
});

function fieldsOf(body) {
  const out = {};
  const head = body.split(/^### /m)[0];
  for (const m of head.matchAll(/^- \*\*(.+?):\*\*\s*(.+)$/gm)) out[m[1].trim()] = m[2].trim();
  return out;
}
function subsections(body) {
  const out = {};
  for (const part of body.split(/^### /m).slice(1)) {
    const nl = part.indexOf('\n');
    out[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  return out;
}
const bullets = text => (text || '').split('\n').filter(l => /^- /.test(l)).map(l => l.slice(2).trim());
const paragraph = text => (text || '').split('\n').filter(l => l.trim() && !/^- /.test(l)).join(' ').trim();
function tableRows(body) {
  const lines = body.split('\n').filter(l => /^\|/.test(l.trim()));
  return lines.slice(2).map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
}

function parseSource(line) {
  const text = line.trim();
  const book = text.match(/^Nội dung:\s*(.+)$/);
  if (book) return { label: 'Nội dung', html: inline(book[1]), urls: [] };
  const urls = [...text.matchAll(/\]\((https?:[^)\s]+)\)/g)].map(m => m[1]);
  const lab = text.match(/^([^[:]{2,60}):\s*(.+)$/);
  if (lab) return { label: lab[1].trim(), html: inline(lab[2]), urls };
  return { label: null, html: inline(text), urls };
}

// ---------- Phần "### Chi tiết": các mục "#### Tên mục", mỗi đoạn / mỗi gạch đầu dòng phải ghi nguồn ----------
// Nguồn viết trong ngoặc: (Sách, tr. 166) · (Tư liệu Văn kiện Đảng) · (Báo …) · (Nghị quyết …) · (Diễn văn …)
const CITE = /\(((?:Sách, tr\.|Tư liệu Văn kiện Đảng|Văn kiện Đảng|Báo |Nghị quyết|Diễn văn)[^()]*)\)/g;
function withCites(text, tlvkUrl) {
  const cites = [];
  const marked = text.replace(CITE, (m, c) => `\u0000${cites.push(c) - 1}\u0000`);
  return {
    count: cites.length,
    html: inline(marked).replace(/\u0000(\d+)\u0000/g, (m, i) => {
      const c = cites[+i];
      const body = c === 'Tư liệu Văn kiện Đảng' && tlvkUrl
        ? `<a href="${tlvkUrl}" target="_blank" rel="noopener">${esc(c)}</a>` : inline(c);
      return `<span class="cite">${body}</span>`;
    })
  };
}
function parseDetail(text, roman, tlvkUrl) {
  if (!text) return null;
  const sections = [];
  let words = 0;
  for (const part of text.split(/^#### /m).slice(1)) {
    const nl = part.indexOf('\n');
    const title = part.slice(0, nl).trim();
    const blocks = [];
    for (const chunk of part.slice(nl + 1).split(/\n\s*\n/)) {
      const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;
      const isList = lines.every(l => l.startsWith('- '));
      const items = isList ? lines.map(l => l.slice(2)) : [lines.join(' ')];
      const done = items.map(it => {
        words += plain(it).split(/\s+/).length;
        const r = withCites(it, tlvkUrl);
        if (!r.count) warn(`ĐH ${roman}: mục chi tiết "${title}" có đoạn chưa ghi nguồn: "${plain(it).slice(0, 50)}…"`);
        return r.html;
      });
      blocks.push(isList ? { type: 'ul', items: done } : { type: 'p', html: done[0] });
    }
    if (!blocks.length) warn(`ĐH ${roman}: mục chi tiết "${title}" trống`);
    sections.push({ title, blocks });
  }
  if (!sections.length) warn(`ĐH ${roman}: "### Chi tiết" chưa có mục "#### …"`);
  return { sections, words };
}

// ---------- Giai đoạn ----------
const phaseSec = sections.find(s => s.title.startsWith('Giai đoạn'));
if (!phaseSec) fail('Thiếu mục "## Giai đoạn (theo mục lục sách)"');
const phases = tableRows(phaseSec.body).map((r, i) => ({
  id: 'p' + (i + 1), key: r[0], range: r[0].replace(/^Đổi mới \((.+)\)$/, '$1'), short: r[1], book: r[2], page: r[3]
}));

// ---------- Mốc mở đầu ----------
let founding = null;
const fSec = sections.find(s => s.title.startsWith('Mốc mở đầu'));
if (fSec) {
  const f = fieldsOf(fSec.body), sub = subsections(fSec.body);
  founding = {
    title: fSec.title.replace(/^Mốc mở đầu:\s*/, ''),
    intro: inline(paragraph(fSec.body.split(/^- \*\*/m)[0])),
    time: f['Thời gian'], place: f['Địa điểm'], people: inline(f['Thành phần'] || ''),
    highlight: f['Điểm nhấn'], anniversary: f['Ngày kỷ niệm thành lập Đảng'],
    points: bullets(sub['Nội dung']).map(inline),
    significance: inline(paragraph(sub['Ý nghĩa'])),
    sources: bullets(sub['Nguồn']).map(parseSource)
  };
}

// ---------- 14 kỳ Đại hội ----------
const REQUIRED = ['Thời gian', 'Địa điểm', 'Giai đoạn', 'Mục trong sách', 'Đại biểu', 'Lãnh đạo được bầu', 'Điểm nhấn', 'Ảnh', 'Chú thích ảnh', 'Nguồn ảnh'];
const toInt = s => parseInt(String(s).replace(/[.,]/g, ''), 10);

// "2.1. Tên mục nguyên văn — tr. 177" -> { num, title, page }; dòng không có số trang (vd. ĐH XIV) -> { note }
function parseBookSection(text) {
  if (!text) return null;
  const m = text.match(/^(?:(\d+(?:\.\d+)*)\.\s+)?(.+?)\s+—\s+tr\.\s*(\d+)$/);
  return m ? { num: m[1] || '', title: m[2], page: m[3] } : { note: text };
}

function parseDelegates(text) {
  const official = text.match(/^([\d.]+)\s*đại biểu/);
  const alternate = text.match(/([\d.]+)\s*đại biểu dự khuyết/);
  const intl = text.match(/([\d.]+)\s*đoàn đại biểu quốc tế/);
  const mem = text.match(/(hơn|gần|khoảng)?\s*([\d.,]+)\s*(triệu|vạn)?\s*đảng viên/);
  let members = null;
  if (mem) {
    const value = mem[3]
      ? Math.round(parseFloat(mem[2].replace(/\./g, '').replace(',', '.')) * (mem[3] === 'triệu' ? 1e6 : 1e4))
      : toInt(mem[2]);
    members = { value, qualifier: mem[1] || '', text: mem[0].replace(/\s*đảng viên$/, '').trim() };
  }
  return {
    text, official: official ? toInt(official[1]) : null,
    alternate: alternate ? toInt(alternate[1]) : null,
    intl: intl ? toInt(intl[1]) : null, members
  };
}

function parseLeadership(text) {
  const leaders = [], organs = [];
  for (const item of text.split(/;\s*/)) {
    const m = item.match(/^(Tổng Bí thư|Chủ tịch Đảng|Bí thư thứ nhất)\s+(.+?)(?:\s*\(([^)]+)\))?$/);
    if (m) leaders.push({ title: m[1], name: m[2].trim(), note: m[3] || '' });
    else organs.push(item.trim());
  }
  return { text, leaders, organs };
}

const congresses = sections.filter(s => /^Đại hội [IVXL]+$/.test(s.title)).map((s, idx) => {
  const roman = s.title.replace('Đại hội ', '');
  const f = fieldsOf(s.body), sub = subsections(s.body);
  for (const k of REQUIRED) if (!f[k]) warn(`ĐH ${roman}: thiếu trường "${k}"`);
  for (const k of ['Bối cảnh', 'Nội dung nổi bật', 'Ý nghĩa', 'Nguồn']) if (!sub[k]) warn(`ĐH ${roman}: thiếu mục "### ${k}"`);

  const phase = phases.find(p => p.key === f['Giai đoạn']);
  if (!phase) warn(`ĐH ${roman}: giai đoạn "${f['Giai đoạn']}" không có trong bảng Giai đoạn`);
  const year = parseInt((f['Thời gian'].match(/(\d{4})\s*$/) || [])[1], 10);

  // Ảnh + chú thích + credit
  const file = basename((f['Ảnh'].match(/`([^`]+)`/) || [, f['Ảnh']])[1]).replace(/\.(jpe?g|png)$/i, '.jpg');
  const full = join(IMG, 'full', file);
  let size = null;
  if (!existsSync(full)) warn(`ĐH ${roman}: chưa có ảnh assets/img/full/${file} (chạy với --images)`);
  else {
    size = jpegSize(full);
    if (statSync(full).size > 300 * 1024) warn(`ĐH ${roman}: ảnh ${file} > 300 KB`);
  }
  const capRaw = f['Chú thích ảnh'] || '';
  const credit = (capRaw.match(/\(Ảnh:\s*([^)]+)\)\s*$/) || [])[1] || null;
  const caption = capRaw.replace(/\s*\(Ảnh:\s*[^)]+\)\s*$/, '').trim();
  const srcField = f['Nguồn ảnh'] || '';
  const pending = srcField.startsWith('⬜');
  if (pending) warn(`ĐH ${roman}: ảnh chưa có nguồn (${srcField})`);
  const srcUrl = (srcField.match(/\]\((https?:[^)\s]+)\)/) || [])[1] || null;

  const sources = bullets(sub['Nguồn']).map(parseSource);
  const tlvk = sources.flatMap(s => s.urls).filter(u => u.includes('tulieuvankien.dangcongsan.vn'));
  const tlvkUrl = tlvk.find(u => !/nien-bieu/.test(u)) || tlvk[0] || null;
  if (!sub['Chi tiết']) warn(`ĐH ${roman}: chưa có mục "### Chi tiết"`);
  const detail = parseDetail(sub['Chi tiết'], roman, tlvkUrl);

  const points = bullets(sub['Nội dung nổi bật']);
  if (points.length < 3 || points.length > 5) warn(`ĐH ${roman}: có ${points.length} ý nội dung (nên 3–5)`);
  const words = (f['Điểm nhấn'] || '').split(/\s+/).length;
  if (words > 20) warn(`ĐH ${roman}: điểm nhấn ${words} chữ (> 20)`);

  return {
    id: roman.toLowerCase(), roman, number: idx + 1,
    title: roman === 'I' ? 'Đại hội đại biểu lần thứ I' : `Đại hội đại biểu toàn quốc lần thứ ${roman}`,
    time: f['Thời gian'], year, place: f['Địa điểm'], phase: phase ? phase.id : null,
    bookSection: parseBookSection(f['Mục trong sách']),
    delegates: parseDelegates(f['Đại biểu'] || ''),
    leadership: parseLeadership(f['Lãnh đạo được bầu'] || ''),
    highlight: f['Điểm nhấn'],
    image: {
      file, full: `assets/img/full/${file}`, thumb: `assets/img/thumb/${file}`, mini: `assets/img/mini/${file}`,
      width: size ? size.width : null, height: size ? size.height : null,
      caption, credit, sourceUrl: srcUrl, sourcePending: pending
    },
    context: inline(paragraph(sub['Bối cảnh'])),
    points: points.map(inline),
    pointsPlain: points.map(plain),
    significance: inline(paragraph(sub['Ý nghĩa'])),
    summaryWords: plain([paragraph(sub['Bối cảnh']), ...points, paragraph(sub['Ý nghĩa'])].join(' ')).split(/\s+/).length,
    detail,
    sources
  };
});
if (congresses.length !== 14) warn(`Có ${congresses.length} kỳ Đại hội (mong đợi 14)`);

// ---------- Ghi chú đối chiếu nguồn ----------
const notesSec = sections.find(s => s.title.startsWith('Ghi chú đối chiếu nguồn'));
const notes = notesSec ? { intro: inline(paragraph(notesSec.body)), items: bullets(notesSec.body).map(inline) } : null;

// ---------- Nguồn sách (từ phần Quy ước) ----------
const bookLine = (md.match(/^- \*\*Sách\*\* = (.+)$/m) || [])[1] || '';
const book = inline(bookLine.split('. Số trang')[0].replace(/\.$/, '') + '.');

// ---------- Ghi file ----------
const data = {
  // chỉ ghi ngày (không ghi giờ) để build lại cùng ngày với cùng nội dung thì data.js không đổi
  generatedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
  source: SRC === EXTERNAL ? 'web-data/dai-hoi-dang.md' : 'content/dai-hoi-dang.md',
  book, phases, founding, congresses, notes
};
mkdirSync(join(ROOT, 'assets', 'js'), { recursive: true });
writeFileSync(join(ROOT, 'assets', 'js', 'data.js'),
  '/* Tự động sinh bởi tools/build-data.mjs từ ' + data.source + ' — đừng sửa tay, hãy sửa file .md rồi chạy lại. */\n' +
  'window.DAI_HOI = ' + JSON.stringify(data, null, 1) + ';\n');
if (SRC !== SNAPSHOT) {
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  copyFileSync(SRC, SNAPSHOT);
}

// Gắn mã phiên bản (băm nội dung) vào link CSS/JS trong các trang: file nào đổi thì trình duyệt tải lại file đó,
// không bị giữ bản cũ trong bộ nhớ đệm.
const hashes = new Map();
const hashOf = rel => {
  if (!hashes.has(rel)) {
    const p = join(ROOT, rel);
    hashes.set(rel, existsSync(p) ? createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 8) : null);
  }
  return hashes.get(rel);
};
let stamped = 0;
for (const f of readdirSync(ROOT).filter(n => n.endsWith('.html'))) {
  const p = join(ROOT, f);
  const html = readFileSync(p, 'utf8');
  const out = html.replace(/((?:href|src)=")(assets\/(?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=[\w-]+)?"/g, (m, attr, rel) => {
    const h = hashOf(rel);
    return h ? `${attr}${rel}?v=${h}"` : m;
  });
  if (out !== html) { writeFileSync(p, out); stamped++; }
}
if (stamped) console.log(`Đã cập nhật mã phiên bản CSS/JS trong ${stamped} trang.`);

console.log(`Đã tạo assets/js/data.js từ ${data.source}: ${congresses.length} kỳ, ${phases.length} giai đoạn` +
  (founding ? ', có mốc mở đầu' : '') + (notes ? `, ${notes.items.length} ghi chú đối chiếu` : ''));
if (warnings.length) {
  console.log(`\nCảnh báo (${warnings.length}):`);
  for (const w of warnings) console.log('  - ' + w);
}
