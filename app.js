// Official BTI palette, in primary-to-accent order. Never darken chart colors.
// Research Team Graphics Style Guide: 1oeGqq8HOtyDAOlBaAakiCeHy5TUe0B5FVG4nxjVYVJk
const COLORS = ["#0d4459", "#00a990", "#d15627", "#be302f", "#ecbba7", "#8c8c8c", "#000000", "#0dc3a8"];
const panel = document.querySelector("#tracker-panel");
const tooltip = document.querySelector("#tooltip");
let DATA;
let BIOTECH;
let RD_UPDATED;
let STUDIES;
let CHANGE_MODE = "annual";
let STUDY_SORT_DIRECTION = "desc";
const mobileLayout = window.matchMedia("(max-width: 900px)");
let ACTIVE_TOPIC = null;
let MOBILE_CHART = 0;
const CHART_CHOICES = new Map();
const CHART_STATES = new Map();
const CARD_STATES = new Map();
// Session-only visibility choices are independent of view, overview and detail.
const SERIES_VISIBILITY = new Map();
let selectedMatrixMetric = "greenhouse_gas";
const IS_EMBEDDED = window.parent !== window;
document.body.classList.toggle("is-embedded", IS_EMBEDDED);
document.body.classList.toggle("local-preview", ["127.0.0.1", "localhost"].includes(location.hostname));
const TEXT_EDITS_STORAGE_KEY = "bti-si-tracker-text-edits-v1";
let PROJECT_TEXT_EDITS = {};
let TEXT_EDIT_MODE = false;
const LOCAL_EDIT_SERVER = ["127.0.0.1", "localhost"].includes(location.hostname);
document.querySelector(".text-edit-tools").hidden = !LOCAL_EDIT_SERVER;

function readTextEdits() {
  if (!LOCAL_EDIT_SERVER) return { ...PROJECT_TEXT_EDITS };
  try { return { ...PROJECT_TEXT_EDITS, ...JSON.parse(localStorage.getItem(TEXT_EDITS_STORAGE_KEY) || "{}") }; }
  catch { return { ...PROJECT_TEXT_EDITS }; }
}
function applySavedTextEdits(root = document) {
  const edits = readTextEdits();
  root.querySelectorAll("[data-editable-key]").forEach(element => {
    if (Object.hasOwn(edits, element.dataset.editableKey)) {
      element.textContent = edits[element.dataset.editableKey];
      element.classList.toggle("text-edited", edits[element.dataset.editableKey].includes("\n"));
    } else element.classList.remove("text-edited");
    element.contentEditable = String(TEXT_EDIT_MODE);
    element.classList.toggle("text-editable", TEXT_EDIT_MODE);
  });
}
function setTextEditMode(enabled) {
  if (!LOCAL_EDIT_SERVER) return;
  TEXT_EDIT_MODE = enabled;
  const button = document.querySelector("#edit-text-toggle");
  const save = document.querySelector("#save-text-edits");
  const reset = document.querySelector("#reset-text-edits");
  const status = document.querySelector("#text-edit-status");
  button.textContent = enabled ? "Done editing" : "Edit text";
  button.setAttribute("aria-pressed", String(enabled));
  save.hidden = !enabled || !LOCAL_EDIT_SERVER;
  reset.hidden = !enabled;
  status.hidden = !enabled;
  if (enabled) status.textContent = "Click highlighted titles, captions or notes to edit, then save your changes to the tracker project.";
  document.body.classList.toggle("text-edit-mode", enabled);
  applySavedTextEdits();
}

document.querySelector("#edit-text-toggle").addEventListener("click", () => setTextEditMode(!TEXT_EDIT_MODE));
document.querySelector("#save-text-edits").addEventListener("click", async () => {
  const status = document.querySelector("#text-edit-status");
  const edits = readTextEdits();
  status.textContent = "Saving to the tracker project…";
  try {
    const response = await fetch("/__save_text_edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits)
    });
    if (!response.ok) throw new Error(`Save failed (${response.status})`);
    PROJECT_TEXT_EDITS = edits;
    try { localStorage.removeItem(TEXT_EDITS_STORAGE_KEY); } catch {}
    status.textContent = "Saved to text-edits.json in the tracker project. Commit and publish the project to update the shared site.";
  } catch {
    status.textContent = "Could not save to the project. Open this tracker with preview.command, then try again.";
  }
});
document.querySelector("#reset-text-edits").addEventListener("click", () => {
  try { localStorage.removeItem(TEXT_EDITS_STORAGE_KEY); } catch {}
  location.reload();
});
document.addEventListener("input", event => {
  const element = event.target.closest("[data-editable-key]");
  if (!TEXT_EDIT_MODE || !element) return;
  const edits = readTextEdits();
  edits[element.dataset.editableKey] = element.innerText.replace(/\r/g, "");
  try { localStorage.setItem(TEXT_EDITS_STORAGE_KEY, JSON.stringify(edits)); }
  catch { document.querySelector("#text-edit-status").textContent = "Browser storage is unavailable; edits may not persist after refresh."; }
});
document.addEventListener("click", event => {
  if (TEXT_EDIT_MODE && event.target.closest("summary [data-editable-key]")) event.preventDefault();
}, true);
document.addEventListener("keydown", event => {
  if (TEXT_EDIT_MODE && event.target.closest("summary [data-editable-key]") && ["Enter", " "].includes(event.key)) event.preventDefault();
});

const sourceLinks = {
  productivity: '<a href="https://ers.usda.gov/data-products/agricultural-productivity-in-the-united-states" target="_blank" rel="noopener">USDA ERS, Agricultural Productivity in the United States</a>',
  epa: '<a href="https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101EZHC.TXT" target="_blank" rel="noopener">EPA, Inventory of U.S. Greenhouse Gas Emissions and Sinks: 1990–2023</a>',
  faostatCrops: '<a href="https://www.fao.org/faostat/en/#data/QCL" target="_blank" rel="noopener">FAOSTAT, Crops and livestock products</a>',
  nass: '<a href="https://quickstats.nass.usda.gov/" target="_blank" rel="noopener">USDA NASS Quick Stats</a>',
  nassCotton: '<a href="https://release.nass.usda.gov/reports/croptr25.pdf" target="_blank" rel="noopener">USDA NASS, historical all-cotton area and yields, pp. 53–54</a>',
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
  censusPractices: '<a href="https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1%2C_Chapter_2_US_State_Level/st99_2_041_044.pdf" target="_blank" rel="noopener">NASS tillage (2024)</a>',
  censusLand: '<a href="https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1%2C_Chapter_1_US/st99_1_001_001.pdf" target="_blank" rel="noopener">NASS cropland (2024)</a>',
  ceap: '<a href="https://www.nrcs.usda.gov/sites/default/files/2022-10/Conservation%20Practices%20on%20Cultivated%20Cropland%20A%20Comparison%20of%20CEAP%20I%20and%20CEAP%20II%20Survey%20Data%20and%20Modeling.pdf" target="_blank" rel="noopener">NRCS (2022)</a>',
  historicTillage: '<a href="https://pubs.usgs.gov/ds/ds573/" target="_blank" rel="noopener">USGS/CTIC (2011)</a>',
  precision: '<a href="https://www.ers.usda.gov/publications/105893" target="_blank" rel="noopener">ERS (2023)</a>',
  precisionUpdate: '<a href="https://mssoy.org/sites/default/files/2025-01/McFADDEN%20%20PA%20PROC%202024.pdf" target="_blank" rel="noopener">McFadden et al. (2024)</a>',
  irrigationMethods: '<a href="https://www.ers.usda.gov/data-products/chart-gallery/102972" target="_blank" rel="noopener">ERS (2022)</a>; <a href="https://www.ers.usda.gov/data-products/chart-gallery/113643" target="_blank" rel="noopener">ERS (2026)</a>',
  irrigationSensing: '<a href="https://www.nass.usda.gov/AgCensus/archive/census_parts/2012-2013-farm-and-ranch-irrigation-survey/index.html" target="_blank" rel="noopener">NASS 2013 survey (2014)</a>; <a href="https://www.nass.usda.gov/sites/default/files/publications/agcensus/2017/Online_Resources/Farm_and_Ranch_Irrigation_Survey/fris_1_0023_0023.pdf" target="_blank" rel="noopener">NASS 2018 survey (2019)</a>; <a href="https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Online_Resources/Farm_and_Ranch_Irrigation_Survey/fris_1_025_025.pdf" target="_blank" rel="noopener">NASS 2023 survey (2024)</a>',
  hypoxiaGoal: '<a href="https://www.epa.gov/ms-htf/hypoxia-task-force-action-plans-and-goal-framework" target="_blank" rel="noopener">EPA Hypoxia Task Force (2015)</a>',
  hypoxia: '<a href="https://cfpub.epa.gov/roe/indicator.cfm?i=41" target="_blank" rel="noopener">EPA (2023)</a>; <a href="https://oceanservice.noaa.gov/hazards/hypoxia/" target="_blank" rel="noopener">NOAA (accessed 2026)</a>',
  aquifer: '<a href="https://ne.water.usgs.gov/projects/HPA/summary_statistics.html" target="_blank" rel="noopener">USGS</a>'
};

const NITROGEN_BALANCE = [[1961,14.3557],[1962,16.9587],[1963,17.8207],[1964,20.619],[1965,21.8806],[1966,26.1029],[1967,28.2792],[1968,28.262],[1969,29.234],[1970,33.4466],[1971,30.3379],[1972,32.1923],[1973,35.736],[1974,37.0302],[1975,39.1277],[1976,40.1395],[1977,37.2161],[1978,39.8402],[1979,40.1523],[1980,46.097],[1981,36.8201],[1982,30.7198],[1983,45.5248],[1984,39.8417],[1985,32.9672],[1986,35.2875],[1987,37.8188],[1988,44.9909],[1989,41.1742],[1990,38.8165],[1991,39.8435],[1992,34.5124],[1993,46.1035],[1994,35.7108],[1995,44.3575],[1996,40.9525],[1997,40.3299],[1998,41.2813],[1999,42.1832],[2000,38.6917],[2001,40.4615],[2002,44.8535],[2003,45.0595],[2004,37.5236],[2005,38.2364],[2006,46.7923],[2007,37.8441],[2008,36.3859],[2009,37.9961],[2010,41.3641],[2011,46.4375],[2012,48.2871],[2013,41.3151],[2014,37.9233],[2015,38.6909],[2016,30.761],[2017,37.228],[2018,37.39],[2019,39.1247],[2020,38.6694],[2021,34.764],[2022,41.6844],[2023,35.6041]].map(([year,value]) => ({year,value}));
const NITROGEN_EFFICIENCY = [[1961,62.9419],[1962,59.349],[1963,59.0937],[1964,54.8222],[1965,56.1973],[1966,51.7154],[1967,51.5653],[1968,52.0228],[1969,50.2056],[1970,45.6995],[1971,51.6488],[1972,50.5968],[1973,50.1329],[1974,45.5242],[1975,48.3975],[1976,46.925],[1977,52.2043],[1978,50.574],[1979,53.8191],[1980,46.6345],[1981,56.4154],[1982,61.3733],[1983,43.0903],[1984,52.9423],[1985,59.655],[1986,55.5743],[1987,53.3692],[1988,43.4369],[1989,50.8952],[1990,54.2878],[1991,52.5884],[1992,59.7827],[1993,47.9092],[1994,60.8284],[1995,51.1979],[1996,56.5338],[1997,58.4471],[1998,58.3243],[1999,57.3055],[2000,59.9829],[2001,58.8163],[2002,54.7947],[2003,55.9905],[2004,64.2565],[2005,63.4375],[2006,58.2335],[2007,63.9481],[2008,65.4035],[2009,66.0035],[2010,64.1357],[2011,60.2864],[2012,59.0989],[2013,65.1015],[2014,68.8151],[2015,68.0687],[2016,75.0111],[2017,70.2531],[2018,70.2771],[2019,67.0521],[2020,69.1562],[2021,72.3868],[2022,67.2134],[2023,71.4314]].map(([year,value]) => ({year,value}));

const pct = value => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
const change = values => (values.at(-1).value / values[0].value - 1) * 100;
const single = (name, values) => [{ name, values }];
const format = (value, decimals = 1) => Number(value).toLocaleString("en-US", { maximumFractionDigits: decimals });
const indexToBase = (values, baseYear = 1990, unit = "") => {
  const base = values.find(d => d.year === baseYear)?.value;
  return base ? values.filter(d => d.year >= baseYear).map(d => ({ ...d, rawValue: d.value, rawUnit: unit, baselineYear: baseYear, value: 100 * d.value / base })) : [];
};
const niceScale = (maxValue, intervals = 5) => {
  const paddedMax = Math.max(maxValue * 1.03, Number.EPSILON);
  const roughStep = paddedMax / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction = [1, 2, 2.5, 5, 10].find(value => value >= fraction) || 10;
  const step = niceFraction * magnitude;
  const count = Math.ceil(paddedMax / step);
  return { max: step * count, ticks: Array.from({ length: count + 1 }, (_, index) => step * index) };
};

function axisNumber(value, ticks) {
  const distinct = [...new Set(ticks)].sort((a, b) => a - b);
  const step = Math.min(...distinct.slice(1).map((tick, i) => tick - distinct[i]));
  let decimals = 0;
  while (decimals < 6 && Math.abs(step * 10 ** decimals - Math.round(step * 10 ** decimals)) > 1e-6) decimals++;
  return format(value, decimals);
}
function yearTicks(first, last, plotWidth, minStep = 1) {
  if (first === last) return [first];
  const intervals = Math.max(1, Math.floor(plotWidth / 55));
  const target = Math.max(minStep, (last - first) / intervals);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find(value => value >= target) || 1000;
  const ticks = [];
  for (let year = Math.ceil(first / step) * step; year <= last; year += step) ticks.push(year);
  return ticks;
}
const USDA_PATHWAYS = { petitions: "Petition determinations", rsr: "Regulatory status reviews", confirmations: "Exemption confirmations", air: "Am I Regulated responses" };
let selectedUSDAPathways = new Set(Object.keys(USDA_PATHWAYS));
function filteredUSDAChart(chart) {
  const records = BIOTECH.usdaRecords.filter(([, , pathway]) => selectedUSDAPathways.has(pathway));
  const majorCrops = new Set(BIOTECH.usdaByCrop.map(series => series.name).filter(name => name !== "Other crops"));
  const aggregate = (templates, group) => {
    const annual = new Map();
    records.forEach(([year, crop]) => {
      const key = `${group(crop)}:${year}`;
      annual.set(key, (annual.get(key) || 0) + 1);
    });
    return templates.map((series, index) => {
      let count = 0;
      return { ...series, color: series.color || (series.name === "Canola" ? "#be302f" : series.name === "Other crops" ? "#8c8c8c" : COLORS[index % COLORS.length]), values: series.values.map(point => ({ year: point.year, value: count += annual.get(`${series.name}:${point.year}`) || 0 })) };
    });
  };
  const otherCrops = aggregate(BIOTECH.usdaOtherCrops, crop => crop);
  return { ...chart, series: withCropBreakdown(aggregate(BIOTECH.usdaByCrop, crop => majorCrops.has(crop) ? crop : "Other crops").filter(series => series.values.at(-1).value > 0), otherCrops), otherCrops, recordRows: BIOTECH.usdaDetails.filter(row => selectedUSDAPathways.has(row.pathway)), filteredRecordCount: records.length };
}
function renderUSDAFilter(container, chart) {
  const content = container.parentElement;
  let filter = content.querySelector(".usda-filter");
  if (!chart.usdaFilter) { filter?.remove(); return; }
  if (!filter) {
    filter = document.createElement("details"); filter.className = "usda-filter";
    filter.innerHTML = `<summary>Filter USDA records <small class="usda-filter-count"></small></summary><div class="pathway-presets" role="group" aria-label="Pathway groups"><button type="button" data-pathway-preset="all">All pathways</button><button type="button" data-pathway-preset="reviews">Petitions + reviews</button><button type="button" data-pathway-preset="inquiries">Exemptions + AIR</button></div><fieldset><legend>Include review pathways</legend>${Object.entries(USDA_PATHWAYS).map(([key, name]) => `<label><input type="checkbox" value="${key}" checked> ${name}</label>`).join("")}</fieldset><p class="pathway-filter-note">These groups identify review routes, not whether a crop is transgenic or gene-edited. “Am I Regulated” includes both. Counts are regulatory records, not unique varieties.</p>`;
    container.before(filter);
    const redraw = () => { drawChart(container, container.chartConfig); document.querySelector("#open-tracker").href = standaloneURL(); sendHeight(); };
    filter.addEventListener("change", () => { selectedUSDAPathways = new Set([...filter.querySelectorAll("input:checked")].map(input => input.value)); redraw(); });
    filter.addEventListener("click", event => {
      const preset = event.target.closest("[data-pathway-preset]")?.dataset.pathwayPreset;
      if (!preset) return;
      selectedUSDAPathways = new Set(preset === "all" ? Object.keys(USDA_PATHWAYS) : preset === "reviews" ? ["petitions", "rsr"] : ["confirmations", "air"]);
      redraw();
    });
    filter.addEventListener("toggle", sendHeight);
  }
  filter.querySelectorAll("input").forEach(input => { input.checked = selectedUSDAPathways.has(input.value); });
  const all = selectedUSDAPathways.size === Object.keys(USDA_PATHWAYS).length;
  filter.querySelector(".usda-filter-count").textContent = `${all ? "All pathways" : "Filtered"} · ${chart.filteredRecordCount} records`;
  filter.querySelectorAll("[data-pathway-preset]").forEach(button => {
    const keys = button.dataset.pathwayPreset === "all" ? Object.keys(USDA_PATHWAYS) : button.dataset.pathwayPreset === "reviews" ? ["petitions", "rsr"] : ["confirmations", "air"];
    button.setAttribute("aria-pressed", String(keys.length === selectedUSDAPathways.size && keys.every(key => selectedUSDAPathways.has(key))));
  });
}

