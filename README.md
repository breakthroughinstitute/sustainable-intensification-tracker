# U.S. Sustainable Intensification Tracker

This folder contains the responsive, dependency-light visualization for the Breakthrough Institute's sustainable-intensification article.

## Features

- Responsive HTML/SVG charts with touch-friendly and keyboard-accessible navigation.
- One embed that adapts to the available width on desktop and mobile.
- A compact, high-contrast topic picker replaces horizontal tab scrolling on narrow screens.
- Units in axis labels and tooltips; latest values replace misleading endpoint percentage changes for adoption, hypoxia, and groundwater.
- Compact Sources disclosures keep each chart's citations available by click, tap, or keyboard without filling the page with long link lists.
- Zero-based y-axes throughout.
- Editorial context on impact topics where it helps interpret the charts.
- A Practices & technology tab with four charts visible together: GE seed, soil cover and tillage, western irrigation methods, and combined precision/nutrient/water-management tools. The no-till legend names its dashed CTIC/USGS and solid Census segments. The combined technology chart uses corn ARMS trends through 2021, two NRCS cultivated-cropland survey-period estimates, and national soil-moisture sensing shares of irrigating farms.
- Gulf mid-summer hypoxic area (1985–2026) as annual bars in Nitrogen, overlaid with a five-survey rolling average and the Task Force goal; there are no bars in the two unsurveyed years. Water includes a 13-point High Plains aquifer water-level trend (1980–2019).
- A single indexed overview compares farm output, total factor productivity, land input, water withdrawals, and direct agricultural emissions.
- Direct agricultural greenhouse gas emissions through 2023, with EPA inventory-source and economic-activity detail through 2022.
- Cropland nitrogen balance and nitrogen-use efficiency through 2023 using FAOSTAT.
- Product-level emissions intensities through 2023 using FAOSTAT.
- A "By product" matrix of annualized within-study percentage changes across greenhouse gases, land, water, energy, and derived crop soil loss per unit of output. Darker cells mark faster reductions. Hover, focus, or tap a cell for years, endpoint values, study units with spelled-out product bases where helpful, total change, and sources. Earlier chicken comparisons are available in the relevant cell details.
- Compact product-study percentage-change bars in Land and Water; Nitrogen groups crop fertilizer input with explicitly labeled beef, milk and chicken nitrogen-related impacts. Climate has an optional collapsed study panel, where annual FAOSTAT product lines are already shown.
- A Total / Per year toggle in topic-specific product study cards. The By product matrix always uses equivalent compound annual rates between endpoints, not observed annual time series.
- Updated cropland soil-erosion rates through 2022 using the 2022 National Resources Inventory summary, with Field to Market reference-year trends for corn grain, cotton, soybeans, and wheat displayed separately.
- Public agricultural and food R&D through 2021, split into two reconciling performer categories, plus spending as a share of BEA gross farm value added. The NCSES university agricultural-sciences funding series is retained in the data but its card is temporarily hidden at the user’s request. An additional NCSES federal agricultural R&D budget chart covers 2000–2026, distinguishing preliminary and proposed funding.
- Long-run land, water, and herbicide series retained where newer national data are not directly comparable.

## Current data boundaries

