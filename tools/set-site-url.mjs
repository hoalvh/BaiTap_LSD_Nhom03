// Gắn thẻ xem trước (Open Graph) cho mọi trang để link hiện ảnh + tiêu đề khi chia sẻ lên Facebook, Zalo.
// Facebook/Zalo cần đường dẫn TUYỆT ĐỐI, nên sau khi deploy chạy lại với địa chỉ web:
//   node tools/set-site-url.mjs https://ten-du-an.vercel.app
// Chạy không có địa chỉ -> dùng đường dẫn tương đối (khi chưa deploy).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (base && !/^https?:\/\/[^/]+/.test(base)) {
  console.error('Địa chỉ không hợp lệ, ví dụ: https://ten-du-an.vercel.app');
  process.exit(1);
}
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const pages = readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== '404.html' && !f.startsWith('_'));
for (const f of pages) {
  const file = join(ROOT, f);
  let html = readFileSync(file, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '14 kỳ Đại hội Đảng';
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
  const url = base ? `${base}/${f === 'index.html' ? '' : f}` : '';
  const img = base ? `${base}/assets/og.jpg` : 'assets/og.jpg';
  const tags = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="14 kỳ Đại hội Đảng Cộng sản Việt Nam">',
    '<meta property="og:locale" content="vi_VN">',
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(desc)}">`,
    url && `<meta property="og:url" content="${attr(url)}">`,
    `<meta property="og:image" content="${attr(img)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="14 kỳ Đại hội Đảng Cộng sản Việt Nam, 1935 – 2026">',
    '<meta name="twitter:card" content="summary_large_image">'
  ].filter(Boolean);
  const block = `  <!-- og:start -->\n${tags.map(t => '  ' + t).join('\n')}\n  <!-- og:end -->`;
  html = html
    .replace(/\n\s*<!-- og:start -->[\s\S]*?<!-- og:end -->/, '')
    .replace(/\n\s*<meta (?:property="og:[^"]+"|name="twitter:[^"]+") content="[^"]*">/g, '');
  html = html.replace(/(\n\s*<meta name="theme-color"[^>]*>)/, `$1\n${block}`);
  writeFileSync(file, html);
  console.log(`${f}: ${url || '(đường dẫn tương đối)'}`);
}
console.log(base ? '\nXong. Deploy lại rồi kiểm tra bằng https://developers.facebook.com/tools/debug/' : '\nXong (chưa có địa chỉ web).');
