# Đóng gói website thành file .zip để nộp. Giải nén rồi mở index.html là xem được, không cần mạng.
# Tên file theo quy định nộp bài của lớp: [Mã lớp]_[Tên bài]_[Nhóm số].
#   powershell -ExecutionPolicy Bypass -File tools/make-zip.ps1
#   powershell -ExecutionPolicy Bypass -File tools/make-zip.ps1 -Name 261LLCT220514_06_Web_Nhom3 -SiteUrl https://baitaplsdnhom03.vercel.app
# File zip nằm ở thư mục "Nop bai" (cạnh thư mục web). Các file "<Name>_BangThongTinNhom.*" trong thư mục đó
# được tự động đặt vào gốc file zip; thêm file khác bằng -Include.
param(
  [string]$Name = '261LLCT220514_06_Web_Nhom3',
  [string]$SiteUrl = 'https://baitaplsdnhom03.vercel.app',
  [string]$OutDir = (Join-Path $PSScriptRoot '..\..\Nop bai'),
  [string[]]$Include = @()
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
New-Item -ItemType Directory -Force $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$Out = Join-Path $OutDir "$Name.zip"

node (Join-Path $root 'tools\build-data.mjs')
if ($LASTEXITCODE -ne 0) { throw 'build-data.mjs báo lỗi, dừng đóng gói.' }

$stage = Join-Path ([System.IO.Path]::GetTempPath()) "zip-$([guid]::NewGuid().ToString('N'))"
$dest = Join-Path $stage $Name
New-Item -ItemType Directory -Force $dest | Out-Null
Get-ChildItem $root -Force | Where-Object { $_.Name -notin @('.git', '.vercel', 'node_modules') -and -not $_.Name.StartsWith('_') } |
  ForEach-Object { Copy-Item $_.FullName -Destination $dest -Recurse -Force }

# Bảng thông tin nhóm (bắt buộc theo thông báo nộp bài) + file thêm
$extra = @(Get-ChildItem $OutDir -File -Filter "$($Name)_BangThongTinNhom.*" | ForEach-Object { $_.FullName }) + $Include
foreach ($f in $extra) { Copy-Item (Resolve-Path $f).Path -Destination $dest -Force; "  + $(Split-Path $f -Leaf)" }
if (-not ($extra | Where-Object { $_ -match 'BangThongTinNhom' })) { Write-Warning "Chưa có Bảng thông tin nhóm ($($Name)_BangThongTinNhom.pdf) trong $OutDir" }

if ($SiteUrl) {
  "[InternetShortcut]`r`nURL=$SiteUrl`r`n" | Set-Content -Encoding ASCII (Join-Path $dest 'Mo-website-truc-tuyen.url')
}
$online = if ($SiteUrl) { "BẢN TRỰC TUYẾN: $SiteUrl  (hoặc bấm đúp file Mo-website-truc-tuyen.url)" } else { 'BẢN TRỰC TUYẾN: (xem file thuyết minh)' }
@"
14 KỲ ĐẠI HỘI ĐẢNG CỘNG SẢN VIỆT NAM — Website
Môn Lịch sử Đảng Cộng sản Việt Nam · GVHD: ThS. Lê Quang Chung · Trường Đại học Công nghệ Kỹ thuật TP.HCM
Lớp: 06_UTExMOOC · Mã lớp: 261LLCT220514_06 · Nhóm số: 3

$online

NHÓM THỰC HIỆN
- Lý Văn Hữu Hòa      MSSV 24162038   Lập trình và triển khai website, điều phối nhóm
- Hồ Nguyễn Hương Vy  MSSV 24156149   Thiết kế giao diện
- Lê Quang Minh       MSSV 24162072   Nội dung và ảnh Đại hội I → VII
- Võ Minh Hòa         MSSV 24161247   Nội dung và ảnh Đại hội VIII → XIV
- Chu Trung Kiên      MSSV 24149175   File thuyết minh và danh mục nguồn
(Bảng thông tin nhóm: file $($Name)_BangThongTinNhom.pdf trong thư mục này.)

CÁCH XEM BẢN OFFLINE
1. Giải nén toàn bộ file .zip.
2. Mở file index.html bằng Chrome, Edge hoặc Cốc Cốc (bấm đúp hoặc kéo thả vào trình duyệt).
   Website chạy được cả khi không có mạng.

Mã nguồn: các file .html, thư mục assets (giao diện, dữ liệu, ảnh, phông chữ), content (file dữ liệu gốc), tools (công cụ build).
"@ | Set-Content -Encoding UTF8 (Join-Path $dest 'HUONG-DAN-XEM.txt')

if (Test-Path $Out) { Remove-Item $Out -Force }
# Tự ghi từng mục với dấu "/": Compress-Archive và ZipFile của PowerShell 5.1 ghi "\" nên giải nén trên Mac/phần mềm khác bị lỗi.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($Out, [System.IO.FileMode]::Create)
$za = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $dest -Recurse -File | ForEach-Object {
    $rel = $Name + '/' + $_.FullName.Substring($dest.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($za, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
  }
} finally { $za.Dispose(); $fs.Dispose() }
Remove-Item $stage -Recurse -Force
"Đã tạo: $Out ($([math]::Round((Get-Item $Out).Length / 1MB, 2)) MB)"
