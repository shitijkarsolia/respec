#!/usr/bin/env bash
# Trim the lead-in (browser launch + navigation) from each raw webm and re-encode
# to a seekable 30fps H.264 mp4 sized for the composition. Args per clip: START DUR.
set -e
FF="$(node -e "console.log(require('@ffmpeg-installer/ffmpeg').path)")"
RAW=assets/raw
OUT=assets
mkdir -p "$OUT"

enc() { # name start dur
  local name=$1 start=$2 dur=$3
  "$FF" -hide_banner -loglevel error -y \
    -ss "$start" -t "$dur" -i "$RAW/$name.webm" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p" \
    -c:v libx264 -preset medium -crf 19 -g 30 -keyint_min 15 -an -movflags +faststart \
    "$OUT/$name.mp4"
  echo "  $name.mp4  ($("$FF" -hide_banner -loglevel error -i "$OUT/$name.mp4" -f null - 2>&1 | grep -oE 'time=[0-9:.]+' | tail -1))"
}

# name        start  dur
enc home       2.0    4.6
enc reveal     1.0    5.6
enc trace      4.3    5.6
enc rail       4.2    4.6
enc review     "${REVIEW_START:-4.2}" "${REVIEW_DUR:-18.2}"
echo "conversion done"
