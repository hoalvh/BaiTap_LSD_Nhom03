# Đóng gói website thành file .zip để nộp. Giải nén rồi mở index.html là xem được, không cần mạng.
#   powershell -ExecutionPolicy Bypass -File tools/make-zip.ps1 -SiteUrl https://ten-du-an.vercel.app
param(
  [string]$SiteUrl = '',
  [string]$Out = (Join-Path $PSScriptRoot '..\..\Nhom3-Web-14-ky-Dai-hoi-Dang.zip')
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$name = 'Nhom3-Web-14-ky-Dai-hoi-Dang'

node (Join-Path $root 'tools\build-data.mjs')
if ($LASTEXITCODE -ne 0) { throw 'build-data.mjs báo lỗi, dừng đóng gói.' }

$stage = Join-Path ([System.IO.Path]::GetTempPath()) "zip-$([guid]::NewGuid().ToString('N'))"
$dest = Join-Path $stage $name
New-Item -ItemType Directory -Force $dest | Out-Null
Get-ChildItem $root -Force | Where-Object { $_.Name -notin @('.git', '.vercel', 'node_modules') -and -not $_.Name.StartsWith('_') } |
  ForEach-Object { Copy-Item $_.FullName -Destination $dest -Recurse -Force }

$online = if ($SiteUrl) { "Bản trực tuyến: $SiteUrl" } else { 'Bản trực tuyến: (xem file thuyết minh)' }
@"
14 KỲ ĐẠI HỘI ĐẢNG CỘNG SẢN VIỆT NAM — Website
Nhóm 3 · Lớp 06_UTExMOOC · Môn Lịch sử Đảng Cộng sản Việt Nam (mã môn 261LLCT220514_06) · GVHD: ThS. Lê Quang Chung · HCMUTE

NHÓM THỰC HIỆN
- Lý Văn Hữu Hòa      MSSV 24162038   Lập trình và triển khai website, điều phối nhóm
- Hồ Nguyễn Hương Vy  MSSV 24156149   Thiết kế giao diện
- Lê Quang Minh       MSSV 24162072   Nội dung và ảnh Đại hội I → VII
- Võ Minh Hòa         MSSV 24161247   Nội dung và ảnh Đại hội VIII → XIV
- Chu Trung Kiên      MSSV 24149175   File thuyết minh và danh mục nguồn

CÁCH XEM
1. Giải nén toàn bộ file .zip.
2. Mở file index.html bằng Chrome, Edge hoặc Cốc Cốc (bấm đúp hoặc kéo thả vào trình duyệt).
   Website chạy được cả khi không có mạng.
$online

Mã nguồn: các file .html, thư mục assets (giao diện, dữ liệu, ảnh, phông chữ), content (file dữ liệu gốc), tools (công cụ build).
"@ | Set-Content -Encoding UTF8 (Join-Path $dest 'HUONG-DAN-XEM.txt')

if (Test-Path $Out) { Remove-Item $Out -Force }
# Tự ghi từng mục với dấu "/": Compress-Archive và ZipFile của PowerShell 5.1 ghi "\" nên giải nén trên Mac/phần mềm khác bị lỗi.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$outFull = [System.IO.Path]::GetFullPath($Out)
$fs = [System.IO.File]::Open($outFull, [System.IO.FileMode]::Create)
$za = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $dest -Recurse -File | ForEach-Object {
    $rel = $name + '/' + $_.FullName.Substring($dest.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
  }
} finally { $za.Dispose(); $fs.Dispose() }
Remove-Item $stage -Recurse -Force
$full = (Resolve-Path $Out).Path
"Đã tạo: $full ($([math]::Round((Get-Item $full).Length / 1MB, 2)) MB)"
