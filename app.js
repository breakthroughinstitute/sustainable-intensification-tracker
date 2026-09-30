const COLORS = ["#0dc3a8", "#0d4459", "#ee5c36", "#f8b944", "#56a9d5", "#e82269", "#252a2b"];
const panel = document.querySelector("#tracker-panel");
const tooltip = document.querySelector("#tooltip");
let DATA;
let STUDIES;
let CHANGE_MODE = "total";

const sourceLinks = {
  productivity: '<a href="https://ers.usda.gov/data-products/agricultural-productivity-in-the-united-states" target="_blank" rel="noopener">USDA ERS, Agricultural Productivity in the United States</a>',
  epa: '<a href="https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101EZHC.TXT" target="_blank" rel="noopener">EPA, Inventory of U.S. Greenhouse Gas Emissions and Sinks: 1990–2023</a>',
  faostatCrops: '<a href="https://www.fao.org/faostat/en/#data/QCL" target="_blank" rel="noopener">FAOSTAT, Crops and livestock products</a>',
  nass: '<a href="https://quickstats.nass.usda.gov/" target="_blank" rel="noopener">USDA NASS Quick Stats</a>',
  nassCotton: '<a href="https://www.nass.usda.gov/Publications/Todays_Reports/reports/croptr25.pdf" target="_blank" rel="noopener">USDA NASS, historical all-cotton area and yields, pp. 53–54</a>',
  nitrogen: '<a href="https://www.fao.org/faostat/en/#data/ESB" target="_blank" rel="noopener">FAOSTAT, Cropland nutrient balance</a>',
  water: '<a href="https://water.usgs.gov/watuse/data/" target="_blank" rel="noopener">USGS Water Use in the United States</a>',
  herbicide: '<a href="https://doi.org/10.1038/ncomms14865" target="_blank" rel="noopener">Kniss (2017), Nature Communications</a>',
  soil: '<a href="https://www.nrcs.usda.gov/sites/default/files/2026-02/2022NRISummary_Final.pdf" target="_blank" rel="noopener">USDA NRCS, 2022 National Resources Inventory Summary</a>',
  fieldToMarketSoil: '<a href="https://fieldtomarket.org/sites/default/files/wp-media/2021/12/Field-to-Market_2021-National-Indicators-Report_FINAL.pdf" target="_blank" rel="noopener">Field to Market, 2021 National Indicators Report, Tables 1.2.1, 1.4.1, 1.9.1 and 1.11.1</a>',
  faostatEmissions: '<a href="https://www.fao.org/faostat/en/#data/EI" target="_blank" rel="noopener">FAOSTAT, Emissions intensities</a>',
  rd: '<a href="https://ers.usda.gov/data-products/agricultural-and-food-research-and-development-expenditures-in-the-united-states" target="_blank" rel="noopener">USDA ERS, Agricultural and Food R&amp;D Expenditures</a>',
  herd: '<a href="https://ncses.nsf.gov/explore-data/microdata/higher-education-research-development" target="_blank" rel="noopener">NCSES, Higher Education R&amp;D Survey public-use data</a>',
  brdpi: '<a href="https://officeofbudget.od.nih.gov/gbipriceindexes.html" target="_blank" rel="noopener">NIH/BEA, research price index (BRDPI)</a>',
  gbard: '<a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab026.pdf" target="_blank" rel="noopener">NCSES, Federal R&amp;D Funding, Table 26</a>',
  bea: '<a href="https://apps.bea.gov/iTable/?reqid=19&step=3&isuri=1&nipa_table_list=13" target="_blank" rel="noopener">BEA, NIPA Table 1.3.5</a>',
  epaExplorer: '<a href="https://cfpub.epa.gov/ghgdata/inventoryexplorer/" target="_blank" rel="noopener">EPA, Greenhouse Gas Inventory Data Explorer</a>',
  ge: '<a href="https://www.ers.usda.gov/data-products/adoption-of-genetically-engineered-crops-in-the-united-states" target="_blank" rel="noopener">USDA ERS, GE crop adoption</a>',
  censusPractices: '<a href="https://www.nass.usda.gov/Publications/AgCensus/2022/Full_Report/Volume_1%2C_Chapter_2_US_State_Level/st99_2_041_044.pdf" target="_blank" rel="noopener">USDA NASS, Census of Agriculture Table 41</a>',
  censusLand: '<a href="https://data.nass.usda.gov/Publications/AgCensus/2022/Full_Report/Volume_1%2C_Chapter_1_US/st99_1_001_001.pdf" target="_blank" rel="noopener">USDA NASS, Census Table 1</a>',
  ceap: '<a href="https://www.nrcs.usda.gov/sites/default/files/2022-10/Conservation%20Practices%20on%20Cultivated%20Cropland%20A%20Comparison%20of%20CEAP%20I%20and%20CEAP%20II%20Survey%20Data%20and%20Modeling.pdf" target="_blank" rel="noopener">USDA NRCS, CEAP cropland surveys</a>',
  historicTillage: '<a href="https://pubs.usgs.gov/ds/ds573/" target="_blank" rel="noopener">USGS/CTIC historical tillage data</a>',
  precision: '<a href="https://www.ers.usda.gov/publications/105893" target="_blank" rel="noopener">USDA ERS, Precision Agriculture in the Digital Era (EIB-248)</a>',
  precisionUpdate: '<a href="https://mssoy.org/sites/default/files/2025-01/McFADDEN%20%20PA%20PROC%202024.pdf" target="_blank" rel="noopener">McFadden et al. (2024), USDA ARMS Table 6</a>',
  irrigationMethods: '<a href="https://ers.usda.gov/sites/default/files/_laserfiche/Charts/56057/IrrigationSystem2018_d.html" target="_blank" rel="noopener">USDA ERS, western irrigation systems, 1984–2018</a>; <a href="https://www.ers.usda.gov/data-products/chart-gallery/113643" target="_blank" rel="noopener">USDA ERS, 2023 update</a>',
  irrigationSensing: '<a href="https://www.nass.usda.gov/AgCensus/archive/files/2012-Farm-and-Ranch-Irrigation-Survey-fris13_1_022_022.pdf" target="_blank" rel="noopener">USDA NASS, 2013 Table 22</a>; <a href="https://data.nass.usda.gov/Publications/AgCensus/2017/Online_Resources/Farm_and_Ranch_Irrigation_Survey/fris_1_0023_0023.pdf" target="_blank" rel="noopener">2018 Table 23</a>; <a href="https://www.nass.usda.gov/Publications/AgCensus/2022/Online_Resources/Farm_and_Ranch_Irrigation_Survey/fris_1_025_025.pdf" target="_blank" rel="noopener">2023 Table 25</a>',
  hypoxiaGoal: '<a href="https://www.epa.gov/ms-htf/hypoxia-task-force-action-plans-and-goal-framework" target="_blank" rel="noopener">EPA Hypoxia Task Force goal</a>',
  hypoxia: '<a href="https://cfpub.epa.gov/roe/indicator.cfm?i=41" target="_blank" rel="noopener">EPA/LUMCON, 1985–2021</a>; <a href="https://oceanservice.noaa.gov/hazards/hypoxia/" target="_blank" rel="noopener">NOAA/LUMCON, 2022–26 releases</a>',
  aquifer: '<a href="https://ne.water.usgs.gov/ogw/hpwlms/tablewlpre.html" target="_blank" rel="noopener">USGS High Plains series</a>; <a href="https://pubs.usgs.gov/publication/sir20235143" target="_blank" rel="noopener">USGS 2019 report</a>'
};

const NITROGEN_BALANCE = [[1961,14.3557],[1962,16.9587],[1963,17.8207],[1964,20.619],[1965,21.8806],[1966,26.1029],[1967,28.2792],[1968,28.262],[1969,29.234],[1970,33.4466],[1971,30.3379],[1972,32.1923],[1973,35.736],[1974,37.0302],[1975,39.1277],[1976,40.1395],[1977,37.2161],[1978,39.8402],[1979,40.1523],[1980,46.097],[1981,36.8201],[1982,30.7198],[1983,45.5248],[1984,39.8417],[1985,32.9672],[1986,35.2875],[1987,37.8188],[1988,44.9909],[1989,41.1742],[1990,38.8165],[1991,39.8435],[1992,34.5124],[1993,46.1035],[1994,35.7108],[1995,44.3575],[1996,40.9525],[1997,40.3299],[1998,41.2813],[1999,42.1832],[2000,38.6917],[2001,40.4615],[2002,44.8535],[2003,45.0595],[2004,37.5236],[2005,38.2364],[2006,46.7923],[2007,37.8441],[2008,36.3859],[2009,37.9961],[2010,41.3641],[2011,46.4375],[2012,48.2871],[2013,41.3151],[2014,37.9233],[2015,38.6909],[2016,30.761],[2017,37.228],[2018,37.39],[2019,39.1247],[2020,38.6694],[2021,34.764],[2022,41.6844],[2023,35.6041]].map(([year,value]) => ({year,value}));
const NITROGEN_EFFICIENCY = [[1961,62.9419],[1962,59.349],[1963,59.0937],[1964,54.8222],[1965,56.1973],[1966,51.7154],[1967,51.5653],[1968,52.0228],[1969,50.2056],[1970,45.6995],[1971,51.6488],[1972,50.5968],[1973,50.1329],[1974,45.5242],[1975,48.3975],[1976,46.925],[1977,52.2043],[1978,50.574],[1979,53.8191],[1980,46.6345],[1981,56.4154],[1982,61.3733],[1983,43.0903],[1984,52.9423],[1985,59.655],[1986,55.5743],[1987,53.3692],[1988,43.4369],[1989,50.8952],[1990,54.2878],[1991,52.5884],[1992,59.7827],[1993,47.9092],[1994,60.8284],[1995,51.1979],[1996,56.5338],[1997,58.4471],[1998,58.3243],[1999,57.3055],[2000,59.9829],[2001,58.8163],[2002,54.7947],[2003,55.9905],[2004,64.2565],[2005,63.4375],[2006,58.2335],[2007,63.9481],[2008,65.4035],[2009,66.0035],[2010,64.1357],[2011,60.2864],[2012,59.0989],[2013,65.1015],[2014,68.8151],[2015,68.0687],[2016,75.0111],[2017,70.2531],[2018,70.2771],[2019,67.0521],[2020,69.1562],[2021,72.3868],[2022,67.2134],[2023,71.4314]].map(([year,value]) => ({year,value}));

