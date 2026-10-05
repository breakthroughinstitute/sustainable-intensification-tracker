#!/bin/sh
set -eu

# Build an explicit allowlist so source material never enters the public deploy.
rm -rf dist
mkdir -p dist/assets
cp index.html app.js styles.css data.json product-studies.json text-edits.json biotech-decisions.json biotech-records.csv biotech-epa-events.csv dist/
cp assets/bti-logo.png dist/assets/
