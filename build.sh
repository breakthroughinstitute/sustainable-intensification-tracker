#!/bin/sh
set -eu

# Build an explicit allowlist so source material never enters the public deploy.
rm -rf dist
mkdir -p dist/assets
cp index.html app.js styles.css data.json product-studies.json dist/
cp assets/bti-logo.png dist/assets/