const PRODUCT_ORDER = ["beef", "dairy", "pork", "chicken", "eggs", "corn", "cotton", "soy", "wheat"];
const PRODUCT_NAMES = { beef: "Beef", dairy: "Milk", pork: "Pork", chicken: "Chicken", eggs: "Eggs", corn: "Corn", cotton: "Cotton", soy: "Soybeans", wheat: "Wheat" };
const STUDY_NAMES = { beef_rotz_2026: "Rotz et al. (2026)", dairy_rotz_2024: "Rotz et al. (2024)", dairy_capper_cady_2020: "Capper and Cady (2020)", pork_putman_2018: "Putman et al. (2018)", poultry_putman_2017: "Putman et al. (2017)", broiler_thoma_putman_2020: "Thoma and Putman (2020)", eggs_pelletier_2014: "Pelletier et al. (2014)", crops_fieldtomarket_2021: "Field to Market (2021)", farmdoc_monaco_2025: "Monaco et al. (2025)" };
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
const studyNumber = value => {
  const number = Number(value);
  // Two decimal places normally; retain two significant digits for small values.
  const decimals = number && Math.abs(number) < 0.1 ? Math.max(2, 1 - Math.floor(Math.log10(Math.abs(number)))) : 2;
  return number.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const studyRows = metric => {
  const rows = PRODUCT_ORDER.map(product => STUDIES.find(row => row.product === product && row.comparison_role !== "historical" && STUDY_METRICS[metric].includes(row.metric))).filter(Boolean);
  rows.sort((a, b) => {
    const difference = Math.abs(studyChange(a)) - Math.abs(studyChange(b));
    return (STUDY_SORT_DIRECTION === "desc" ? -difference : difference) || PRODUCT_ORDER.indexOf(a.product) - PRODUCT_ORDER.indexOf(b.product);
  });
  return rows;
};
const studyPeriod = row => `${row.base_year}–${row.latest_year}`;
// Annualize each source's reported total change, preserving unrounded-source estimates
// when the displayed endpoints are rounded. All product views share this function.
const annualizedChange = row => Math.expm1(Math.log1p(row.change_pct / 100) / (row.latest_year - row.base_year)) * 100;
const studyChange = row => CHANGE_MODE === "annual" ? annualizedChange(row) : row.change_pct;
const studyDelta = row => {
  const value = studyChange(row);
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(CHANGE_MODE === "annual" ? 2 : 1)}%${CHANGE_MODE === "annual" ? "/yr" : ""}`;
};
const changeToggle = () => `<div class="change-mode-control"><span class="change-mode-label">Percentage change</span><div class="change-mode-toggle" role="group" aria-label="Percentage change period"><button type="button" data-change-mode="total" aria-pressed="${CHANGE_MODE === "total"}">Total</button><button type="button" data-change-mode="annual" aria-pressed="${CHANGE_MODE === "annual"}">Per year</button></div></div>`;
const studySortHeader = () => `<button type="button" class="product-bar-sort" data-study-sort aria-label="Sort by absolute change, ${STUDY_SORT_DIRECTION === "desc" ? "descending" : "ascending"}" title="Sort by absolute change, ${STUDY_SORT_DIRECTION === "desc" ? "descending" : "ascending"}">Change ${STUDY_SORT_DIRECTION === "desc" ? "↓" : "↑"}</button>`;
function studyDetails(row) {
  const name = PRODUCT_NAMES[row.product];
  const measurement = matrixMeasurement(row);
  const source = /^https:\/\//.test(row.source_url) ? `<a href="${escapeHTML(row.source_url)}" target="_blank" rel="noopener">Open study ↗</a>` : "";
  const measure = row.product === "dairy" && row.metric === "cropland" ? "" : row.product === "dairy" && row.metric === "water" ? "Modeled total water use" : { blue_water: "Blue water use", water_consumption: "Water consumption", direct_water: "Direct farm water", irrigation_water: "Irrigation water", cropland: "Feed cropland", fertilizer_n: "Fertilizer nitrogen applied per unit of crop output", reactive_n_loss: "Life-cycle reactive nitrogen lost to air and water", n_leached: "Modeled farm nitrogen leaching below the root zone", marine_eutrophication: "Life-cycle marine eutrophication potential", soil_erosion_output: "Derived soil loss per unit of crop output" }[row.metric];
  const note = row.product === "chicken" && row.metric === "land" ? (row.comparison_note || "").replace("The report rebuilt its 2010 model using matching Agri-Stats data. ", "") : row.comparison_note;
  return `<div class="study-info"><button type="button" class="study-info-trigger" aria-label="Details for ${name}" aria-expanded="false" title="Study details">i</button><div class="study-popover" role="dialog" aria-label="${name} study details"><button type="button" class="study-popover-close" aria-label="Close study details">×</button><strong>${escapeHTML(STUDY_NAMES[row.study_id] || row.study_id)}</strong>${measure ? `<span>${measure}</span>` : ""}<span>${row.base_year}: ${studyNumber(row.base_value)} → ${row.latest_year}: ${studyNumber(row.latest_value)} ${escapeHTML(measurement.unit)}</span>${measurement.basis ? `<span>${escapeHTML(measurement.basis)}</span>` : ""}${note ? `<span>${escapeHTML(note)}</span>` : ""}<span>${escapeHTML(row.source_table)}</span>${source}</div></div>`;
}
const matrixRow = (product, metric) => STUDIES.find(row => row.product === product && row.comparison_role !== "historical" && STUDY_METRICS[metric].includes(row.metric));
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
  return `<td data-metric="${metric}"><button type="button" class="matrix-cell band-${matrixBand(row)}" data-matrix-cell="${metric}" data-product="${product}" aria-label="${escapeHTML(label)}" aria-expanded="false">${rate}</button></td>`;
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
  if (row.product === "dairy" && row.metric === "cropland") unit = unit.replace("m²/", "m² feed cropland/");
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
  return `<div class="matrix-popover-head"><h3>${name} · ${STUDY_METRIC_NAMES[metric]}</h3><button type="button" class="matrix-popover-close" aria-label="Close details">×</button></div>${matrixDetail(matrixRow(product, metric), metric)}${older ? `<details class="matrix-earlier"><summary>Earlier chicken comparison</summary>${matrixDetail(older, metric)}<p>The newer study rebuilt its baseline; the two comparisons come from separate studies.</p></details>` : ""}`;
}
let matrixAnchor = null;
let matrixPinned = false;
let matrixHideTimer;
let restoringMatrixFocus = false;
function closeMatrixPopover(restoreFocus = false) {
  const previousAnchor = matrixAnchor;
  clearTimeout(matrixHideTimer);
  matrixAnchor?.setAttribute("aria-expanded", "false");
  matrixAnchor = null;
  matrixPinned = false;
  panel.querySelector(".matrix-popover")?.remove();
  if (restoreFocus && previousAnchor?.isConnected) {
    restoringMatrixFocus = true;
    previousAnchor.focus({ preventScroll: true });
    restoringMatrixFocus = false;
  }
}
function positionMatrixPopover(anchor, popover) {
  const rect = anchor.getBoundingClientRect();
  const width = popover.getBoundingClientRect().width;
  const height = popover.getBoundingClientRect().height;
  popover.style.left = `${Math.max(10, Math.min(window.innerWidth - width - 10, rect.left))}px`;
  const below = window.innerHeight - rect.bottom;
  if (mobileLayout.matches) { popover.style.left = ""; popover.style.top = ""; return; }
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
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Product study details");
    popover.addEventListener("pointerenter", () => clearTimeout(matrixHideTimer));
    popover.addEventListener("pointerleave", () => { if (!matrixPinned) matrixHideTimer = setTimeout(closeMatrixPopover, 140); });
    popover.addEventListener("toggle", () => { if (matrixAnchor) positionMatrixPopover(matrixAnchor, popover); }, true);
    panel.append(popover);
  }
  popover.innerHTML = matrixPopoverContent(anchor.dataset.product, anchor.dataset.matrixCell);
  anchor.setAttribute("aria-controls", "matrix-details");
  positionMatrixPopover(anchor, popover);
  if (pinned) popover.querySelector("button").focus({ preventScroll: true });
}
function renderProducts() {
  closeMatrixPopover();
  panel.innerHTML = `<div class="panel-lead"><h2 data-editable-key="products:title">Explore changes in product footprints</h2><p data-editable-key="products:subtitle">Annualized change in resource use and environmental impacts per unit of product in the United States.</p></div><div class="matrix-controls"><label for="matrix-metric">Measure</label><select id="matrix-metric">${MATRIX_METRICS.map(metric => `<option value="${metric}">${MATRIX_METRIC_NAMES[metric]}</option>`).join("")}</select></div><div class="matrix-legend" aria-label="Color scale"><span>← Faster annual declines</span><i aria-hidden="true"></i><span>Slower declines →</span></div><div class="matrix-wrap"><table class="product-matrix"><caption data-editable-key="products:matrix-caption">Annualized change in per-unit product footprints, not total sector impacts</caption><thead><tr><th scope="col">Product</th>${MATRIX_METRICS.map(metric => `<th scope="col" data-metric="${metric}">${MATRIX_METRIC_NAMES[metric]}</th>`).join("")}</tr></thead><tbody>${PRODUCT_ORDER.map(product => `<tr class="${product === "corn" ? "matrix-crops-start" : ""}"><th scope="row">${PRODUCT_NAMES[product]}</th>${MATRIX_METRICS.map(metric => matrixCell(product, metric)).join("")}</tr>`).join("")}</tbody></table></div><p class="product-boundary" data-editable-key="products:boundary">Rates are compound annual changes between study endpoints. Study periods, system boundaries and water measures differ; compare changes within each study. Crop soil loss per unit of output is derived from Field to Market's soil loss per acre and planted acres per unit of output. Its 2020 soil-loss figure is the report’s published smoothed trend estimate, using USDA erosion-model inputs through 2017. Select a cell for values, methods and sources.</p>`;
  applySavedTextEdits(panel);
  const metricSelect = panel.querySelector("#matrix-metric");
  metricSelect.value = selectedMatrixMetric;
  const updateMetric = () => {
    selectedMatrixMetric = metricSelect.value;
    panel.querySelectorAll("[data-metric]").forEach(cell => cell.classList.toggle("mobile-metric-hidden", cell.dataset.metric !== selectedMatrixMetric));
    closeMatrixPopover(); document.querySelector("#open-tracker").href = standaloneURL(); sendHeight();
  };
  metricSelect.addEventListener("change", updateMetric);
  updateMetric();
}
function studyBarRows(metric) {
  const rows = studyRows(metric).filter(row => ACTIVE_TOPIC !== 'livestock' || ['beef','dairy','pork','chicken','eggs'].includes(row.product));
  const values = rows.map(studyChange);
  const minChange = Math.min(0, ...values), maxChange = Math.max(0, ...values);
  const extent = Math.max(maxChange - minChange, 0.01);
  const zero = -minChange / extent * 100;
  const bars = panel.querySelector(".product-bars");
  if (bars) bars.style.setProperty("--product-zero", String(zero / 100));
  const axis = panel.querySelector(".product-bar-axis");
  if (axis) axis.innerHTML = ACTIVE_TOPIC === 'livestock'
    ? `<span class="bar-direction">${minChange < 0 ? `−${Math.abs(minChange).toFixed(1)}%` : ""}</span><span class="bar-zero" style="left:${zero}%">0%</span><span class="bar-increase">${maxChange > 0 ? `+${maxChange.toFixed(1)}%` : ""}</span>`
    : `<span class="bar-direction">${minChange < 0 ? "← Decrease" : ""}</span><span class="bar-zero" style="left:${zero}%">0%</span>${maxChange > 0 ? '<span class="bar-increase">Increase →</span>' : ""}`;
  const nitrogenLabels = { fertilizer_n: "Fertilizer N applied", reactive_n_loss: "Reactive N loss", n_leached: "N leached", marine_eutrophication: "Marine eutrophication" };
  const bar = row => {
    const value = studyChange(row);
    const width = Math.abs(value) / extent * 100;
    const left = value > 0 ? zero : zero - width;
    return `<div class="product-bar-row ${metric === "fertilizer_n" ? "nitrogen-product-bar" : ""}"><div class="product-bar-name"><strong>${PRODUCT_NAMES[row.product]}</strong><small>${studyPeriod(row)}</small>${ACTIVE_TOPIC === 'livestock' && metric === 'fertilizer_n' ? `<small>${nitrogenLabels[row.metric]}</small>` : ''}</div><div class="product-bar-track" role="img" aria-label="${PRODUCT_NAMES[row.product]}, ${nitrogenLabels[row.metric] || STUDY_METRIC_NAMES[metric]}, ${studyPeriod(row)}: ${studyDelta(row)}"><span class="${value > 0 ? "increase" : "decrease"}" style="left:${left}%;width:${width}%"></span></div><strong class="product-bar-value">${studyDelta(row)}</strong>${studyDetails(row)}</div>`;
  };
  return rows.map(bar).join("");
}
function studyComparisonNote() {
  return `${CHANGE_MODE === 'annual' ? 'Compound annual change' : 'Total change'} between study endpoints. Periods and methodologies differ across some studies.`;
}
function studyBars(metric) {
  // EDIT PRODUCT CARD TITLES HERE. Keep each key so its tab can find the title.
  const titles = {
    land: "Land-use intensity by product",
    water: "Water-use intensity by product",
    greenhouse_gas: "Life-cycle emissions intensity by product",
    fertilizer_n: "Nitrogen-related measures per unit of product"
  };
  const descriptions = {
    land: "Land or feed-cropland use per unit of product.",
    water: "Water use per unit of product; the specific measure varies by study.",
    greenhouse_gas: "Life-cycle greenhouse-gas emissions per unit of product.",
    fertilizer_n: "Nitrogen applied, lost, leached, or linked to eutrophication per unit of product, depending on the study."
  };
  return `<details class="product-evidence" ${metric === "greenhouse_gas" ? "" : "open"}><summary><span data-editable-key="study:${metric}:title">${titles[metric]}</span></summary><div class="product-evidence-body"><p class="product-evidence-subtitle" data-editable-key="study:${metric}:description">${descriptions[metric]}</p><div class="product-evidence-controls">${changeToggle()}<button type="button" class="product-explore-link">Explore all measures →</button></div><div class="product-bar-sort-row"><span></span><div class="product-bar-axis" aria-label="Change from zero"></div>${studySortHeader()}<span></span></div><div class="product-bars">${studyBarRows(metric)}</div><p class="study-comparison-note" data-editable-key="study:${metric}:comparison-note:${CHANGE_MODE}">${studyComparisonNote()}</p></div></details>`;
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
const CROP_DETAIL_COLORS = COLORS;
function withCropBreakdown(series, otherCrops) {
  const children = [...otherCrops].filter(crop => crop.values.at(-1).value > 0).sort((a, b) => b.values.at(-1).value - a.values.at(-1).value || a.name.localeCompare(b.name)).map((crop, i) => ({ ...crop, color: CROP_DETAIL_COLORS[i % CROP_DETAIL_COLORS.length] }));
  return series.map(item => item.name === "Other crops" ? { ...item, breakdownLabel: "crop breakdown", breakdownSeries: children } : item);
}

function biotechDecisionChart() {
  const common = {
    compactRecords: true, integerTicks: true, recordUnit: "records", type: "stacked", summaryMode: "latest", comparisonMode: "absolute", decimals: 0, hideLegendValues: true, legendReverse: true,
    caption: "Completed USDA regulatory records, not unique varieties or commercial sales. Partial 2026: through October 2.",
    yLabel: "Cumulative records", tooltipUnit: "", totalLabel: "Records shown"
  };
  const usdaSources = '<a href="https://www.aphis.usda.gov/biotechnology/legacy-petition-process/petitions" target="_blank" rel="noopener">USDA petition determinations</a>; <a href="https://www.aphis.usda.gov/regulatory-status-review-table" target="_blank" rel="noopener">regulatory status reviews</a>; <a href="https://www.aphis.usda.gov/confirmation-letters" target="_blank" rel="noopener">exemption confirmations</a>; <a href="https://www.aphis.usda.gov/biotechnology/regulated-article-inquiry" target="_blank" rel="noopener">Am I Regulated letters</a>';
  const download = '<a href="biotech-records.csv" download>Download underlying records (CSV)</a>';
  const eventDownload = '<a href="biotech-epa-events.csv" download>Download identified EPA crop events (CSV)</a>';
  const cropSeries = withCropBreakdown(BIOTECH.usdaByCrop.map(series => ({ ...series, color: series.name === "Canola" ? "#be302f" : series.name === "Other crops" ? "#8c8c8c" : undefined })), BIOTECH.usdaOtherCrops);
  const epa = {
    ...common, yLabel: "Cumulative crop events", totalLabel: "All crops · identified events", comparisonLabel: "additional crop events",
    caption: "Each identified crop event is counted once, including later cancellations. Exempt products are excluded. Partial 2026: through October 2.",
    explanations: [
      { title: "What does this count cover?", body: "This is a minimum count of individually identified crop events in EPA’s registration list. Two older potato listings cover groups of plants without identifying all their individual lines and are excluded. USDA and EPA may review the same crop, so their totals should not be added." },
      { title: "What about PIPs exempt from registration?", body: "Some engineered pest protections similar to those achievable through conventional breeding can qualify for an exemption from EPA registration. These include certain changes to genes from plants that can be crossed, or reducing an existing gene’s activity to create pest resistance. This chart covers registered protections and does not estimate the number of exempt products." }
    ],
    source: `<a href="https://www.epa.gov/ingredients-used-pesticide-products/current-and-previously-registered-section-3-plant-incorporated" target="_blank" rel="noopener">EPA current and previously registered PIPs</a>; <a href="https://downloads.regulations.gov/EPA-HQ-OPP-2016-0036-0013/content.pdf" target="_blank" rel="noopener">EPA’s 2017 potato decision</a>; <a href="https://www.epa.gov/newsreleases/new-citrus-tool-help-prevent-widespread-loss-citrus-crops-and-support-americas-food" target="_blank" rel="noopener">EPA’s 2026 citrus decision</a>; <a href="https://www.epa.gov/pesticides/epa-posts-resources-rule-accelerate-use-plant-incorporated-biotechnologies-protect" target="_blank" rel="noopener">EPA registration exemptions</a>.<p>Ingredients linked to the same named crop event are combined and dated to their first registration in the source table. The potato decision identifies three lines—W8, X17, and Y9—under one ingredient listing. The citrus decision identifies one product with three gene edits. The two unresolved older listings concern New Leaf potatoes and potatoes protected against leaf roll virus. ${eventDownload}; ${download}.</p>`
  };
  const fdaSource = '<a href="https://hfpappexternal.fda.gov/scripts/fdcc/index.cfm?set=NewPlantVarietyConsultations&showAll=true" target="_blank" rel="noopener">Source: FDA, New Plant Variety Consultations inventory</a>; <a href="https://www.fda.gov/food/food-new-plant-varieties/programs-food-new-plant-varieties" target="_blank" rel="noopener">FDA consultation programs</a>.<p>Author’s calculations: one consultation per distinct biotechnology notification file (BNF) number, dated by FDA’s response letter. The inventory’s 223 plant-line rows represent 161 consultation files across 20 crops. Crop labels are standardized: Fuji apple → apple; starch potato → potato; sugar from sugarcane → sugarcane. Other crops combines the remaining 15 crops. Data retrieved October 8, 2026; FDA marks the inventory updated June 10, 2026. The latest listed letter is March 24, 2026; later completions may not yet be published. The earliest listed response letters are in 1995, although FDA dates its first consultation to 1994. Other FDA submission programs and genome-edited plant premarket meetings are excluded. <a href="fda-consultations.csv" download>Download consultation records (CSV)</a>; <a href="fda-consultations-annual.csv" download>Download annual counts (CSV)</a>.</p>';
  const fdaExplanations = [
    { title: "What does a completed consultation mean?", body: "FDA reviews the developer’s assessment of food safety and regulatory issues. It closes a consultation when those issues are resolved, typically with a letter stating it has no further questions. Developers remain responsible for safe, lawful food. This is a voluntary consultation, not a product approval or evidence of sales." },
    { title: "Does this include every gene-edited crop?", body: "No. The program covers genetically engineered crops and some gene-edited crops, but the inventory does not capture every new variety. FDA also offers a separate premarket meeting route for genome-edited plants. Those meetings are excluded, and the inventory does not consistently label breeding methods, so no gene-edited versus transgenic split is inferred. USDA, EPA and FDA may review the same crop; their totals should not be added." }
  ];
  return {
    title: "Biotech crop decisions and food-safety consultations", fullWidth: true,
    views: [
      { ...common, id: "usda-crop", recordRows: BIOTECH.usdaDetails, recordKind: "usda-crop", recordUnit: "records", recordPanel: "USDA records", recordAgency: "USDA", recordColumns: ["Decision date", "Crop / description", "Review pathway", "Outcome", "USDA record"], label: "USDA · by crop", usdaFilter: true, subtitle: "USDA decisions on biotech crops, by crop", series: cropSeries, otherCrops: BIOTECH.usdaOtherCrops,
        source: `${usdaSources}.<p>One record per completed crop petition, regulatory status review, exemption confirmation, or favorable Am I Regulated response. Uses the effective or response date; pending requests and non-crop organisms are excluded. Scope includes food, feed, fiber, tobacco, and biofuel crops. Other crops combines the smaller crop categories. These USDA decisions do not establish FDA or EPA approval or commercial adoption. ${download}.</p>` },
      { ...common, id: "usda-pathway", recordRows: BIOTECH.usdaDetails.map(row => ({ ...row, crop: USDA_PATHWAYS[row.pathway], traits: row.crop })), recordKind: "usda-pathway", recordGroupLabel: "Pathway", recordUnit: "records", recordPanel: "USDA records", recordAgency: "USDA", recordColumns: ["Decision date", "Crop / description", "Crop", "Outcome", "USDA record"], label: "USDA · by review pathway", explanationTitle: "About review pathways", subtitle: "Completed USDA regulatory records by review pathway", series: BIOTECH.usdaByPathway,
        explanations: [
          { title: "Petition determinations", body: "Used from 1992 through the 2021 transition; new petitions resumed March 3, 2025. USDA assesses plant-pest risk and grants nonregulated status to crops previously subject to its rules. The route covers many older transgenic crops." },
          { title: "Regulatory status reviews", body: "April 5, 2021–December 2, 2024. Created by the 2020 SECURE rule, this short-lived replacement for petitions expanded to all plants in October 2021. USDA assessed increased plant-pest risk." },
          { title: "Exemption confirmations", body: "August 17, 2020–December 2, 2024. Created by the 2020 SECURE rule, this process confirmed exemptions for certain changes achievable through conventional breeding, including targeted changes within a plant’s gene pool." },
          { title: "Am I Regulated responses", body: "New inquiries stopped in June 2020 and resumed January 8, 2025. USDA determines whether a plant falls outside its biotechnology regulations and therefore does not need a petition for nonregulated status. Only responses finding plants nonregulated are counted here. This route includes gene-edited and some transgenic crops." }
        ],
        source: `${usdaSources}.<p>Pathways have different criteria and are not equivalent to transgenic versus gene-edited categories. Exemption confirmations and Am I Regulated letters are findings of regulatory status, not product approvals. The 2020 rules were vacated in December 2024; earlier responses remain valid. Public records do not cover every developer self-determination. <a href="https://www.aphis.usda.gov/vacatur-2020-regulations" target="_blank" rel="noopener">USDA’s account of the December 2024 ruling and restarted processes</a>; <a href="https://www.aphis.usda.gov/sites/default/files/brs_2020518.pdf" target="_blank" rel="noopener">2020 rule and phased implementation dates (p. 29815)</a>; <a href="https://www.aphis.usda.gov/news/program-update/aphis-resumes-receipt-petitions-nonregulated-status" target="_blank" rel="noopener">USDA guidance on gene-edited and transgenic plants</a>. ${download}.</p>` },
      { ...epa, id: "epa-crop", recordRows: BIOTECH.epaDetails, recordKind: "epa", recordUnit: "crop events", recordPanel: "EPA crop events", recordAgency: "EPA", recordColumns: ["First registered", "Crop event", "Registration status", "Cancellation year", "EPA source"], label: "EPA · all registrations", subtitle: "Crop events with EPA-registered plant-incorporated protectants (PIPs): pest protection built into the plant itself, such as Bt corn’s insect-killing proteins.", series: BIOTECH.epaEventsByCrop },
      { ...common, id: "fda-crop", label: "FDA · by crop", compactRecords: true, subtitle: "Completed FDA food-safety consultations on biotech crops, by crop",
        integerTicks: true, yLabel: "Cumulative consultations", totalLabel: "All crops · completed consultations", comparisonLabel: "additional consultations", series: withCropBreakdown(BIOTECH.fda.byCrop, BIOTECH.fda.otherCrops), otherCrops: BIOTECH.fda.otherCrops, recordRows: BIOTECH.fda.plantLines, recordKind: "consultations", recordUnit: "consultations",
        caption: "One completed consultation per FDA file, not a product approval. Partial 2026: letters listed through March 24; publication may lag.",
        explanationTitle: "About FDA consultations", explanations: fdaExplanations, source: fdaSource },
      { ...common, id: "fda-meetings", label: "FDA · premarket meetings", subtitle: "FDA premarket meeting records for gene-edited crops",
        integerTicks: true, yLabel: "Cumulative meeting records", totalLabel: "All crops · meeting records", comparisonLabel: "additional meeting records",
        series: withCropBreakdown(BIOTECH.fdaMeetings.byCrop, BIOTECH.fdaMeetings.otherCrops), otherCrops: BIOTECH.fdaMeetings.otherCrops, recordRows: BIOTECH.fdaMeetings.records, recordKind: "meetings", recordUnit: "meeting records", recordPanel: "Premarket meeting records", recordAgency: "FDA", recordColumns: ["Meeting date", "Plant line / designation", "Trait", "Developer", "FDA file"],
        caption: "Voluntary meetings for certain gene-edited foods, not FDA food-safety evaluations or approvals. Partial 2026: meetings listed through July 9; publication may lag.",
        explanationTitle: "About premarket meetings", explanations: [{ title: "How do meetings differ from consultations?", body: "FDA offers these voluntary meetings for certain gene-edited foods. Developers share the steps they have taken to ensure safe, lawful food. A meeting does not represent FDA’s evaluation of a food-safety assessment, and does not replace a full consultation when food-safety questions warrant one. Counts do not confirm sales or cover every gene-edited variety." }],
        source: '<a href="https://hfpappexternal.fda.gov/scripts/fdcc/index.cfm?set=GenomeEditedPlants&showAll=true" target="_blank" rel="noopener">Source: FDA, premarket meeting inventory</a>; <a href="https://www.fda.gov/food/programs-food-new-plant-varieties/premarket-meetings-food-genome-edited-plants" target="_blank" rel="noopener">FDA program description</a>.<p>One record per published VPM identifier: 12 entries across nine crops. VPM 0005-A and 0005-B describe separate rice entries with the same meeting date; both are counted, so the total is inventory records, not distinct meeting sessions. A record can cover multiple plant lines or edits. Dates are meeting dates. Retrieved October 9, 2026; inventory updated August 21, 2026; latest listed meeting July 9, 2026. Publication may lag. <a href="fda-premarket-meetings.csv" download>Download meeting records (CSV)</a></p>' }


    ]
  };
}
function federalAgencyBudgetView() {
  const colors = { "ARS research": "#00a990", "NIFA and predecessor research": "#0d4459", "Other USDA research (ERS, NASS and others)": "#d15627", "Agricultural research facilities": "#8c8c8c", "Forest Service research": "#be302f" };
  const series = DATA.rd.agencyBudgetWithForestry.map(item => ({ ...item, color: colors[item.name], name: item.name === "Other USDA research (ERS, NASS and others)" ? "ERS, NASS, and other USDA research" : item.name === "Agricultural research facilities" ? "USDA research facilities" : item.name }))
    .sort((a, b) => Number(b.name === "USDA research facilities") - Number(a.name === "USDA research facilities"));
  return {
    title: "USDA R&D budget authority",
    subtitle: `Authority to commit federal research and facilities funds, ${Math.min(...series.flatMap(item => item.values.map(point => point.year)))}–${Math.max(...series.flatMap(item => item.values.map(point => point.year)))}`,
    yLabel: "Billion 2024 dollars", tooltipUnit: "billion 2024 dollars", currency: true, hideTooltipSource: true, drilldownOnly: true, type: "stacked", series,
    totalLabel: "USDA budget total", showChangeYears: true, fullWidth: true, hideSourceLists: true,
    caption: `Budget authority for USDA R&D; amounts differ from obligations, outlays and expenditures. ${series.filter(item => item.name.includes("facilities")).flatMap(item => item.values.filter(point => point.value < 0).map(point => `The negative facilities value in ${point.year} cancels earlier authority.`)).join(" ")} 2025 is preliminary, mainly reflecting annualized continuing-resolution funding; reconciliation funding is excluded. BRDPI uses a preliminary 2024 index and projected 2025 index.`,
    source: `<a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab012.pdf" target="_blank" rel="noopener">NCSES, agricultural agency budgets (annual tables)</a>; <a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab011.pdf" target="_blank" rel="noopener">NCSES, Forest Service research (annual tables)</a>; <a href="https://files.eric.ed.gov/fulltext/ED458125.pdf" target="_blank" rel="noopener">NSF, 2000 agency budgets</a>; <a href="https://usda.azureedge.us/sites/default/files/documents/16ars2013notes.pdf" target="_blank" rel="noopener">USDA facility histories</a>; ${sourceLinks.brdpi}. <a href="rd-budget-authority.csv" download>Download budget authority in 2024 dollars</a>.`,
    decimals: 2
  };
}

function performerExpenditureChart() {
  const sources = `<a href="https://www.nifa.usda.gov/data/reeis-research-education-and-economics-information-system" target="_blank" rel="noopener">REEIS State Snapshots</a>; ${sourceLinks.rd}; <a href="https://ncses.nsf.gov/surveys/federal-funds-research-development" target="_blank" rel="noopener">NCSES agency outlays</a>; ${sourceLinks.brdpi}.<p><a href="rd-funder-performer-reconciliation-2026-10-26.csv" download>Funder–performer reconciliation</a>; <a href="rd-performer-expenditures.csv" download>Updated annual performer estimates</a>; <a href="rd-performer-components.csv" download>Institution components</a>; <a href="rd-performer-usda-detail.csv" download>USDA agencies and transfer deduction</a>; <a href="rd-performer-history.csv" download>Historical series</a>; <a href="rd-performer-formula-2021.csv" download>2021 formula expenditures by recipient type</a>; <a href="https://www.nifa.usda.gov/data/data-gateway" target="_blank" rel="noopener">NIFA Data Gateway</a>.</p>`;
  return {
    title: "Public agricultural R&D expenditures by performer",
    subtitle: "ERS history, 1970–2001; updated performer estimates, 2002–2024",
    type: "stacked", yLabel: "Billion 2024 dollars", tooltipUnit: "billion 2024 dollars", currency: true, decimals: 2,
    hideTooltipSource: true, drilldownOnly: true, fullWidth: true, showChangeYears: true, hideSourceLists: true,
    series: RD_UPDATED.performerUpdated, overviewLegendLabel: "All performers",
    caption: "ERS data cover 1970–2001. Estimates for 2002–2024 follow the ERS approach using REEIS institution funding and NCSES USDA outlays, with overlapping transfers deducted once. Private SBIR recipients are excluded. Nonagricultural Minnesota veterinary-school NIH funding is subtracted in 2006–2008. All amounts use 2024 dollars, adjusted with BRDPI.",
    source: sources
  };
}

function agriculturalFundingChart() {
  // Retain the alternative data and view below; set true to restore the selector.
  const enableNCSESFundingView = false;
  const profileSeries = enableNCSESFundingView ? [RD_UPDATED.fundingProfiles.reeis_preferred, RD_UPDATED.fundingProfiles.ncses_herd_alternative] : [RD_UPDATED.fundingProfiles.reeis_preferred];
  const profileTotals = profileSeries.flatMap(series => series[0].values.map(point => series.reduce((sum, item) => sum + (item.values.find(value => value.year === point.year)?.value || 0), 0)));
  const fixedY = niceScale(Math.max(...profileTotals));
  const sourceYears = profileSeries.flatMap(series => series.flatMap(item => item.values.map(point => point.year)));
  const common = { yMax: fixedY.max, yTicks: fixedY.ticks, xMin: Math.min(...sourceYears), xMax: Math.max(...sourceYears), type: "stacked", yLabel: "Billion 2024 dollars", tooltipUnit: "billion 2024 dollars", currency: true, decimals: 2, fullWidth: true, showChangeYears: true, hideTooltipSource: true, drilldownOnly: true, hideSourceLists: true,
    caption: "USDA agencies and facilities use NCSES cash outlays. REEIS NIFA combines formula expenditure reports and nonformula grant obligations. REEIS state, nongovernment and other-federal values are reported project expenditures, which can include unliquidated obligations. Pre-2002 values use CRIS expenditure summaries. Nonagricultural Minnesota NIH funding is removed in 2006–2008. 2023–2024 industry and institution-generated amounts may be incomplete or regrouped; most other-federal support lacks agency detail. Values are in 2024 dollars using BRDPI.",
    source: `<a href="https://www.nifa.usda.gov/data/reeis-research-education-and-economics-information-system" target="_blank" rel="noopener">REEIS State Snapshots</a>; <a href="https://ncses.nsf.gov/surveys/federal-funds-research-development" target="_blank" rel="noopener">NCSES agency outlays</a>; ${sourceLinks.herd}; ${sourceLinks.brdpi}.<p><a href="rd-funder-performer-reconciliation-2026-10-26.csv" download>Funder–performer reconciliation</a>; <a href="rd-funding-components.csv" download>Funding components and source provenance</a>; <a href="rd-funding-totals.csv" download>Totals by source option</a>; <a href="rd-funding-drilldowns.csv" download>Funding detail by program, agency and recipient</a>; <a href="rd-nonusda-source-comparison.csv" download>Other-federal recipient source comparison</a>; <a href="https://www.nifa.usda.gov/about-nifa/what-we-do/types-federal-assistance" target="_blank" rel="noopener">NIFA grant types</a>.</p><p>Scope: includes support reported for SBIR grant-recipient institutions; the performer chart excludes these institutions.</p>` };
  const sourceViews = [
    { ...common, source: common.source.replace(`${sourceLinks.herd}; `, ""), id: "funding-reeis", label: "NIFA REEIS", subtitle: "Federal, state and nongovernment spending and support, with historical CRIS reports", series: RD_UPDATED.fundingProfiles.reeis_preferred },
    { ...common, id: "funding-ncses-herd", label: "NSF NCSES", subtitle: "NIFA outlays and other federal university expenditures from NSF NCSES; state and nongovernment support from REEIS", series: RD_UPDATED.fundingProfiles.ncses_herd_alternative }
  ];
  return { title: "Agricultural R&D funding by funder", fullWidth: true, resetFocusOnViewChange: true, hideViewControls: !enableNCSESFundingView, showViewLabel: enableNCSESFundingView, viewLabel: "Select source for NIFA and other federal estimates", views: enableNCSESFundingView ? sourceViews : [sourceViews[0]] };
}

function federalSpendingDetailChart() {
  const common = { type: "stacked", yLabel: "Billion 2024 dollars", tooltipUnit: "billion 2024 dollars", decimals: 2, showChangeYears: true,
    caption: "Only the other-federal recipient component changes between these views. This diagnostic repeats the USDA payments to show the source difference; it is not additional spending and should not be added to charts 1 or 3.",
    explanationTitle: "Comparing recipient sources",
    explanations: [
      { title: "What changes with the source?", body: "Only the non-USDA recipient component changes. NCSES/HERD covers university agricultural sciences. REEIS covers the six cooperating-institution categories, excluding SBIR and USDA agency performers; its scope includes forestry, veterinary schools and other cooperating institutions. The two values are not estimates of identical populations." },
      { title: "How the composite avoids overlap", body: "USDA agency R&D and facilities outlays are counted gross. Only research financed by other federal agencies is added. USDA-financed university funding is not added again. REEIS Minnesota NIH corrections are applied once in 2007–2008. The unavailable live2021 value is filled from the retained REEIS funder-by-performer table, excluding SBIR; its source vintage is unknown." }
    ],
    source: `${sourceLinks.herd}; <a href="https://www.nifa.usda.gov/data/reeis-research-education-and-economics-information-system" target="_blank" rel="noopener">REEIS State Snapshots</a>; ${sourceLinks.brdpi}.<p><a href="rd-federal-spending.csv" download>NCSES federal composite</a>; <a href="rd-nonusda-source-comparison.csv" download>Non-USDA recipient source comparison</a>.</p>` };
  return { title: "Source check: other-federal recipient research", fullWidth: true, viewLabel: "Non-USDA recipient source", views: [
    { ...common, id: "federal-ncses", label: "NCSES / HERD universities", subtitle: "NCSES/HERD recipient values added to the same USDA payments; a source check, not a second national expenditure estimate", series: RD_UPDATED.federalComposites.ncses },
    { ...common, id: "federal-reeis", caption: "Only the other-federal recipient component changes; USDA payments are identical. 2021 uses a retained REEIS table with unknown vintage. This diagnostic is not additional spending.", label: "REEIS cooperating institutions", subtitle: "REEIS recipient values added to the same USDA payments; coverage differs from HERD universities", series: RD_UPDATED.federalComposites.reeis }
  ] };
}

function fittedTFPGrowth(windowYears) {
  const tfp = DATA.rd.productivityComparison;
  const values = new Map(tfp.values.map(point => [point.year, point.value]));
  return tfp.values.filter(point => values.has(point.year - windowYears)).map(point => {
    const years = Array.from({ length: windowYears + 1 }, (_, i) => point.year - windowYears + i);
    const center = point.year - windowYears / 2;
    const meanLog = years.reduce((sum, year) => sum + Math.log(values.get(year)), 0) / years.length;
    const slope = years.reduce((sum, year) => sum + (year - center) * (Math.log(values.get(year)) - meanLog), 0) / years.reduce((sum, year) => sum + (year - center) ** 2, 0);
    return { year: point.year, value: 100 * Math.expm1(slope), source: `Fitted annual growth over ${point.year - windowYears}–${point.year}; ${windowYears + 1} annual observations.` };
  });
}

function configureTFPTrend(chart, windowYears) {
  const growth = fittedTFPGrowth(windowYears);
  const low = Math.min(0, ...growth.map(point => point.value));
  const high = Math.max(0, ...growth.map(point => point.value));
  const step = niceScale(high - low).ticks[1];
  const yMin = Math.floor(low / step) * step, yMax = Math.max(yMin + step, Math.ceil(high / step) * step);
  return { ...chart, smoothingYears: windowYears,
    subtitle: `Annual growth in total factor productivity, smoothed over ${windowYears} years`,
    xMin: growth[0].year, xMax: growth.at(-1).year,
    yMin, yMax, yTicks: Array.from({ length: Math.round((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step),
    series: [{ name: 'TFP growth', color: '#0d4459', values: growth }],
    caption: `TFP measures farm output per unit of combined inputs. Each point fits ${windowYears + 1} annual observations over the preceding ${windowYears} years; longer windows respond more slowly to recent changes.` };
}

function renderTFPWindowControl(container, chart) {
  let control = container.parentElement.querySelector('.chart-smoothing-control');
  if (!chart.smoothingWindow) { control?.remove(); return; }
  if (!control) {
    control = document.createElement('label'); control.className = 'chart-smoothing-control';
    control.innerHTML = 'Smoothing window <output></output><input type="range" min="5" max="30" step="1" aria-label="Smoothing window in years">';
    container.before(control);
    control.querySelector('input').addEventListener('input', event => {
      container.smoothingYears = Number(event.target.value);
      drawChart(container, container.chartConfig); sendHeight();
    });
  }
  control.querySelector('output').textContent = `${chart.smoothingYears} years`;
  const input = control.querySelector('input'); input.value = chart.smoothingYears;
  input.setAttribute('aria-valuetext', `${chart.smoothingYears} years`);
}

function rdProductivityChart() {
  const tfp = DATA.rd.productivityComparison;
  const values = new Map(tfp.values.map(point => [point.year, point.value]));
  // Published ERS national accounts table, June 2026; full-period total omitted.
  const boundaries = [1948, 1953, 1957, 1960, 1969, 1973, 1979, 1981, 1990, 2000, 2007, 2019, 2023];
  const rates = [0.02, 0.79, 3.67, 1.68, 2.20, 0.48, 4.36, 2.23, 1.47, 0.34, 0.51, 3.19];
  const economic = rates.map((value, i) => ({ year: boundaries[i+1], startYear: boundaries[i], periodLabel: `${boundaries[i]}–${boundaries[i+1]}`, value,
    source: 'Published USDA ERS economic-period annual growth rate, June 2026.' }));
  const decades = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2023];
  const decadal = decades.slice(1).map((end, i) => ({ year: end, startYear: decades[i], periodLabel: `${decades[i]}–${end}`,
    value: 100 * Math.expm1(Math.log(values.get(end) / values.get(decades[i])) / (end - decades[i])),
    source: `Compound annual growth over ${decades[i]}–${end}, calculated from USDA ERS national TFP indices.${end - decades[i] < 10 ? ' Partial decade.' : ''}` }));
  const common = { yLabel: 'Percent per year', tooltipUnit: '% per year', tickSuffix: '%', decimals: 2,
    hideLegendValues: true, hideLabelYears: true, showChangeYears: false, useSourceLabels: true, sourceDetails: false };
  const periodBars = { ...common, hideTooltipSource: true, type: 'period-bars', hideSeriesLabels: true, yMin: 0, yMax: 5, yTicks: [0, 1, 2, 3, 4, 5] };
  const source = '<a href="https://ers.usda.gov/data-products/agricultural-productivity-in-the-united-states" target="_blank" rel="noopener">USDA ERS (2026)</a>';
  return { title: 'Agricultural productivity growth', fullWidth: true, viewLabel: 'Choose growth measure', views: [
    configureTFPTrend({ ...common, id: 'tfp-trend', label: 'Smoothed trend', smoothingWindow: true, hideSeriesLabels: true, source }, 15),
    { ...periodBars, id: 'tfp-economic', label: 'Economic periods', subtitle: 'Average annual growth in total factor productivity by ERS economic period',
      series: [{ name: 'TFP growth', values: economic }],
      caption: 'ERS periods follow peaks in U.S. economic activity and vary in length. TFP measures farm output per unit of combined inputs.',
      source: '<a href="https://ers.usda.gov/data-products/agricultural-productivity-in-the-united-states/productivity-growth-in-us-agriculture" target="_blank" rel="noopener">USDA ERS (2026)</a>' },
    { ...periodBars, id: 'tfp-decades', label: 'Decades', subtitle: 'Average annual growth in total factor productivity by decade',
      series: [{ name: 'TFP growth', values: decadal }],
      caption: 'Compound annual growth calculated from ERS indices. The last period (2020–2023) is a partial decade.', source }
  ] };
}

function livestockCharts() {
  const l = DATA.livestock;
  const link = (url, label) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
  const download = '<a href="livestock-productivity.csv" download>Download livestock observations (CSV)</a>';
  const ncc = `${link('https://www.nationalchickencouncil.org/about-the-industry/statistics/u-s-broiler-performance/', 'National Chicken Council, U.S. Broiler Performance')}.<p>Industry compilation, 1925–2025, retrieved October 17, 2026. Broiler feed efficiency is the reciprocal of the reported feed conversion ratio, shown as pounds of live weight per pound of feed. NCC attributes its table to USDA and other reliable sources but does not identify each observation’s underlying source or sampling error. Earlier observations are spaced five or ten years apart; 2005–2025 is annual. It is a long-run performance benchmark, not a harmonized USDA survey series. ${download}.</p>`;
  const dairy = `${link('https://www.ers.usda.gov/sites/default/files/_laserfiche/publications/109626/ERR-334.pdf', 'USDA ERS, Structure, Costs, and Technology Used on U.S. Dairy Farms (2024), figures 7–12 and 15–16')}.<p>National estimates from ARMS dairy surveys in 2000, 2005, 2010, 2016 and 2021. Automatic take-offs were not asked in 2016; those values are absent. Dashed lines connect surveyed years, not annual observations. Milk-sales shares cover all sales from farms reporting any use, not the fraction of individual cows treated or milk produced with a technology. Breeding technologies combine artificial insemination, embryo transfer and/or sexed semen; they do not measure genomic selection specifically. Practices overlap and should not be added. ${download}.</p>`;
  const indexed = (series, year) => ({ ...series, values: series.values.filter(point => point.year >= year).map(point => ({ ...point,
    rawValue: point.value, rawUnit: series.unit, baselineYear: year,
    value: 100 * point.value / series.values.find(p => p.year === year).value })) });
  const percentChange = (series, year) => {
    const baseline = series.values.find(point => point.year === year).value;
    return { ...series, values: series.values.map(point => ({ ...point,
      rawValue: point.value, rawUnit: series.unit, baselineYear: year, baselineValue: baseline, displayMode: 'percent-change',
      value: 100 * (point.value / baseline - 1) })) };
  };
  const feedEfficiency = (series, name, unit) => ({ ...series, name, unit,
    calculation: 'Feed efficiency = 1 / feed conversion',
    values: series.values.map(point => ({ ...point, sourceValue: point.value, sourceUnit: series.unit, value: 1 / point.value })) });
  const annual = { showAllPoints: true, decimals: 2, showChangeYears: true };
  const share = { ...annual, hideLinePoints: true, xTicks: [2000, 2005, 2010, 2015, 2020], yLabel: 'Percent', tooltipUnit: '%', tickSuffix: '%',
    yMin: 0, yMax: 100, yTicks: [0,25,50,75,100], summaryMode: 'latest', latestYearLabel: true, showChangeYears: false, decimals: 0 };
  const scaleSource = `${link('https://www.govinfo.gov/content/pkg/GOVPUB-A93-PURL-gpo224091/pdf/GOVPUB-A93-PURL-gpo224091.pdf', 'USDA ERS (2018)')}; ${link('https://ers.usda.gov/amber-waves/2020/february/consolidation-in-u-s-agriculture-continues', 'USDA ERS (2020)')}`;
  const environmentSource = `${link('product-studies.json', 'Download the existing product-study comparisons (JSON)')}.<p>Uses the same selected studies, endpoints, product bases and reported changes as By product. Bars show within-study change; annual rates are equivalent compound rates between endpoints, not measured annual trends. Study periods, system boundaries and water measures differ. Select each row’s details for its source, original values and units. The 2010–2020 chicken report is industry commissioned and not peer reviewed; its rebuilt baseline must not be joined to the older 1965–2010 study.</p>`;
  const charts = [
    { title: 'Broiler productivity', subtitle: 'Change from 1925 to 2025 in feed efficiency (live weight per unit of feed), survival to market, market weight and market age. Every series starts at 0% change in 1925.',
      yLabel: 'Change from 1925', tooltipUnit: '%', tickSuffix: '%', decimals: 0, summaryMode: 'latest', latestYearLabel: true, yMin: -100, yMax: 200, yTicks: [-100,-50,0,50,100,150,200],
      series: [
        percentChange(feedEfficiency(l.broilers.feed, 'Broiler feed efficiency', 'lb live weight per lb feed'),1925),
        { ...percentChange(l.broilers.survival,1925), name: 'Survival to market', calculation: 'Survival (%) = 100 - mortality (%)', values: percentChange(l.broilers.survival,1925).values.map(point => ({ ...point, sourceValue: l.broilers.mortality.values.find(item => item.year === point.year)?.value, sourceUnit: 'percent mortality' })) },
        { ...percentChange(l.broilers.weight,1925), name: 'Market weight' },
        { ...percentChange(l.broilers.age,1925), name: 'Market age' }
      ],
      caption: 'The chart compares relative change across different measures. Hover or focus a point for its absolute value and unit. Survival is 100 minus reported mortality; it is not chick hatchability or first-week survival. Genetics, nutrition, housing and health management contribute jointly.', source: ncc },
    { title: 'Pig productivity', subtitle: 'Change from 2004 in feed efficiency (live-weight gain per unit of feed) and pigs weaned per litter. Each series is indexed to 2004 = 0% change.',
      yLabel: 'Change from 2004', tooltipUnit: '%', tickSuffix: '%', decimals: 0, summaryMode: 'latest', latestYearLabel: true, yMin: -50, yMax: 40, yTicks: [-50,-25,0,25,40],
      series: [
        percentChange(feedEfficiency(l.hogFeed[0], 'Farrow-to-finish feed efficiency', 'lb live-weight gain per lb feed'),2004),
        percentChange(feedEfficiency(l.hogFeed[1], 'Feeder-to-finish feed efficiency', 'lb live-weight gain per lb feed'),2004),
        { ...percentChange({ ...l.litter, name: 'Pigs weaned per litter', unit: 'pigs per litter' },2004), dasharray: '4 3' }
      ],
      caption: 'Farrow-to-finish includes breeding and piglet production; feeder-to-finish covers the finishing stage. Litter values are pigs weaned, not all piglets born. Markers show reported survey years; unavailable years are not filled.',
      source: `${link('https://ers.usda.gov/sites/default/files/_laserfiche/publications/45148/40364_err158.pdf', 'USDA ERS (2013)')}; ${link('https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Hog_Inventory/', 'USDA NASS survey')}; ${link('https://esmis.nal.usda.gov/publication/hogs-and-pigs/2025-12-23', 'USDA NASS (2025)')}.<p>Hog feed efficiency is the reciprocal of feed conversion (reported lb feed per hundredweight of gain divided by 100), shown as lb live-weight gain per lb feed. Feed conversion observations are from the 1992 Farm Costs and Returns Survey and 1998, 2004 and 2009 ARMS. Pigs weaned per litter uses annual December–November periods; 2006–2008 and 2022 are unavailable. Latest revisions were taken from archived December releases and may differ from later Quick Stats revisions. Absolute plotted values and units are retained in tooltips; the CSV preserves source observations. These indicators have different output bases and are shown as within-series percentage changes, not as directly comparable quantities. ${download}.</p>` },
    { title: 'Dairy technology and feeding practices', viewLabel: 'Choose adoption denominator', views: [
      { ...share, id: 'dairy-sales', label: 'Share of milk sales', subtitle: 'Share of U.S. milk sales from farms using each practice', hideCaption: true, series: l.dairyAdoption.sales,
        caption: 'Larger adopters account for more milk sales than their share of farms. These are overlapping practices, not additive shares.', source: dairy },
      { ...share, id: 'dairy-farms', label: 'Share of farms', subtitle: 'Share of U.S. dairy farms using each practice', hideCaption: true, series: l.dairyAdoption.farms,
        caption: 'Breeding technologies spread selected genetics; computerized systems help match feeding and milking to animal needs.', source: dairy }
    ]},
    { ...annual, hideLinePoints: true, title: 'Livestock operation size', subtitle: 'Change in the midpoint operation size, 1987–2017, indexed to 1987 = 100. Hogs and dairy consolidated faster than beef cow herds.',
      id: 'scale-index', yLabel: 'Index (1987 = 100)', tooltipUnit: 'index points', decimals: 0, series: l.scale.map(s => indexed(s,1987)),
      caption: 'Half of the animals are on larger operations and half on smaller ones. Scale can support technology use, but this is not a productivity measure.', source: scaleSource },
    { title: 'Environmental efficiency of livestock production', fullWidth: true, viewLabel: 'Choose environmental measure', views: [
      ...['greenhouse_gas','land','water','energy','fertilizer_n'].map(metric => ({ id: `livestock-${metric}`, label: metric === 'fertilizer_n' ? 'Nitrogen-related' : STUDY_METRIC_NAMES[metric],
        type: 'livestock-studies', metric, subtitle: metric === 'fertilizer_n'
          ? 'Beef reactive N loss, milk N leaching and chicken marine eutrophication per unit of product. These are different measures; compare changes within each study.'
          : 'Change per unit of product in the existing U.S. life-cycle studies. Periods and methods differ.', source: environmentSource }))
    ]}
  ];
  const methods = {
    'Broiler productivity': 'Feed efficiency is the reciprocal of feed conversion. NCC compiles industry benchmarks from USDA and other sources; observation-level methods are not fully documented. Earlier observations are spaced five or ten years apart.',
    'Pig productivity': 'Feed efficiency is the reciprocal of feed conversion, from the 1992 FCRS and 1998, 2004 and 2009 ARMS surveys. Piglet counts use December–November periods; 2006–2008 and 2022 are unavailable.',
    'Dairy technology and feeding practices': 'ARMS dairy surveys cover 2000, 2005, 2010, 2016 and 2021. Automatic take-offs were not asked in 2016. Practices overlap and should not be added. Breeding technologies combine artificial insemination, embryo transfer and sexed semen.',
    'Livestock operation size': 'Seven Census years, 1987–2017. Broilers, fed cattle and hogs use annual sales or removals; cow series use year-end inventories. These historical estimates do not describe current farm sizes.',
    'Environmental efficiency of livestock production': 'System boundaries and water measures differ by study. The 2010–2020 chicken report was industry commissioned and not peer reviewed; its rebuilt baseline must not be joined to the older 1965–2010 study.'
  };
  charts.forEach(chart => {
    chart.solidLines = true; chart.publicMethods = methods[chart.title]; chart.fullWidth = true; chart.hideLegendValues = true; chart.hideLabelYears = true; chart.latestYearLabel = false;
    if (['Broiler productivity', 'Pig productivity', 'Livestock operation size'].includes(chart.title)) chart.sourceDetails = false;
    if (['Broiler productivity', 'Pig productivity'].includes(chart.title)) chart.hideSourceDetails = true;
    if (['Pig productivity', 'Livestock operation size'].includes(chart.title)) chart.useSourceLabels = true;
    chart.views?.forEach(view => {
      view.solidLines = true; view.publicMethods = methods[chart.title] + (view.id === 'dairy-sales' ? ' Milk-sales shares count all sales from farms reporting any use of a practice.' : ''); view.hideLegendValues = true; view.hideLabelYears = true; view.latestYearLabel = false;
      if (view.id === 'dairy-sales' || view.id === 'dairy-farms') {
        view.sourceDetails = false; view.hideSourceDetails = true;
      }
      if (chart.title === 'Environmental efficiency of livestock production') view.hideSourceDetails = true;
    });
  });
  return charts;
}

function climateInventorySeries() {
  const series = DATA.climate.inventoryCategories || [];
  const small = series.filter(s => /field burning|liming|urea fertilization|rice cultivation/i.test(s.name));
  const main = series.filter(s => !small.includes(s));
  if (!small.length) return main;
  const years = [...new Set(small.flatMap(s => s.values.map(p => p.year)))].sort((a,b) => a-b);
  return [...main, { name: 'Other', values: years.map(year => ({ year, value: small.reduce((total,s) => total + (s.values.find(p => p.year === year)?.value || 0), 0) })),
    breakdownSeries: small, breakdownLabel: 'smaller IPCC sources', breakdownNote: 'Rice cultivation, urea fertilization, liming, and field burning of agricultural residues.' }];
}

const TOPICS = {
  livestock: () => ({
    title: 'How livestock productivity has changed',
    why: 'Selective breeding, better nutrition and feeding, disease control, improved housing, and labor-saving systems have helped producers obtain more output from feed, animals and labor. Larger and more specialized operations can make some of these practices easier to use. The charts track practices and performance; they do not assign a share of national productivity growth to each driver.',
    happened: 'Broilers need much less feed per pound of live weight than in the early industry, while reaching heavier weights at younger ages. U.S. piglets saved per litter rose from 8.94 in 2004 to 11.79 in 2025. Dairy technology adoption and the scale of production have also changed. Environmental impacts per unit often fell, but the study comparisons below have different periods and boundaries, and do not show that every total impact declined.',
    charts: livestockCharts()
  }),
  overview: () => ({
    title: "Output is decoupling from resource use and impacts",
    intro: "",
    why: "U.S. agriculture covers about 40 percent of the country's land and accounts for approximately 80 percent of its consumptive water use. At this scale, changes in resource use and emissions have broad consequences. Comparing output with these pressures shows whether more production also brings proportionate increases in environmental impact.",
    happened: "From 1990 to each series' latest year (2023, except water withdrawals, which end in 2015), farm output rose 53.9 percent and total factor productivity rose 42.7 percent. Direct agricultural greenhouse-gas emissions rose 8.0 percent, while land use fell 8.3 percent and water withdrawals fell 11.9 percent. Output therefore grew faster than direct emissions, while the land and water measures declined as production grew. These selected indicators show decoupling on these measures; they do not show that every environmental pressure fell.",
    charts: [
      {
        title: "Agricultural output, inputs, and impacts",
        labelLeaders: ["Water withdrawals"],
        sourceDetails: false,
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
          { name: "Direct GHG emissions", values: indexToBase(DATA.overview.ghg, 1990, "million metric tons CO2e") },
          { name: "Water withdrawals", values: indexToBase(DATA.water.total, 1990, "billion gallons per day") },
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
        xTicks: [1970, 1980, 1990, 2000, 2010, 2020], useSourceLabels: true, sourceDetails: false, hideSourceDetails: true,
        preferDirectLabels: true,
        subtitle: "",
        yLabel: "Harvested hectares per metric ton",
        tooltipUnit: "harvested hectares per metric ton",
        caption: "Harvested land per unit of crop output; cotton measures lint and corn measures grain. 2023–2025 estimates may be revised.",
        series: DATA.land.intensity.filter(d => d.name !== "Rice"),
        source: `<a href="https://esmis.nal.usda.gov/sites/default/release-files/795853/croptr26.pdf" target="_blank" rel="noopener">USDA NASS</a>; <a href="https://esmis.nal.usda.gov/sites/default/release-files/796123/crop1026.pdf" target="_blank" rel="noopener">USDA NASS (2026)</a>.<p>Author's calculations use harvested area divided by production. Corn, soybeans and wheat convert bushels to metric tons using 56, 60 and 60 pounds per bushel, respectively. Cotton uses published lint yield; 2025 values use the October 2026 NASS update. Planted and harvested area include all cotton. 2023–2025 estimates may be revised. <a href="land-nass-2026.csv" download>Download the underlying data (CSV)</a>.</p>`,
        decimals: 2
      },
      {
        title: "Planted area",
        xTicks: [1970, 1980, 1990, 2000, 2010, 2020], useSourceLabels: true, sourceDetails: false, hideSourceDetails: true,
        preferDirectLabels: true,
        subtitle: "",
        yLabel: "Million acres",
        tooltipUnit: "million acres",
        caption: "Corn is planted area for all purposes; cotton includes all cotton. The 2026 figures are preliminary; 2023–2025 may also be revised.",
        series: DATA.land.area,
        source: `<a href="https://esmis.nal.usda.gov/sites/default/release-files/795853/croptr26.pdf" target="_blank" rel="noopener">USDA NASS</a>; <a href="https://esmis.nal.usda.gov/sites/default/release-files/796123/crop1026.pdf" target="_blank" rel="noopener">USDA NASS (2026)</a>.<p>Planted acreage for all purposes; the October update supplies revised 2025 and preliminary 2026 estimates. 2023–2026 estimates may be revised. <a href="land-nass-2026.csv" download>Download the underlying data (CSV)</a>.</p>`,
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
        xTicks: [1970, 1980, 1990, 2000, 2010, 2020], hideSeriesLabels: true,
        subtitle: "N inputs minus N removed in crops",
        yLabel: "Kilograms N per hectare",
        tooltipUnit: "kilograms N per hectare",
        series: single("Nitrogen surplus", NITROGEN_BALANCE),
        source: sourceLinks.nitrogen,
        decimals: 1
      },
      {
        title: "Nitrogen-use efficiency",
        xTicks: [1970, 1980, 1990, 2000, 2010, 2020], hideSeriesLabels: true,
        subtitle: "Share of nitrogen inputs removed in crops",
        yLabel: "Percent",
        tooltipUnit: "%",
        series: single("Nitrogen-use efficiency", NITROGEN_EFFICIENCY),
        source: sourceLinks.nitrogen,
        decimals: 1
      },
      {
        title: "Gulf dead zone area",
        hideSeriesLabels: true, hideLegendValues: true,
        subtitle: "Mid-summer area with bottom-water oxygen below 2 mg/L",
        yLabel: "Square miles",
        tooltipUnit: "square miles",
        type: "bar",
        series: single("Measured area", DATA.nitrogen.hypoxia),
        rollingSeries: { name: "Last five surveyed summers", calculation: "Mean of the five most recent surveyed summers", values: DATA.nitrogen.hypoxia_average },
        goalValue: 5000 / 2.589988110336,
        summaryMode: "latest",
        fullWidth: true,
        caption: "",
        goalLabel: "EPA 2035 Goal",
        source: `${sourceLinks.hypoxia}; ${sourceLinks.hypoxiaGoal}`, useSourceLabels: true, sourceDetails: false,
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
        hideSeriesLabels: true,
        subtitle: "U.S. irrigation and livestock withdrawals, including nonfarm irrigation.",
        sourceDetails: false,
        sourceSuffix: ". Surface-water and groundwater withdrawals including farms, golf courses, and other landscapes.",
        yLabel: "Billion gallons per day",
        tooltipUnit: "billion gallons per day",
        series: single("Withdrawals", DATA.water.total),
        source: `${sourceLinks.water}.<p>1960–2015: the sum of USGS national irrigation and livestock withdrawal estimates at five-year intervals. These are surface-water and groundwater withdrawals, not consumptive use. USGS irrigation includes farms, golf courses, and other irrigated landscapes; aquaculture is excluded from this sum.</p>`,
        decimals: 0
      },
      {
        title: "Water-withdrawal intensity",
        hideSeriesLabels: true,
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
        compactAxisHeader: true,
        subtitle: "",
        accessibleDescription: "Area-weighted average across eight states; negative values indicate a decline from predevelopment, about 1950.",
        yLabel: "Feet relative to predevelopment (~1950)",
        tooltipUnit: "feet relative to predevelopment",
        relativeToPredevelopment: true,
        yMin: -20, yMax: 0, yTicks: [-20, -15, -10, -5, 0],
        series: single("High Plains aquifer", DATA.water.high_plains_decline.map(point => ({ ...point, value: -point.value }))),
        summaryMode: "latest",
        fullWidth: true,
        caption: "Area-weighted average across eight states. Negative values indicate declines.",
        hideSingleSeriesSummary: true,
        useSourceLabels: true, sourceDetails: false,
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
        caption: "For each herbicide, the amount applied per area is divided by the dose lethal to half of test rats; the results are added. Lower values mean lower potential hazard.",
        subtitle: "Potential short-term hazard to mammals from herbicide use",
        yLabel: "Acute quotient",
        tooltipUnit: "acute quotient",
        series: DATA.herbicides.acute.filter(d => d.name !== "Rice"),
        source: sourceLinks.herbicide,
        decimals: 0
      },
      {
        title: "Chronic hazard quotient",
        caption: "For each herbicide, the amount applied per area is divided by the dose with no observed effects in two-year rat studies; the results are added. Lower values mean lower potential hazard.",
        subtitle: "Potential long-term hazard to mammals from herbicide use",
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
        labelLeaders: false,
        subtitle: "",
        yLabel: "Tons per acre per year",
        tooltipUnit: "tons per acre per year",
        series: DATA.soil.rate,
        source: sourceLinks.soil,
        decimals: 2,
        fullWidth: false
      },
      {
        title: "Soil erosion by crop",
        preferDirectLabels: true,
        subtitle: "",
        yLabel: "Tons per acre per year",
        tooltipUnit: "tons per acre per year",
        series: DATA.soil.by_crop,
        source: sourceLinks.fieldToMarketSoil,
        sourceSuffix: ", smoothed estimates based on USDA NRI surveys and erosion models through 2017.",
        sourceDetails: false, hideCaption: true, caption: "",
        decimals: 1,
        fullWidth: false
      }
    ]
  }),
  practices: () => ({
    title: "Farm practices that target inputs, protect soil, and sustain yields",
    intro: "",
    why: "Farm technologies and management practices can help sustain yields while targeting inputs, conserving water, and protecting soil. Their effects depend on the crop, location, and how they are used.",
    happened: "Genetically engineered seeds are widely used in corn, soybeans, and cotton. The charts also track tillage, cover crops, irrigation systems, precision tools, and biotechnology decisions. Adoption varies across practices and crops; the series cover different years and populations.",
    charts: [
      {
        title: "Genetically engineered seed",
        subtitle: "Pest and weed traits help protect yields and can support reduced tillage.",
        yLabel: "Percent of planted acres nationally",
        tooltipUnit: "%",
        tickSuffix: "%",
        yMin: 0, yMax: 100, yTicks: [0, 25, 50, 75, 100],
        series: DATA.practices.ge,
        summaryMode: "latest", latestYearLabel: true,
        caption: "",
        source: sourceLinks.ge,
        decimals: 0,
        fullWidth: true
      },
      {
        title: "Soil cover and tillage",
        preferDirectLabels: true, hideLegendValues: true, hideLabelYears: true,
        subtitle: "Less disturbance and winter cover curb erosion, retain moisture, and protect yield potential.",
        yLabel: "Percent of relevant acres", tooltipUnit: "%", tickSuffix: "%",
        yMin: 0, yMax: 50, yTicks: [0, 10, 20, 30, 40, 50],
        series: [
          { name: "No-till", color: "#0d4459", sourceBoundary: { earlierEnd: 2004, laterStart: 2012 }, solidSourceSegments: true, values: [
            ...DATA.practices.historic_tillage[0].values.map(point => ({ ...point, source: "CTIC/USGS" })),
            ...DATA.practices.census[0].values.map(point => ({ ...point, source: "Census of Agriculture" }))
          ] },
          { ...DATA.practices.census[1], name: "Reduced tillage", color: "#d15627" },
          { ...DATA.practices.census[2], name: "Cover crops", color: "#00a990" }
        ],
        summaryMode: "latest", latestYearLabel: true, decimals: 1, fullWidth: true,
        caption: "Across crops; acreage bases differ: surveyed planted acres (earlier no-till), reported tillage acres (later tillage), and total cropland (cover crops).",
        source: `${sourceLinks.historicTillage}; ${sourceLinks.censusPractices}; ${sourceLinks.censusLand}`, useSourceLabels: true, sourceDetails: false
      },
      {
        title: "Irrigation technology",
        subtitle: "Pressurized systems, such as sprinklers and drip irrigation, can apply water more evenly and limit field losses.",
        yLabel: "Million irrigated acres", tooltipUnit: "million acres",
        yMin: 0, yMax: 35, yTicks: [0, 5, 10, 15, 20, 25, 30, 35],
        series: [
          { ...DATA.practices.irrigation[0], name: "Pressurized", color: "#00a990" },
          { ...DATA.practices.irrigation[1], name: "Gravity", color: "#0d4459" }
        ],
        summaryMode: "latest", latestYearLabel: true, decimals: 1, fullWidth: true,
        legendShare: true,
        caption: "Data cover 17 Western states.",
        source: sourceLinks.irrigationMethods, useSourceLabels: true, sourceDetails: false
      },
      {
        title: "Precision, nutrient, and water-management tools",
        hideLabelYears: true, latestYearLabel: false,
        subtitle: "Mapping, guidance, fertilizers, and sensors target inputs while supporting yields.",
        yLabel: "Percent adoption", tooltipUnit: "%", tickSuffix: "%",
        yMin: 0, yMax: 70, yTicks: [0, 10, 20, 30, 40, 50, 60, 70],
        series: [
          { ...DATA.practices.precision[0], name: "Yield maps · corn acres", color: "#0d4459" },
          { ...DATA.practices.precision[2], name: "Guidance/auto-steer · corn acres", color: "#00a990" },
          { ...DATA.practices.ceap[0], name: "Enhanced-efficiency fertilizer · cultivated acres", color: "#d15627" },
          { ...DATA.practices.ceap[1], name: "Variable-rate technology · cultivated acres", color: "#be302f" },
          { ...DATA.practices.soil_moisture_sensing[0], name: "Soil-moisture sensing · irrigating farms", color: "#ecbba7", dasharray: "5 4" }
        ],
        summaryMode: "latest", latestYearLabel: false, decimals: 1, fullWidth: true,
        caption: "Series use different denominators: corn acres, cultivated cropland, or irrigating farms, as labeled. CEAP estimates represent survey periods, not annual observations.",
        source: `${sourceLinks.ceap}; ${sourceLinks.irrigationSensing}`, useSourceLabels: true, sourceDetails: false
      },
      biotechDecisionChart()
    ]
  }),
  climate: () => ({
    title: "U.S. agricultural emissions remain above 1990 levels",
    intro: "",
    why: "Agriculture emits methane, nitrous oxide, and carbon dioxide from soils, livestock, manure, and energy use. Total emissions show the sector's contribution to warming; limiting climate change requires these emissions to fall.",
    happened: "Direct U.S. agricultural emissions were 595 million metric tons CO₂e in 2023, 8 percent above 1990. EPA's estimates by economic sector are higher, including on-farm fuel combustion. The product studies below compare life-cycle emissions per unit for specific products over their study periods; their boundaries differ from the EPA sector totals.",
    charts: [
      {
        title: "U.S. agricultural emissions",
        views: [
          {
            id: "inventory",
            label: "By IPCC category", // View button
            totalLabel: "Inventory total", // Summed change in the legend
            subtitle: "",
            yLabel: "Million metric tons CO₂e",
            tooltipUnit: "million metric tons CO₂e",
            type: "stacked",
            series: climateInventorySeries(),
            source: sourceLinks.epaExplorer,
            decimals: 0
          },
          {
            id: "economic",
            label: "By economic category", // View button
            totalLabel: "Economic-sector total", // Summed change in the legend
            subtitle: "",
            yLabel: "Million metric tons CO₂e",
            tooltipUnit: "million metric tons CO₂e",
            type: "stacked",
            series: DATA.climate.economicCategories || [],
            source: sourceLinks.epaExplorer,
            decimals: 0
          }
        ]
      }
    ]
  }),
  products: () => ({}),
  rd: () => {
    return {
      title: "Public agricultural R&D remains below its peak",
      why: "In the United States, public agricultural research supports yields, resource efficiency, animal health, and environmental performance. Because its benefits can take decades to emerge, sustained investment matters.",
      happened: "Updated performer estimates extend through 2024 and remain below the early-2000s peak after inflation. Funding and expenditures are shown separately, with source options for REEIS and NCSES. Agricultural productivity continued to rise, but these parallel trends do not establish the effect of research spending.",
      charts: [
        agriculturalFundingChart(),
        performerExpenditureChart(),
        {
          title: "Public agricultural R&D intensity",
          fullWidth: true,
          hideTooltipSource: true, drilldownOnly: true, hideSourceDetails: true,
          subtitle: "Public agricultural and food R&D spending as a share of gross farm value added, 1970–2024",
          yLabel: "% of gross farm value added",
          tooltipUnit: "%",
          tickSuffix: "%",
          series: single("R&D intensity", DATA.rd.intensity || []),
          caption: "Spending follows the performer chart: ERS history through 2001 and updated estimates for 2002–2024. The share uses current-dollar spending and BEA farm value added, comparing fiscal-year research spending with calendar-year farm value added.",
          source: `${sourceLinks.rd}; ${sourceLinks.bea}. <a href="rd-intensity.csv" download>Download spending, farm value added and intensity</a>.`,
          decimals: 1
        },
        federalAgencyBudgetView(),
        rdProductivityChart()
        // Retained for restoration: federalSpendingDetailChart()
      ]
    };
  }
};

function renderTopic(id) {
  if (!TOPICS[id] || id === ACTIVE_TOPIC) return;
  const navigating = ACTIVE_TOPIC !== null;
  const previousScroll = window.scrollY;
  if (ACTIVE_TOPIC && ACTIVE_TOPIC !== "products") rememberChartState();
  ACTIVE_TOPIC = id;
  closeMatrixPopover();
  hideTooltip();
  document.querySelectorAll(".topic-nav button").forEach(button => {
    button.setAttribute("aria-selected", String(button.dataset.topic === id));
    button.tabIndex = button.dataset.topic === id ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", `topic-tab-${id}`);
  document.querySelector("#topic-select").value = id;
  if (id === "products") {
    renderProducts();
    document.querySelector("#chart-position").textContent = "By product: product footprint comparisons";
    finishTopicNavigation(id, navigating, previousScroll);
    return;
  }
  const topic = TOPICS[id]();
  const intro = topic.intro?.trim() ? `<p data-editable-key="topic:${id}:intro">${topic.intro}</p>` : "";
  const commentary = [
    ["why", "Why does it matter?", topic.why],
    ["happened", "What happened?", topic.happened]
  ].filter(([, , text]) => text?.trim());
  const commentaryMarkup = commentary.length
    ? `<details class="topic-context" ${mobileLayout.matches ? "" : "open"}><summary>Context</summary><div class="commentary-grid ${commentary.length === 1 ? "single" : ""}">${commentary.map(([key, title, text]) => `<section><h3 data-editable-key="topic:${id}:${key}:title">${title}</h3><p data-editable-key="topic:${id}:${key}:body">${text}</p></section>`).join("")}</div></details>`
    : "";
  panel.innerHTML = `<div class="panel-lead"><div><h2 data-editable-key="topic:${id}:title">${topic.title}</h2>${intro}</div></div>
    ${commentaryMarkup}
    <div class="charts ${topic.charts.length === 1 ? "single" : ""}">${topic.charts.map((chart, index) => chartCard(chart, index, id)).join("")}</div>
    ${({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[id] ? studyBars(({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[id]) : ""}`;
  applySavedTextEdits(panel);
  topic.charts.forEach((chart, index) => {
    const savedView = CHART_STATES.get(`${id}:${index}`)?.view;
    const active = chart.views?.find(view => view.id === (savedView === "epa-active" ? "epa-crop" : savedView)) || chart.views?.[0] || chart;
    panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === active.id)));
    const chartContainer = panel.querySelector(`[data-chart="${index}"]`);
    if (chart.legendAddons) chartContainer.toggleAddon = flag => {
      const flags = (chartContainer.chartConfig.addonFlags || 0) ^ flag;
      chartContainer.focusedSeries = null; chartContainer.focusedChild = null;
      switchChartView(chartContainer, chart.views.find(view => view.addonFlags === flags));
      chartContainer.parentElement.querySelector(`[data-${flags & flag ? "hide" : "enable"}-addon="${flag}"]`)?.focus({ preventScroll: true });
    };
    drawChart(panel.querySelector(`[data-chart="${index}"]`), active);
    const addons = [...panel.querySelectorAll(`[data-chart-addon="${index}"]`)];
    addons.forEach(input => {
      input.checked = Boolean(active.addonFlags & Number(input.value));
      input.addEventListener("change", () => {
        const flags = addons.reduce((sum, item) => sum + (item.checked ? Number(item.value) : 0), 0);
        const container = panel.querySelector(`[data-chart="${index}"]`);
        container.focusedSeries = null; container.focusedChild = null;
        switchChartView(container, chart.views.find(view => view.addonFlags === flags));
      });
    });
    panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(button => button.addEventListener("click", () => {
      const view = chart.views.find(item => item.id === button.dataset.view);
      panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      const container = panel.querySelector(`[data-chart="${index}"]`);
      if (chart.resetFocusOnViewChange) { container.focusedSeries = null; container.focusedChild = null; }
      switchChartView(container, view);
    }));
  });
  applySavedTextEdits(panel);
  panel.querySelectorAll(".chart-card").forEach(card => card.addEventListener("toggle", sendHeight));
  panel.querySelector(".product-explore-link")?.addEventListener("click", () => renderTopic("products"));
  panel.querySelector(".product-evidence")?.addEventListener("toggle", sendHeight);
  panel.querySelectorAll(".source-disclosure").forEach(details => details.addEventListener("toggle", sendHeight));
  panel.querySelectorAll(".chart-card, .product-evidence").forEach((card, index) => {
    if (CARD_STATES.has(`${id}:${index}`)) card.open = CARD_STATES.get(`${id}:${index}`);
  });
  const metric = ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[id];
  if (metric) panel.querySelector(".product-bars").innerHTML = studyBarRows(metric);
  panel.querySelector(".topic-context")?.addEventListener("toggle", sendHeight);
  finishTopicNavigation(id, navigating, previousScroll);
}

function rememberChartState() {
  panel.querySelectorAll("[data-chart]").forEach(container => {
    const card = container.closest(".chart-card");
    CHART_STATES.set(`${ACTIVE_TOPIC}:${container.dataset.chart}`, { view: container.chartConfig?.id || card.querySelector('[data-chart-view][aria-pressed="true"]')?.dataset.view });
  });
  panel.querySelectorAll(".chart-card, .product-evidence").forEach((card, index) => CARD_STATES.set(`${ACTIVE_TOPIC}:${index}`, card.open));
}
function finishTopicNavigation(id, navigating, previousScroll) {
  history.replaceState(null, "", `#${id}`);
  document.querySelector("#open-tracker").href = standaloneURL();
  const cards = [...panel.querySelectorAll(".chart-card, .product-evidence")];
  installMobileChartNavigation(cards);
  MOBILE_CHART = Math.min(CHART_CHOICES.get(id) || 0, Math.max(0, cards.length - 1));
  selectMobileChart(MOBILE_CHART, false);
  updateToolbarSize();
  if (navigating && previousScroll > document.querySelector(".explorer-toolbar").offsetTop) scrollToPanel();
  sendHeight();
}
function scrollToPanel() {
  requestAnimationFrame(() => {
    panel.scrollIntoView({ block: "start", behavior: "instant" });
    if (IS_EMBEDDED && !document.fullscreenElement) window.parent.postMessage({ type: "bti-intensification-navigate" }, parentOrigin());
  });
}
function installMobileChartNavigation(cards) {
  if (cards.length < 2) return;
  cards.forEach(card => {
    card.classList.add("has-chart-navigation");
    const frame = document.createElement("div");
    frame.className = "mobile-chart-frame";
    card.before(frame); frame.append(card);
    const summary = card.querySelector("summary");
    const count = document.createElement("span");
    count.className = "mobile-chart-count";
    summary.append(count);
    [-1, 1].forEach(step => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "mobile-chart-arrow";
      button.dataset.chartStep = String(step);
      button.textContent = step < 0 ? "←" : "→";
      // Keep navigation outside the disclosure so it remains available when collapsed.
      frame.append(button);
    });
  });
}
function selectMobileChart(index, scroll = true) {
  const cards = [...panel.querySelectorAll(".chart-card, .product-evidence")];
  if (!cards.length) return;
  MOBILE_CHART = Math.max(0, Math.min(index, cards.length - 1));
  CHART_CHOICES.set(ACTIVE_TOPIC, MOBILE_CHART);
  cards.forEach((card, i) => {
    const heading = card.querySelector(":scope > summary");
    if (heading) {
      if (mobileLayout.matches) { heading.setAttribute("role", "group"); heading.tabIndex = -1; card.open = true; }
      else { heading.removeAttribute("role"); heading.removeAttribute("tabindex"); }
    }
    card.classList.toggle("mobile-selected", i === MOBILE_CHART);
    card.closest(".mobile-chart-frame")?.classList.toggle("mobile-selected-frame", i === MOBILE_CHART);
  });
  if (mobileLayout.matches) {
    cards[MOBILE_CHART].open = true;
    const container = cards[MOBILE_CHART].querySelector("[data-chart]");
    if (container?.chartConfig) drawChart(container, container.chartConfig);
  }
  cards.forEach((card, i) => {
    const previous = card.parentElement.querySelector('[data-chart-step="-1"]');
    const next = card.parentElement.querySelector('[data-chart-step="1"]');
    if (!previous || !next) return;
    previous.disabled = i === 0; next.disabled = i === cards.length - 1;
    const name = item => item.querySelector('h3, summary [data-editable-key]')?.textContent || "Chart";
    previous.setAttribute("aria-label", i ? `Previous chart: ${name(cards[i - 1])}` : "Previous chart");
    next.setAttribute("aria-label", i < cards.length - 1 ? `Next chart: ${name(cards[i + 1])}` : "Next chart");
    card.querySelector('.mobile-chart-count').textContent = `Chart ${i + 1} of ${cards.length}`;
  });
  document.querySelector("#chart-position").textContent = `${cards[MOBILE_CHART].querySelector("h3, summary [data-editable-key]")?.textContent || "Chart"}. Chart ${MOBILE_CHART + 1} of ${cards.length}`;
  document.querySelector("#open-tracker").href = standaloneURL();
  if (scroll && mobileLayout.matches) scrollToPanel();
  sendHeight();
}

function chartCard(chart, index, topicId) {
  const active = chart.views?.[0] || chart;
  const controls = chart.hideViewControls || chart.legendAddons ? "" : chart.addonControls ? `<div class="view-toggle funding-addons" role="group" aria-label="Add funding sources">${[[1,"State support"],[2,"Nongovernment support"]].map(([flag,label]) => `<label><input type="checkbox" data-chart-addon="${index}" value="${flag}"> ${label}</label>`).join("")}</div>` : chart.views ? `<div class="view-toggle" role="group" aria-label="${chart.viewLabel || "Choose chart view"}">${chart.views.map((view, viewIndex) => `<button type="button" data-chart-view="${index}" data-view="${view.id}" aria-pressed="${viewIndex === 0}">${view.label}</button>`).join("")}</div>` : "";
  const heading = chart.title ? `<h3 data-editable-key="topic:${topicId}:chart:${index}:title">${chart.title}</h3>` : "";
  return `<details class="chart-card ${chart.fullWidth ? "full-width" : ""} ${chart.compactAxisHeader ? "compact-axis-header" : ""}" open><summary class="chart-card-heading">${heading}</summary><div class="chart-card-content"><p class="chart-subtitle" data-editable-key="topic:${topicId}:chart:${index}:subtitle" data-subtitle="${index}">${active.subtitle || ""}</p>${chart.showViewLabel ? `<p class="change-note">${escapeHTML(chart.viewLabel)}</p>` : ""}${controls}<div class="chart-wrap" data-chart="${index}"></div><div class="series-summary" data-summary="${index}"></div><details class="source-disclosure"><summary>Sources</summary><div class="source-line"></div></details></div></details>`;
}

function formatValue(chart, value, series) {
  if (series?.tooltipUnit !== undefined) chart = { ...chart, tooltipUnit: series.tooltipUnit, decimals: series.decimals ?? chart.decimals };
  if (chart.currency) {
    const millions = Math.abs(value) < 0.1;
    return `${format(millions ? value * 1000 : value, Math.min(chart.decimals ?? 2, 2))} ${millions ? "million" : "billion"} 2024 dollars`;
  }
  if (chart.relativeToPredevelopment) {
    if (value === 0) return "at predevelopment level";
    return `${format(Math.abs(value), chart.decimals ?? 1)} feet ${value < 0 ? "below" : "above"} predevelopment`;
  }
  const number = format(value, chart.decimals ?? 1);
  return chart.tooltipUnit?.startsWith("%") ? `${number}${chart.tooltipUnit}` : `${number} ${chart.tooltipUnit || ""}`.trim();
}

function switchChartView(container, chart) {
  const content = container.parentElement, controls = content.querySelector(".view-toggle") || content.querySelector(".chart-subtitle");
  const before = controls.getBoundingClientRect().top, scrollBefore = window.scrollY;
  const expandedHeight = [...content.querySelectorAll("details[open]")].reduce((sum, details) => sum + details.getBoundingClientRect().height - details.querySelector("summary").getBoundingClientRect().height, 0);
  content.viewHeight = Math.max(content.viewHeight || 0, content.getBoundingClientRect().height - expandedHeight);
  // Keep the document from briefly shrinking while the old SVG is replaced.
  content.style.minHeight = `${content.getBoundingClientRect().height}px`;
  drawChart(container, chart);
  applySavedTextEdits(content);
  content.style.minHeight = chart.compactRecords ? "" : `${content.viewHeight}px`;
  const restore = () => {
    if (content.isConnected) window.scrollTo({ top: scrollBefore + controls.getBoundingClientRect().top - before, behavior: "instant" });
  };
  restore();
  cancelAnimationFrame(content.viewFrame);
  content.viewFrame = requestAnimationFrame(() => { restore(); sendHeight(); });
  document.querySelector("#open-tracker").href = standaloneURL();
}

// Keys follow the existing title/subtitle convention. View-specific prose gets a
// separate suffix so edits survive redraws without replacing another view's text.
function chartTextKey(chart, field) {
  return chart.textEditKey ? `${chart.textEditKey}:${field}` : "";
}
function chartEditableText(chart, field, value, tag = "p", className = "") {
  const key = chartTextKey(chart, field);
  return `<${tag}${className ? ` class="${escapeHTML(className)}"` : ""}${key ? ` data-editable-key="${escapeHTML(key)}"` : ""}>${escapeHTML(value)}</${tag}>`;
}
function chartExplanationMarkup(chart) {
  return (chart.explanations || []).map((item, index) => `<section>${chartEditableText(chart, `explanation:${index}:title`, item.title, "h4")}${chartEditableText(chart, `explanation:${index}:body`, item.body)}</section>`).join("");
}

function colorChartSeries(chart) {
  const assign = (series, stacked) => {
    // Pale brand accents work as areas; thin lines use the stronger official inks.
    const palette = stacked ? COLORS : COLORS.filter(color => color !== '#ecbba7' && (color !== '#0dc3a8' || ['dairy-sales', 'dairy-farms'].includes(chart.id)));
    const cropColors = { Corn:'#0d4459', Soybean:'#00a990', Cotton:'#d15627', Potato:'#be302f', Tomato:'#ecbba7', Canola:'#be302f', Pennycress:'#000000', 'Other crops':'#8c8c8c', Rice:'#ecbba7', Papaya:'#be302f', Plum:'#ecbba7', Citrus:'#8c8c8c' };
    const preferred = series.map((item, index) => {
      const color = chart.recordRows && chart.recordKind !== 'usda-pathway' ? cropColors[item.name] || item.color : item.color;
      return palette.includes(color) ? color : palette[index % palette.length];
    });
    const used = new Set(), reserved = new Set(preferred);
    return series.map((item, index) => {
      let color = preferred[index];
      if (used.has(color)) color = palette.find(value => !used.has(value) && !reserved.has(value)) || palette.find(value => !used.has(value)) || palette[index % palette.length];
      const repeated = used.has(color); used.add(color);
      return { ...item, color,
        ...(item.breakdownSeries ? { breakdownSeries: assign(item.breakdownSeries, true) } : {}),
        ...(item.breakdownVariants ? { breakdownVariants: item.breakdownVariants.map(variant => ({ ...variant, breakdownSeries: assign(variant.breakdownSeries, true) })) } : {}) };
    });
  };
  return { ...chart, series: assign(chart.series || [], chart.type === 'stacked'), overlaySeries: assign(chart.overlaySeries || [], false) };
}

function brandSwatch(series) { return series.color; }
function brandAreaFill(svg, series) { return series.color; }

function visibleChartSeries(container, chart, scope = "overview") {
  const key = `${ACTIVE_TOPIC}:${container.dataset.chart}:${chart.id || "default"}:${scope}`;
  const choices = [...(chart.series || []), ...(chart.overlaySeries || []).filter(series => !series.hideInLegend).map(series => ({ ...series, isOverlay: true }))].filter(series => !series.addonFlag);
  // Existing optional-support controls own addon visibility. Single-series and
  // annual-bar/rolling-average charts keep their existing, specialized controls.
  if (chart.type !== "stacked" || choices.length < 2) return chart;
  const hidden = SERIES_VISIBILITY.get(key) || new Set();
  const isVisible = series => !hidden.has(series.name) || Boolean(series.addonFlag);
  const series = chart.series.filter(isVisible), overlaySeries = (chart.overlaySeries || []).filter(isVisible);
  const hiddenSeries = choices.filter(item => hidden.has(item.name));
  const result = { ...chart, series, overlaySeries, visibilityHiddenSeries: hiddenSeries, visibility: { key, label: scope === "overview" ? `${chart.title || "chart"} overview` : `${scope.slice("detail:".length)} breakdown`, choices, order: [...chart.series, ...(chart.hiddenLegendSeries || []), ...(chart.hiddenOverlaySeries || []), ...(chart.overlaySeries || [])].map(series => series.name), hidden: hiddenSeries.map(item => item.name), change: (name, showAll = false) => {
    const next = new Set(SERIES_VISIBILITY.get(key) || []);
    if (showAll) next.clear(); else if (next.has(name)) next.delete(name); else next.add(name);
    SERIES_VISIBILITY.set(key, next);
    // Overview choices should immediately control the plotted selection, including
    // when a label or a record previously opened a focused category.
    if (scope === "overview") { container.focusedSeries = null; container.focusedChild = null; }
    const card = container.closest(".chart-card");
    drawChart(container, container.chartConfig);
    const selector = showAll ? "[data-series-show-all]" : "[data-series-visibility]";
    const target = [...card.querySelectorAll(selector)].find(button => button.dataset.visibilityScope === key && (showAll || button.dataset.seriesVisibility === name));
    const fallback = [...card.querySelectorAll("[data-series-visibility]")].find(button => button.dataset.visibilityScope === key);
    const focusTarget = target && !target.disabled ? target : fallback;
    if (focusTarget?.closest('.chart-series-selector')) { focusTarget.closest('.chart-series-selector').open = true; focusTarget.closest('.chart-options').open = true; }
    focusTarget?.focus({ preventScroll: true });
    sendHeight();
  } } };
  if (hiddenSeries.length) {
    delete result.yMax; delete result.yTicks;
    if (result.totalLabel) result.totalLabel = `${result.totalLabel} · visible selection`;
  }
  return result;
}

function decorateSeriesVisibility(summary, chart) {
  const visibility = chart.visibility;
  if (!visibility) return;
  const header = document.createElement("div"); header.className = "series-visibility-header";
  const label = document.createElement("p"); label.textContent = "Select series to show";
  header.append(label);
  if (chart.recordRows) {
    const scope = document.createElement("small"); scope.textContent = "Chart only; record tables retain all categories."; header.append(scope);
  }
  const reset = document.createElement("button"); reset.type = "button"; reset.textContent = "Show all"; reset.dataset.seriesShowAll = ""; reset.dataset.visibilityScope = visibility.key;
  reset.setAttribute("aria-label", `Show all series in ${visibility.label}`); reset.disabled = !visibility.hidden.length; reset.hidden = !visibility.hidden.length; reset.addEventListener("click", () => visibility.change(null, true)); header.append(reset);
  const caption = summary.querySelector(":scope > .change-note");
  if (caption) caption.after(header); else summary.prepend(header);
  const seen = new Set();
  summary.querySelectorAll(":scope > span").forEach(row => {
    const item = [...visibility.choices].sort((a, b) => b.name.length - a.name.length).find(series => row.dataset.visibilitySeries === series.name || row.textContent.trim() === series.name || row.textContent.trim().startsWith(series.name + " "));
    if (!item || seen.has(item.name)) return;
    seen.add(item.name);
    const shown = !visibility.hidden.includes(item.name);
    row.classList.add("series-visibility-row");
    const selection = document.createElement("label"); selection.className = "series-visibility-choice";
    const input = document.createElement("input"); input.type = "checkbox"; input.checked = shown;
    input.dataset.seriesVisibility = item.name; input.dataset.visibilityScope = visibility.key;
    input.setAttribute("aria-label", item.name); input.style.setProperty("--series-color", item.color); input.style.setProperty("--series-swatch", brandSwatch(item));
    const rgb = /^#([a-f0-9]{6})$/i.exec(item.color || "");
    const light = rgb && [0, 2, 4].reduce((sum, offset, i) => sum + parseInt(rgb[1].slice(offset, offset + 2), 16) * [0.299, 0.587, 0.114][i], 0) > 155;
    input.style.setProperty("--check-ink", light ? "#0d4459" : "#fff");
    input.addEventListener("change", () => visibility.change(item.name));
    const label = row.querySelector("b, .other-crops-button");
    const text = document.createElement("b"); text.innerHTML = label?.innerHTML || escapeHTML(item.name);
    // Keep the color key, label, and selection in one generous click target.
    selection.append(input);
    const swatch = row.querySelector(":scope > i, :scope > svg");
    // The persistent colored checkbox is also the legend key.
    swatch?.remove();
    selection.append(text); row.replaceChildren(selection);


  });
}

// Explicit source assignments are verified against the builders and source rows.
function chartDownloadSources(chart) {
  const title = chart.title || '';
  const sources = {
    'Farm output': `USDA ERS, Agricultural Productivity (${sourceLinks.productivity.match(/href="([^"]+)"/)[1]})`,
    'Total factor productivity': `USDA ERS, Agricultural Productivity (${sourceLinks.productivity.match(/href="([^"]+)"/)[1]})`,
    'Land use': `USDA ERS, Agricultural Productivity: land input (${sourceLinks.productivity.match(/href="([^"]+)"/)[1]})`,
    'Direct GHG emissions': `EPA, U.S. Greenhouse Gas Inventory (${sourceLinks.epa.match(/href="([^"]+)"/)[1]})`,
    'Water withdrawals': `USGS Water Use (${sourceLinks.water.match(/href="([^"]+)"/)[1]})`
  };
  if (ACTIVE_TOPIC === 'overview') return { ...chart, series: chart.series.map(series => ({ ...series, exportSource: sources[series.name] })) };
  if (ACTIVE_TOPIC === 'land' && /Land-use intensity|Planted area/.test(title)) {
    return { ...chart, series: chart.series.map(series => ({ ...series, values: series.values.map(point => ({ ...point,
      exportSource: point.year >= 2025
        ? 'USDA NASS, Crop Production (https://esmis.nal.usda.gov/sites/default/release-files/796123/crop1026.pdf)'
        : 'USDA NASS, Historical Track Records (https://esmis.nal.usda.gov/sites/default/release-files/795853/croptr26.pdf)'
    })) })) };
  }
  return chart;
}

// Export definitions describe the data calculation, not the optional display mode.
function chartDownloadMetadata(chart) {
  const title = chart.title || '';
  const metadata = chart.sourceSuffix ? { exportCaveat: chart.sourceSuffix.replace(/^[.,\s]+/, '') } : {};
  if (ACTIVE_TOPIC === 'rd' && /2024 dollars/.test(chart.yLabel || '')) metadata.exportCalculation = '2024 dollars using NIH/BEA BRDPI; published ERS history retains its original deflator vintage';
  if (/Agricultural output, inputs, and impacts/.test(title)) Object.assign(metadata, {
    exportIndexed: true, exportBaselineYear: 1990,
    exportCalculation: 'Index = 100 × value / 1990 value'
  });
  if (/Land-use intensity/.test(title)) Object.assign(metadata, {
    exportCalculation: 'Harvested hectares / production in metric tons (inverse yield); corn, soybeans, wheat: 56, 60, 60 lb/bushel; cotton: lint',
    exportCaveat: '2023–2025 estimates may be revised.'
  });
  if (/Water-withdrawal intensity/.test(title)) Object.assign(metadata, {
    exportIndexed: true, exportBaselineYear: 1960,
    exportCalculation: '100 × (withdrawals / agricultural output index) / (1960 withdrawals / 1960 output index)'
  });
  if (chart.id === 'scale-index') Object.assign(metadata, {
    exportIndexed: true, exportBaselineYear: 1987,
    exportCalculation: 'Index = 100 × midpoint operation size / 1987 midpoint operation size',
    exportCaveat: 'Midpoint: half the animals are on larger operations and half on smaller ones.'
  });
  if (/intensity/i.test(title) && ACTIVE_TOPIC === 'rd') Object.assign(metadata, {
    exportCalculation: '100 × nominal performer spending / nominal farm gross value added',
    exportCaveat: 'ERS through 2001; calculated estimates from 2002. Fiscal-year research includes food and forestry; farm value added is calendar-year.'
  });
  if (/Acute toxicity quotient/.test(title)) metadata.exportCalculation = 'Sum across herbicides of applied amount per area / rat LD50';
  if (/Chronic hazard quotient/.test(title)) metadata.exportCalculation = 'Sum across herbicides of applied amount per area / no-observed-effect dose in two-year rat studies';
  if (/Agricultural water withdrawals/.test(title)) metadata.exportCalculation = 'USGS irrigation withdrawals + livestock withdrawals';
  if (chart.id === 'tfp-decades') metadata.exportCalculation = '100 × ((end TFP / start TFP)^(1 / years) - 1)';
  if (chart.smoothingWindow) metadata.exportCalculation = `100 × (exp(OLS log-TFP slope) - 1), over ${chart.smoothingYears} preceding years`;
  if (chart.id === 'tfp-economic') metadata.exportCaveat = 'Published ERS annual growth rates for economic periods of differing length.';
  if (/Broiler productivity/.test(title)) metadata.exportCaveat = 'Industry compilation; observations are not a harmonized USDA survey series.';
  if (/Pig productivity/.test(title)) metadata.exportCaveat = 'Survey-year feed conversion; litter periods are December–November. Missing years are not zero.';
  if (chart.id === 'dairy-sales' || chart.id === 'dairy-farms') metadata.exportCaveat = 'Practices overlap; survey years only. Milk-sales shares cover all sales from adopting farms.';
  // Retain the concise public qualification without repeating methods paragraphs.
  if (ACTIVE_TOPIC === 'rd' && /by funder/.test(title)) metadata.exportCaveat = '2002 accounting/source break; 2021 reconstructed coverage; 2023–2024 categories may be incomplete or regrouped. Includes SBIR-recipient support.';
  if (ACTIVE_TOPIC === 'rd' && /by performer/.test(title)) metadata.exportCaveat = 'ERS through 2001; calculated REEIS/NCSES estimates from 2002. Transfers deducted once; private SBIR recipients excluded; Minnesota NIH corrected in 2006–2008.';
  if (ACTIVE_TOPIC === 'rd' && /budget authority/.test(title)) metadata.exportCaveat = 'Budget authority, not outlays; 2025 preliminary. Negative facilities amounts cancel prior authority. BRDPI: 2024 preliminary, 2025 projected.';
  const edited = readTextEdits()[`${chart.textEditKey}:caption:public-note`];
  if (typeof edited === 'string' && edited.trim() && !metadata.exportCaveat) metadata.exportCaveat = edited.trim();
  return metadata;
}

function drawChart(container, chart) {
  hideTooltip();
  container.chartConfig = chart;
  if (chart.smoothingWindow) chart = configureTFPTrend(chart, container.smoothingYears || 15);
  renderTFPWindowControl(container, chart);
  if (container.recordKind !== chart.recordKind) { container.recordsOpen = false; container.recordSelection = null; container.recordKind = chart.recordKind; }
  if (chart.usdaFilter) chart = filteredUSDAChart(chart);
  chart = colorChartSeries(chart);
  renderUSDAFilter(container, chart);
  container.parentElement.querySelector(".chart-compare")?.remove();
  container.replaceChildren();
  const card = container.closest(".chart-card");
  chart = { ...chart, textEditKey: `topic:${ACTIVE_TOPIC}:chart:${container.dataset.chart}${chart.id ? `:view:${encodeURIComponent(chart.id)}` : ""}`, title: chart.title || card.querySelector("h3")?.textContent || chart.yLabel || "Chart" };
  const subtitleNode = card.querySelector(".chart-subtitle");
  if ((ACTIVE_TOPIC === 'practices' && container.dataset.chart === '4') || (ACTIVE_TOPIC === 'livestock' && container.dataset.chart === '2')) subtitleNode.dataset.editableKey = `topic:${ACTIVE_TOPIC}:chart:${container.dataset.chart}:view:${chart.id}:restored-subtitle`;
  subtitleNode.textContent = chart.subtitle || "";
  card.querySelector(".source-disclosure").hidden = !chart.source;
  card.querySelector(".source-line").innerHTML = (chart.source || "") + (chart.compactRecords ? `<div class="chart-explainer">${chartExplanationMarkup(chart)}</div>` : "");
  card.querySelector(".source-disclosure > summary").textContent = chart.compactRecords ? "Sources and methods" : "Sources";
  const summary = card.querySelector(".chart-card-content > .series-summary");
  summary.replaceChildren();
  card.querySelector(".chart-methods")?.remove();
  card.querySelector(".crop-breakdown")?.remove();
  card.querySelector(".plant-records")?.remove();
  card.querySelector(".record-launch")?.remove();
  card.querySelector(".series-focus-controls")?.remove();
  card.querySelector(".series-breakdown-legend")?.remove();
  if (chart.type === 'livestock-studies') {
    container.innerHTML = `<div class="livestock-study-controls">${changeToggle()}</div><div class="product-bar-sort-row"><span></span><div class="product-bar-axis" aria-label="Change from zero"></div>${studySortHeader()}<span></span></div><div class="product-bars"></div><p class="livestock-study-note">Equivalent compound annual change between each study’s endpoints. Choose Total to see the full-period change; select a row’s details for values, units and sources. These are within-study comparisons, not comparable absolute footprints.</p>`;
    container.querySelector('.product-bars').innerHTML = studyBarRows(chart.metric);
    container.querySelector('.livestock-study-note').textContent = `${studyComparisonNote()} Compare changes within each study; absolute footprints are not directly comparable.`;
    const studyNote = container.querySelector(".livestock-study-note");
    studyNote.dataset.editableKey = chartTextKey(chart, `study-note:${CHANGE_MODE}`);
    applySavedTextEdits(card);
    card.querySelector('.source-disclosure').hidden = true;
    renderPublicChartSource(container.parentElement, { ...chart, processingNotes: studyNote.textContent, visibleSourceContext: studyNote.textContent });
    sendHeight();
    return;
  }
  if (!chart.series?.length || chart.series.some(series => !series.values?.length)) {
    container.innerHTML = chart.usdaFilter ? '<p class="chart-empty">Select at least one review pathway to see records.</p>' : '<p class="chart-empty">Detailed data are unavailable.</p>';
    return;
  }
  chart = { ...chart, series: chart.series.map(series => {
    if (!series.breakdownVariants?.length) return series;
    const choice = container.breakdownVariantSelections?.get(series.name) || series.defaultBreakdownVariant;
    const variant = series.breakdownVariants.find(item => item.id === choice) || series.breakdownVariants[0];
    return { ...series, ...variant, name: series.name, _breakdownVariant: variant.id };
  }) };
  if (!chart.recordRows) chart.drilldownOnly = true;
  const fullChart = chart;
  if (chart.drilldownOnly) {
    // R&D opens informative breakdowns only. The original leaf isolation path
    // remains below for other topics and can be restored by removing this flag.
    container.focusedChild = null;
    if (!chart.series.some(series => series.name === container.focusedSeries && hasInformativeBreakdown(series))) container.focusedSeries = null;
  }
  if (!chart.series.some(series => series.name === container.focusedSeries)) container.focusedSeries = null;
  const parentSeries = chart.series.find(series => series.name === container.focusedSeries);
  if (!parentSeries) container.focusedChild = null;
  if (parentSeries) {
    const children = parentSeries.breakdownSeries;
    const childYears = (children || [parentSeries]).flatMap(series => series.values.map(point => point.year));
    if (!children?.some(series => series.name === container.focusedChild)) container.focusedChild = null;
    chart = { ...chart, decimals: children ? parentSeries.breakdownDecimals ?? chart.decimals : chart.decimals, summaryMode: children ? parentSeries.breakdownSummaryMode || chart.summaryMode : chart.summaryMode, series: children ? children.filter(series => !container.focusedChild || series.name === container.focusedChild) : [parentSeries], overlaySeries: [], totalLabel: null, isolatedSeries: true, subtitle: children ? `${parentSeries.name} · ${container.focusedChild || parentSeries.breakdownLabel || "agency breakdown"}, ${Math.min(...childYears)}–${Math.max(...childYears)}` : chart.subtitle };
  }
  const visibilityScope = parentSeries ? `detail:${parentSeries.name}${parentSeries._breakdownVariant ? `:${parentSeries._breakdownVariant}` : ""}` : "overview";
  const fullDataChart = chartDownloadSources({ ...chart, rawUnit: chart.tooltipUnit || chart.yLabel, ...chartDownloadMetadata(chart) });
  container.csvChart = fullDataChart;
  const presentation = presentationControls(container, fullDataChart, visibilityScope);
  chart = visibleChartSeries(container, chart, visibilityScope);
  chart = applyChartPresentation(chart, presentation);
  chart.processingNotes = parentSeries?.breakdownNote || chart.caption || (/index|change from/i.test(chart.yLabel || '') ? `Series are expressed as ${chart.yLabel}. Each series retains its source coverage and reporting definition.` : "");
  if (ACTIVE_TOPIC === 'rd' && !parentSeries) {
    if (/performer|expenditures by performer/i.test(chart.title)) chart.publicMethods = '1970–2001 uses ERS estimates. From 2002, REEIS institution funding is combined with NCSES USDA outlays, deducting overlapping transfers once. Private SBIR recipients are excluded. Nonagricultural Minnesota veterinary-school NIH funding is removed in 2006–2008. Values use 2024 dollars, adjusted with the NIH/BEA research price index (BRDPI).';
    if (/intensity/i.test(chart.title)) { chart.sourceDetails = false; chart.sourceSuffix = '. Research includes food and forestry; fiscal-year spending is compared with the same calendar year of farm value added.'; }
  }
  container.directLabelsRendered = false;
  const axisUnit = document.createElement("p"); axisUnit.className = "chart-axis-unit"; axisUnit.textContent = chart.yLabel;
  if (chart.dualAxis) { axisUnit.classList.add("dual-axis-units"); axisUnit.innerHTML = `<span style="color:#0d4459">R&D · $bn (2024)</span><span style="color:${chart.rightAxis.color}">TFP growth · %/year</span>`; }
  container.append(axisUnit);
  if (!chart.series.length && !(chart.overlaySeries || []).length) {
    const empty = document.createElement("p"); empty.className = "chart-empty series-selection-empty";
    empty.setAttribute("role", "status"); empty.textContent = "All series are hidden. Open Chart options → Show/hide series to select a series or choose Show all."; container.append(empty);
    renderSeriesSummary(summary, chart);
  } else if (!chart.series.length && chart.overlaySeries?.length) {
    // A stacked chart's remaining overlays are lines, not stacked layers.
    drawLineChart(container, { ...chart, type: "line", series: chart.overlaySeries, overlaySeries: [] });
  } else if (chart.type === "stacked") drawStackedAreaChart(container, chart);
  else if (chart.type === "period-bars") drawPeriodBarChart(container, chart);
  else if (chart.type === "bar") drawBarChart(container, chart);
  else drawLineChart(container, chart);
  // Record browsing and year selectors retain the complete source coverage even
  // when the plot's visibility selection is empty or narrowed.
  renderChartContext(container, { ...chart, series: fullChart.series });
  attachChartInteractions(container, chart);
  attachSeriesFocus(container, fullChart);
  renderChartOptions(container, fullChart, chart, fullDataChart, presentation);
  finalizeChartLegend(container, chart, parentSeries);
  applySavedTextEdits(card);
  const shownCaption = (parentSeries ? card.querySelector(".series-breakdown-legend > .change-note") : summary.querySelector(":scope > .change-note"))?.textContent;
  const fullProcessingNotes = [shownCaption || chart.caption, chart.processingNotes, parentSeries?.breakdownNote, chart.presentationNote].filter(Boolean);
  const caveatNode = parentSeries ? card.querySelector(".series-breakdown-legend > .change-note") : summary.querySelector(":scope > .change-note");
  if (caveatNode) { caveatNode.textContent = chart.hideCaption ? "" : conciseChartCaveat(chart, parentSeries, shownCaption); caveatNode.hidden = !caveatNode.textContent; if (caveatNode.dataset.editableKey) caveatNode.dataset.editableKey += ':public-note'; }
  renderPublicChartSource(container.parentElement, { ...chart, caption: "", processingNotes: fullProcessingNotes, visibleSourceContext: [chart.subtitle, chart.yLabel, caveatNode?.textContent].filter(Boolean).join(" ") });
  if (parentSeries?.breakdownSeries) card.querySelector(".chart-subtitle").textContent = chart.subtitle;
}

function saveChartFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


async function downloadChartImage(container, chart) {
  const plot = container.querySelector("svg"); if (!plot) return;
  const clone = plot.cloneNode(true);
  const properties = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "opacity", "font-family", "font-size", "font-weight", "text-anchor"];
  const originalNodes = [plot, ...plot.querySelectorAll("*")], copiedNodes = [clone, ...clone.querySelectorAll("*")];
  originalNodes.forEach((node, i) => {
    const target = copiedNodes[i], style = getComputedStyle(node);
    properties.forEach(name => target.style.setProperty(name, style.getPropertyValue(name)));
    target.removeAttribute("tabindex");
  });
  clone.querySelectorAll(".range-selection").forEach(node => node.remove());
  const width = Math.max(700, plot.viewBox.baseVal.width), plotHeight = plot.viewBox.baseVal.height * width / plot.viewBox.baseVal.width;
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  const wrap = (text, max = 105) => String(text || "").split(/\s+/).reduce((lines, word) => { const i = lines.length - 1; if ((lines[i] + " " + word).trim().length > max) lines.push(word); else lines[i] = (lines[i] + " " + word).trim(); return lines; }, [""]);
  const addText = (value, y, size = 13, weight = 400) => { const el = document.createElementNS(ns, "text"); el.setAttribute("x", "24"); el.setAttribute("y", y); el.setAttribute("fill", "#0d4459"); el.setAttribute("font-family", "Arial, sans-serif"); el.setAttribute("font-size", size); el.setAttribute("font-weight", weight); el.textContent = value; svg.append(el); };
  let y = 30;
  const title = container.closest(".chart-card").querySelector("h3")?.textContent || chart.title;
  wrap(title, 75).forEach(line => { addText(line, y, 19, 700); y += 26; });
  wrap(container.closest(".chart-card").querySelector(".chart-subtitle")?.textContent || chart.subtitle).forEach(line => { addText(line, y); y += 18; });
  addText(chart.yLabel || "", y); y += 14;
  clone.setAttribute("x", "16"); clone.setAttribute("y", y); clone.setAttribute("width", width - 32); clone.setAttribute("height", plotHeight); svg.append(clone); y += plotHeight + 22;
  (container.directLabelsRendered ? [] : [...chart.series, ...(chart.overlaySeries || [])]).filter(series => !series.hideInLegend).forEach(series => {
    const key = document.createElementNS(ns, "rect"); key.setAttribute("x", "24"); key.setAttribute("y", y - 10); key.setAttribute("width", "12"); key.setAttribute("height", "12"); key.setAttribute("fill", brandAreaFill(svg, series)); svg.append(key);
    const label = document.createElementNS(ns, "text"); label.setAttribute("x", "44"); label.setAttribute("y", y); label.setAttribute("font-family", "Arial, sans-serif"); label.setAttribute("font-size", "12"); label.setAttribute("fill", "#0d4459"); label.textContent = series.name; svg.append(label); y += 20;
  });
  const card = container.closest(".chart-card"), note = card.querySelector(".series-breakdown-legend > .change-note")?.textContent || card.querySelector(".series-summary > .change-note")?.textContent;
  wrap(note).forEach(line => { addText(line, y, 11); y += 16; });
  const citations = document.createElement("div"); citations.innerHTML = chart.source || "";
  const sourceNames = [...new Set([...citations.querySelectorAll('a[href]')].filter(a => /^https?:/.test(a.getAttribute('href')) && !a.hasAttribute('download')).map(a => publicSourceName(new URL(a.href), a.textContent)))];
  if (sourceNames.length) wrap(`Source: ${sourceNames.join('; ')}${chart.sourceSuffix || ""}`).forEach(line => { addText(line, y, 11); y += 16; });
  if (chart.presentationNote && chart.transformMode !== "relative") wrap(chart.presentationNote).forEach(line => { addText(line, y, 11); y += 16; });
  if (chart.visibility?.hidden.length) { addText("Only selected series are shown. Scale reflects this selection.", y, 11); y += 18; }
  svg.setAttribute("xmlns", ns); svg.setAttribute("width", width); svg.setAttribute("height", y + 20); svg.setAttribute("viewBox", `0 0 ${width} ${y + 20}`); svg.style.background = "white";
  // Rasterize the self-contained drawing for a widely supported image download.
  const imageURL = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageURL; });
    const canvas = document.createElement("canvas"), scale = 2;
    canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil((y + 20) * scale);
    const context = canvas.getContext("2d"); context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("PNG export unavailable");
    saveChartFile(`${ACTIVE_TOPIC}-chart.png`, png, "image/png");
  } finally { URL.revokeObjectURL(imageURL); }
}

