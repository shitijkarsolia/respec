#!/usr/bin/env bash
# Trim the lead-in (browser launch + navigation) from each raw webm and re-encode
# to a seekable 30fps H.264 mp4 sized for the composition, speeding each clip up so
# the whole composition lands under 30s. Args per clip: START DUR SPEED.
set -e
FF="$(node -e "console.log(require('@ffmpeg-installer/ffmpeg').path)")"
RAW="${RAWDIR:-assets/raw-light}"
OUT="${OUTDIR:-assets}"
mkdir -p "$OUT"

enc() { # name start dur speed  (start/dur are INPUT-time; output dur = dur/speed)
  local name=$1 start=$2 dur=$3 speed=${4:-1.0}
  "$FF" -hide_banner -loglevel error -y \
    -ss "$start" -t "$dur" -i "$RAW/$name.webm" \
    -vf "setpts=PTS/${speed},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p" \
    -r 30 -c:v libx264 -preset medium -crf 19 -g 30 -keyint_min 15 -an -movflags +faststart \
    "$OUT/$name.mp4"
  echo "  $name.mp4  ($("$FF" -hide_banner -loglevel error -i "$OUT/$name.mp4" -f null - 2>&1 | grep -oE 'time=[0-9:.]+' | tail -1))"
}

# name      start  dur   speed
enc home    1.7    3.8   1.30
enc reveal  1.2    6.5   1.95
enc trace   4.0    6.5   1.95
enc rail    3.5    5.7   1.90
enc review  2.5    20.0  1.75
echo "conversion done"
