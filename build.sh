#!/bin/sh
set -eu

# Build an explicit allowlist so source material never enters the public deploy.
rm -rf dist
mkdir -p dist/assets
cp index.html app.js styles.css data.json product-studies.json text-edits.json biotech-decisions.json biotech-records.csv biotech-epa-events.csv fda-consultations.csv fda-consultations-annual.csv fda-premarket-meetings.csv rd-federal-spending.csv rd-source-comparison.csv rd-gateway-annual-totals.csv rd-reported-support-comparison.csv livestock-productivity.csv dist/
cp assets/bti-logo.png dist/assets/
cp rd-spending-public-series.csv rd-herd-all-sources.csv rd-spending-methods.txt dist/

cp rd-updated-sources.json rd-funding-components.csv rd-funding-totals.csv rd-performer-expenditures.csv rd-performer-components.csv rd-performer-history.csv rd-nonusda-source-comparison.csv rd-updated-methods.txt dist/

cp rd-funding-drilldowns.csv rd-performer-usda-detail.csv dist/