const pct = value => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
const change = values => (values.at(-1).value / values[0].value - 1) * 100;
const single = (name, values) => [{ name, values }];
const format = (value, decimals = 1) => Number(value).toLocaleString("en-US", { maximumFractionDigits: decimals });
const indexToBase = (values, baseYear = 1990) => {
  const base = values.find(d => d.year === baseYear)?.value;
  return base ? values.filter(d => d.year >= baseYear).map(d => ({ year: d.year, value: 100 * d.value / base })) : [];
};
const niceScale = (maxValue, intervals = 4) => {
  const roughStep = Math.max(maxValue * 1.03 / intervals, Number.EPSILON);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(value => value >= fraction) || 10;
  const step = niceFraction * magnitude;
  return { max: step * intervals, ticks: Array.from({ length: intervals + 1 }, (_, index) => step * index) };
};

const PRODUCT_ORDER = ["beef", "dairy", "pork", "chicken", "eggs", "corn", "cotton", "soy", "wheat"];
const PRODUCT_NAMES = { beef: "Beef", dairy: "Milk", pork: "Pork", chicken: "Chicken", eggs: "Eggs", corn: "Corn", cotton: "Cotton", soy: "Soybeans", wheat: "Wheat" };
const STUDY_NAMES = { beef_rotz_2026: "Rotz et al. (2026)", dairy_rotz_2024: "Rotz et al. (2024)", dairy_capper_cady_2020: "Capper and Cady (2020)", pork_putman_2018: "Putman et al. (2018)", poultry_putman_2017: "Putman et al. (2017)", broiler_thoma_putman_2020: "Thoma and Putman (2020 update)", eggs_pelletier_2014: "Pelletier et al. (2014)", crops_fieldtomarket_2021: "Field to Market (2021)", farmdoc_monaco_2025: "Monaco et al. (2025)" };
const STUDY_METRICS = {
  greenhouse_gas: ["greenhouse_gas"],
  land: ["land", "cropland"],
  water: ["water", "blue_water", "irrigation_water", "direct_water", "water_consumption"],
  energy: ["energy", "fossil_energy"],
  fertilizer_n: ["fertilizer_n", "reactive_n_loss", "n_leached", "marine_eutrophication"],
  soil_erosion: ["soil_erosion_output"]
};
const STUDY_METRIC_NAMES = { greenhouse_gas: "Greenhouse gases", land: "Land use", water: "Water use", energy: "Energy use", fertilizer_n: "Fertilizer nitrogen", soil_erosion: "Soil loss/output" };
const MATRIX_METRICS = ["greenhouse_gas", "land", "water", "energy", "soil_erosion"];
const MATRIX_METRIC_NAMES = { greenhouse_gas: "GHGs/output", land: "Land/output", water: "Water/output", energy: "Energy/output", soil_erosion: "Soil loss/output" };
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const studyNumber = value => Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 });
const studyRows = metric => PRODUCT_ORDER.map(product => STUDIES.find(row => row.product === product && row.comparison_role !== "historical" && STUDY_METRICS[metric].includes(row.metric))).filter(Boolean);
const studyPeriod = row => `${row.base_year}–${row.latest_year}`;
const studyChange = row => CHANGE_MODE === "annual" ? (Math.pow(1 + row.change_pct / 100, 1 / (row.latest_year - row.base_year)) - 1) * 100 : row.change_pct;
const studyDelta = row => {
  const value = studyChange(row);
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(CHANGE_MODE === "annual" ? 2 : 1)}%${CHANGE_MODE === "annual" ? "/yr" : ""}`;
};
const changeToggle = () => `<div class="change-mode-control"><span class="change-mode-label">Percentage change</span><div class="change-mode-toggle" role="group" aria-label="Percentage change period"><button type="button" data-change-mode="total" aria-pressed="${CHANGE_MODE === "total"}">Total</button><button type="button" data-change-mode="annual" aria-pressed="${CHANGE_MODE === "annual"}">Per year</button></div></div>`;
function studyDetails(row) {
  const name = PRODUCT_NAMES[row.product];
  const measurement = matrixMeasurement(row);
  const source = /^https:\/\//.test(row.source_url) ? `<a href="${escapeHTML(row.source_url)}" target="_blank" rel="noopener">Open study ↗</a>` : "";
  const measure = row.product === "dairy" && row.metric === "water" ? "Modeled total water use" : { blue_water: "Blue water use", water_consumption: "Water consumption", direct_water: "Direct farm water", irrigation_water: "Irrigation water", cropland: "Feed cropland", fertilizer_n: "Fertilizer nitrogen applied per unit of crop output", reactive_n_loss: "Life-cycle reactive nitrogen lost to air and water", n_leached: "Modeled farm nitrogen leaching below the root zone", marine_eutrophication: "Life-cycle marine eutrophication potential", soil_erosion_output: "Derived soil loss per unit of crop output" }[row.metric];
  const period = CHANGE_MODE === "annual" ? "Compound annual change between study endpoints." : "Total change between study endpoints.";
  return `<div class="study-info"><button type="button" class="study-info-trigger" aria-label="Details for ${name}" aria-expanded="false" title="Study details">i</button><div class="study-popover"><strong>${escapeHTML(STUDY_NAMES[row.study_id] || row.study_id)}</strong>${measure ? `<span>${measure}</span>` : ""}<span>${row.base_year}: ${studyNumber(row.base_value)} → ${row.latest_year}: ${studyNumber(row.latest_value)} ${escapeHTML(measurement.unit)}</span><span>${period}</span>${measurement.basis ? `<span>${escapeHTML(measurement.basis)}</span>` : ""}${row.comparison_note ? `<span>${escapeHTML(row.comparison_note)}</span>` : ""}<span>Periods and methodologies differ across some studies.</span><span>${escapeHTML(row.source_table)}</span>${source}</div></div>`;
}
const matrixRow = (product, metric) => STUDIES.find(row => row.product === product && row.comparison_role !== "historical" && STUDY_METRICS[metric].includes(row.metric));
const annualizedChange = row => (Math.pow(1 + row.change_pct / 100, 1 / (row.latest_year - row.base_year)) - 1) * 100;
const matrixRate = row => `${annualizedChange(row) > 0 ? "+" : "−"}${Math.abs(annualizedChange(row)).toFixed(2)}%`;
function matrixBand(row) {
  if (!row) return "missing";
  const rate = annualizedChange(row);
  if (rate >= 0) return "increase";
  return [0.5, 1, 1.5, 2, 2.5, 3].findIndex(threshold => -rate < threshold) + 1 || 7;
}
function matrixCell(product, metric) {
  const row = matrixRow(product, metric);
  const rate = row ? matrixRate(row) : "—";
  const label = `${PRODUCT_NAMES[product]}, ${STUDY_METRIC_NAMES[metric]}: ${row ? `${rate} annualized change; show study details` : "no selected comparison"}`;
  return `<td><button type="button" class="matrix-cell band-${matrixBand(row)}" data-matrix-cell="${metric}" data-product="${product}" aria-label="${escapeHTML(label)}" aria-expanded="false">${rate}</button></td>`;
}
function matrixMeasurement(row) {
  let unit = row.unit.replaceAll("CO2e", "CO₂e").replaceAll("m2a", "m²·yr").replaceAll("m2", "m²").replaceAll("m3", "m³");
  let basis = "";
  if (row.product === "dairy") unit = unit.replace("FPCM", "fat-and-protein-corrected milk").replace("ECM", "saleable energy-corrected milk");
  if (row.product === "eggs") {
    unit = unit.replace("metric tonne eggs", "metric tonne of table eggs");
    if (row.metric === "direct_water") basis = "Direct farm water only.";
  }
  if (row.product === "corn") unit = unit.replace("/bushel", "/bushel of corn grain");
  if (row.product === "cotton") unit = unit.replace("/lb lint", "/lb of cotton lint");
  if (row.product === "soy") unit = unit.replace("/bushel", "/bushel of soybeans");
  if (row.product === "wheat") unit = unit.replace("/bushel", "/bushel of wheat");
  if (row.product === "beef") basis = "Includes traditional beef and dairy cull cattle.";
  if (row.product === "dairy" && row.metric === "cropland") basis = "Feed cropland only.";
  if (row.product === "chicken") basis = row.comparison_role === "historical" ? "Poultry meat, including spent hens." : "Broilers and culled breeder hens.";
  if (row.product === "chicken" && row.metric === "land") basis += " Crop land impact.";
  return { unit, basis };
}
function matrixDetail(row, metric) {
  if (!row) return `<div class="matrix-detail-row"><p>No selected historical comparison for this measure.</p></div>`;
  const source = /^https:\/\//.test(row.source_url) ? `<a href="${escapeHTML(row.source_url)}" target="_blank" rel="noopener">${escapeHTML(STUDY_NAMES[row.study_id] || row.study_id)} ↗</a>` : escapeHTML(STUDY_NAMES[row.study_id] || row.study_id);
  const measurement = matrixMeasurement(row);
  return `<div class="matrix-detail-row"><div class="matrix-endpoints"><span><small>${row.base_year}</small><b>${studyNumber(row.base_value)}</b></span><span aria-hidden="true">→</span><span><small>${row.latest_year}</small><b>${studyNumber(row.latest_value)}</b></span><em>${pct(row.change_pct)} total</em></div><p>${escapeHTML(measurement.unit)}</p>${measurement.basis ? `<p>${escapeHTML(measurement.basis)}</p>` : ""}${row.comparison_note ? `<details class="matrix-method"><summary>Method note</summary><p>${escapeHTML(row.comparison_note)}</p></details>` : ""}<p class="matrix-source">${source}${row.source_table ? ` · ${escapeHTML(row.source_table)}` : ""}</p></div>`;
}
function matrixPopoverContent(product, metric) {
  const name = PRODUCT_NAMES[product];
  const older = product === "chicken" ? STUDIES.find(row => row.comparison_role === "historical" && STUDY_METRICS[metric].includes(row.metric)) : null;
  return `<div class="matrix-popover-head"><h3>${name} · ${STUDY_METRIC_NAMES[metric]}</h3><button type="button" class="matrix-popover-close" aria-label="Close details">×</button></div>${matrixDetail(matrixRow(product, metric), metric)}${older ? `<details class="matrix-earlier"><summary>Earlier chicken comparison</summary>${matrixDetail(older, metric)}<p>Similar methods, but separate study. Estimately not entirely comparable.</p></details>` : ""}`;
}
let matrixAnchor = null;
let matrixPinned = false;
let matrixHideTimer;
function closeMatrixPopover() {
  clearTimeout(matrixHideTimer);
  matrixAnchor?.setAttribute("aria-expanded", "false");
  matrixAnchor = null;
  matrixPinned = false;
  panel.querySelector(".matrix-popover")?.remove();
}
function positionMatrixPopover(anchor, popover) {
  const rect = anchor.getBoundingClientRect();
  const width = popover.getBoundingClientRect().width;
  const height = popover.getBoundingClientRect().height;
  popover.style.left = `${Math.max(10, Math.min(window.innerWidth - width - 10, rect.left))}px`;
  const below = window.innerHeight - rect.bottom;
  popover.style.top = `${below >= Math.min(height, 250) || below >= rect.top ? Math.min(window.innerHeight - height - 10, rect.bottom + 7) : Math.max(10, rect.top - height - 7)}px`;
}
function openMatrixPopover(anchor, pinned = false) {
  clearTimeout(matrixHideTimer);
  if (matrixAnchor === anchor && matrixPinned && !pinned) return;
  if (matrixAnchor !== anchor) closeMatrixPopover();
  matrixAnchor = anchor;
  matrixPinned = pinned;
  anchor.setAttribute("aria-expanded", "true");
  let popover = panel.querySelector(".matrix-popover");
  if (!popover) {
    popover = document.createElement("div");
    popover.className = "matrix-popover";
    popover.id = "matrix-details";
    popover.addEventListener("pointerenter", () => clearTimeout(matrixHideTimer));
    popover.addEventListener("pointerleave", () => { if (!matrixPinned) matrixHideTimer = setTimeout(closeMatrixPopover, 140); });
    panel.append(popover);
  }
  popover.innerHTML = matrixPopoverContent(anchor.dataset.product, anchor.dataset.matrixCell);
  positionMatrixPopover(anchor, popover);
}
function renderProducts() {
  closeMatrixPopover();
  panel.innerHTML = `<div class="panel-lead"><h2>Explore changes in product footprints</h2><p>Annualized change in resource use or impact per unit of product.</p></div><div class="matrix-wrap"><table class="product-matrix"><caption>Annualized change in per-unit product footprints, not total sector impacts</caption><thead><tr><th scope="col">Product</th>${MATRIX_METRICS.map(metric => `<th scope="col">${MATRIX_METRIC_NAMES[metric]}</th>`).join("")}</tr></thead><tbody>${PRODUCT_ORDER.map(product => `<tr class="${product === "corn" ? "matrix-crops-start" : ""}"><th scope="row">${PRODUCT_NAMES[product]}</th>${MATRIX_METRICS.map(metric => matrixCell(product, metric)).join("")}</tr>`).join("")}</tbody></table></div><p class="product-boundary">Rates are compound annual changes between study endpoints. Crop soil loss per unit of output is derived from Field to Market's soil loss per acre and planted acres per unit of output. Its 2020 soil-loss figure is the report’s published smoothed trend estimate, using USDA erosion-model inputs through 2017. Select a cell for values, methods and sources.</p>`;
}
function studyBarRows(metric) {
  const rows = studyRows(metric);
  const maxChange = Math.max(...rows.map(row => Math.abs(studyChange(row))), 0.01);
  const nitrogenLabels = { fertilizer_n: "Fertilizer N applied", reactive_n_loss: "Reactive N loss", n_leached: "N leached", marine_eutrophication: "Marine eutrophication" };
  const bar = row => `<div class="product-bar-row ${metric === "fertilizer_n" ? "nitrogen-product-bar" : ""}"><div class="product-bar-name"><strong>${PRODUCT_NAMES[row.product]}</strong><small>${studyPeriod(row)}</small></div><div class="product-bar-track" role="img" aria-label="${PRODUCT_NAMES[row.product]}, ${nitrogenLabels[row.metric] || STUDY_METRIC_NAMES[metric]}, ${studyPeriod(row)}: ${studyDelta(row)}"><span class="${studyChange(row) > 0 ? "increase" : ""}" style="width:${Math.max(2, Math.abs(studyChange(row)) / maxChange * 100)}%"></span></div><strong class="product-bar-value">${studyDelta(row)}</strong>${studyDetails(row)}</div>`;
  return rows.map(bar).join("");
}
function studyBars(metric) {
  // EDIT PRODUCT CARD TITLES HERE. Keep each key so its tab can find the title.
  const titles = {
    land: "Land-use intensity by product",
    water: "Water-use intensity by product",
    greenhouse_gas: "Life-cycle emissions intensity by product",
    fertilizer_n: "Nitrogen-related measures per unit of product"
  };
  return `<details class="product-evidence" ${metric === "greenhouse_gas" ? "" : "open"}><summary>${titles[metric]}</summary><div class="product-evidence-controls">${changeToggle()}<button type="button" class="product-explore-link">Explore all measures →</button></div><div class="product-bars">${studyBarRows(metric)}</div></details>`;
}

