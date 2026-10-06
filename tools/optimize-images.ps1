# Tạo 3 cỡ ảnh cho web từ thư mục ảnh gốc (mặc định: ../web-data/img).
#   assets/img/full/   cạnh dài tối đa 1600 px, nén lại nếu file > 300 KB
#   assets/img/thumb/  rộng 720 px  (thẻ trên trục thời gian, trang so sánh)
#   assets/img/mini/   rộng 320 px  (ảnh ghép ở trang chủ, nút kỳ trước/sau)
# Chạy trên Windows:  powershell -ExecutionPolicy Bypass -File tools/optimize-images.ps1
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\..\web-data\img'),
  [string]$Out = (Join-Path $PSScriptRoot '..\assets\img')
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg([System.Drawing.Image]$img, [string]$path, [long]$quality) {
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, $quality)
  $img.Save($path, $jpegCodec, $params)
  $params.Dispose()
}

function Resize([System.Drawing.Image]$img, [int]$width, [int]$height) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $bmp.SetResolution(72, 72)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingQuality = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.PixelOffsetMode = 'HighQuality'
  $attr = New-Object System.Drawing.Imaging.ImageAttributes
  $attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $width, $height), 0, 0, $img.Width, $img.Height, 'Pixel', $attr)
  $attr.Dispose(); $g.Dispose()
  return $bmp
}

foreach ($dir in 'full', 'thumb', 'mini') { New-Item -ItemType Directory -Force (Join-Path $Out $dir) | Out-Null }

$files = Get-ChildItem $Source -File | Where-Object { $_.Extension -match '^\.(jpe?g|png)$' }
if (-not $files) { throw "Không thấy ảnh trong $Source" }

foreach ($f in $files) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($f.Name) + '.jpg'
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  try {
    # Bản đầy đủ: giữ nguyên nếu đã là JPEG nhỏ gọn, ngược lại thu về 1600 px và nén.
    $full = Join-Path $Out "full\$name"
    $longSide = [Math]::Max($img.Width, $img.Height)
    if ($f.Extension -match 'jpe?g' -and $longSide -le 1600 -and $f.Length -le 300KB) {
      Copy-Item $f.FullName $full -Force
    } else {
      $scale = [Math]::Min(1.0, 1600.0 / $longSide)
      $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
      $b = Resize $img $w $h
      $q = 82
      do { Save-Jpeg $b $full $q; $q -= 6 } while ((Get-Item $full).Length -gt 300KB -and $q -ge 58)
      $b.Dispose()
    }
    foreach ($size in @(@{ dir = 'thumb'; w = 720; q = 80 }, @{ dir = 'mini'; w = 320; q = 76 })) {
      $w = [Math]::Min($size.w, $img.Width)
      $h = [int]([double]$img.Height * $w / $img.Width)
      $b = Resize $img $w $h
      Save-Jpeg $b (Join-Path $Out "$($size.dir)\$name") $size.q
      $b.Dispose()
    }
    $kb = [Math]::Round((Get-Item $full).Length / 1KB)
    "{0,-10} {1,5}x{2,-5} full {3,4} KB" -f $name, $img.Width, $img.Height, $kb
  } finally { $img.Dispose() }
}