| Topic | Latest year | Status |
|---|---:|---|
| Farm output, inputs, productivity | 2023 | Updated official series |
| Direct agricultural GHG emissions | 2023 | EPA inventory |
| Detailed agricultural GHG categories | 2022 | EPA Inventory Data Explorer; inventory- and economic-sector views use different accounting boundaries |
| Cropland nitrogen balance and efficiency | 2023 | FAOSTAT |
| Gulf hypoxic area | 2026 | EPA/LUMCON and NOAA/LUMCON; mid-summer survey, not annual mean; nitrogen and phosphorus plus weather contribute |
| GE seed adoption | 2025 | USDA ERS; percent of each eligible crop's planted acres |
| Cover crops and tillage | 2022 | Census of Agriculture; different eligible-acre bases explained in chart and source ledger |
| Enhanced-efficiency fertilizer and variable-rate technology | 2013–16 | NRCS CEAP survey-period estimates, not current adoption |
| Corn yield mapping and auto-steer | 2021 | USDA ARMS crop-acre trends, extended with McFadden et al. (2024) conference results; 2023 soybean observations are archived separately |
| Western irrigation methods | 2023 | USDA ERS/NASS, 17 western states; acreage by method, with published pressurized-adoption shares in the chart note |
| Soil-moisture sensing | 2023 | USDA NASS irrigation surveys; share of irrigating farms, unlike other acreage-based precision series |
| High Plains groundwater decline | 2019 | USGS regional area-weighted water-level series, not a national storage estimate |
| Product-level GHG intensity | 2023 | FAOSTAT |
| Cropland erosion rates | 2022 | Updated official series |
| Crop-specific soil loss per acre and derived loss per output | 2020 reference year | Field to Market published smoothed trend estimates; 2020 uses USDA erosion-model inputs through 2017 |
| Public agricultural and food R&D | 2021 | USDA ERS; BEA gross farm value added for intensity |
| University agricultural-sciences funding (card hidden) | 2024 | NCSES HERD public-use data, 2010–2024; constant 2022 dollars using NIH BRDPI; 2016 definition break; not the full public R&D total |
| Federal agricultural R&D budget | 2026 proposed | NCSES GBARD agriculture objective, 2000–2026; budget authority plus capital R&D, constant 2022 dollars; 2025 preliminary, 2026 proposed |
| Published product-study comparisons | 2010–2022, depending on study | Separate retrospective study endpoints; periods, product bases, and accounting boundaries vary |
| Land use by crop | 2017 | FAOSTAT; cotton lint intensity from USDA NASS historical yields |
| Water withdrawals | 2015 | Comparable national series; a 2020 modeled estimate is noted separately |
| Herbicide hazard quotients | 2015 | Published research series |

## Files

- `index.html` — embed entry point
- `styles.css` — responsive BTI styling
- `app.js` — interaction and SVG chart rendering
- `data.json` — compact chart data
- `product-studies.json` — curated endpoint comparisons from published studies; source URLs and reported units retained
- `EMBED.md` — recommended iframe and responsive-height code
- `NETLIFY.md` — current local link and recommended continuous-deployment setup
- `page-copy.md` — suggested replacement text for the article page

No package installation is required. The live review site is
[bti-agriculture-tracker-review-2026.netlify.app](https://bti-agriculture-tracker-review-2026.netlify.app/).
Netlify publishes the `main` branch of the
[BTI GitHub repository](https://github.com/breakthroughinstitute/sustainable-intensification-tracker)
using `sh build.sh` and the allowlisted `dist/` output. See [NETLIFY.md](NETLIFY.md)
for the publishing workflow. A local edit appears on the site after it is
committed and pushed to GitHub.

## Local preview

On a Mac, double-click `preview.command` in this folder. It opens the tracker in your browser; keep the Terminal window open while previewing, and refresh the browser after editing `app.js`. Opening `index.html` directly from Finder will not load the charts because browsers block its local JSON data requests.

The study comparison charts are descriptive within each study. Study periods and accounting boundaries differ. Beef blue water, milk total modeled water, chicken water consumption, egg direct farm water, and crop irrigation water are not equivalent. The crop fertilizer-nitrogen intensities are not nitrogen surplus, and their 2024 endpoints are fitted trend estimates. Beef reactive N loss, milk N leaching, and chicken marine eutrophication potential are different measures and are not directly comparable with crop fertilizer input or each other. The newer chicken technical report is the selected comparison for Climate, Land, Water, and Nitrogen; the older 1965–2010 study remains available in the relevant By product cell details. Do not join the two chicken studies into a 1965–2020 trend: the newer report rebuilt its 2010 baseline, and its land and water measures differ from the older study. Energy retains the older fossil-energy result because the newer report uses a different fossil-resource metric. The study charts are separate from the annual FAOSTAT direct-production estimates in Climate. The local research packet in `research/` holds the underlying transcriptions and caveats, including a product-study audit dated 2026-09-23.