// EDIT TAB AND CHART COPY HERE.
// Each tab has a title and optional intro, why, and happened text. Blank optional
// text is omitted. Within charts, title is the card heading (set "" to omit);
// subtitle is the small line beneath it (delete or set "" to omit). yLabel and
// tooltipUnit describe the numbers and should stay in place.
// caption controls the note above a chart legend: omit it to use the default,
// set caption: "" to hide it, or write your own text. Source is the line below
// the legend; set source: "" to hide it, but keep citations with published data.
// For charts with views, edit the card title outside views and each button label,
// subtitle, caption, and source inside its view. Inline series.name values are
// legend labels; names in DATA come from data.json.
const DEFAULT_CHART_CAPTION = "Percent change from first to latest available year";
const TOPICS = {
  overview: () => ({
    title: "Output is decoupling from resource use and impacts",
    intro: "The environmental impacts of the U.S. food system are enormous. Agriculture covers 40% of U.S. land and accounts for approximately 80% of consumptive water use. However these impacts are large due to the scale of agricultural production. U.S. farmers produce more than any other country besides India and China and twice as much as they did in 1970.<br><br>Taking into account production levels, U.S. agriculture's environmental performance has improved by most measures, following the trajectory of sustainable intensification. The environmental intensity of agriculture—the resource use or environmental impacts per unit of production—has fallen nearly across the board. In some cases total impacts have declined; in others rising impacts have been far outpaced by increasing production.",
    charts: [
      {
        title: "Agricultural output, inputs, and impacts",
        yLabel: "Index (1990 = 100)",
        tooltipUnit: "",
        // Overview-only axis range and hover target size.
        yMin: 80,
        yMax: 160,
        yTicks: [80, 100, 120, 140, 160],
        pointRadius: 6,
        series: [
          { name: "Farm output", values: DATA.overview.output },
          { name: "Total factor productivity", values: DATA.overview.tfp },
          { name: "Direct GHG emissions", values: indexToBase(DATA.overview.ghg) },
          { name: "Water withdrawals", values: indexToBase(DATA.water.total) },
          { name: "Land use", values: DATA.overview.land || [] }
        ].filter(series => series.values.length),
        source: `${sourceLinks.productivity}; ${sourceLinks.epa}; ${sourceLinks.water}`,
        decimals: 0
      }
    ]
  }),
  land: () => ({
    title: "Rising yields have slowed cropland expansion",
    intro: "",
    why: "Farmland covers roughly two-fifths of the United States. Rising yields can reduce pressure to convert forests, grasslands, and other habitats, leaving more room for biodiversity and carbon storage.",
    happened: "For decades, yields of major crops have steadily risen. Total acreage of some crops like soy has expanded, but far more land conversion would have been needed without yield growth.",
    charts: [
      {
        title: "Land-use intensity",
        subtitle: "Harvested area per ton of crop; cotton refers to lint",
        yLabel: "Hectares per metric ton",
        tooltipUnit: "hectares per metric ton",
        series: DATA.land.intensity.filter(d => d.name !== "Rice"),
        source: `${sourceLinks.faostatCrops}; ${sourceLinks.nassCotton}`,
        decimals: 2
      },
      {
        title: "Planted area",
        subtitle: "",
        yLabel: "Million acres",
        tooltipUnit: "million acres",
        series: DATA.land.area,
        source: `${sourceLinks.nass}; ${sourceLinks.nassCotton}`,
        decimals: 0
      }
    ]
  }),
  nitrogen: () => ({
    title: "Nitrogen efficiency improved, but Gulf hypoxia persists",
    intro: "",
    why: "Nitrogen not taken up by crops can contribute to nitrous oxide emissions, drinking-water contamination, and algal blooms. In the Gulf, nutrient-fueled blooms can drain oxygen from bottom waters, creating a summer dead zone where aquatic life struggles to survive. Higher nitrogen-use efficiency and lower nitrogen surpluses reduce these losses without reducing production.",
    happened: "Nitrogen surplus—the nitrogen added to cropland but not removed in crops—rose sharply through the 1970s before plateauing. Nitrogen-use efficiency reached 71 percent in 2023. The Gulf dead zone varies widely from year to year; its 2022–26 five-survey average was 3,754 square miles, above the Task Force's goal of less than about 1,930 square miles. Nitrogen loading is the strongest single predictor of the surveyed area, while phosphorus, river flow, and weather also matter.",
    charts: [
      {
        title: "Cropland nitrogen surplus",
        subtitle: "N inputs minus N removed in crops",
        yLabel: "Kilograms N per hectare",
        tooltipUnit: "kilograms N per hectare",
        series: single("Nitrogen surplus", NITROGEN_BALANCE),
        source: sourceLinks.nitrogen,
        decimals: 1
      },
      {
        title: "Nitrogen-use efficiency",
        subtitle: "Share of nitrogen inputs removed in crops",
        yLabel: "Percent",
        tooltipUnit: "%",
        series: single("Nitrogen-use efficiency", NITROGEN_EFFICIENCY),
        source: sourceLinks.nitrogen,
        decimals: 1
      },
      {
        title: "Gulf dead zone area",
        subtitle: "Mid-summer area with bottom-water oxygen below 2 mg/L",
        yLabel: "Square miles",
        tooltipUnit: "square miles",
        type: "bar",
        series: single("Measured area", DATA.nitrogen.hypoxia),
        rollingSeries: { name: "Last five surveyed summers", values: DATA.nitrogen.hypoxia_average },
        goalValue: 5000 / 2.589988110336,
        summaryMode: "latest",
        fullWidth: true,
        caption: "Bars are annual surveys; the line averages the latest five surveyed summers (skipping missing 1989 and 2016). Dashed goal: below about 1,930 square miles for a five-survey average. The latest mean, 2022–26, is 3,754 square miles.",
        source: `${sourceLinks.hypoxia}; ${sourceLinks.hypoxiaGoal}`,
        decimals: 0
      }
    ]
  }),
  water: () => ({
    title: "Water intensity improved while a major aquifer declined",
    intro: "",
    why: "Agriculture is the largest consumer of water in the United States. Reducing water use per unit of output can ease pressure on rivers and aquifers, especially in water-scarce regions.",
    happened: "Combined irrigation and livestock withdrawals rose 7.5 percent from 1960 to 2015 while agricultural output grew substantially. Withdrawals per unit of farm output fell by more than half. The High Plains aquifer's average water level was 16.5 feet below its predevelopment level in 2019, with much deeper local declines.",
    charts: [
      {
        title: "Agricultural water withdrawals",
        subtitle: "Irrigation plus livestock",
        yLabel: "Billion gallons per day",
        tooltipUnit: "billion gallons per day",
        series: single("Withdrawals", DATA.water.total),
        source: sourceLinks.water,
        decimals: 0
      },
      {
        title: "Water-withdrawal intensity",
        subtitle: "Withdrawals divided by agricultural output index",
        yLabel: "Index (1960 = 100)",
        tooltipUnit: "",
        yMin: 0,
        yMax: 100,
        yTicks: [0, 25, 50, 75, 100],
        series: single("Withdrawals per unit of output", DATA.water.intensity),
        source: `${sourceLinks.water}; ${sourceLinks.productivity}`,
        decimals: 0
      },
      {
        title: "High Plains groundwater decline",
        subtitle: "Area-weighted average water level below predevelopment (~1950)",
        yLabel: "Feet below predevelopment",
        tooltipUnit: "feet below predevelopment",
        series: single("High Plains aquifer", DATA.water.high_plains_decline),
        summaryMode: "latest",
        fullWidth: true,
        caption: "USGS regional estimates, 1980–2019. The aquifer spans eight states; its average masks much larger local declines. Water-level change is not a national storage estimate.",
        source: sourceLinks.aquifer,
        decimals: 1
      }
    ]
  }),
  herbicides: () => ({
    title: "Herbicide risk has fallen by some but not all measures",
    intro: "",
    why: "Herbicides help control weeds, but some products can harm workers, wildlife, and aquatic ecosystems. The screening quotients shown here combine the amount applied with toxicological benchmarks and indicate potential hazard to mammals.",
    happened: "From the early 1990s to 2015, acute toxicity quotients declined for four of the five crops studied, while chronic hazard quotients declined for two. Much of the acute improvement came as comparatively hazardous products such as alachlor and cyanazine were phased out of corn production.",
    charts: [
      {
        title: "Acute toxicity quotient",
        subtitle: "Lower values indicate lower hazard",
        yLabel: "Acute quotient",
        tooltipUnit: "acute quotient",
        series: DATA.herbicides.acute.filter(d => d.name !== "Rice"),
        source: sourceLinks.herbicide,
        decimals: 0
      },
      {
        title: "Chronic hazard quotient",
        subtitle: "Lower values indicate lower hazard",
        yLabel: "Chronic quotient",
        tooltipUnit: "chronic quotient",
        series: DATA.herbicides.chronic.filter(d => d.name !== "Rice"),
        source: sourceLinks.herbicide,
        decimals: 2
      }
    ]
  }),
  soil: () => ({
    title: "Cropland erosion rates fell and have stayed low",
    intro: "",
    why: "Erosion removes fertile topsoil, carries sediment and nutrients into waterways, and can undermine long-term productivity. Keeping soil in place supports both yields and water quality. The National Resources Inventory estimates average water and wind erosion across U.S. cropland.",
    happened: "Conservation tillage, residue cover, contour farming, terraces, and related practices helped lower both water and wind erosion after 1982. Most of the national improvement occurred before 2007. Estimated rates have changed little from 2012 to 2022.",
    charts: [
      {
        title: "Average annual cropland erosion",
        subtitle: "",
        yLabel: "Tons per acre per year",
        tooltipUnit: "tons per acre per year",
        series: DATA.soil.rate,
        source: sourceLinks.soil,
        decimals: 2,
        fullWidth: true
      },
      {
        title: "Soil erosion by crop",
        subtitle: "Field to Market national reference years, 1980–2020",
        yLabel: "Tons of soil loss per acre per year",
        tooltipUnit: "tons per acre per year",
        series: DATA.soil.by_crop,
        source: sourceLinks.fieldToMarketSoil,
        caption: "Points are Field to Market's published smoothed trend estimates for the labeled years. Its 2020 estimate uses USDA erosion-model inputs through 2017; it is not simply the 2017 survey value.",
        decimals: 1,
        fullWidth: true
      }
    ]
  }),
  practices: () => ({
    title: "Farm practices that target inputs, protect soil, and sustain yields",
    intro: "",
    charts: [
      {
        title: "Genetically engineered seed",
        subtitle: "Pest and weed traits help protect yields and can support reduced tillage.",
        yLabel: "Percent of planted acres",
        tooltipUnit: "%",
        tickSuffix: "%",
        yMin: 0, yMax: 100, yTicks: [0, 25, 50, 75, 100],
        series: DATA.practices.ge,
        summaryMode: "latest",
        caption: "National planted-acre shares for crops in USDA's annual GE survey. Environmental effects depend on the trait and how it is used.",
        source: sourceLinks.ge,
        decimals: 0,
        fullWidth: true
      },
      {
        title: "Soil cover and tillage",
        subtitle: "Less disturbance and winter cover curb erosion, retain moisture, and protect yield potential.",
        yLabel: "Percent of relevant acres", tooltipUnit: "%", tickSuffix: "%",
        yMin: 0, yMax: 50, yTicks: [0, 10, 20, 30, 40, 50],
        series: [
          { name: "No-till", color: "#0d4459", sourceBoundary: { earlierEnd: 2004, laterStart: 2012 }, values: [
            ...DATA.practices.historic_tillage[0].values.map(point => ({ ...point, source: "CTIC/USGS" })),
            ...DATA.practices.census[0].values.map(point => ({ ...point, source: "Census of Agriculture" }))
          ] },
          { ...DATA.practices.census[1], name: "Reduced tillage · Census", color: "#ee5c36" },
          { ...DATA.practices.census[2], name: "Cover crops · Census", color: "#0dc3a8" }
        ],
        summaryMode: "latest", decimals: 1, fullWidth: true,
        caption: "No-till joins complete-coverage CTIC/USGS years (dashed, 1989–2004) to Census years (solid, 2012–22); the dotted bridge crosses a source and denominator change. Intermediate years are not observations. Reduced tillage is the Census category excluding no-till; cover crops use all cropland.",
        source: `${sourceLinks.historicTillage}; ${sourceLinks.censusPractices}; ${sourceLinks.censusLand}`
      },
      {
        title: "Irrigation technology",
        subtitle: "Pressurized systems, such as sprinklers and drip irrigation, can apply water more evenly and limit field losses.",
        yLabel: "Million irrigated acres", tooltipUnit: "million acres",
        yMin: 0, yMax: 35, yTicks: [0, 5, 10, 15, 20, 25, 30, 35],
        series: [
          { ...DATA.practices.irrigation[0], name: "Pressurized", color: "#0dc3a8" },
          { ...DATA.practices.irrigation[1], name: "Gravity", color: "#0d4459" }
        ],
        summaryMode: "latest", decimals: 1, fullWidth: true,
        caption: "Coverage: 17 Western states. Pressurized adoption rose from 37% of irrigated acres in 1984 to 75% in 2023. These states held about 71% of U.S. irrigated cropland in 2013. Method acres may overlap. The 2023 values are rounded (≈); higher efficiency need not mean lower total water use.",
        source: sourceLinks.irrigationMethods
      },
      {
        title: "Precision, nutrient, and water-management tools",
        subtitle: "Mapping, guidance, fertilizers, and sensors target inputs while supporting yields.",
        yLabel: "Percent adoption", tooltipUnit: "%", tickSuffix: "%",
        yMin: 0, yMax: 70, yTicks: [0, 10, 20, 30, 40, 50, 60, 70],
        series: [
          { ...DATA.practices.precision[0], name: "Yield maps · corn acres", color: "#0d4459" },
          { ...DATA.practices.precision[2], name: "Guidance/auto-steer · corn acres", color: "#0dc3a8" },
          { ...DATA.practices.ceap[0], name: "Enhanced-efficiency fertilizer · cultivated acres", color: "#ee5c36" },
          { ...DATA.practices.ceap[1], name: "Variable-rate technology · cultivated acres", color: "#f8b944" },
          { ...DATA.practices.soil_moisture_sensing[0], name: "Soil-moisture sensing · irrigating farms", color: "#56a9d5", dasharray: "5 4" }
        ],
        summaryMode: "latest", decimals: 1, fullWidth: true,
        caption: "Corn ARMS lines now extend through 2021; chart-read and rounded points are approximate (≈ in tooltips). The 2023 soybean results use a different crop base, so are not joined. NRCS lines are cultivated-acre shares from 2003–06 and 2013–16 survey periods. The dashed soil-sensing line is a share of irrigating farms; other lines measure acreage. Yield-map definitions changed in 2015.",
        source: `${sourceLinks.precision}; ${sourceLinks.precisionUpdate}; ${sourceLinks.ceap}; ${sourceLinks.irrigationSensing}`
      }
    ]
  }),
  climate: () => ({
    title: "Emissions intensity fell, while greater production increased total emissions",
    intro: "",
    why: "Agriculture emits methane, nitrous oxide, and carbon dioxide from soils, livestock, manure, and energy use. Emissions per unit of food show production efficiency, while total emissions show the sector's overall contribution to warming. Lower intensity can slow growth in the total footprint, but total emissions must ultimately fall to limit warming.",
    happened: "Direct U.S. agricultural emissions were 595 million metric tons CO₂e in 2023, 8 percent above 1990. EPA's estimates by economic sector are higher, including on-farm fuel combustion. However, product-level emissions intensity fell for major agricultural products.",
    charts: [
      {
        title: "U.S. agricultural emissions",
        views: [
          {
            id: "inventory",
            label: "By IPCC category", // View button
            totalLabel: "Inventory total", // Summed change in the legend
            subtitle: "IPCC categories",
            yLabel: "Million metric tons CO₂e",
            tooltipUnit: "million metric tons CO₂e",
            type: "stacked",
            series: DATA.climate.inventoryCategories || [],
            source: sourceLinks.epaExplorer,
            decimals: 0
          },
          {
            id: "economic",
            label: "By economic category", // View button
            totalLabel: "Economic-sector total", // Summed change in the legend
            subtitle: "EPA economic categories, including on-farm energy",
            yLabel: "Million metric tons CO₂e",
            tooltipUnit: "million metric tons CO₂e",
            type: "stacked",
            series: DATA.climate.economicCategories || [],
            source: sourceLinks.epaExplorer,
            decimals: 0
          }
        ]
      },
      {
        title: "Emissions intensity by product",
        subtitle: "Direct production emissions, omitting land-use change",
        yLabel: "Kilograms CO₂e per kg product",
        tooltipUnit: "kilograms CO₂e per kg product",
        series: DATA.climate.intensity,
        source: sourceLinks.faostatEmissions,
        decimals: 1
      }
    ]
  }),
  products: () => ({}),
  rd: () => {
    return {
      title: "Public agricultural R&D remains below its peak",
      why: "Public and private research drives improvements in yields, resource efficiency, resilience, animal health, and environmental performance. Because its benefits compound over decades, sustained investment matters.",
      happened: "Inflation-adjusted public spending on agricultural and food research peaked in 2002. By 2021 it was 29 percent lower, while spending as a share of gross farm value added fell by about half.",
      charts: [
        {
          title: "Total public agricultural R&D spending",
          subtitle: "USDA agencies and state universities: agricultural and food research, all funding sources",
          yLabel: "Billion 2022 dollars",
          tooltipUnit: "billion 2022 dollars",
          type: "stacked",
          series: DATA.rd.components || single("Public R&D", DATA.rd.spending),
          source: sourceLinks.rd,
          decimals: 1
        },
        {
          title: "Public agricultural R&D intensity",
          subtitle: "The same ERS spending total, as a share of gross farm value added",
          yLabel: "% of gross farm value added",
          tooltipUnit: "%",
          tickSuffix: "%",
          series: single("R&D intensity", DATA.rd.intensity || []),
          source: `${sourceLinks.rd}; ${sourceLinks.bea}`,
          decimals: 1
        },
        {
          title: "Federal agricultural R&D budget",
          subtitle: "Agency breakdown, 2000–2024; solid line: agency total; dashed line: broader GBARD agriculture budget",
          yLabel: "Billion 2022 dollars",
          tooltipUnit: "billion 2022 dollars",
          type: "stacked",
          series: DATA.rd.agencyBudget || [],
          overlaySeries: [...(DATA.rd.federalBudget || []).map((series, index) => ({ ...series, name: index === 0 ? "GBARD agriculture" : `GBARD · ${series.name}`, color: "#252a2b", dasharray: "7 5" })), { name: "Agency budget total", color: "#56a9d5", dasharray: "", hideInLegend: true, values: (DATA.rd.agencyBudget?.[0]?.values || []).map(point => ({ year: point.year, value: DATA.rd.agencyBudget.reduce((sum, series) => sum + series.values.find(d => d.year === point.year).value, 0) })) }],
          totalLabel: "Agency budget total",
          showChangeYears: true, labelPointSeriesOnly: true, fullWidth: true,
          caption: "Areas show actual research and facilities budgets under U.S. agriculture budget function 350. NIFA includes predecessor agencies; other research includes ERS, APHIS and NASS. The blue line is their net total. Facilities fall below zero in 2011 because Congress rescinded prior-year funding. GBARD uses a broader definition that includes forestry and fisheries, so it is not the sum of these areas. Forest Service research is outside this stack: in 2024 it was $303 million nominal, close to the $311 million nominal gap. Other classification differences and historical revisions may also contribute. Both datasets use the same March 2025 NIH BRDPI in 2022 dollars. Legend changes end in 2024. Isolated GBARD points: 2025 preliminary; 2026 President’s proposal. The 2024 price index is preliminary; 2025–26 indices are projected.",
          source: `<a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab012.pdf" target="_blank" rel="noopener">NCSES, agency budgets (annual tables)</a>; <a href="https://files.eric.ed.gov/fulltext/ED458125.pdf" target="_blank" rel="noopener">NSF, 2000 agency budgets</a>; ${sourceLinks.gbard}; <a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab011.pdf" target="_blank" rel="noopener">NCSES, Forest Service research (Table 11)</a>; ${sourceLinks.brdpi}`,
          decimals: 2
        }
      ]
    };
  }
};