function renderChartOptions(container, fullChart, displayedChart, fullDataChart, presentation) {
  const card = container.closest(".chart-card"), content = container.parentElement;
  content.querySelector(".chart-toolbar")?.remove();
  const toolbar = document.createElement("div"); toolbar.className = "chart-toolbar";
  const parent = fullChart.series.find(series => series.name === container.focusedSeries);
  const breakdowns = fullChart.series.filter(series => hasInformativeBreakdown(series) || fullChart.recordRows);
  const breadcrumb = document.createElement("div"); breadcrumb.className = "chart-view-breadcrumb";
  if (parent) {
    const back = document.createElement("button"); back.type = "button"; back.textContent = "← Overview";
    back.setAttribute("aria-label", `Back to ${fullChart.title} overview`);
    back.addEventListener("click", () => { container.focusedSeries = null; container.focusedChild = null; drawChart(container, container.chartConfig); content.querySelector(".chart-options > summary")?.focus(); sendHeight(); }); breadcrumb.append(back);
    // The subtitle already identifies the current breakdown.
  }
  toolbar.append(breadcrumb);
  const options = document.createElement("details"); options.className = "chart-options";
  const csvOptions = displayedChart.type === 'stacked' && displayedChart.visibility
    ? '<button type="button" data-chart-action="csv-current">Download CSV · current selection</button><button type="button" data-chart-action="csv-all">Download CSV · all series in this view</button>'
    : '<button type="button" data-chart-action="csv-all">Download CSV</button>';
  options.innerHTML = `<summary aria-label="Chart options" title="Chart options"><span class="chart-options-label">Chart options</span><span aria-hidden="true">⋯</span></summary><div class="chart-options-panel">${breakdowns.length ? `<label>View breakdown<select aria-label="View breakdown"><option value="">Overview</option>${breakdowns.map(series => `<option value="${escapeHTML(series.name)}">${escapeHTML(series.name)}</option>`).join("")}</select></label>` : ""}${parent?.breakdownVariants?.length > 1 ? `<label>Detail level<select aria-label="Breakdown detail level">${parent.breakdownVariants.map(variant => `<option value="${escapeHTML(variant.id)}">${escapeHTML(variant.label)}</option>`).join("")}</select></label>` : ""}${presentation.modes.length > 1 ? `<label>Display<select aria-label="Chart display">${presentation.modes.map(mode => `<option value="${mode.id}">${mode.label}</option>`).join("")}</select></label>${["relative","points"].includes(presentation.state.mode) ? `<label>Baseline year<select aria-label="Baseline year">${presentation.baselineYears.slice(0,-1).map(year => `<option value="${year}">${year}</option>`).join("")}</select></label>` : ""}` : ""}<button type="button" data-chart-action="table">View data table</button><div class="chart-options-divider"></div><button type="button" data-chart-action="png">Download PNG image</button>${csvOptions}<p class="chart-download-inline-status" role="status" aria-live="polite"></p></div>`;
  toolbar.append(options);
  let subtitleRow = content.querySelector(".chart-subtitle-row");
  if (!subtitleRow) { subtitleRow = document.createElement("div"); subtitleRow.className = "chart-subtitle-row"; const subtitle = content.querySelector(".chart-subtitle"); subtitle.before(subtitleRow); subtitleRow.append(subtitle); }
  subtitleRow.append(toolbar);
  const sources = card.querySelector(".source-disclosure");
  if (sources) { sources.open = false; sources.hidden = true; }
  // Compare selected observations from the original series, even when the plot
  // itself is showing a rebased display. Missing years are never interpolated.
  const visibleNames = new Set([...(displayedChart.series || []), ...(displayedChart.overlaySeries || [])].map(series => series.name));
  const candidates = [...(fullDataChart.series || []), ...(fullDataChart.overlaySeries || []), ...(fullDataChart.rollingSeries ? [fullDataChart.rollingSeries] : [])]
    .filter(series => (visibleNames.has(series.name) || series === fullDataChart.rollingSeries) && series.values?.filter(point => Number.isFinite(point.value)).length > 1);
  if (fullDataChart.type === 'stacked' && !fullDataChart.dualAxis) {
    const parts = (fullDataChart.series || []).filter(series => visibleNames.has(series.name) && series.values?.length);
    const units = new Set(parts.map(series => series.tooltipUnit ?? fullDataChart.tooltipUnit ?? ''));
    if (parts.length > 1 && units.size === 1) {
      const lookup = parts.map(series => new Map(series.values.filter(point => Number.isFinite(point.value)).map(point => [point.year, point])));
      const values = [...lookup[0].keys()].filter(year => lookup.every(map => map.has(year))).map(year => ({
        year, value: lookup.reduce((sum, map) => sum + map.get(year).value, 0),
        approximate: lookup.some(map => map.get(year).approximate)
      }));
      if (values.length > 1) candidates.unshift({ name: 'Total (visible series)', values, totalParts: parts });
    }
  }
  if (candidates.length) {
    const compare = document.createElement('details');
    compare.className = 'chart-date-comparison';
    compare.innerHTML = `<summary>${fullDataChart.type === 'period-bars' ? 'Compare periods' : 'Compare years'}</summary><label>Series<select aria-label="Series to compare">${candidates.map((series, index) => `<option value="${index}">${escapeHTML(series.name || 'Series')}</option>`).join('')}</select></label><div class="chart-compare-years"><label>From<select aria-label="Start year"></select></label><label>To<select aria-label="End year"></select></label></div><p class="chart-comparison-result" role="status" aria-live="polite"></p>`;
    options.querySelector('[data-chart-action="table"]').before(compare);
    const seriesSelect = compare.querySelector('[aria-label="Series to compare"]');
    const from = compare.querySelector('[aria-label="Start year"]'), to = compare.querySelector('[aria-label="End year"]');
    const result = compare.querySelector('.chart-comparison-result');
    let points = [];
    const fillYears = () => {
      points = [...candidates[Number(seriesSelect.value)].values].filter(point => Number.isFinite(point.value)).sort((a,b) => a.year-b.year);
      const years = [...new Set(points.map(point => point.year))];
      from.innerHTML = to.innerHTML = years.map(year => `<option value="${year}">${escapeHTML(points.find(point => point.year === year)?.periodLabel || String(year))}</option>`).join('');
      from.value = String(years[0]); to.value = String(years.at(-1));
      updateResult();
    };
    const updateResult = () => {
      const series = candidates[Number(seriesSelect.value)];
      const first = points.find(point => point.year === Number(from.value));
      const last = points.find(point => point.year === Number(to.value));
      if (!first || !last) return;
      if (first.year >= last.year) { result.textContent = 'Choose an end year after the start year.'; return; }
      let change = first.value <= 0 ? 'Percentage change unavailable from a zero or negative starting value' : `${pct((last.value / first.value - 1) * 100)} change`;
      const firstText = `${first.approximate ? '≈' : ''}${formatValue(fullDataChart, first.value, series)}`;
      const lastText = `${last.approximate ? '≈' : ''}${formatValue(fullDataChart, last.value, series)}`;
      // Share the currency suffix only when both values use the same scale.
      const firstLabel = fullDataChart.currency && firstText.endsWith('billion 2024 dollars') && lastText.endsWith('billion 2024 dollars') ? firstText.replace(' billion 2024 dollars', '') : firstText;
      result.textContent = `${change} from ${firstLabel} → ${lastText}.`;
    };
    seriesSelect.addEventListener('change', fillYears);
    from.addEventListener('change', updateResult); to.addEventListener('change', updateResult);
    fillYears();
  }
  options.querySelector('[data-chart-action="png"]').disabled = !container.querySelector('svg');
  const display = options.querySelector('[aria-label="Chart display"]'), baseline = options.querySelector('[aria-label="Baseline year"]');
  const updatePresentation = () => { container.presentationChoices.set(presentation.key, { mode: display.value, baseline: baseline ? Number(baseline.value) : presentation.state.baseline }); drawChart(container, container.chartConfig); content.querySelector('.chart-options > summary')?.focus({ preventScroll: true }); sendHeight(); };
  if (display) { display.value = presentation.state.mode; display.addEventListener('change', updatePresentation); }
  if (baseline) { baseline.value = String(presentation.state.baseline); baseline.addEventListener('change', updatePresentation); }
  const select = options.querySelector('[aria-label="View breakdown"]');
  if (select) { select.value = parent?.name || ""; select.addEventListener("change", () => {
    const name = select.value; options.open = false;
    if (!name) { container.focusedSeries = null; container.focusedChild = null; drawChart(container, container.chartConfig); }
    else if (container.focusedSeries !== name) container.focusSeries?.(name);
    content.querySelector(".chart-options > summary")?.focus({ preventScroll: true }); sendHeight();
  }); }
  const level = options.querySelector('[aria-label="Breakdown detail level"]');
  if (level) { level.value = parent._breakdownVariant; level.addEventListener("change", () => {
    if (!container.breakdownVariantSelections) container.breakdownVariantSelections = new Map();
    container.breakdownVariantSelections.set(parent.name, level.value); container.focusedChild = null;
    drawChart(container, container.chartConfig); content.querySelector(".chart-options > summary")?.focus({ preventScroll: true }); sendHeight();
  }); }
  options.addEventListener("keydown", event => { if (event.key === "Escape") { options.open = false; options.querySelector("summary").focus(); event.stopPropagation(); } });
  options.querySelectorAll("[data-chart-action]").forEach(button => button.addEventListener("click", async () => {
    const status = options.querySelector('.chart-download-inline-status');
    button.disabled = true;
    try {
      if (button.dataset.chartAction === 'table') { openChartDataTable(container, displayedChart, options.querySelector('summary')); return; }
      if (button.dataset.chartAction === 'png') await downloadChartImage(container, displayedChart);
      else downloadChartCSV(container, fullDataChart, displayedChart, button.dataset.chartAction === 'csv-all' ? 'all' : 'current');
      status.textContent = 'Download started.';
    } catch { status.textContent = 'Could not download. Please try again.'; }
    finally { button.disabled = false; }
  }));
}
document.addEventListener("pointerdown", event => {
  document.querySelectorAll(".chart-options[open]").forEach(options => { if (!options.contains(event.target)) options.open = false; });
});


