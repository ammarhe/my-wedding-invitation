#!/usr/bin/env bash
# Downloads the full-resolution theme artwork and the original background track
# from the reference invitation into client/public/theme.
# Run this once from the project root on a machine with normal internet access:
#   bash scripts/fetch-assets.sh
set -euo pipefail
cd "$(dirname "$0")/../client/public/theme"

BASE="https://chungdoi.com/images/themes/minimalism-dark-red"
for f in castle-background envelope-background envelope-cover flower2-decoration paper papernote-background; do
  echo "→ $f.webp"
  curl -fsSL -o "$f.webp" "$BASE/$f.webp"
done

echo "→ photo.webp (couple photo from the reference)"
curl -fsSL -o photo.jpg "https://cdn.chungdoi.com/uploads/0ca4c625-5c65-4207-a380-ec6205d76d96.jpg" && \
  { command -v cwebp >/dev/null && cwebp -q 85 photo.jpg -o photo.webp >/dev/null && rm photo.jpg || mv photo.jpg photo.webp; }

echo "→ music.mp3 (original background track)"
curl -fsSL -o music.mp3 "https://cdn.chungdoi.com/music/yt-4f27e557-fc2.mp3"

echo
echo "Done. Files are in client/public/theme/."
echo "To use the track: open the dashboard → Music → paste  /theme/music.mp3  as the audio URL (or upload your own)."