function renderTopic(id) {
  closeMatrixPopover();
  hideTooltip();
  document.querySelectorAll(".topic-nav button").forEach(button => button.setAttribute("aria-selected", String(button.dataset.topic === id)));
  document.querySelector("#topic-select").value = id;
  if (id === "products") {
    renderProducts();
    history.replaceState(null, "", `#${id}`);
    sendHeight();
    return;
  }
  const topic = TOPICS[id]();
  const intro = topic.intro?.trim() ? `<p>${topic.intro}</p>` : "";
  const commentary = [
    ["Why does it matter?", topic.why],
    ["What happened?", topic.happened]
  ].filter(([, text]) => text?.trim());
  const commentaryMarkup = commentary.length
    ? `<div class="commentary-grid ${commentary.length === 1 ? "single" : ""}">${commentary.map(([title, text]) => `<section><h3>${title}</h3><p>${text}</p></section>`).join("")}</div>`
    : "";
  panel.innerHTML = `<div class="panel-lead"><div><h2>${topic.title}</h2>${intro}</div></div>
    ${commentaryMarkup}
    <div class="charts ${topic.charts.length === 1 ? "single" : ""}">${topic.charts.map((chart, index) => chartCard(chart, index)).join("")}</div>
    ${({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[id] ? studyBars(({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[id]) : ""}`;
  topic.charts.forEach((chart, index) => {
    drawChart(panel.querySelector(`[data-chart="${index}"]`), chart.views?.[0] || chart);
    panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(button => button.addEventListener("click", () => {
      const view = chart.views.find(item => item.id === button.dataset.view);
      panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      drawChart(panel.querySelector(`[data-chart="${index}"]`), view);
      sendHeight();
    }));
  });
  panel.querySelector(".product-explore-link")?.addEventListener("click", () => renderTopic("products"));
  panel.querySelector(".product-evidence")?.addEventListener("toggle", sendHeight);
  panel.querySelectorAll(".source-disclosure").forEach(details => details.addEventListener("toggle", sendHeight));
  history.replaceState(null, "", `#${id}`);
  sendHeight();
}