function otherCropCounts(chart, year) {
  return (chart.otherCrops || []).map(series => ({ name: series.name, value: series.values.find(point => point.year === year)?.value || 0 }))
    .filter(crop => crop.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function chartPointTooltip(chart, series, point) {
  let html = `<strong>${escapeHTML(series.name || "Five-survey mean")}</strong><br>${escapeHTML(point.periodLabel || String(point.year))}: ${point.approximate ? "≈" : ""}${formatValue(chart, point.value, series)}${point.source && !chart.hideTooltipSource ? `<br>${escapeHTML(point.source)}` : ""}`;
  if (point.rawValue !== undefined) html += `<br>${format(point.rawValue, 4)} ${escapeHTML(point.rawUnit)}`;
  if (series.breakdownSeries && (!chart.drilldownOnly || hasInformativeBreakdown(series))) html += `<br><small>Click to explore the ${escapeHTML(series.breakdownLabel || "agency breakdown")}.</small>`;
  if (chart.recordRows && series.name !== "Other crops") html += "<br><small>Select once to isolate this series; select it again at a year to view records.</small>";
  if (chart.otherCrops && series.name === "Other crops") {
    const crops = otherCropCounts(chart, point.year), leading = crops.slice(0, 5);
    html += `<div class="tooltip-crops">${leading.map(crop => `${escapeHTML(crop.name)}: ${crop.value}`).join("<br>")}${crops.length > 5 ? `<br>Remaining crops: ${crops.slice(5).reduce((sum, crop) => sum + crop.value, 0)}` : ""}</div><small>Select this area or choose Other crops in Chart options to see each crop separately.</small>`;
  }
  return html;
}

function openOtherCropBreakdown(container, year) {
  const chart = container.chartConfig;
  if (chart.compactRecords && chart.series.find(series => series.name === "Other crops")?.breakdownSeries) {
    container.focusedSeries = "Other crops";
    container.focusedChild = null;
    container.recordsOpen = false;
    container.recordFocusYear = year;
    drawChart(container, chart);
    sendHeight();
    return;
  }
  const details = container.parentElement.querySelector(".crop-breakdown");
  if (!details) return;
  details.updateYear(year);
  if (details.tagName === "DETAILS") details.open = true; else details.hidden = false;
  sendHeight();
}

function openPlantRecords(container, crop, year) {
  let details = container.parentElement.querySelector(".plant-records");
  if (!details) return;
  container.recordsOpen = true;
  const config = container.chartConfig;
  if (config.compactRecords) {
    const focused = crop === "__all__" ? null : config.series.some(series => series.name === crop) ? crop : "Other crops";
    if (container.focusedSeries !== focused) {
      container.recordSelection = { kind: config.recordKind, crop, year };
      container.focusedSeries = focused;
      container.focusedChild = focused === "Other crops" ? crop : null;
      container.recordFocusYear = year;
      drawChart(container, config);
      details = container.parentElement.querySelector(".plant-records");
    }
  }
  if (details.tagName === "DETAILS") details.open = true; else details.hidden = false;
  details.selectRecords(crop, year);
  details.scrollIntoView({ block: "nearest", behavior: "smooth" });
  sendHeight();
}

function renderPlantRecords(container, chart) {
  const details = document.createElement(chart.compactRecords ? "section" : "details"); details.className = "plant-records";
  if (chart.compactRecords) details.hidden = !container.recordsOpen;
  const rows = [...chart.recordRows].sort((a, b) => b.completed.localeCompare(a.completed) || a.crop.localeCompare(b.crop) || String(a.bnf || a.vpm || a.id).localeCompare(String(b.bnf || b.vpm || b.id), undefined, { numeric: true }));
  const crops = [...new Set(rows.map(row => row.crop))].sort();
  const years = chart.series[0].values.map(point => point.year);
  const isMeeting = chart.recordKind === "meetings";
  const isConsultation = chart.recordKind === "consultations";
  const agency = chart.recordAgency || "FDA";
  const groupLabel = chart.recordGroupLabel || "Crop";
  const panelTitle = chart.recordPanel || "Plant lines";
  const columns = chart.recordColumns || ["FDA letter", "Plant line / designation", "Trait", "Developer", "FDA file"];
  const recordLink = row => row.bnf ? `BNF ${row.bnf}` : row.vpm ? `VPM ${row.vpm}` : row.id;
  const entryLabel = isConsultation ? "plant-line" : "record";
  const renderRow = row => `<tr data-record-crop="${escapeHTML(row.crop)}" data-record-year="${row.completed.slice(0, 4)}"><td>${escapeHTML(row.completed)}</td><td>${escapeHTML(row.crop)}</td><td>${escapeHTML(row.designation)}</td><td>${escapeHTML(row.traits)}</td><td>${escapeHTML(row.developer)}</td><td><a href="${escapeHTML(row.source_url)}" target="_blank" rel="noopener">${escapeHTML(recordLink(row))}</a></td></tr>`;
  details.innerHTML = `${chart.compactRecords ? `<div class="record-panel-heading"><h4>${escapeHTML(panelTitle)}</h4><button type="button" class="record-close">Hide records</button></div>` : `<summary>${isMeeting ? "Explore premarket meeting records" : "Explore plant-line records"}</summary>`}${chart.compactRecords ? "" : `<p>${isMeeting ? "Published meeting entries for the selected crop are shown below, across all years." : "Plant-line entries for the selected crop are shown below, across all years; a consultation can cover several lines, and source repetitions are retained."} Records from the selected year are highlighted. These records are not product approvals.</p>`}<div class="record-controls"><label>${escapeHTML(groupLabel)}<select aria-label="${escapeHTML(groupLabel)} for records" data-record-group><option value="__all__">All ${groupLabel === "Pathway" ? "pathways" : "crops"}</option>${crops.map(crop => `<option>${escapeHTML(crop)}</option>`).join("")}</select></label><label>${chart.compactRecords ? "Jump to year" : isMeeting ? "Meeting year" : "Completion year"}<select aria-label="Year for records">${years.map(year => `<option>${year}</option>`).join("")}</select></label></div><button type="button" class="record-download">Download table CSV</button><p class="record-selection-status" role="status"></p><p class="record-scroll-hint">Scroll horizontally to see all columns, including traits, developers and source records.</p><div class="record-table-scroll" tabindex="0" aria-label="${agency} records for the selected ${groupLabel.toLowerCase()}; scroll to explore all years"><table class="${chart.compactRecords ? "record-table-compact" : ""} record-table-${agency.toLowerCase()}"><caption>Published FDA ${isMeeting ? "premarket meeting entries" : "plant-line consultation entries"}</caption><thead><tr>${columns.map((name, i) => `<th scope="col">${escapeHTML(name)}</th>${i === 0 ? `<th scope="col">${escapeHTML(groupLabel)}</th>` : ""}`).join("")}</tr></thead><tbody></tbody></table></div>`;
  const cropSelect = details.querySelector('[data-record-group]');
  const yearSelect = details.querySelector('[aria-label="Year for records"]');
  const scroller = details.querySelector(".record-table-scroll");
  details.selectRecords = (crop, year) => {
    cropSelect.value = crops.includes(crop) ? crop : "__all__";
    const allCrops = cropSelect.value === "__all__", selectedLabel = allCrops ? `All ${groupLabel === "Pathway" ? "pathways" : "crops"}` : cropSelect.value;
    yearSelect.value = years.includes(year) ? String(year) : String(years.at(-1));
    container.recordSelection = { kind: chart.recordKind, crop: cropSelect.value, year: Number(yearSelect.value) };
    const filteredRows = rows.filter(row => allCrops || row.crop === cropSelect.value);
    details.currentRows = filteredRows;
    details.querySelector("tbody").innerHTML = filteredRows.map(renderRow).join("");
    const allRows = [...details.querySelectorAll("tbody tr")];
    const matching = allRows.filter(row => row.dataset.recordYear === yearSelect.value);
    allRows.forEach(row => row.classList.toggle("record-selected", matching.includes(row)));
    scroller.querySelector("caption").textContent = `${selectedLabel} · ${filteredRows.length} entries · all years, newest first`;
    const selectedFiles = new Set(rows.filter(row => (allCrops || row.crop === cropSelect.value) && row.completed.slice(0, 4) === yearSelect.value).map(row => row.bnf || row.vpm || row.id));
    details.querySelector(".record-selection-status").textContent = chart.compactRecords
      ? `${selectedLabel} · ${yearSelect.value}: ${matching.length} ${entryLabel} ${matching.length === 1 ? "entry" : "entries"}${isConsultation ? ` in ${selectedFiles.size} consultation ${selectedFiles.size === 1 ? "file" : "files"}` : ""}. ${matching.length ? "Highlighted below." : "No entries this year; showing the nearest listed year."}`
      : `${selectedLabel} · ${yearSelect.value}: ${matching.length} listed entries. ${matching.length ? "Highlighted below; all years for this crop remain available." : "No entries this year; showing the nearest listed year."}`;
    const target = matching[0] || allRows.filter(row => allCrops || row.dataset.recordCrop === cropSelect.value).sort((a, b) => Math.abs(Number(a.dataset.recordYear) - Number(yearSelect.value)) - Math.abs(Number(b.dataset.recordYear) - Number(yearSelect.value)))[0];
    requestAnimationFrame(() => {
      if ((details.tagName === "DETAILS" ? details.open : !details.hidden) && target && target.isConnected) scroller.scrollTop += target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight / 2 + target.clientHeight / 2;
    });
  };
  const update = () => { details.selectRecords(cropSelect.value, Number(yearSelect.value)); sendHeight(); };
  cropSelect.addEventListener("change", () => {
    update();
    if (chart.compactRecords) {
      container.recordsOpen = true;
      container.recordFocusYear = Number(yearSelect.value);
      container.focusedSeries = cropSelect.value === "__all__" ? null : container.chartConfig.series.some(series => series.name === cropSelect.value) ? cropSelect.value : "Other crops";
      container.focusedChild = container.focusedSeries === "Other crops" ? cropSelect.value : null;
      drawChart(container, container.chartConfig);
      container.parentElement.querySelector('[data-record-group]')?.focus({ preventScroll: true });
    }
  });
  yearSelect.addEventListener("change", () => { container.recordFocusYear = Number(yearSelect.value); update(); });
  if (!chart.compactRecords) details.addEventListener("toggle", () => { if (details.open) update(); sendHeight(); });
  details.querySelector(".record-close")?.addEventListener("click", () => { container.recordsOpen = false; details.hidden = true; container.parentElement.querySelector(".record-launch")?.focus({ preventScroll: true }); sendHeight(); });
  container.parentElement.querySelector(":scope > .series-summary").after(details);
  details.querySelector('.record-download').addEventListener('click', () => {
    const columns = [isConsultation ? 'response_date' : isMeeting ? 'meeting_date' : 'date',groupLabel.toLowerCase(),'designation','trait','developer','record_id','source_url'];
    const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const output = [columns, ...details.currentRows.map(row => [row.completed, row.crop, row.designation, row.traits, row.developer, recordLink(row), row.source_url])];
    saveChartFile(`${agency.toLowerCase()}-${chart.recordKind}-table.csv`, output.map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  });
  const previous = container.recordSelection;
  const focusedCrop = crops.includes(container.focusedChild) ? container.focusedChild : crops.includes(container.focusedSeries) ? container.focusedSeries : null;
  details.selectRecords(focusedCrop || (previous?.kind === chart.recordKind ? previous.crop : "__all__"), focusedCrop ? container.recordFocusYear ?? years.at(-1) : previous?.kind === chart.recordKind ? previous.year : years.at(-1));
  if (chart.compactRecords) {
    const launch = document.createElement("button"); launch.type = "button"; launch.className = "record-launch"; launch.textContent = `Browse ${isConsultation ? "plant lines" : "records"}`;
    launch.addEventListener("click", () => openPlantRecords(container, cropSelect.value, Number(yearSelect.value)));
    details.before(launch);
  }
}

function renderChartContext(container, chart) {
  const summary = container.parentElement.querySelector(":scope > .series-summary");
  if (chart.explanations && !chart.compactRecords) {
    const explanation = document.createElement("details"); explanation.className = "chart-methods";
    explanation.innerHTML = `<summary>${escapeHTML(chart.explanationTitle || "About these records")}</summary><div class="chart-explainer">${chartExplanationMarkup(chart)}</div>`;
    explanation.addEventListener("toggle", sendHeight);
    summary.after(explanation);
  }
  if (chart.recordRows) renderPlantRecords(container, chart);
  if (!chart.otherCrops || chart.compactRecords) return;
  const years = chart.series[0].values.map(point => point.year);
  const details = document.createElement(chart.compactRecords ? "section" : "details"); details.className = "crop-breakdown";
  if (chart.compactRecords) details.hidden = true;
  details.innerHTML = `${chart.compactRecords ? `<div class="record-panel-heading"><h4>Other crops</h4><button type="button" class="crop-close">Hide breakdown</button></div>` : "<summary>Explore other crops</summary>"}<label>${chart.recordKind ? "Cumulative records" : "Cumulative decisions"} through <select aria-label="Year for other crops">${years.map(year => `<option value="${year}">${year}</option>`).join("")}</select></label><p class="crop-breakdown-note"></p><ul class="crop-counts"></ul>`;
  const select = details.querySelector("select");
  details.updateYear = year => {
    select.value = String(year);
    const crops = otherCropCounts(chart, year), total = crops.reduce((sum, crop) => sum + crop.value, 0);
    details.querySelector(".crop-breakdown-note").textContent = `${total} ${chart.recordKind === "consultations" ? "consultations" : "records"} across ${crops.length} crops${year === 2026 ? (chart.recordKind === "consultations" ? "; partial 2026, letters through March 24" : chart.recordKind === "meetings" ? "; partial 2026, meetings through July 9" : "; 2026 through October 2") : ""}. ${chart.recordRows ? "Select a crop to see its records in this year." : "Each crop is shown separately below."}`;
    details.querySelector("ul").innerHTML = crops.map(crop => `<li>${chart.recordRows ? `<button type="button" data-record-crop="${escapeHTML(crop.name)}">${escapeHTML(crop.name)}</button>` : `<span>${escapeHTML(crop.name)}</span>`}<strong>${crop.value}</strong></li>`).join("");
  };
  details.addEventListener("click", event => { const button = event.target.closest("[data-record-crop]"); if (button) { openPlantRecords(container, button.dataset.recordCrop, Number(select.value)); if (chart.compactRecords) details.hidden = true; } });
  select.addEventListener("change", () => { details.updateYear(Number(select.value)); sendHeight(); });
  details.querySelector(".crop-close")?.addEventListener("click", () => { details.hidden = true; container.parentElement.querySelector(".other-crops-button")?.focus({ preventScroll: true }); sendHeight(); });
  details.addEventListener("toggle", sendHeight);
  details.updateYear(years.at(-1));
  summary.after(details);
  summary.querySelector(".other-crops-button")?.addEventListener("click", () => openOtherCropBreakdown(container, years.at(-1)));
}

function drawPeriodBarChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const points = chart.series[0].values;
  const margin = { top: 12, left: width < 380 ? 88 : 108, right: 48, bottom: 34 };
  const rowHeight = 29, height = margin.top + points.length * rowHeight + margin.bottom;
  const x = value => margin.left + (value - chart.yMin) / (chart.yMax - chart.yMin) * (width - margin.left - margin.right);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${chart.title}. ${chart.subtitle}`);
  const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
  desc.textContent = 'Each bar shows an annualized growth rate for its labeled period. Periods are ordered chronologically. Focus a bar and use the arrow keys to explore periods.'; svg.append(desc);
  chart.yTicks.forEach(tick => {
    svg.append(line(x(tick), margin.top, x(tick), height - margin.bottom, tick === 0 ? 'axis-line' : 'grid-line'));
    svg.append(text(x(tick), height - margin.bottom + 19, `${tick}%`, 'tick-label', 'middle'));
  });
  const bars = [];
  points.forEach((point, index) => {
    const y = margin.top + index * rowHeight + 5;
    svg.append(text(margin.left - 10, y + 13, point.periodLabel, 'tick-label', 'end'));
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    Object.entries({ x: Math.min(x(0), x(point.value)), y, width: Math.max(1, Math.abs(x(point.value) - x(0))), height: 18, fill: '#0d4459', class: 'bar-mark', tabindex: index === points.length - 1 ? '0' : '-1', 'aria-label': `${point.periodLabel}: ${formatValue(chart, point.value)}` }).forEach(([key, value]) => bar.setAttribute(key, value));
    bar.chartDatum = { series: chart.series[0], point };
    const show = event => showTooltip(event, chartPointTooltip(chart, chart.series[0], point));
    ['pointerenter','pointermove','focus'].forEach(type => bar.addEventListener(type, show));
    ['pointerleave','blur'].forEach(type => bar.addEventListener(type, hideTooltip));
    bar.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); bars[Math.max(0, Math.min(bars.length - 1, index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1)))]?.focus();
    });
    bars.push(bar); svg.append(bar);
    const valueLabel = text(x(point.value) + 7, y + 13, `${format(point.value, 2)}%`, 'tick-label');
    if (point.value < 0) valueLabel.style.fill = '#fff';
    svg.append(valueLabel);
  });
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(':scope > .series-summary'), chart);
}

function drawBarChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: 16, bottom: 34, left: width < 380 ? 52 : 64 };
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
  svg.setAttribute("aria-label", `${chart.title}. ${chart.accessibleDescription || chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc");
  description.textContent = chart.barDescription || (chart.rollingSeries ? `Bars show completed annual surveys, the overlaid line averages the last five measured summers, and the dashed line shows the ${chart.goalLabel || "goal"}. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years.` : "One bar per completed annual survey. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years.");
  svg.append(description);
  (chart.yTicks || yScale.ticks).forEach(tick => {
    svg.append(line(margin.left, y(tick), width - margin.right, y(tick), "grid-line"));
    svg.append(text(margin.left - 9, y(tick) + 4, axisNumber(tick, chart.yTicks || yScale.ticks), "tick-label", "end"));
  });
  const xTicks = yearTicks(xMin, xMax, width - margin.left - margin.right);
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
    goal.setAttribute("aria-label", `${chart.goalLabel || "Goal"}: below ${formatValue(chart, chart.goalValue)} five-survey average`);
    svg.append(goal);
  }
  const bars = [];
  sorted.forEach((point, index) => {
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", x(point.year) - slot * 0.36);
    bar.setAttribute("y", y(point.value));
    bar.setAttribute("width", slot * 0.72);
    bar.setAttribute("height", height - margin.bottom - y(point.value));
    bar.setAttribute("fill", chart.rollingSeries ? "#00a990" : COLORS[0]);
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
  renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
}

function drawLineChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const labelPlan = directLabelPlan(chart, width);
  const margin = { top: 18, right: labelPlan.enabled ? labelPlan.right : chart.dualAxis ? (width < 380 ? 48 : 64) : chart.series.length > 1 ? 24 : 16, bottom: 34, left: width < 380 ? 52 : 64 };
  const all = chart.series.flatMap(s => s.values);
  const allYears = all.map(d => d.year), values = chart.series.filter(series => series.axis !== "right").flatMap(series => series.values.map(point => point.value));
  const xMin = chart.xMin ?? Math.min(...allYears), xMax = chart.xMax ?? Math.max(...allYears);
  const yScale = niceScale(Math.max(...values, 1));
  const yMin = chart.yMin ?? 0;
  const yMax = chart.yMax ?? yScale.max;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = chart.yTicks || yScale.ticks;
  const xTicks = chart.xTicks ? chart.xTicks.filter(year => year >= xMin && year <= xMax) : yearTicks(xMin, xMax, width - margin.left - margin.right);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title}. ${chart.accessibleDescription || chart.subtitle || ""}`); svg.innerHTML = `<title>${chart.title}</title>`;
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a series at its latest point, then use the left and right arrow keys to explore plotted values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), tick === 0 ? "grid-line zero-line" : "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, `${axisNumber(tick, chart.yTicks || yScale.ticks)}${chart.tickSuffix || ""}`, "tick-label", "end")); });
  xTicks.forEach(tick => {
    svg.append(line(x(tick), height - margin.bottom, x(tick), height - margin.bottom + 5, "axis-line"));
    const label = text(x(tick), height - margin.bottom + 19, tick, "tick-label", "middle");
    if (chart.xTicks && xTicks.length > 1) {
      const spacing = (x(xTicks.at(-1)) - x(xTicks[0])) / (xTicks.length - 1);
      label.style.fontSize = `${Math.min(12, Math.max(7, spacing / 2.5))}px`;
    }
    svg.append(label);
  });
  svg.append(line(margin.left, margin.top, margin.left, height - margin.bottom, "axis-line")); svg.append(line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, "axis-line"));
  const axisLabel = text(15, (height - margin.bottom + margin.top) / 2, chart.yLabel, "axis-label", "middle"); axisLabel.setAttribute("transform", `rotate(-90 15 ${(height - margin.bottom + margin.top) / 2})`); svg.append(axisLabel);
  const primaryY = y;
  const right = chart.rightAxis;
  const rightY = value => height - margin.bottom - (value - right.min) / (right.max - right.min) * (height - margin.top - margin.bottom);
  if (chart.dualAxis) {
    svg.append(line(width - margin.right, margin.top, width - margin.right, height - margin.bottom, "axis-line"));
    right.ticks.forEach(tick => { const label = text(width - margin.right + 8, rightY(tick) + 4, `${axisNumber(tick, right.ticks)}%`, "tick-label right-axis-tick"); label.setAttribute("fill", right.color); label.style.fill = right.color; svg.append(label); });
    const label = text(width - 12, (height - margin.bottom + margin.top) / 2, right.label, "axis-label", "middle"); label.setAttribute("transform", `rotate(90 ${width - 12} ${(height - margin.bottom + margin.top) / 2})`); label.style.fill = right.color; svg.append(label);
    axisLabel.style.fill = "#0d4459";
  }
  chart.series.forEach((series, index) => {
    const y = series.axis === "right" ? rightY : primaryY;
    const color = series.color || COLORS[index % COLORS.length]; const sorted = [...series.values].sort((a, b) => a.year - b.year);
    const appendPath = (points, dasharray) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", points.map((d, i) => `${i && (!(series.breakOnMissingYear ?? chart.breakOnMissingYear) || d.year - points[i - 1].year === 1) ? "L" : "M"}${x(d.year).toFixed(2)},${y(d.value).toFixed(2)}`).join(" "));
      path.setAttribute("class", "series-path"); path.setAttribute("stroke", color);
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
      appendPath(earlier, series.solidSourceSegments ? undefined : "5 4");
      appendPath([earlier.at(-1), later[0]], series.solidSourceSegments ? undefined : "2 4");
      appendPath(later);
    } else if (!series.pointsOnly) appendPath(sorted, series.dasharray);
    const circles = [];
    sorted.forEach((d, pointIndex) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("cx", x(d.year)); circle.setAttribute("cy", y(d.value)); circle.setAttribute("r", series.pointRadius ?? (series.pointsOnly ? 5 : (chart.pointRadius ?? 4.2))); circle.setAttribute("fill", color); circle.setAttribute("class", `data-point line-point${!chart.hideLinePoints && (series.pointsOnly || series.breakOnMissingYear || chart.showAllPoints) ? " always-visible" : ""}`); circle.setAttribute("tabindex", pointIndex === sorted.length - 1 ? "0" : "-1"); circle.setAttribute("aria-label", `${series.name}, ${d.year}: ${formatValue(chart, d.value, series)}`);
      circle.chartDatum = { series, point: d };
      circle.setAttribute("aria-label", `${series.name}, ${d.year}: ${d.approximate ? "approximately " : ""}${formatValue(chart, d.value, series)}${d.rawValue !== undefined ? `, ${format(d.rawValue,4)} ${d.rawUnit}` : ''}${d.source ? `, ${d.source}` : ""}`);
      const show = event => showTooltip(event, chartPointTooltip(chart, series, d)); circle.addEventListener("pointerenter", show); circle.addEventListener("pointermove", show); circle.addEventListener("focus", show); circle.addEventListener("pointerleave", hideTooltip); circle.addEventListener("blur", hideTooltip); svg.append(circle);
      circle.addEventListener("keydown", event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = Math.max(0, Math.min(circles.length - 1, pointIndex + (event.key === 'ArrowRight' ? 1 : -1))); circles[next]?.focus(); });
      circles.push(circle);
    });
  });
  container.directLabelsRendered = appendDirectLabels(svg, chart, labelPlan, x, y, width, height, margin);
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
}

function integerCountScale(maxValue) {
  const scale = niceScale(Math.max(1, maxValue));
  const step = Math.max(1, Math.ceil(scale.ticks[1] - scale.ticks[0]));
  const count = Math.max(1, Math.ceil(maxValue / step));
  return { max: step * count, ticks: Array.from({ length: count + 1 }, (_, index) => step * index) };
}

function drawStackedAreaChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const labelPlan = directLabelPlan(chart, width);
  const margin = { top: 18, right: labelPlan.enabled ? labelPlan.right : 16, bottom: 34, left: width < 380 ? 52 : 64 };
  const maps = chart.series.map(series => new Map(series.values.map(d => [d.year, d.value])));
  const years = chart.series[0].values.map(d => d.year).filter(year => maps.every((map, i) => chart.series[i].partialCoverage || map.has(year))).sort((a, b) => a - b);
  if (!years.length) { container.innerHTML = '<p class="chart-empty">The component series do not share a common time period.</p>'; return; }
  const totals = years.map(year => maps.reduce((sum, map) => sum + (map.get(year) ?? 0), 0));
  const overlays = chart.overlaySeries || [];
  const overlayPoints = overlays.flatMap(series => series.values);
  const positiveTotals = years.map(year => maps.reduce((sum, map) => sum + Math.max(0, map.get(year) ?? 0), 0));
  const negativeTotals = years.map(year => maps.reduce((sum, map) => sum + Math.min(0, map.get(year) ?? 0), 0));
  const xMin = chart.isolatedSeries ? years[0] : chart.xMin ?? Math.min(years[0], ...overlayPoints.map(d => d.year)), xMax = chart.isolatedSeries ? years.at(-1) : chart.xMax ?? Math.max(years.at(-1), ...overlayPoints.map(d => d.year));
  const yScale = !chart.isolatedSeries && chart.yTicks ? { max: chart.yMax, ticks: chart.yTicks } : (chart.integerTicks ? integerCountScale : niceScale)(chart.isolatedSeries ? Math.max(...positiveTotals, ...overlayPoints.map(d => d.value), 0.001) : chart.yMax ?? Math.max(...positiveTotals, ...overlayPoints.map(d => d.value), 1)), yMax = yScale.max;
  const step = yScale.ticks[1] - yScale.ticks[0];
  const yMin = Math.min(...negativeTotals) < 0 ? -Math.ceil(Math.abs(Math.min(...negativeTotals)) / (step / 2)) * (step / 2) : 0;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = yMin < 0 ? [yMin, ...yScale.ticks] : yScale.ticks;
  const xTicks = yearTicks(xMin, xMax, width - margin.left - margin.right);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title || "Stacked area chart"}. ${chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a category at its latest point, then use the left and right arrow keys to explore annual values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), tick === 0 ? "grid-line zero-line" : "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, `${axisNumber(tick, yTicks)}${chart.tickSuffix || ""}`, "tick-label", "end")); });
  xTicks.forEach(tick => { svg.append(line(x(tick), height - margin.bottom, x(tick), height - margin.bottom + 5, "axis-line")); svg.append(text(x(tick), height - margin.bottom + 19, tick, "tick-label", "middle")); });
  svg.append(line(margin.left, margin.top, margin.left, height - margin.bottom, "axis-line")); svg.append(line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, "axis-line"));
  const axisLabel = text(15, (height - margin.bottom + margin.top) / 2, chart.yLabel, "axis-label", "middle"); axisLabel.setAttribute("transform", `rotate(-90 15 ${(height - margin.bottom + margin.top) / 2})`); svg.append(axisLabel);
  // Insert zero crossings so signed areas never overlap between observations.
  const knots = [...years];
  maps.forEach(map => years.slice(1).forEach((year, i) => {
    const a = map.get(years[i]) ?? 0, b = map.get(year) ?? 0;
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
    const areaValues = areaYears.map(year => series.partialCoverage && (year < series.values[0].year || year > series.values.at(-1).year) ? 0 : interpolate(maps[index], year));
    const positions = new Map();
    [1, -1].forEach(sign => {
      const lower = sign > 0 ? positiveBase : negativeBase;
      const upper = areaValues.map((value, i) => lower[i] + (sign > 0 ? Math.max(0, value) : Math.min(0, value)));
      areaYears.forEach((year, i) => { if ((sign > 0 && areaValues[i] >= 0) || (sign < 0 && areaValues[i] < 0)) positions.set(year, upper[i]); });
      if (areaValues.some(value => value * sign > 0)) {
        const coveredIndices = areaYears.map((year, i) => i).filter(i => !series.partialCoverage || (areaYears[i] >= series.values[0].year && areaYears[i] <= series.values.at(-1).year));
        const topPath = coveredIndices.map((i, j) => `${j ? "L" : "M"}${x(areaYears[i]).toFixed(2)},${y(upper[i]).toFixed(2)}`).join(" ");
        const bottomPath = [...coveredIndices].reverse().map(i => `L${x(areaYears[i]).toFixed(2)},${y(lower[i]).toFixed(2)}`).join(" ");
        const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        area.setAttribute("d", `${topPath} ${bottomPath} Z`); area.setAttribute("class", "area-path"); area.setAttribute("fill", brandAreaFill(svg, series, index));
        if (chart.drilldownOnly && !hasInformativeBreakdown(series)) area.style.cursor = "crosshair";
        area.chartSeries = series; svg.append(area);
      }
      if (sign > 0) positiveBase = upper; else negativeBase = upper;
    });
    const circles = [];
    years.forEach((year, i) => {
      const point = series.values.find(point => point.year === year);
      if (!point) return;
      const qualifier = point.approximate ? "≈" : "";
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); circle.setAttribute("cx", x(year)); circle.setAttribute("cy", y(positions.get(year))); circle.setAttribute("r", 4); circle.setAttribute("fill", series.color || COLORS[index % COLORS.length]); circle.setAttribute("class", "data-point area-point"); circle.setAttribute("tabindex", year === series.values.at(-1).year ? "0" : "-1"); circle.setAttribute("aria-label", `${series.name}, ${year}: ${qualifier}${formatValue(chart, values[i])}`);
      circle.chartDatum = { series, point };
      // Zero-height categories share another crop's boundary. Keep their keyboard
      // access, but never let their invisible pointer target intercept that crop.
      if (chart.recordRows && chart.series.length > 1 && point.value === 0) circle.style.pointerEvents = "none";
      const show = event => showTooltip(event, chartPointTooltip(chart, series, point)); circle.addEventListener("pointerenter", show); circle.addEventListener("pointermove", show); circle.addEventListener("focus", show); circle.addEventListener("pointerleave", hideTooltip); circle.addEventListener("blur", hideTooltip); svg.append(circle);
      circle.addEventListener("keydown", event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = Math.max(0, Math.min(circles.length - 1, circles.indexOf(circle) + (event.key === 'ArrowRight' ? 1 : -1))); circles[next]?.focus(); });
      circles.push(circle);
    });
  });
  // Keep every annual hit point above later stacked areas, so its crop is clickable.
  svg.append(...svg.querySelectorAll(".area-point"));
  overlays.forEach(series => {
    const sorted = [...series.values].sort((a, b) => a.year - b.year);
    if (!series.pointsOnly) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", sorted.map((d, i) => `${i ? "L" : "M"}${x(d.year)},${y(d.value)}`).join(" "));
      path.setAttribute("class", "series-path"); path.setAttribute("stroke", series.color);
      svg.append(path);
    }
    const circles = [];
    sorted.forEach((d, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.chartDatum = { series, point: d };
      Object.entries({ cx: x(d.year), cy: y(d.value), r: series.pointsOnly ? 5 : 4, fill: series.marker === "hollow" ? "#ffffff" : series.color, stroke: series.color, "stroke-width": series.marker === "hollow" ? 2 : 0, style: series.marker === "hollow" ? `stroke: ${series.color}; stroke-width: 2` : "", class: `data-point line-point${series.pointsOnly ? " always-visible" : ""}${series.marker === "hollow" ? " hollow-point" : ""}`, tabindex: i === sorted.length - 1 ? "0" : "-1", "aria-label": `${series.name}, ${d.year}: ${formatValue(chart, d.value)}` }).forEach(([key, value]) => circle.setAttribute(key, value));
      const show = event => showTooltip(event, `<strong>${series.name}</strong><br>${d.year}: ${formatValue(chart, d.value)}`);
      ["pointerenter", "pointermove", "focus"].forEach(event => circle.addEventListener(event, show));
      ["pointerleave", "blur"].forEach(event => circle.addEventListener(event, hideTooltip));
      circle.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); circles[Math.max(0, Math.min(circles.length - 1, i + (event.key === "ArrowRight" ? 1 : -1)))]?.focus(); });
      circles.push(circle); svg.append(circle);
    });
  });
  if (chart.isolatedSeries) {
    const boundaries = [...new Set(chart.series.map(series => series.definitionBreak?.laterStart).filter(year => year > xMin && year < xMax))];
    boundaries.forEach(year => {
      const marker = line(x(year), margin.top + 12, x(year), height - margin.bottom, "plot-reporting-break");
      marker.setAttribute("aria-hidden", "true"); marker.style.pointerEvents = "none"; svg.append(marker);
      const label = text(Math.max(margin.left + 65, Math.min(width - 80, x(year))), margin.top + 2, `${year} reporting change`, "plot-reporting-break-label", "middle");
      label.style.pointerEvents = "none"; svg.append(label);
    });
  }
  container.directLabelsRendered = appendDirectLabels(svg, chart, labelPlan, x, y, width, height, margin, true);
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
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
  container.parentElement.querySelector('.chart-compare')?.remove();
  let hovered = null, pointerStart = null;
  const local = event => {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  const nearest = event => {
    if (event.target.chartDatum) return records.find(record => record.mark === event.target) || null;
    const point = local(event), matrix = svg.getScreenCTM(), radius = 18 / Math.hypot(matrix.a, matrix.b);
    if ((chart.otherCrops && event.target.chartSeries?.name === "Other crops") || event.target.chartSeries) {
      return records.filter(record => record.series === event.target.chartSeries).reduce((best, record) => !best || Math.abs(record.x - point.x) < Math.abs(best.x - point.x) ? record : best, null);
    }
    let winner = null, distance = Infinity;
    records.forEach(record => {
      if (chart.recordRows && chart.series.length > 1 && record.point.value === 0) return;
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
    showTooltip(event, chartPointTooltip(chart, record.series, record.point));
  };
  svg.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') hover(event, nearest(event));
  });
  svg.addEventListener('pointerdown', event => {
    if (event.button === 0) pointerStart = { x: event.clientX, y: event.clientY };
  });
  svg.addEventListener('pointerup', event => {
    const start = pointerStart; pointerStart = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 10) return;
    const record = nearest(event);
    if (!record) return;
    if (chart.otherCrops && record.series.name === 'Other crops') openOtherCropBreakdown(container, record.point.year);
    else if (container.focusSeries) container.focusSeries(record.series.name, record.point.year);
    else hover(event, record);
  });
  svg.addEventListener('pointercancel', () => { pointerStart = null; hideTooltip(); });
  svg.addEventListener('keydown', event => {
    const record = event.target.chartDatum;
    if (['Enter', ' '].includes(event.key) && record) {
      event.preventDefault();
      if (chart.otherCrops && record.series.name === 'Other crops') openOtherCropBreakdown(container, record.point.year);
      else container.focusSeries?.(record.series.name, record.point.year);
    }
    if (event.key === 'Escape') { if (container.focusedSeries) container.resetSeries?.(); hideTooltip(); }
  });
  svg.addEventListener('pointerleave', () => { hovered?.mark.classList.remove('is-hovered'); hovered = null; pointerStart = null; hideTooltip(); });
}

// Isolating a series puts it on a zero baseline and rescales the axis; stacked
// offsets no longer obscure small categories. Keep the complete legend for switching.
function hasInformativeBreakdown(series) {
  return (series?.breakdownSeries || []).filter(child => child.values?.some(point => point.value !== 0)).length > 1;
}

function attachSeriesFocus(container, chart) {
  container.parentElement.querySelector(".series-focus-controls")?.remove();
  container.parentElement.querySelector(".series-breakdown-legend")?.remove();
  container.focusSeries = null;
  if (chart.series.length < 2) return;
  const summary = container.parentElement.querySelector(":scope > .series-summary");
  const parent = chart.series.find(series => series.name === container.focusedSeries);
  renderSeriesSummary(summary, visibleChartSeries(container, container.focusedSeries ? { ...chart, overlaySeries: [] } : chart));
  summary.querySelector(".other-crops-button")?.addEventListener("click", () => openOtherCropBreakdown(container, chart.series[0].values.at(-1).year));
  container.resetSeries = () => { if (chart.compactRecords) { container.recordsOpen = false; container.recordSelection = null; } container.focusedSeries = null; container.focusedChild = null; drawChart(container, container.chartConfig); sendHeight(); };
  container.focusSeries = (name, year) => {
    // Keep the previous isolation behavior below for non-R&D charts. R&D leaf
    // clicks do not rescale the same series or hide sibling breakdown categories.
    // Restore the old R&D isolation behavior by enabling this retained override:
    // chart = { ...chart, drilldownOnly: false };
    if (!chart.recordRows && !chart.series.some(series => series.name === name && hasInformativeBreakdown(series))) return;
    if (chart.recordRows) container.recordSelection = { kind: chart.recordKind, crop: name, year: year ?? container.recordFocusYear ?? chart.series[0].values.at(-1).year };
    if (chart.recordRows && container.focusedSeries === name) { openPlantRecords(container, name, year ?? container.recordFocusYear ?? chart.series[0].values.at(-1).year); return; }
    container.recordFocusYear = year ?? chart.series[0].values.at(-1).year;
    if (parent?.breakdownSeries?.some(series => series.name === name)) {
      if (chart.compactRecords && container.focusedChild === name) { openPlantRecords(container, name, container.recordFocusYear); return; }
      container.focusedChild = chart.compactRecords ? name : container.focusedChild === name ? null : name;
    } else {
      container.focusedSeries = container.focusedSeries === name ? null : name;
      container.focusedChild = null;
    }
    drawChart(container, container.chartConfig);
    sendHeight();
  };
  const controls = document.createElement("div"); controls.className = "series-focus-controls";
  const status = document.createElement("span"); status.setAttribute("role", "status");
  status.textContent = parent?.breakdownSeries
    ? (container.focusedChild ? `Showing only ${container.focusedChild}. Axis rescaled.` : `${parent.name} · ${parent.breakdownLabel || "agency breakdown"}. Axis rescaled.`)
    : container.focusedSeries ? chart.compactRecords ? `${container.focusedSeries} · ${parent.values.at(-1).value} ${chart.recordUnit || "records"}` : `Showing only ${container.focusedSeries}. ${chart.dualAxis ? "Axes unchanged." : "Axis rescaled."}${chart.recordRows ? " Select a year on this crop again to see its records." : ""}` : "";
  controls.append(status);
  if (container.focusedChild) {
    const back = document.createElement("button"); back.type = "button"; back.textContent = "Show full breakdown";
    back.addEventListener("click", () => { if (chart.compactRecords) { container.focusedChild = null; container.recordsOpen = false; drawChart(container, chart); sendHeight(); } else container.focusSeries(container.focusedChild); }); controls.append(back);
  }
  if (container.focusedSeries) {
    const reset = document.createElement("button"); reset.type = "button"; reset.textContent = chart.recordRows ? "Show all" : "Back to overview";
    reset.setAttribute("aria-label", `Back to ${chart.title || "chart"} overview`);
    reset.addEventListener("click", () => container.resetSeries()); controls.append(reset);
  }
  // A single breadcrumb in the chart toolbar owns Back navigation.
  // if (container.focusedSeries) summary.before(controls);
  const makeButtons = (legend, seriesList, child = false) => {
    legend.querySelectorAll(":scope > span").forEach(row => {
      const series = seriesList.find(series => row.textContent.trim() === series.name || row.textContent.trim().startsWith(series.name + " "));
      const label = row.querySelector("b");
      if (chart.drilldownOnly && (child || !hasInformativeBreakdown(series))) return;
      if (!series || !label || row.classList.contains("series-visibility-hidden") || row.querySelector(".series-focus-button, .other-crops-button")) return;
      // Legend selections own visibility. Chart options and plotted areas retain
      // breakdown navigation; keep the former per-row action code below so it
      // can be restored by removing this guard.
      if (row.classList.contains("series-visibility-row")) return;
      const active = child ? container.focusedChild === series.name : container.focusedSeries === series.name;
      const button = document.createElement("button"); button.type = "button"; button.className = "series-focus-button";
      button.setAttribute("aria-pressed", String(active));
      button.dataset.focusSeriesName = series.name;
      button.setAttribute("aria-label", active ? (child ? (chart.compactRecords ? `View records for ${series.name}` : "Show full breakdown") : chart.recordRows ? `View records for ${series.name}` : "Show all series") : `${series.breakdownSeries ? "Explore breakdown of " : "Focus on "}${series.name}`);
      if (row.classList.contains("series-visibility-row")) {
        button.classList.add("series-detail-button");
        button.textContent = active && !chart.recordRows ? "Back ↑" : "Details →";
        row.append(button);
      } else { button.innerHTML = label.innerHTML; label.replaceWith(button); }
      button.addEventListener("click", () => {
        container.focusSeries(series.name);
        [...container.parentElement.querySelectorAll(".series-focus-button")].find(item => item.dataset.focusSeriesName === series.name)?.focus({ preventScroll: true });
      });
      row.classList.toggle("series-muted", Boolean(child ? container.focusedChild && !active : container.focusedSeries && !active));
    });
  };
  if (parent?.breakdownSeries && chart.compactRecords) {
    renderSeriesSummary(summary, visibleChartSeries(container, { ...chart, series: parent.breakdownSeries.filter(series => !container.focusedChild || series.name === container.focusedChild), overlaySeries: [], totalLabel: `Other crops · ${chart.recordUnit || "records"}` }, `detail:${parent.name}${parent._breakdownVariant ? `:${parent._breakdownVariant}` : ""}`));
    makeButtons(summary, parent.breakdownSeries, true);
    return;
  }
  if (parent?.breakdownSeries) {
    const breakdown = document.createElement("div"); breakdown.className = "series-breakdown-legend";
    const heading = document.createElement("h4"); heading.textContent = parent.breakdownLabel ? parent.breakdownLabel[0].toUpperCase() + parent.breakdownLabel.slice(1) : "Agency breakdown"; breakdown.append(heading);
    const childLegend = document.createElement("div"); childLegend.className = "series-summary";
    renderSeriesSummary(childLegend, visibleChartSeries(container, { ...chart, series: parent.breakdownSeries.filter(series => !container.focusedChild || series.name === container.focusedChild), overlaySeries: [], hiddenLegendSeries: [], hiddenOverlaySeries: [], decimals: parent.breakdownDecimals ?? chart.decimals, summaryMode: parent.breakdownSummaryMode || chart.summaryMode, legendShare: Boolean(parent.breakdownLegendShare), editableCaption: false, caption: parent.breakdownSummaryMode === "latest" ? `Latest available values · ${parent.breakdownSeries[0].values.at(-1).year}` : parent.breakdownLegendShare ? `Share of reported state support in ${parent.values.at(-1).year}` : "", totalLabel: null }, `detail:${parent.name}${parent._breakdownVariant ? `:${parent._breakdownVariant}` : ""}`));
    breakdown.append(childLegend); makeButtons(childLegend, parent.breakdownSeries, true);
    const note = document.createElement("p"); note.className = "change-note"; note.textContent = parent.breakdownNote || "";
    if (parent.breakdownNote) note.dataset.editableKey = chartTextKey(chart, `breakdown:${encodeURIComponent(parent.name)}${parent._breakdownVariant ? `:${parent._breakdownVariant}` : ""}:note`);
    breakdown.append(note);
    // The chart menu replaces the former second overview legend below details.
    // const fullLabel = document.createElement("h4"); fullLabel.textContent = chart.overviewLegendLabel || "All funding sources"; breakdown.append(fullLabel);
    summary.before(breakdown); summary.hidden = true;
  }
  makeButtons(summary, chart.series);
}

function renderSeriesSummary(summary, chart) {
  summary.classList.toggle("multi", chart.series.length > 1 || Boolean(chart.visibility));
  summary.classList.toggle("regulatory-legend", Boolean(chart.hideLegendValues));
  const caption = chart.caption === undefined ? (chart.summaryMode === "latest" ? "Latest available values" : "") : chart.caption;
  // Keep calculated labels (for example latest-year and share captions) live.
  const note = caption ? chart.caption !== undefined && chart.editableCaption !== false
    ? chartEditableText(chart, "caption", caption, "p", "change-note")
    : `<p class="change-note">${escapeHTML(caption)}</p>` : "";
  let total = "";
  if (chart.totalLabel && chart.summaryMode === "latest" && chart.series.length) {
    const firstYear = Math.max(...chart.series.map(series => series.values[0].year));
    const lastYear = Math.min(...chart.series.map(series => series.values.at(-1).year));
    const first = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === firstYear).value, 0);
    const last = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === lastYear).value, 0);
    const totalValue = chart.summaryMode === "latest" ? formatValue(chart, last) : pct((last / first - 1) * 100);
    total = `<strong class="total-change">${chart.totalLabel}: ${totalValue} <small>${chart.summaryMode === "latest" ? lastYear : ""}</small></strong>`;
  }
  const legendSeries = [...chart.series, ...(chart.visibilityHiddenSeries || []).map(series => ({ ...series, isVisibilityHidden: true })), ...(chart.hiddenLegendSeries || []).map(series => ({ ...series, isHidden: true })), ...(chart.hiddenOverlaySeries || []).map(series => ({ ...series, isHidden: true, isOverlay: true })), ...(chart.overlaySeries || []).filter(series => !series.hideInLegend).map(series => ({ ...series, isOverlay: true }))].map((series, index) => ({ ...series, color: series.color || COLORS[index % COLORS.length] }));
  if (chart.visibility) {
    const positions = new Map(chart.visibility.order.map((name, index) => [name, index]));
    legendSeries.sort((a, b) => (positions.get(a.name) ?? Infinity) - (positions.get(b.name) ?? Infinity));
  }
  if (chart.legendOrder) legendSeries.sort((a,b) => chart.legendOrder.indexOf(a.name) - chart.legendOrder.indexOf(b.name));
  if (chart.legendReverse) legendSeries.reverse();
  const periods = [...new Set(legendSeries.filter(series => !series.isHidden && !series.isVisibilityHidden && !series.hideLegendValue && !series.pointsOnly && !series.sourceBoundary).map(series => `${series.values[0].year}–${series.values.at(-1).year}`))];
  const showChange = false;
  const periodDescription = "Change from first to latest year:";
  const changeHeading = showChange && periods.length ? `<p class="legend-change-heading">${escapeHTML(periodDescription)}</p>` : "";
  const rows = legendSeries.map((series, index) => {
    if (series.isVisibilityHidden) return `<span class="series-visibility-hidden" data-visibility-series="${escapeHTML(series.name)}"><i style="background:${brandSwatch(series)}"></i><b>${escapeHTML(series.name)} <small>Hidden</small></b></span>`;
    if (series.isHidden) return `<span class="series-muted"><i style="background:${brandSwatch(series)}"></i><button type="button" class="series-focus-button" data-enable-addon="${series.addonFlag}" aria-label="Show ${escapeHTML(series.name)}">${escapeHTML(series.name)} <small>Show</small></button></span>`;
    if (chart.hideSingleSeriesSummary && chart.series.length === 1 && !chart.visibility) return "";
    const latest = series.values.at(-1);
    const latestTotal = chart.legendShare ? chart.series.reduce((sum, item) => sum + (item.values.find(point => point.year === latest.year)?.value || 0), 0) : 0;
    const delta = series.hideLegendValue || chart.hideLegendValues || (chart.labelPointSeriesOnly && series.pointsOnly) ? "" : chart.legendShare ? `${format(100 * latest.value / latestTotal, chart.decimals ?? 1)}%` : chart.summaryMode === "latest" ? formatValue(chart, latest.value, series) : "";
    const range = `${series.values[0].year}–${series.values.at(-1).year}`;
    if (series.sourceBoundary && !series.solidSourceSegments) {
      const earlier = series.values.find(point => point.year === series.sourceBoundary.earlierEnd);
      const color = series.color || COLORS[index % COLORS.length];
      return `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3"></line></svg><b>No-till · CTIC/USGS ${formatValue(chart, earlier.value)} <small>${series.sourceBoundary.earlierEnd}</small></b></span><span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3"></line></svg><b>No-till · Census ${delta} <small>${series.values.at(-1).year}</small></b></span>`;
    }
    const hideControl = series.addonFlag ? ` <button type="button" class="legend-hide" data-hide-addon="${series.addonFlag}" aria-label="Hide ${escapeHTML(series.name)}">Hide</button>` : "";
    return chart.series.length === 1 && !chart.visibility
      ? `<span class="single-change"><strong>${delta}</strong> <small>${chart.summaryMode === "latest" ? series.values.at(-1).year : ""}</small></span>`
      : chart.type === "stacked" && !series.isOverlay
        ? `<span><i style="background:${brandSwatch(series)}"></i>${chart.otherCrops && series.name === "Other crops" ? `<button type="button" class="other-crops-button" aria-label="Explore other crop records">${series.name} ${delta}</button>` : `<b>${series.name} ${delta}${series.partialCoverage ? ` <small>${range}</small>` : ""}</b>`}${hideControl}</span>`
        : `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true">${series.pointsOnly ? `<circle cx="9" cy="2" r="1.5" fill="${series.marker === "hollow" ? "none" : series.color || COLORS[index % COLORS.length]}" stroke="${series.color || COLORS[index % COLORS.length]}" stroke-width="${series.marker === "hollow" ? 1 : 0}"></circle>` : `<line x1="0" y1="2" x2="18" y2="2" stroke="${series.color || COLORS[index % COLORS.length]}" stroke-width="3" ></line>`}</svg><b>${series.name} ${delta}${chart.latestYearLabel && !chart.hideLabelYears ? ` <small>${series.values.at(-1).year}</small>` : ""}</b></span>`;
  }).join("");
  const overlayKey = chart.rollingSeries ? `<div class="overlay-key"><span><i class="key-bar"></i> Annual survey</span><span><i class="key-average"></i> Five-survey mean</span><span><i class="key-goal"></i> ${chart.goalLabel || "Goal"}</span></div>` : "";
  summary.innerHTML = note + overlayKey + changeHeading + total + rows;
  summary.querySelectorAll("[data-enable-addon]").forEach(button => button.addEventListener("click", () => {
    const input = summary.closest(".chart-card-content").querySelector(`[data-chart-addon][value="${button.dataset.enableAddon}"]`);
    if (input) { input.checked = true; input.dispatchEvent(new Event("change")); }
    else summary.closest(".chart-card-content").querySelector(".chart-wrap")?.toggleAddon?.(Number(button.dataset.enableAddon));
  }));
  summary.querySelectorAll("[data-hide-addon]").forEach(button => button.addEventListener("click", () => {
    summary.closest(".chart-card-content").querySelector(".chart-wrap")?.toggleAddon?.(Number(button.dataset.hideAddon));
  }));
  decorateSeriesVisibility(summary, chart);
  summary.hidden = !summary.innerHTML;
}

