#!/bin/sh

# from screenshots folder, ../make-screenshots.sh *.jpg

mkdir -p 3.5
mkdir -p 4.0
mkdir -p 4.7
mkdir -p 5.5
mkdir -p ipad

for base in "$@"
do
  dest=${base//jpg/png}

  echo $base

  convert "$base" -resize 640x960!     3.5/"$dest"
  convert "$base" -resize 640x1136!    4.0/"$dest"
  convert "$base" -resize 750x1334!    4.7/"$dest"
  convert "$base" -resize 1242x2208!   5.5/"$dest"
  convert "$base" -resize 768x1024!   ipad/"$dest"
done