function chartCard(chart, index) {
  const active = chart.views?.[0] || chart;
  const controls = chart.views ? `<div class="view-toggle" role="group" aria-label="${chart.viewLabel || "Choose chart view"}">${chart.views.map((view, viewIndex) => `<button type="button" data-chart-view="${index}" data-view="${view.id}" aria-pressed="${viewIndex === 0}">${view.label}</button>`).join("")}</div>` : "";
  const heading = chart.title ? `<h3>${chart.title}</h3>` : "";
  return `<article class="chart-card ${chart.fullWidth ? "full-width" : ""}">${heading}<p class="chart-subtitle" data-subtitle="${index}">${active.subtitle || ""}</p>${controls}<div class="chart-wrap" data-chart="${index}"></div><div class="series-summary" data-summary="${index}"></div><details class="source-disclosure"><summary>Sources</summary><div class="source-line"></div></details></article>`;
}

function formatValue(chart, value) {
  const number = format(value, chart.decimals ?? 1);
  return chart.tooltipUnit === "%" ? `${number}%` : `${number} ${chart.tooltipUnit || ""}`.trim();
}

function drawChart(container, chart) {
  hideTooltip();
  container.parentElement.querySelector(".chart-compare")?.remove();
  container.replaceChildren();
  const card = container.closest(".chart-card");
  chart = { ...chart, title: chart.title || card.querySelector("h3")?.textContent || chart.yLabel || "Chart" };
  card.querySelector(".chart-subtitle").textContent = chart.subtitle || "";
  card.querySelector(".source-disclosure").hidden = !chart.source;
  card.querySelector(".source-line").innerHTML = chart.source || "";
  const summary = card.querySelector(".series-summary");
  summary.replaceChildren();
  if (!chart.series?.length || chart.series.some(series => !series.values?.length)) {
    container.innerHTML = '<p class="chart-empty">Detailed data are unavailable.</p>';
    return;
  }
  if (chart.type === "stacked") drawStackedAreaChart(container, chart);
  else if (chart.type === "bar") drawBarChart(container, chart);
  else drawLineChart(container, chart);
  attachChartInteractions(container, chart);
}