function line(x1, y1, x2, y2, className) { const el = document.createElementNS("http://www.w3.org/2000/svg", "line"); Object.entries({ x1, y1, x2, y2, class: className }).forEach(([k, v]) => el.setAttribute(k, v)); return el; }
function text(x, y, value, className, anchor = "start") { const el = document.createElementNS("http://www.w3.org/2000/svg", "text"); el.setAttribute("x", x); el.setAttribute("y", y); el.setAttribute("class", className); el.setAttribute("text-anchor", anchor); el.textContent = value; return el; }
function showTooltip(event, html) {
  tooltip.innerHTML = html; tooltip.classList.add("show"); tooltip.setAttribute("aria-hidden", "false");
  const bounds = event.target.getBoundingClientRect();
  const px = event.clientX || bounds.left + bounds.width / 2, py = event.clientY || bounds.top;
  tooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - tooltip.offsetWidth - 8, px + 12))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(window.innerHeight - tooltip.offsetHeight - 8, py - 55))}px`;
}
function hideTooltip() { tooltip.classList.remove("show"); tooltip.setAttribute("aria-hidden", "true"); }
function parentOrigin() {
  try { return new URL(document.referrer).origin; } catch { return "*"; }
}
let heightFrame = 0, lastSentHeight = 0;
function sendHeight() {
  if (!IS_EMBEDDED || document.fullscreenElement || heightFrame) return;
  heightFrame = requestAnimationFrame(() => {
    heightFrame = 0;
    // Measure content, not the iframe viewport, so a shorter topic can shrink it.
    const height = Math.ceil(document.querySelector(".tracker-shell").getBoundingClientRect().height);
    if (height !== lastSentHeight) {
      lastSentHeight = height;
      window.parent.postMessage({ type: "bti-intensification-height", height }, parentOrigin());
    }
  });
}
// A host may attach its resize listener after the embedded page has loaded.
window.addEventListener('message', event => {
  if (IS_EMBEDDED && event.source === window.parent && event.data?.type === 'bti-intensification-request-height') {
    lastSentHeight = 0;
    sendHeight();
  }
});
function standaloneURL() {
  const url = new URL(location.href); url.searchParams.delete("embed");
  ["chart", "view", "measure", "change", "pathways"].forEach(key => url.searchParams.delete(key));
  if (ACTIVE_TOPIC === "products") url.searchParams.set("measure", selectedMatrixMetric);
  else if (ACTIVE_TOPIC) {
    url.searchParams.set("chart", String(MOBILE_CHART));
    const card = [...panel.querySelectorAll(".chart-card, .product-evidence")][MOBILE_CHART];
    const view = card?.querySelector("[data-chart]")?.chartConfig?.id || card?.querySelector('[data-chart-view][aria-pressed="true"]')?.dataset.view;
    if (view) url.searchParams.set("view", view);
    if (card?.querySelector("[data-chart]")?.chartConfig?.usdaFilter && selectedUSDAPathways.size !== Object.keys(USDA_PATHWAYS).length) url.searchParams.set("pathways", [...selectedUSDAPathways].join(",") || "none");
  }
  if (CHANGE_MODE === "total") url.searchParams.set("change", "total");
  return url.href;
}
function updateToolbarSize() {
  const height = Math.ceil(document.querySelector(".explorer-toolbar").getBoundingClientRect().height);
  document.documentElement.style.setProperty("--toolbar-height", `${height}px`);
}
function positionExplorerActions() {
  const actions = document.querySelector(".explorer-actions");
  const toolbar = document.querySelector(".explorer-toolbar");
  const inToolbar = mobileLayout.matches || document.body.classList.contains("focus-view");
  const target = inToolbar ? toolbar : document.querySelector(".tracker-header");
  if (actions.parentElement !== target) {
    if (inToolbar) target.prepend(actions);
    else target.append(actions);
  }
}
positionExplorerActions();
mobileLayout.addEventListener("change", positionExplorerActions);
const fullscreenButton = document.querySelector("#fullscreen-toggle");
fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
    if (IS_EMBEDDED) window.open(standaloneURL(), "_blank", "noopener");
    else { document.body.classList.toggle("focus-view"); updateFullscreenControls(); }
    return;
  }
  try { await document.documentElement.requestFullscreen(); }
  catch { document.querySelector("#display-status").textContent = "Full screen is unavailable in this browser. Use Open in new tab for the standalone tracker."; }
});
function updateFullscreenControls() {
  positionExplorerActions();
  const expanded = !!document.fullscreenElement || document.body.classList.contains("focus-view");
  fullscreenButton.setAttribute("aria-pressed", String(expanded));
  fullscreenButton.querySelector(".fullscreen-label").textContent = expanded ? "Exit full screen" : "Full screen";
  fullscreenButton.title = expanded ? "Exit full screen" : "Full screen";
  document.body.classList.toggle("fullscreen-view", !!document.fullscreenElement);
  lastSentHeight = 0; updateToolbarSize(); sendHeight();
}
document.addEventListener("fullscreenchange", updateFullscreenControls);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("focus-view")) { document.body.classList.remove("focus-view"); updateFullscreenControls(); }
});
document.querySelector("#open-tracker").addEventListener("click", event => { event.currentTarget.href = standaloneURL(); });
window.addEventListener("hashchange", () => { if (DATA && TOPICS[location.hash.slice(1)] && ACTIVE_TOPIC !== location.hash.slice(1)) renderTopic(location.hash.slice(1)); });
window.addEventListener("scroll", () => { hideTooltip(); if (matrixAnchor && !matrixPinned) closeMatrixPopover(); }, { passive: true });
mobileLayout.addEventListener("change", () => {
  panel.querySelector(".topic-context")?.toggleAttribute("open", !mobileLayout.matches);
  selectMobileChart(MOBILE_CHART, false); updateToolbarSize();
});
let resizeTimer;
const chartResizeObserver = new ResizeObserver(() => {
  updateToolbarSize();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    panel.querySelectorAll("[data-chart]").forEach(container => {
      if (!container.chartConfig || !container.getBoundingClientRect().width) return;
      const width = Math.max(240, Math.round(container.getBoundingClientRect().width));
      const svgWidth = container.querySelector("svg")?.viewBox.baseVal.width;
      if (Math.abs(width - svgWidth) > 2) {
        const comparison = container.parentElement.querySelector(".chart-compare");
        const state = comparison ? { open: comparison.querySelector("details").open, series: comparison.querySelector(".compare-series").value, from: comparison.querySelector(".compare-from").value, to: comparison.querySelector(".compare-to").value, focus: ["compare-series", "compare-from", "compare-to", "compare-clear"].find(name => comparison.contains(document.activeElement) && document.activeElement.classList.contains(name)) } : null;
        const methodsOpen = container.parentElement.querySelector(".chart-methods")?.open;
        drawChart(container, container.chartConfig);
        if (methodsOpen) container.parentElement.querySelector(".chart-methods")?.setAttribute("open", "");
        const controls = container.parentElement.querySelector(".chart-compare");
        if (state?.open && controls) {
          controls.querySelector(".compare-series").value = state.series;
          controls.querySelector(".compare-series").dispatchEvent(new Event("change"));
          controls.querySelector(".compare-from").value = state.from;
          controls.querySelector(".compare-to").value = state.to;
          controls.querySelector("details").open = true;
          controls.querySelector(".compare-to").dispatchEvent(new Event("change"));
          if (state.focus) controls.querySelector(`.${state.focus}`)?.focus({ preventScroll: true });
        }
      }
    });
    sendHeight();
  }, 120);
});
chartResizeObserver.observe(panel);
new ResizeObserver(updateToolbarSize).observe(document.querySelector(".explorer-toolbar"));

document.querySelectorAll(".topic-nav button").forEach((button, index, buttons) => {
  button.id = `topic-tab-${button.dataset.topic}`;
  button.setAttribute("role", "tab"); button.setAttribute("aria-controls", "tracker-panel");
  button.addEventListener("click", () => renderTopic(button.dataset.topic));
  button.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length; buttons[next].focus(); buttons[next].click(); });
});
document.querySelector("#topic-select").addEventListener("change", event => renderTopic(event.target.value));
panel.addEventListener("click", event => {
  const chartHeading = event.target.closest(".chart-card > summary, .product-evidence > summary");
  if (mobileLayout.matches && chartHeading && !TEXT_EDIT_MODE) { event.preventDefault(); chartHeading.parentElement.open = true; return; }
  const arrow = event.target.closest("[data-chart-step]");
  if (arrow) {
    const step = Number(arrow.dataset.chartStep);
    selectMobileChart(MOBILE_CHART + step, false);
    const selected = panel.querySelector(".mobile-selected");
    const destination = selected.parentElement.querySelector(`[data-chart-step="${step}"]`);
    // Keep keyboard focus in the new card, without jumping back to the topic heading.
    (destination.disabled ? selected.querySelector("summary") : destination).focus({ preventScroll: true });
    return;
  }
  if (event.target.closest(".study-popover-close")) {
    const trigger = event.target.closest(".study-info").querySelector(".study-info-trigger");
    trigger.setAttribute("aria-expanded", "false"); trigger.focus({ preventScroll: true }); return;
  }
  if (event.target.closest(".matrix-popover-close")) { closeMatrixPopover(true); return; }
  const matrixButton = event.target.closest("[data-matrix-cell]");
  if (matrixButton) {
    if (matrixAnchor === matrixButton && matrixPinned) closeMatrixPopover();
    else openMatrixPopover(matrixButton, true);
    return;
  }
  const sortButton = event.target.closest("[data-study-sort]");
  if (sortButton) {
    STUDY_SORT_DIRECTION = STUDY_SORT_DIRECTION === "desc" ? "asc" : "desc";
    const ascending = STUDY_SORT_DIRECTION === "asc";
    sortButton.textContent = `Change ${ascending ? "↑" : "↓"}`;
    sortButton.setAttribute("aria-label", `Sort by absolute change, ${ascending ? "ascending" : "descending"}`);
    sortButton.title = `Sort by absolute change, ${ascending ? "ascending" : "descending"}`;
    const metric = ACTIVE_TOPIC === 'livestock' ? panel.querySelector('[data-chart="4"]').chartConfig.metric : ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[document.querySelector("#topic-select").value];
    const bars = panel.querySelector(".product-bars");
    if (metric && bars) bars.innerHTML = studyBarRows(metric);
    sendHeight();
    return;
  }
  const modeButton = event.target.closest("[data-change-mode]");
  if (modeButton) {
    CHANGE_MODE = modeButton.dataset.changeMode;
    panel.querySelectorAll("[data-change-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.changeMode === CHANGE_MODE)));
    const metric = ACTIVE_TOPIC === 'livestock' ? panel.querySelector('[data-chart="4"]').chartConfig.metric : ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[document.querySelector("#topic-select").value];
    if (metric) { panel.querySelector(".product-bars").innerHTML = studyBarRows(metric); const note = panel.querySelector(".study-comparison-note"); if (note) { note.textContent = studyComparisonNote(); note.dataset.editableKey = `study:${metric}:comparison-note:${CHANGE_MODE}`; applySavedTextEdits(note.parentElement); } }
    if (ACTIVE_TOPIC === 'livestock') {
      const container = panel.querySelector('[data-chart="4"]');
      drawChart(container, container.chartConfig);
    }
    document.querySelector("#open-tracker").href = standaloneURL();
    sendHeight();
    return;
  }
  const trigger = event.target.closest(".study-info-trigger");
  panel.querySelectorAll(".study-info-trigger[aria-expanded='true']").forEach(button => {
    if (button !== trigger) button.setAttribute("aria-expanded", "false");
  });
  if (trigger) { const opened = trigger.getAttribute("aria-expanded") !== "true"; trigger.setAttribute("aria-expanded", String(opened)); if (opened) trigger.closest(".study-info").querySelector(".study-popover-close").focus({ preventScroll: true }); }
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
  if (button && !restoringMatrixFocus) openMatrixPopover(button);
});
panel.addEventListener("focusout", event => {
  if (matrixAnchor && !matrixPinned && !panel.querySelector(".matrix-popover")?.contains(event.relatedTarget)) matrixHideTimer = setTimeout(closeMatrixPopover, 140);
});
document.addEventListener("click", event => {
  if (matrixAnchor && !event.target.closest("[data-matrix-cell], .matrix-popover")) closeMatrixPopover();
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && matrixAnchor) { closeMatrixPopover(true); } });
window.addEventListener("resize", () => { if (matrixAnchor) positionMatrixPopover(matrixAnchor, panel.querySelector(".matrix-popover")); });

document.addEventListener("click", event => {
  if (!event.target.closest(".study-info")) panel.querySelectorAll(".study-info-trigger").forEach(button => button.setAttribute("aria-expanded", "false"));
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideTooltip(); panel.querySelectorAll('.study-info-trigger[aria-expanded="true"]').forEach(button => {
      button.setAttribute("aria-expanded", "false");
      if (button.closest(".study-info").contains(document.activeElement)) button.focus({ preventScroll: true });
    });
  }
});
applySavedTextEdits(document);
panel.innerHTML = '<div class="loading">Loading the tracker…</div>';
Promise.all(["data.json", "product-studies.json", "text-edits.json", "biotech-decisions.json", "rd-updated-sources.json"].map(path => fetch(path, { cache: "no-cache" }).then(response => { if (!response.ok) throw new Error(`${path} failed to load`); return response.json(); }))).then(([data, studies, textEdits, biotech, rdUpdated]) => {
  DATA = data; RD_UPDATED = rdUpdated; BIOTECH = biotech; STUDIES = studies.studies; PROJECT_TEXT_EDITS = textEdits; applySavedTextEdits(document); const ghg2023 = { year: 2023, value: 595.4 }; [DATA.overview.ghg, DATA.climate.total].forEach(series => { if (!series.some(d => d.year === 2023)) series.push(ghg2023); });
  const requested = location.hash.slice(1), initial = TOPICS[requested] ? requested : "overview";
  const params = new URLSearchParams(location.search);
  const chartIndex = Math.max(0, Number.parseInt(params.get("chart"), 10) || 0);
  CHART_CHOICES.set(initial, chartIndex);
  if (params.get("view")) CHART_STATES.set(`${initial}:${chartIndex}`, { view: params.get("view") === "fda-annual" ? "fda-meetings" : params.get("view") });
  if (MATRIX_METRICS.includes(params.get("measure"))) selectedMatrixMetric = params.get("measure");
  if (params.get("change") === "total") CHANGE_MODE = "total";
  if (params.has("pathways")) selectedUSDAPathways = new Set(params.get("pathways").split(",").filter(key => Object.hasOwn(USDA_PATHWAYS, key)));
  renderTopic(initial);
  document.fonts?.ready.then(() => { updateToolbarSize(); sendHeight(); });
}).catch(() => { panel.innerHTML = location.protocol === "file:"
  ? '<div class="loading">To preview locally, double-click preview.command in this folder and keep its Terminal window open.</div>'
  : '<div class="loading">The data could not be loaded. Please refresh the page.</div>'; });

new ResizeObserver(sendHeight).observe(document.body);