function drawBarChart(container, chart) {
  const width = Math.max(300, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: 16, bottom: 34, left: width < 380 ? 56 : 64 };
  const sorted = [...chart.series[0].values].sort((a, b) => a.year - b.year);
  const xMin = sorted[0].year, xMax = sorted.at(-1).year;
  const slot = (width - margin.left - margin.right) / (xMax - xMin + 1);
  const x = year => margin.left + (year - xMin + 0.5) * slot;
  const yScale = niceScale(Math.max(...sorted.map(point => point.value), 1));
  const yMax = chart.yMax ?? yScale.max;
  const y = value => height - margin.bottom - value / yMax * (height - margin.top - margin.bottom);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${chart.title}. ${chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc");
  description.textContent = chart.rollingSeries ? "Bars show completed annual surveys, the overlaid line averages the last five measured summers, and the dashed line shows the Task Force goal. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years." : "One bar per completed annual survey. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years.";
  svg.append(description);
  (chart.yTicks || yScale.ticks).forEach(tick => {
    svg.append(line(margin.left, y(tick), width - margin.right, y(tick), "grid-line"));
    svg.append(text(margin.left - 9, y(tick) + 4, format(tick, chart.decimals ?? 1), "tick-label", "end"));
  });
  const intervals = width < 380 ? 3 : 5;
  const xTicks = Array.from({ length: intervals + 1 }, (_, i) => Math.round(xMin + (xMax - xMin) * i / intervals)).filter((year, i, years) => i === 0 || year !== years[i - 1]);
  xTicks.forEach(year => {
    svg.append(line(x(year), height - margin.bottom, x(year), height - margin.bottom + 5, "axis-line"));
    svg.append(text(x(year), height - margin.bottom + 19, year, "tick-label", "middle"));
  });
  svg.append(line(margin.left, margin.top, margin.left, height - margin.bottom, "axis-line"));
  svg.append(line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, "axis-line"));
  const axisLabel = text(15, (height - margin.bottom + margin.top) / 2, chart.yLabel, "axis-label", "middle");
  axisLabel.setAttribute("transform", `rotate(-90 15 ${(height - margin.bottom + margin.top) / 2})`);
  svg.append(axisLabel);
  if (chart.goalValue) {
    const goal = line(margin.left, y(chart.goalValue), width - margin.right, y(chart.goalValue), "goal-line");
    goal.setAttribute("aria-label", `Task Force goal: below ${formatValue(chart, chart.goalValue)} five-survey average`);
    svg.append(goal);
  }
  const bars = [];
  sorted.forEach((point, index) => {
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", x(point.year) - slot * 0.36);
    bar.setAttribute("y", y(point.value));
    bar.setAttribute("width", slot * 0.72);
    bar.setAttribute("height", height - margin.bottom - y(point.value));
    bar.setAttribute("fill", COLORS[0]);
    bar.setAttribute("class", "bar-mark");
    bar.setAttribute("tabindex", index === sorted.length - 1 ? "0" : "-1");
    bar.setAttribute("aria-label", `${point.year}: ${formatValue(chart, point.value)}`);
    bar.chartDatum = { series: chart.series[0], point };
    const show = event => showTooltip(event, `<strong>${point.year}</strong><br>${formatValue(chart, point.value)}`);
    bar.addEventListener("pointerenter", show);
    bar.addEventListener("pointermove", show);
    bar.addEventListener("focus", show);
    bar.addEventListener("pointerleave", hideTooltip);
    bar.addEventListener("blur", hideTooltip);
    bar.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = Math.max(0, Math.min(bars.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
      bars[next]?.focus();
    });
    svg.append(bar);
    bars.push(bar);
  });
  if (chart.rollingSeries) {
    const rolling = chart.rollingSeries.values;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", rolling.map((point, index) => `${index ? "L" : "M"}${x(point.year).toFixed(2)},${y(point.value).toFixed(2)}`).join(" "));
    path.setAttribute("class", "rolling-path");
    svg.append(path);
    rolling.forEach(point => {
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hit.setAttribute("cx", x(point.year)); hit.setAttribute("cy", y(point.value)); hit.setAttribute("r", 7);
      hit.setAttribute("class", "rolling-hit"); hit.setAttribute("tabindex", "0");
      hit.setAttribute("aria-label", `${point.year} five-survey average: ${formatValue(chart, point.value)}`);
      hit.chartDatum = { series: chart.rollingSeries, point };
      const show = event => showTooltip(event, `<strong>${point.year} five-survey mean</strong><br>${formatValue(chart, point.value)}`);
      hit.addEventListener("pointerenter", show); hit.addEventListener("pointermove", show); hit.addEventListener("focus", show);
      hit.addEventListener("pointerleave", hideTooltip); hit.addEventListener("blur", hideTooltip);
      svg.append(hit);
    });
  }
  container.append(svg);
  renderSeriesSummary(container.parentElement.querySelector(".series-summary"), chart);
}

function drawLineChart(container, chart) {
  const width = Math.max(300, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: chart.series.length > 1 ? 24 : 16, bottom: 34, left: width < 380 ? 56 : 64 };
  const all = chart.series.flatMap(s => s.values);
  const allYears = all.map(d => d.year), values = all.map(d => d.value);
  const xMin = Math.min(...allYears), xMax = Math.max(...allYears);
  const yScale = niceScale(Math.max(...values, 1));
  const yMin = chart.yMin ?? 0;
  const yMax = chart.yMax ?? yScale.max;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = chart.yTicks || yScale.ticks;
  const xIntervals = width < 380 ? 3 : 5;
  const xTicks = Array.from({ length: xIntervals + 1 }, (_, i) => Math.round(xMin + (xMax - xMin) * i / xIntervals)).filter((v, i, a) => i === 0 || v !== a[i - 1]);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title}. ${chart.subtitle || ""}`); svg.innerHTML = `<title>${chart.title}</title>`;
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a series at its latest point, then use the left and right arrow keys to explore plotted values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, `${format(tick, chart.decimals ?? 1)}${chart.tickSuffix || ""}`, "tick-label", "end")); });
  xTicks.forEach(tick => { svg.append(line(x(tick), height - margin.bottom, x(tick), height - margin.bottom + 5, "axis-line")); svg.append(text(x(tick), height - margin.bottom + 19, tick, "tick-label", "middle")); });
  svg.append(line(margin.left, margin.top, margin.left, height - margin.bottom, "axis-line")); svg.append(line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, "axis-line"));
  const axisLabel = text(15, (height - margin.bottom + margin.top) / 2, chart.yLabel, "axis-label", "middle"); axisLabel.setAttribute("transform", `rotate(-90 15 ${(height - margin.bottom + margin.top) / 2})`); svg.append(axisLabel);
  chart.series.forEach((series, index) => {
    const color = series.color || COLORS[index % COLORS.length]; const sorted = [...series.values].sort((a, b) => a.year - b.year);
    const appendPath = (points, dasharray) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", points.map((d, i) => `${i && (!(series.breakOnMissingYear ?? chart.breakOnMissingYear) || d.year - points[i - 1].year === 1) ? "L" : "M"}${x(d.year).toFixed(2)},${y(d.value).toFixed(2)}`).join(" "));
      path.setAttribute("class", "series-path"); path.setAttribute("stroke", color);
      if (dasharray) path.setAttribute("stroke-dasharray", dasharray);
      svg.append(path);
    };
    if (!series.pointsOnly && series.definitionBreak) {
      const earlier = sorted.filter(point => point.year <= series.definitionBreak.earlierEnd);
      const firstLater = sorted.find(point => point.year >= series.definitionBreak.laterStart);
      appendPath(firstLater ? [...earlier, firstLater] : earlier, "5 4");
      appendPath(sorted.filter(point => point.year >= series.definitionBreak.laterStart));
    } else if (!series.pointsOnly && series.sourceBoundary) {
      const earlier = sorted.filter(point => point.year <= series.sourceBoundary.earlierEnd);
      const later = sorted.filter(point => point.year >= series.sourceBoundary.laterStart);
      appendPath(earlier, "5 4");
      appendPath([earlier.at(-1), later[0]], "2 4");
      appendPath(later);
    } else if (!series.pointsOnly) appendPath(sorted, series.dasharray);
    const circles = [];
    sorted.forEach((d, pointIndex) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("cx", x(d.year)); circle.setAttribute("cy", y(d.value)); circle.setAttribute("r", series.pointsOnly ? 5 : (chart.pointRadius ?? 4.2)); circle.setAttribute("fill", color); circle.setAttribute("class", `data-point line-point${series.pointsOnly || series.breakOnMissingYear ? " always-visible" : ""}`); circle.setAttribute("tabindex", pointIndex === sorted.length - 1 ? "0" : "-1"); circle.setAttribute("aria-label", `${series.name}, ${d.year}: ${formatValue(chart, d.value)}`);
      const qualifier = d.approximate ? "≈" : "";
      circle.chartDatum = { series, point: d };
      const source = d.source ? `<br>${escapeHTML(d.source)}` : "";
      circle.setAttribute("aria-label", `${series.name}, ${d.year}: ${d.approximate ? "approximately " : ""}${formatValue(chart, d.value)}${d.source ? `, ${d.source}` : ""}`);
      const show = event => showTooltip(event, `<strong>${series.name}</strong><br>${d.year}: ${qualifier}${formatValue(chart, d.value)}${source}`); circle.addEventListener("pointerenter", show); circle.addEventListener("pointermove", show); circle.addEventListener("focus", show); circle.addEventListener("pointerleave", hideTooltip); circle.addEventListener("blur", hideTooltip); svg.append(circle);
      circle.addEventListener("keydown", event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = Math.max(0, Math.min(circles.length - 1, pointIndex + (event.key === 'ArrowRight' ? 1 : -1))); circles[next]?.focus(); });
      circles.push(circle);
    });
  });
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(".series-summary"), chart);
}

function drawStackedAreaChart(container, chart) {
  const width = Math.max(300, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: 16, bottom: 34, left: width < 380 ? 56 : 64 };
  const maps = chart.series.map(series => new Map(series.values.map(d => [d.year, d.value])));
  const years = chart.series[0].values.map(d => d.year).filter(year => maps.every(map => map.has(year))).sort((a, b) => a - b);
  if (!years.length) { container.innerHTML = '<p class="chart-empty">The component series do not share a common time period.</p>'; return; }
  const totals = years.map(year => maps.reduce((sum, map) => sum + map.get(year), 0));
  const overlays = chart.overlaySeries || [];
  const overlayPoints = overlays.flatMap(series => series.values);
  const positiveTotals = years.map(year => maps.reduce((sum, map) => sum + Math.max(0, map.get(year)), 0));
  const negativeTotals = years.map(year => maps.reduce((sum, map) => sum + Math.min(0, map.get(year)), 0));
  const xMin = Math.min(years[0], ...overlayPoints.map(d => d.year)), xMax = Math.max(years.at(-1), ...overlayPoints.map(d => d.year)), yScale = niceScale(Math.max(...positiveTotals, ...overlayPoints.map(d => d.value), 1)), yMax = yScale.max;
  const step = yScale.ticks[1] - yScale.ticks[0];
  const yMin = Math.min(...negativeTotals) < 0 ? -Math.ceil(Math.abs(Math.min(...negativeTotals)) / (step / 2)) * (step / 2) : 0;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = yMin < 0 ? [yMin, ...yScale.ticks] : yScale.ticks;
  const xIntervals = width < 380 ? 3 : 5;
  const xTicks = Array.from({ length: xIntervals + 1 }, (_, i) => Math.round(xMin + (xMax - xMin) * i / xIntervals)).filter((v, i, a) => i === 0 || v !== a[i - 1]);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title || "Stacked area chart"}. ${chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a category at its latest point, then use the left and right arrow keys to explore annual values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, format(tick, chart.decimals ?? 1), "tick-label", "end")); });
  xTicks.forEach(tick => { svg.append(line(x(tick), height - margin.bottom, x(tick), height - margin.bottom + 5, "axis-line")); svg.append(text(x(tick), height - margin.bottom + 19, tick, "tick-label", "middle")); });
  svg.append(line(margin.left, margin.top, margin.left, height - margin.bottom, "axis-line")); svg.append(line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, "axis-line"));
  const axisLabel = text(15, (height - margin.bottom + margin.top) / 2, chart.yLabel, "axis-label", "middle"); axisLabel.setAttribute("transform", `rotate(-90 15 ${(height - margin.bottom + margin.top) / 2})`); svg.append(axisLabel);
  // Insert zero crossings so signed areas never overlap between observations.
  const knots = [...years];
  maps.forEach(map => years.slice(1).forEach((year, i) => {
    const a = map.get(years[i]), b = map.get(year);
    if (a * b < 0) knots.push(years[i] + (year - years[i]) * Math.abs(a) / (Math.abs(a) + Math.abs(b)));
  }));
  const areaYears = [...new Set(knots)].sort((a, b) => a - b);
  const interpolate = (map, year) => {
    if (map.has(year)) return map.get(year);
    const right = years.findIndex(value => value > year), left = right - 1;
    return map.get(years[left]) + (map.get(years[right]) - map.get(years[left])) * (year - years[left]) / (years[right] - years[left]);
  };
  let positiveBase = areaYears.map(() => 0), negativeBase = areaYears.map(() => 0);
  chart.series.forEach((series, index) => {
    const values = years.map(year => maps[index].get(year));
    const areaValues = areaYears.map(year => interpolate(maps[index], year));
    const positions = new Map();
    [1, -1].forEach(sign => {
      const lower = sign > 0 ? positiveBase : negativeBase;
      const upper = areaValues.map((value, i) => lower[i] + (sign > 0 ? Math.max(0, value) : Math.min(0, value)));
      areaYears.forEach((year, i) => { if ((sign > 0 && areaValues[i] >= 0) || (sign < 0 && areaValues[i] < 0)) positions.set(year, upper[i]); });
      if (areaValues.some(value => value * sign > 0)) {
        const topPath = areaYears.map((year, i) => `${i ? "L" : "M"}${x(year).toFixed(2)},${y(upper[i]).toFixed(2)}`).join(" ");
        const bottomPath = [...areaYears].reverse().map((year, reverseIndex) => { const i = areaYears.length - 1 - reverseIndex; return `L${x(year).toFixed(2)},${y(lower[i]).toFixed(2)}`; }).join(" ");
        const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        area.setAttribute("d", `${topPath} ${bottomPath} Z`); area.setAttribute("class", "area-path"); area.setAttribute("fill", COLORS[index % COLORS.length]); svg.append(area);
      }
      if (sign > 0) positiveBase = upper; else negativeBase = upper;
    });
    const circles = [];
    years.forEach((year, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("cx", x(year)); circle.setAttribute("cy", y(positions.get(year))); circle.setAttribute("r", 4); circle.setAttribute("fill", COLORS[index % COLORS.length]); circle.setAttribute("class", "data-point area-point"); circle.setAttribute("tabindex", i === years.length - 1 ? "0" : "-1"); circle.setAttribute("aria-label", `${series.name}, ${year}: ${formatValue(chart, values[i])}`);
      circle.chartDatum = { series, point: { year, value: values[i] } };
      const show = event => showTooltip(event, `<strong>${series.name}</strong><br>${year}: ${formatValue(chart, values[i])}`); circle.addEventListener("pointerenter", show); circle.addEventListener("pointermove", show); circle.addEventListener("focus", show); circle.addEventListener("pointerleave", hideTooltip); circle.addEventListener("blur", hideTooltip); svg.append(circle);
      circle.addEventListener("keydown", event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = Math.max(0, Math.min(circles.length - 1, i + (event.key === 'ArrowRight' ? 1 : -1))); circles[next]?.focus(); });
      circles.push(circle);
    });
  });
  overlays.forEach(series => {
    const sorted = [...series.values].sort((a, b) => a.year - b.year);
    if (!series.pointsOnly) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", sorted.map((d, i) => `${i ? "L" : "M"}${x(d.year)},${y(d.value)}`).join(" "));
      path.setAttribute("class", "series-path"); path.setAttribute("stroke", series.color);
      path.setAttribute("stroke-dasharray", series.dasharray ?? "7 5"); svg.append(path);
    }
    const circles = [];
    sorted.forEach((d, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.chartDatum = { series, point: d };
      Object.entries({ cx: x(d.year), cy: y(d.value), r: series.pointsOnly ? 5 : 4, fill: series.color, class: `data-point line-point${series.pointsOnly ? " always-visible" : ""}`, tabindex: i === sorted.length - 1 ? "0" : "-1", "aria-label": `${series.name}, ${d.year}: ${formatValue(chart, d.value)}` }).forEach(([key, value]) => circle.setAttribute(key, value));
      const show = event => showTooltip(event, `<strong>${series.name}</strong><br>${d.year}: ${formatValue(chart, d.value)}`);
      ["pointerenter", "pointermove", "focus"].forEach(event => circle.addEventListener(event, show));
      ["pointerleave", "blur"].forEach(event => circle.addEventListener(event, hideTooltip));
      circle.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); circles[Math.max(0, Math.min(circles.length - 1, i + (event.key === "ArrowRight" ? 1 : -1)))]?.focus(); });
      circles.push(circle); svg.append(circle);
    });
  });
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(".series-summary"), chart);
}

function rangeChangeText(first, last) {
  if (first.year === last.year) return "Choose two different years.";
  if (first.value <= 0) return "Percent change is undefined from a zero or negative starting value.";
  return `${pct((last.value / first.value - 1) * 100)} change`;
}

function attachChartInteractions(container, chart) {
  const svg = container.querySelector("svg");
  if (!svg) return;
  const marks = [...svg.querySelectorAll(".data-point, .bar-mark, .rolling-hit")].filter(mark => mark.chartDatum);
  const records = marks.map(mark => ({ mark, ...mark.chartDatum,
    x: Number(mark.getAttribute(mark.tagName === "rect" ? "x" : "cx")) + (mark.tagName === "rect" ? Number(mark.getAttribute("width")) / 2 : 0),
    y: Number(mark.getAttribute(mark.tagName === "rect" ? "y" : "cy")),
    rect: mark.tagName === "rect" ? { x: Number(mark.getAttribute("x")), y: Number(mark.getAttribute("y")), width: Number(mark.getAttribute("width")), height: Number(mark.getAttribute("height")) } : null
  }));
  const candidates = [...new Set(records.map(record => record.series))].filter(series => series.values.length > 1);
  const previous = container.parentElement.querySelector(".chart-compare");
  previous?.remove();
  if (!candidates.length) return;
  const name = series => series.name || "Five-survey mean";
  const comparison = document.createElement("div"); comparison.className = "chart-compare";
  comparison.innerHTML = `<p class="compare-hint">Drag from a point to another year to compare dates.</p><details><summary>Compare dates</summary><div class="compare-controls"><label>Series<select class="compare-series" aria-label="Series to compare">${candidates.map((series, i) => `<option value="${i}">${escapeHTML(name(series))}</option>`).join("")}</select></label><label>From<select class="compare-from" aria-label="Start year"></select></label><label>To<select class="compare-to" aria-label="End year"></select></label><button type="button" class="compare-clear">Clear</button></div><p class="compare-result" role="status" aria-live="polite"></p></details>`;
  container.after(comparison);
  const details = comparison.querySelector("details"), select = comparison.querySelector(".compare-series"), from = comparison.querySelector(".compare-from"), to = comparison.querySelector(".compare-to"), result = comparison.querySelector(".compare-result");
  const selection = document.createElementNS("http://www.w3.org/2000/svg", "g"); selection.setAttribute("class", "range-selection"); selection.setAttribute("aria-hidden", "true"); svg.append(selection);
  let activeSeries = candidates[0], drag = null, hovered = null;
  const pointsFor = series => records.filter(record => record.series === series).sort((a, b) => a.point.year - b.point.year);
  const fillYears = () => {
    const points = pointsFor(activeSeries);
    const options = points.map(record => `<option value="${record.point.year}">${record.point.year}</option>`).join("");
    from.innerHTML = options; to.innerHTML = options;
    from.value = String(points[0].point.year); to.value = String(points.at(-1).point.year);
  };
  const drawSelection = (a, b) => {
    selection.replaceChildren();
    if (a.point.year === b.point.year) return;
    const height = svg.viewBox.baseVal.height;
    const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    Object.entries({ x: Math.min(a.x, b.x), y: 18, width: Math.abs(a.x - b.x), height: height - 52, class: "range-band" }).forEach(([key, value]) => band.setAttribute(key, value)); selection.append(band);
    [a, b].forEach(record => {
      selection.append(line(record.x, 18, record.x, height - 34, "range-boundary"));
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      Object.entries({ cx: record.x, cy: record.y, r: 5, class: "range-endpoint" }).forEach(([key, value]) => dot.setAttribute(key, value)); selection.append(dot);
    });
  };
  const updateResult = () => {
    const points = pointsFor(activeSeries);
    let a = points.find(record => record.point.year === Number(from.value)), b = points.find(record => record.point.year === Number(to.value));
    if (!a || !b) return;
    if (a.point.year > b.point.year) [a, b] = [b, a];
    if (!drag) { from.value = String(a.point.year); to.value = String(b.point.year); }
    const first = a.point, last = b.point;
    const boundary = activeSeries.definitionBreak || activeSeries.sourceBoundary;
    const caution = boundary && first.year <= boundary.earlierEnd && last.year >= boundary.laterStart ? " Definitions or sources change within this range." : "";
    const approximate = first.approximate || last.approximate ? " Approximate endpoint values." : "";
    const rescission = chart.type === "stacked" && name(activeSeries) === "Research facilities" && first.year <= 2011 && last.year >= 2011 ? " Includes the 2011 rescission of prior-year funding." : "";
    const percentagePoints = chart.tooltipUnit === "%" && first.year !== last.year ? ` (${format(last.value - first.value, 1)} percentage points)` : "";
    result.innerHTML = `<strong>${escapeHTML(name(activeSeries))} · ${first.year}–${last.year}: ${rangeChangeText(first, last)}${percentagePoints}</strong><br>${first.approximate ? "≈" : ""}${formatValue(chart, first.value)} → ${last.approximate ? "≈" : ""}${formatValue(chart, last.value)}${caution || approximate || rescission ? `<br><span>${escapeHTML(caution + approximate + rescission)}</span>` : ""}`;
    drawSelection(a, b);
  };
  const local = event => {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  const nearest = event => {
    const point = local(event), matrix = svg.getScreenCTM(), radius = 18 / Math.hypot(matrix.a, matrix.b);
    let winner = null, distance = Infinity;
    records.forEach(record => {
      const dx = record.rect ? Math.max(record.rect.x - point.x, 0, point.x - record.rect.x - record.rect.width) : record.x - point.x;
      const dy = record.rect ? Math.max(record.rect.y - point.y, 0, point.y - record.rect.y - record.rect.height) : record.y - point.y;
      const candidate = Math.hypot(dx, dy);
      if (candidate < distance) { distance = candidate; winner = record; }
    });
    return distance <= radius ? winner : null;
  };
  const hover = (event, record) => {
    hovered?.mark.classList.remove("is-hovered"); hovered = record;
    if (!record) { hideTooltip(); return; }
    record.mark.classList.add("is-hovered");
    showTooltip(event, `<strong>${escapeHTML(name(record.series))}</strong><br>${record.point.year}: ${record.point.approximate ? "≈" : ""}${formatValue(chart, record.point.value)}${record.point.source ? `<br>${escapeHTML(record.point.source)}` : ""}`);
  };
  const stopDrag = () => { if (drag && svg.hasPointerCapture(drag.pointerId)) svg.releasePointerCapture(drag.pointerId); drag = null; svg.classList.remove("is-dragging"); hideTooltip(); };
  select.addEventListener("change", () => { activeSeries = candidates[Number(select.value)]; fillYears(); updateResult(); });
  [from, to].forEach(control => control.addEventListener("change", updateResult));
  details.addEventListener("toggle", () => { if (details.open) updateResult(); sendHeight(); });
  comparison.querySelector(".compare-clear").addEventListener("click", () => { selection.replaceChildren(); details.open = false; result.replaceChildren(); fillYears(); });
  fillYears();
  svg.addEventListener("pointermove", event => {
    if (!drag) { if (event.pointerType !== "touch") hover(event, nearest(event)); return; }
    const point = local(event), points = pointsFor(activeSeries);
    const end = points.reduce((best, record) => Math.abs(record.x - point.x) < Math.abs(best.x - point.x) ? record : best);
    to.value = String(end.point.year);
    if (from.value !== to.value) { details.open = true; updateResult(); hideTooltip(); }
  });
  svg.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const start = nearest(event);
    if (!start || !candidates.includes(start.series)) return;
    event.preventDefault(); activeSeries = start.series; select.value = String(candidates.indexOf(activeSeries)); fillYears();
    from.value = to.value = String(start.point.year); selection.replaceChildren();
    drag = { pointerId: event.pointerId }; svg.setPointerCapture(event.pointerId); svg.classList.add("is-dragging");
  });
  svg.addEventListener("pointerup", () => { if (drag) { stopDrag(); if (details.open) updateResult(); } });
  svg.addEventListener("pointercancel", () => { stopDrag(); selection.replaceChildren(); details.open = false; });
  svg.addEventListener("keydown", event => { if (event.key === "Escape") { stopDrag(); selection.replaceChildren(); details.open = false; } });
  svg.addEventListener("pointerleave", () => { if (!drag) { hovered?.mark.classList.remove("is-hovered"); hovered = null; hideTooltip(); } });
}

function renderSeriesSummary(summary, chart) {
  summary.classList.toggle("multi", chart.series.length > 1);
  const caption = chart.caption === undefined ? DEFAULT_CHART_CAPTION : chart.caption;
  const note = caption ? `<p class="change-note">${escapeHTML(caption)}</p>` : "";
  let total = "";
  if (chart.totalLabel) {
    const firstYear = Math.max(...chart.series.map(series => series.values[0].year));
    const lastYear = Math.min(...chart.series.map(series => series.values.at(-1).year));
    const first = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === firstYear).value, 0);
    const last = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === lastYear).value, 0);
    total = `<strong class="total-change">${chart.totalLabel}: ${pct((last / first - 1) * 100)} <small>${firstYear}–${lastYear}</small></strong>`;
  }
  const rows = [...chart.series, ...(chart.overlaySeries || []).filter(series => !series.hideInLegend).map(series => ({ ...series, isOverlay: true }))].map((series, index) => {
    const delta = chart.labelPointSeriesOnly && series.pointsOnly ? "" : chart.summaryMode === "latest" ? formatValue(chart, series.values.at(-1).value) : pct(change(series.values));
    const range = `${series.values[0].year}–${series.values.at(-1).year}`;
    if (series.sourceBoundary) {
      const earlier = series.values.find(point => point.year === series.sourceBoundary.earlierEnd);
      const color = series.color || COLORS[index % COLORS.length];
      return `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3" stroke-dasharray="5 4"></line></svg><b>No-till · CTIC/USGS ${formatValue(chart, earlier.value)} <small>${series.sourceBoundary.earlierEnd}</small></b></span><span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3"></line></svg><b>No-till · Census ${delta} <small>${series.values.at(-1).year}</small></b></span>`;
    }
    return chart.series.length === 1
      ? `<span class="single-change"><strong>${delta}</strong> <small>${chart.summaryMode === "latest" ? series.values.at(-1).year : range}</small></span>`
      : chart.type === "stacked" && !series.isOverlay
        ? `<span><i style="background:${COLORS[index % COLORS.length]}"></i><b>${series.name} ${delta}${chart.showChangeYears ? ` <small>${range}</small>` : ""}</b></span>`
        : `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true">${series.pointsOnly ? `<circle cx="9" cy="2" r="2" fill="${series.color || COLORS[index % COLORS.length]}"></circle>` : `<line x1="0" y1="2" x2="18" y2="2" stroke="${series.color || COLORS[index % COLORS.length]}" stroke-width="3" ${series.dasharray ? `stroke-dasharray="${series.dasharray}"` : ""}></line>`}</svg><b>${series.name} ${delta}${chart.showChangeYears && !(chart.labelPointSeriesOnly && series.pointsOnly) ? ` <small>${range}</small>` : chart.latestYearLabel ? ` <small>${series.values.at(-1).year}</small>` : ""}</b></span>`;
  }).join("");
  const overlayKey = chart.rollingSeries ? `<div class="overlay-key"><span><i class="key-bar"></i> Annual survey</span><span><i class="key-average"></i> Five-survey mean</span><span><i class="key-goal"></i> Task Force goal</span></div>` : "";
  summary.innerHTML = note + overlayKey + total + rows;
}

function line(x1, y1, x2, y2, className) { const el = document.createElementNS("http://www.w3.org/2000/svg", "line"); Object.entries({ x1, y1, x2, y2, class: className }).forEach(([k, v]) => el.setAttribute(k, v)); return el; }
function text(x, y, value, className, anchor = "start") { const el = document.createElementNS("http://www.w3.org/2000/svg", "text"); el.setAttribute("x", x); el.setAttribute("y", y); el.setAttribute("class", className); el.setAttribute("text-anchor", anchor); el.textContent = value; return el; }
function showTooltip(event, html) { tooltip.innerHTML = html; tooltip.classList.add("show"); tooltip.setAttribute("aria-hidden", "false"); const bounds = event.target.getBoundingClientRect(); const px = Number.isFinite(event.clientX) && event.clientX ? event.clientX : bounds.left + bounds.width / 2; const py = Number.isFinite(event.clientY) && event.clientY ? event.clientY : bounds.top; tooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - 245, px + 12))}px`; tooltip.style.top = `${Math.max(8, py - 55)}px`; }
function hideTooltip() { tooltip.classList.remove("show"); tooltip.setAttribute("aria-hidden", "true"); }
function sendHeight() { requestAnimationFrame(() => window.parent?.postMessage({ type: "bti-intensification-height", height: document.documentElement.scrollHeight }, "*")); }

document.querySelectorAll(".topic-nav button").forEach((button, index, buttons) => {
  button.addEventListener("click", () => renderTopic(button.dataset.topic));
  button.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); const next = (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length; buttons[next].focus(); buttons[next].click(); });
});
document.querySelector("#topic-select").addEventListener("change", event => renderTopic(event.target.value));
panel.addEventListener("click", event => {
  if (event.target.closest(".matrix-popover-close")) { closeMatrixPopover(); return; }
  const matrixButton = event.target.closest("[data-matrix-cell]");
  if (matrixButton) {
    if (matrixAnchor === matrixButton && matrixPinned) closeMatrixPopover();
    else openMatrixPopover(matrixButton, true);
    return;
  }
  const modeButton = event.target.closest("[data-change-mode]");
  if (modeButton) {
    CHANGE_MODE = modeButton.dataset.changeMode;
    panel.querySelectorAll("[data-change-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.changeMode === CHANGE_MODE)));
    const metric = ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[document.querySelector("#topic-select").value];
    if (metric) panel.querySelector(".product-bars").innerHTML = studyBarRows(metric);
    sendHeight();
    return;
  }
  const trigger = event.target.closest(".study-info-trigger");
  panel.querySelectorAll(".study-info-trigger[aria-expanded='true']").forEach(button => {
    if (button !== trigger) button.setAttribute("aria-expanded", "false");
  });
  if (trigger) trigger.setAttribute("aria-expanded", String(trigger.getAttribute("aria-expanded") !== "true"));
});

panel.addEventListener("pointerover", event => {
  if (event.pointerType === "touch") return;
  const button = event.target.closest("[data-matrix-cell]");
  if (button && !button.contains(event.relatedTarget)) openMatrixPopover(button);
});
panel.addEventListener("pointerout", event => {
  const button = event.target.closest("[data-matrix-cell]");
  if (button && !button.contains(event.relatedTarget) && !matrixPinned) matrixHideTimer = setTimeout(closeMatrixPopover, 140);
});
panel.addEventListener("focusin", event => {
  const button = event.target.closest("[data-matrix-cell]");
  if (button) openMatrixPopover(button);
});
panel.addEventListener("focusout", event => {
  if (matrixAnchor && !matrixPinned && !panel.querySelector(".matrix-popover")?.contains(event.relatedTarget)) matrixHideTimer = setTimeout(closeMatrixPopover, 140);
});
document.addEventListener("click", event => {
  if (matrixAnchor && !event.target.closest("[data-matrix-cell], .matrix-popover")) closeMatrixPopover();
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && matrixAnchor) { closeMatrixPopover(); } });
window.addEventListener("resize", () => { if (matrixAnchor) positionMatrixPopover(matrixAnchor, panel.querySelector(".matrix-popover")); });

panel.innerHTML = '<div class="loading">Loading the tracker…</div>';
Promise.all(["data.json", "product-studies.json"].map(path => fetch(path).then(response => { if (!response.ok) throw new Error(`${path} failed to load`); return response.json(); }))).then(([data, studies]) => {
  DATA = data; STUDIES = studies.studies; const ghg2023 = { year: 2023, value: 595.4 }; [DATA.overview.ghg, DATA.climate.total].forEach(series => { if (!series.some(d => d.year === 2023)) series.push(ghg2023); });
  const initial = location.hash.slice(1); renderTopic(TOPICS[initial] ? initial : "overview");
}).catch(() => { panel.innerHTML = location.protocol === "file:"
  ? '<div class="loading">To preview locally, double-click preview.command in this folder and keep its Terminal window open.</div>'
  : '<div class="loading">The data could not be loaded. Please refresh the page.</div>'; });

new ResizeObserver(sendHeight).observe(document.body);
