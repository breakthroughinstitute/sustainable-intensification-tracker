const COLORS = ["#0dc3a8", "#0d4459", "#ee5c36", "#f8b944", "#56a9d5", "#e82269", "#252a2b"];
const panel = document.querySelector("#tracker-panel");
const tooltip = document.querySelector("#tooltip");
let DATA;
let BIOTECH;
let STUDIES;
let CHANGE_MODE = "annual";
let STUDY_SORT_DIRECTION = "desc";
const mobileLayout = window.matchMedia("(max-width: 900px)");
let ACTIVE_TOPIC = null;
let MOBILE_CHART = 0;
const CHART_CHOICES = new Map();
const CHART_STATES = new Map();
const CARD_STATES = new Map();
let selectedMatrixMetric = "greenhouse_gas";
const IS_EMBEDDED = window.parent !== window;
document.body.classList.toggle("is-embedded", IS_EMBEDDED);
document.body.classList.toggle("local-preview", ["127.0.0.1", "localhost"].includes(location.hostname));
const TEXT_EDITS_STORAGE_KEY = "bti-si-tracker-text-edits-v1";
let PROJECT_TEXT_EDITS = {};
let TEXT_EDIT_MODE = false;
const LOCAL_EDIT_SERVER = ["127.0.0.1", "localhost"].includes(location.hostname);

function readTextEdits() {
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
  if (enabled && !LOCAL_EDIT_SERVER) status.textContent = "This hosted page saves text only in your browser. Use the local preview to save edits into the project source.";
  else if (enabled) status.textContent = "Click highlighted text to edit, then save your changes to the tracker project.";
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
function yearTicks(first, last, plotWidth) {
  if (first === last) return [first];
  const gap = (last - first) * 42 / Math.max(plotWidth, 1);
  const targetStep = (last - first) / Math.min(5, Math.max(2, Math.floor(plotWidth / 50)));
  const step = [1, 2, 5, 10, 20, 25, 50, 100].reduce((best, step) => Math.abs(step - targetStep) < Math.abs(best - targetStep) ? step : best);
  const ticks = [first];
  for (let year = Math.ceil(first / step) * step; year < last; year += step) {
    if (year - ticks.at(-1) >= gap && last - year >= gap) ticks.push(year);
  }
  ticks.push(last);
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
      return { ...series, color: series.color || COLORS[index % COLORS.length], values: series.values.map(point => ({ year: point.year, value: count += annual.get(`${series.name}:${point.year}`) || 0 })) };
    });
  };
  return { ...chart, series: aggregate(chart.series, crop => majorCrops.has(crop) ? crop : "Other crops").filter(series => series.values.at(-1).value > 0), otherCrops: aggregate(BIOTECH.usdaOtherCrops, crop => crop), filteredRecordCount: records.length };
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
  const measure = row.product === "dairy" && row.metric === "water" ? "Modeled total water use" : { blue_water: "Blue water use", water_consumption: "Water consumption", direct_water: "Direct farm water", irrigation_water: "Irrigation water", cropland: "Feed cropland", fertilizer_n: "Fertilizer nitrogen applied per unit of crop output", reactive_n_loss: "Life-cycle reactive nitrogen lost to air and water", n_leached: "Modeled farm nitrogen leaching below the root zone", marine_eutrophication: "Life-cycle marine eutrophication potential", soil_erosion_output: "Derived soil loss per unit of crop output" }[row.metric];
  const period = CHANGE_MODE === "annual" ? "Compound annual change between study endpoints." : "Total change between study endpoints.";
  return `<div class="study-info"><button type="button" class="study-info-trigger" aria-label="Details for ${name}" aria-expanded="false" title="Study details">i</button><div class="study-popover" role="dialog" aria-label="${name} study details"><button type="button" class="study-popover-close" aria-label="Close study details">×</button><strong>${escapeHTML(STUDY_NAMES[row.study_id] || row.study_id)}</strong>${measure ? `<span>${measure}</span>` : ""}<span>${row.base_year}: ${studyNumber(row.base_value)} → ${row.latest_year}: ${studyNumber(row.latest_value)} ${escapeHTML(measurement.unit)}</span><span>${period}</span>${measurement.basis ? `<span>${escapeHTML(measurement.basis)}</span>` : ""}${row.comparison_note ? `<span>${escapeHTML(row.comparison_note)}</span>` : ""}<span>Periods and methodologies differ across some studies.</span><span>${escapeHTML(row.source_table)}</span>${source}</div></div>`;
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
  panel.innerHTML = `<div class="panel-lead"><h2 data-editable-key="products:title">Explore changes in product footprints</h2><p data-editable-key="products:subtitle">Annualized change in resource use and environmental impacts per unit of product in the United States.</p></div><div class="matrix-controls"><label for="matrix-metric">Measure</label><select id="matrix-metric">${MATRIX_METRICS.map(metric => `<option value="${metric}">${MATRIX_METRIC_NAMES[metric]}</option>`).join("")}</select></div><div class="matrix-legend" aria-label="Color scale"><span>← Faster annual declines</span><i aria-hidden="true"></i><span>Slower declines →</span></div><div class="matrix-wrap"><table class="product-matrix"><caption data-editable-key="products:matrix-caption">Annualized change in per-unit product footprints, not total sector impacts</caption><thead><tr><th scope="col">Product</th>${MATRIX_METRICS.map(metric => `<th scope="col" data-metric="${metric}">${MATRIX_METRIC_NAMES[metric]}</th>`).join("")}</tr></thead><tbody>${PRODUCT_ORDER.map(product => `<tr class="${product === "corn" ? "matrix-crops-start" : ""}"><th scope="row">${PRODUCT_NAMES[product]}</th>${MATRIX_METRICS.map(metric => matrixCell(product, metric)).join("")}</tr>`).join("")}</tbody></table></div><p class="product-boundary" data-editable-key="products:boundary">Rates are compound annual changes between study endpoints. Crop soil loss per unit of output is derived from Field to Market's soil loss per acre and planted acres per unit of output. Its 2020 soil-loss figure is the report’s published smoothed trend estimate, using USDA erosion-model inputs through 2017. Select a cell for values, methods and sources.</p>`;
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
  const rows = studyRows(metric);
  const values = rows.map(studyChange);
  const minChange = Math.min(0, ...values), maxChange = Math.max(0, ...values);
  const extent = Math.max(maxChange - minChange, 0.01);
  const zero = -minChange / extent * 100;
  const bars = panel.querySelector(".product-bars");
  if (bars) bars.style.setProperty("--product-zero", String(zero / 100));
  const axis = panel.querySelector(".product-bar-axis");
  if (axis) axis.innerHTML = `<span class="bar-direction">${minChange < 0 ? "← Decrease" : ""}</span><span class="bar-zero" style="left:${zero}%">0%</span>${maxChange > 0 ? '<span class="bar-increase">Increase →</span>' : ""}`;
  const nitrogenLabels = { fertilizer_n: "Fertilizer N applied", reactive_n_loss: "Reactive N loss", n_leached: "N leached", marine_eutrophication: "Marine eutrophication" };
  const bar = row => {
    const value = studyChange(row);
    const width = Math.abs(value) / extent * 100;
    const left = value > 0 ? zero : zero - width;
    return `<div class="product-bar-row ${metric === "fertilizer_n" ? "nitrogen-product-bar" : ""}"><div class="product-bar-name"><strong>${PRODUCT_NAMES[row.product]}</strong><small>${studyPeriod(row)}</small></div><div class="product-bar-track" role="img" aria-label="${PRODUCT_NAMES[row.product]}, ${nitrogenLabels[row.metric] || STUDY_METRIC_NAMES[metric]}, ${studyPeriod(row)}: ${studyDelta(row)}"><span class="${value > 0 ? "increase" : "decrease"}" style="left:${left}%;width:${width}%"></span></div><strong class="product-bar-value">${studyDelta(row)}</strong>${studyDetails(row)}</div>`;
  };
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
  const descriptions = {
    land: "Land or feed-cropland use per unit of product.",
    water: "Water use per unit of product; the specific measure varies by study.",
    greenhouse_gas: "Life-cycle greenhouse-gas emissions per unit of product.",
    fertilizer_n: "Nitrogen applied, lost, leached, or linked to eutrophication per unit of product, depending on the study."
  };
  return `<details class="product-evidence" ${metric === "greenhouse_gas" ? "" : "open"}><summary><span data-editable-key="study:${metric}:title">${titles[metric]}</span></summary><div class="product-evidence-body"><p class="product-evidence-subtitle" data-editable-key="study:${metric}:description">${descriptions[metric]}</p><div class="product-evidence-controls">${changeToggle()}<button type="button" class="product-explore-link">Explore all measures →</button></div><div class="product-bar-sort-row"><span></span><div class="product-bar-axis" aria-label="Change from zero"></div>${studySortHeader()}<span></span></div><div class="product-bars">${studyBarRows(metric)}</div></div></details>`;
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
function biotechDecisionChart() {
  const common = {
    type: "stacked", summaryMode: "latest", comparisonMode: "absolute", decimals: 0, hideLegendValues: true, legendReverse: true,
    caption: "Regulatory decisions are a step toward bringing a crop to market. These records can cover several plant lines or revisit a product, so they do not count unique varieties or confirm commercial sales. 2026 runs through October 2.",
    yLabel: "Cumulative records", tooltipUnit: "", totalLabel: "Total records"
  };
  const usdaSources = '<a href="https://www.aphis.usda.gov/biotechnology/legacy-petition-process/petitions" target="_blank" rel="noopener">USDA petition determinations</a>; <a href="https://www.aphis.usda.gov/regulatory-status-review-table" target="_blank" rel="noopener">regulatory status reviews</a>; <a href="https://www.aphis.usda.gov/confirmation-letters" target="_blank" rel="noopener">exemption confirmations</a>; <a href="https://www.aphis.usda.gov/biotechnology/regulated-article-inquiry" target="_blank" rel="noopener">Am I Regulated letters</a>';
  const download = '<a href="biotech-records.csv" download>Download underlying records (CSV)</a>';
  const eventDownload = '<a href="biotech-epa-events.csv" download>Download identified EPA crop events (CSV)</a>';
  const cropSeries = BIOTECH.usdaByCrop.map(series => ({ ...series, color: series.name === "Canola" ? "#8b6bb1" : series.name === "Other crops" ? "#738184" : undefined }));
  const epa = {
    ...common, yLabel: "Cumulative crop events", totalLabel: "Identified crop events", comparisonLabel: "additional crop events",
    caption: "A crop event is a plant line with a particular genetic modification. Each identified event is counted once, even when EPA lists several pest-control ingredients for it. An event can be bred into many seed varieties. Registration does not confirm commercial sales. 2026 runs through October 2.",
    explanations: [
      { title: "What does this count cover?", body: "This is a minimum count of individually identified crop events in EPA’s registration list. Two older potato listings cover groups of plants without identifying all their individual lines and are excluded. USDA and EPA may review the same crop, so their totals should not be added." },
      { title: "What about PIPs exempt from registration?", body: "Some engineered pest protections similar to those achievable through conventional breeding can qualify for an exemption from EPA registration. These include certain changes to genes from plants that can be crossed, or reducing an existing gene’s activity to create pest resistance. This chart covers registered protections and does not estimate the number of exempt products." }
    ],
    source: `<a href="https://www.epa.gov/ingredients-used-pesticide-products/current-and-previously-registered-section-3-plant-incorporated" target="_blank" rel="noopener">EPA current and previously registered PIPs</a>; <a href="https://downloads.regulations.gov/EPA-HQ-OPP-2016-0036-0013/content.pdf" target="_blank" rel="noopener">EPA’s 2017 potato decision</a>; <a href="https://www.epa.gov/newsreleases/new-citrus-tool-help-prevent-widespread-loss-citrus-crops-and-support-americas-food" target="_blank" rel="noopener">EPA’s 2026 citrus decision</a>; <a href="https://www.epa.gov/pesticides/epa-posts-resources-rule-accelerate-use-plant-incorporated-biotechnologies-protect" target="_blank" rel="noopener">EPA registration exemptions</a>.<p>Ingredients linked to the same named crop event are combined and dated to their first registration in the source table. The potato decision identifies three lines—W8, X17, and Y9—under one ingredient listing. The citrus decision identifies one product with three gene edits. The two unresolved older listings concern New Leaf potatoes and potatoes protected against leaf roll virus. ${eventDownload}; ${download}.</p>`
  };
  return {
    title: "Genetically engineered and gene-edited crop decisions", fullWidth: true,
    views: [
      { ...common, id: "usda-crop", label: "USDA · by crop", usdaFilter: true, subtitle: "USDA decisions on biotech crops, by crop, 1992–2026", series: cropSeries, otherCrops: BIOTECH.usdaOtherCrops,
        source: `${usdaSources}.<p>One record per completed crop petition, regulatory status review, exemption confirmation, or favorable Am I Regulated response. Uses the effective or response date; pending requests and non-crop organisms are excluded. Scope includes food, feed, fiber, tobacco, and biofuel crops. Other crops combines the smaller crop categories. These USDA decisions do not establish FDA or EPA approval or commercial adoption. ${download}.</p>` },
      { ...common, id: "usda-pathway", label: "USDA · by review pathway", explanationTitle: "About review pathways", subtitle: "USDA approvals by regulatory pathway", series: BIOTECH.usdaByPathway,
        explanations: [
          { title: "Petition determinations", body: "Used from 1992 through the 2021 transition; new petitions resumed March 3, 2025. USDA assesses plant-pest risk and grants nonregulated status to crops previously subject to its rules. The route covers many older transgenic crops." },
          { title: "Regulatory status reviews", body: "April 5, 2021–December 2, 2024. Created by the 2020 SECURE rule, this short-lived replacement for petitions expanded to all plants in October 2021. USDA assessed increased plant-pest risk." },
          { title: "Exemption confirmations", body: "August 17, 2020–December 2, 2024. Created by the 2020 SECURE rule, this process confirmed exemptions for certain changes achievable through conventional breeding, including targeted changes within a plant’s gene pool." },
          { title: "Am I Regulated responses", body: "New inquiries stopped in June 2020 and resumed January 8, 2025. USDA determines whether a plant falls outside its biotechnology regulations and therefore does not need a petition for nonregulated status. Only responses finding plants nonregulated are counted here. This route includes gene-edited and some transgenic crops." }
        ],
        source: `${usdaSources}.<p>Pathways have different criteria and are not equivalent to transgenic versus gene-edited categories. Exemption confirmations and Am I Regulated letters are findings of regulatory status, not product approvals. The 2020 rules were vacated in December 2024; earlier responses remain valid. Public records do not cover every developer self-determination. <a href="https://www.aphis.usda.gov/vacatur-2020-regulations" target="_blank" rel="noopener">USDA’s account of the December 2024 ruling and restarted processes</a>; <a href="https://www.aphis.usda.gov/sites/default/files/brs_2020518.pdf" target="_blank" rel="noopener">2020 rule and phased implementation dates (p. 29815)</a>; <a href="https://www.aphis.usda.gov/news/program-update/aphis-resumes-receipt-petitions-nonregulated-status" target="_blank" rel="noopener">USDA guidance on gene-edited and transgenic plants</a>. ${download}.</p>` },
      { ...epa, id: "epa-crop", label: "EPA · all registrations", subtitle: "Crop events with EPA-registered plant-incorporated protectants (PIPs): pest protection built into the plant itself, such as Bt corn’s insect-killing proteins.", series: BIOTECH.epaEventsByCrop }

    ]
  };
}
function federalAgencyBudgetView() {
  const colors = { "ARS research": "#00bfa5", "NIFA and predecessor research": "#10495e", "Other USDA research (ERS, NASS and others)": "#bc743b", "Agricultural research facilities": "#adb7bd", "Forest Service research": "#859e70" };
  const series = DATA.rd.agencyBudgetWithForestry.map(item => ({ ...item, color: colors[item.name] }))
    .sort((a, b) => Number(b.name === "Agricultural research facilities") - Number(a.name === "Agricultural research facilities"));
  return {
    title: "USDA agricultural and forestry R&D funding",
    subtitle: "Research budget authority by agency, plus agricultural research facilities, 2000–2024",
    yLabel: "Billion 2022 dollars", tooltipUnit: "billion 2022 dollars", type: "stacked", series,
    overlaySeries: [{ name: "USDA budget total", color: "#56a9d5", dasharray: "", hideInLegend: true,
      values: series[0].values.map(point => ({ year: point.year, value: series.reduce((sum, item) => sum + item.values.find(d => d.year === point.year).value, 0) })) }],
    totalLabel: "USDA budget total", showChangeYears: true, fullWidth: true,
    caption: "Funds made available for R&D. Forest Service research is separate. The blue line is the net total; negative facilities funding in 2011 cancels earlier allocations.",
    explanationTitle: "Coverage and accounting",
    explanations: [
      { title: "Research components", body: "ARS and NIFA use their research budget components, not their entire agency appropriations. Other USDA research includes ERS, NASS, APHIS and other research reported under budget function 350, with table rounding residuals. Forest Service research is reported separately under natural resources and environment; its forestry facilities are excluded throughout this chart." },
      { title: "Budget authority and spending", body: "Budget authority permits agencies to commit funds. Obligations are commitments such as awards and contracts; outlays are payments. These measures can differ within a year. This chart consistently uses budget authority, not Gateway award amounts or university expenditures." },
      { title: "Historical comparability", body: "Each year uses its published actual agency budget table. Program classifications and reporting definitions have changed. All values use the same NIH/BEA research deflator as the detailed spending chart; the 2024 deflator is preliminary." }
    ],
    source: `<a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab012.pdf" target="_blank" rel="noopener">NCSES, agricultural agency budgets (annual tables)</a>; <a href="https://ncses.nsf.gov/pubs/nsf26309/assets/data-tables/tables/nsf26309-tab011.pdf" target="_blank" rel="noopener">NCSES, Forest Service research (annual tables)</a>; <a href="https://files.eric.ed.gov/fulltext/ED458125.pdf" target="_blank" rel="noopener">NSF, 2000 agency budgets</a>; <a href="https://usda.azureedge.us/sites/default/files/documents/16ars2013notes.pdf" target="_blank" rel="noopener">USDA facility histories</a>; ${sourceLinks.brdpi}. <a href="rd-source-comparison.csv" download>Download annual dataset comparison</a>.`,
    decimals: 2
  };
}

function federalSpendingDetailChart() {
  return {
    title: "Federal agricultural R&D spending",
    subtitle: "USDA R&D and facilities payments + non-USDA-funded university agricultural sciences research",
    yLabel: "Billion 2022 dollars", tooltipUnit: "billion 2022 dollars", type: "stacked",
    series: DATA.rd.federalStateSpendingDetail.filter(series => !series.partialCoverage),
    nonUsdaBreakdown: DATA.rd.nonUsdaUniversityBreakdown,
    showChangeYears: true, fullWidth: true, decimals: 2,
    caption: "Includes forestry; state funding is shown separately below. Before 2010, a small unallocated share is counted as non-USDA.",
    source: `<a href="https://ncses.nsf.gov/pubs/nsf26316" target="_blank" rel="noopener">NCSES, federal R&D outlays and facilities</a>; ${sourceLinks.herd}; <a href="https://portal.nifa.usda.gov/enterprise-search/" target="_blank" rel="noopener">NIFA Data Gateway, annual Financial Details</a>; ${sourceLinks.brdpi}.<p>University data cover agricultural sciences; definitions change in 2010, 2016 and 2020. USDA-funded university spending is already included in USDA payments. All displayed series use the same research deflator. State project funding is retained in the download as a separate comparison, not an area in this chart.</p><a href="rd-federal-spending.csv" download>Download chart data</a>; <a href="rd-gateway-annual-totals.csv" download>Gateway totals by year, mechanism and source</a>; <a href="rd-source-comparison.csv" download>annual dataset comparison</a>.`
  };
}

function gatewayStateFundingChart() {
  const common = {
    type: "stacked", yLabel: "Billion 2022 dollars", tooltipUnit: "billion 2022 dollars", decimals: 2,
    legendShare: true,
    caption: "Legend shows each category’s share in 2021. Reports include mixed activities and incomplete nonformula reporting in 2010–2014; formula coverage ends in 2021.",
    source: `<a href="https://portal.nifa.usda.gov/enterprise-search/" target="_blank" rel="noopener">NIFA Data Gateway, annual Financial Details</a>; ${sourceLinks.brdpi}.<p>State appropriations reported by projects, grouped by their funding mechanism or program label. These are state dollars supporting those projects, not NIFA grant amounts. Other capacity includes Animal Health and Renewable Resources Extension projects. The exports do not provide a state-location or research-focus classification. Categories and totals are not a complete national research-only estimate.</p><a href="rd-gateway-annual-totals.csv" download>Annual mechanism and source totals</a>; <a href="rd-source-comparison.csv" download>Annual program totals and dataset comparison</a>.`
  };
  return {
    title: "State funding reported by agricultural projects", fullWidth: true,
    viewLabel: "Break down state appropriations",
    views: [
      { ...common, id: "state-program", label: "By project program", subtitle: "Reported state appropriations by project program, 2004–2021", series: DATA.rd.gatewayStateByProgram },
      { ...common, id: "state-mechanism", label: "By funding mechanism", subtitle: "Reported state appropriations by project funding mechanism, 2004–2021", series: DATA.rd.gatewayStateByMechanism }
    ]
  };
}

const TOPICS = {
  overview: () => ({
    title: "Output is decoupling from resource use and impacts",
    intro: "",
    why: "U.S. agriculture covers about 40 percent of the country's land and accounts for approximately 80 percent of its consumptive water use. At this scale, changes in resource use and emissions have broad consequences. Comparing output with these pressures shows whether more production also brings proportionate increases in environmental impact.",
    happened: "From 1990 to each series' latest year (2023, except water withdrawals, which end in 2015), farm output rose 53.9 percent and total factor productivity rose 42.7 percent. Direct agricultural greenhouse-gas emissions rose 8.0 percent, while land use fell 8.3 percent and water withdrawals fell 11.9 percent. Output therefore grew faster than direct emissions, while the land and water measures declined as production grew. These selected indicators show decoupling on these measures; they do not show that every environmental pressure fell.",
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
        subtitle: "",
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
        caption: "",
        goalLabel: "EPA 2035 Goal",
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
        subtitle: "U.S. irrigation and livestock withdrawals, including nonfarm irrigation.",
        yLabel: "Billion gallons per day",
        tooltipUnit: "billion gallons per day",
        series: single("Withdrawals", DATA.water.total),
        source: `${sourceLinks.water}; <a href="https://pubs.usgs.gov/publication/cir1441" target="_blank" rel="noopener">USGS 2015 report, Table 14</a>.<p>Surface-water and groundwater withdrawals, not consumptive use. USGS irrigation includes farms, golf courses, and other irrigated landscapes; aquaculture is excluded from this sum.</p>`,
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
        subtitle: "Average aquifer water level across eight states below predevelopment (~1950).",
        yLabel: "Feet below predevelopment",
        tooltipUnit: "feet below predevelopment",
        series: single("High Plains aquifer", DATA.water.high_plains_decline),
        summaryMode: "latest",
        fullWidth: true,
        caption: "",
        hideSingleSeriesSummary: true,
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
        fullWidth: false
      },
      {
        title: "Soil erosion by crop",
        subtitle: "",
        yLabel: "Tons per acre per year",
        tooltipUnit: "tons per acre per year",
        series: DATA.soil.by_crop,
        source: sourceLinks.fieldToMarketSoil,
        caption: "Field to Market’s smoothed estimates of wind and water erosion, based on USDA National Resources Inventory surveys and erosion models through 2017.",
        decimals: 1,
        fullWidth: false
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
        summaryMode: "latest", latestYearLabel: true, decimals: 1, fullWidth: true,
        caption: "Tillage shares use cultivated cropland; cover-crop shares use harvested cropland. The dashed no-till segment uses CTIC/USGS; the solid segment uses the Census of Agriculture.",
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
        summaryMode: "latest", latestYearLabel: true, decimals: 1, fullWidth: true,
        legendShare: true,
        caption: "Data cover 17 Western states.",
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
        summaryMode: "latest", latestYearLabel: true, decimals: 1, fullWidth: true,
        caption: "Series use different denominators: corn acres, cultivated cropland, or irrigating farms, as labeled. CEAP estimates represent survey periods, not annual observations.",
        source: `${sourceLinks.precision}; ${sourceLinks.precisionUpdate}; ${sourceLinks.ceap}; ${sourceLinks.irrigationSensing}`
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
            series: DATA.climate.inventoryCategories || [],
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
      happened: "After peaking in 2002, inflation-adjusted public agricultural and food R&D spending was 29 percent lower by 2021. Agricultural productivity continued to rise, but more slowly after 2000. These parallel trends do not show that lower research spending caused the slowdown.",
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
        federalAgencyBudgetView(),
        federalSpendingDetailChart(),
        gatewayStateFundingChart()
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
    drawChart(panel.querySelector(`[data-chart="${index}"]`), active);
    panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(button => button.addEventListener("click", () => {
      const view = chart.views.find(item => item.id === button.dataset.view);
      panel.querySelectorAll(`[data-chart-view="${index}"]`).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      switchChartView(panel.querySelector(`[data-chart="${index}"]`), view);
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
    CHART_STATES.set(`${ACTIVE_TOPIC}:${container.dataset.chart}`, { view: card.querySelector('[data-chart-view][aria-pressed="true"]')?.dataset.view });
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
  const controls = chart.views ? `<div class="view-toggle" role="group" aria-label="${chart.viewLabel || "Choose chart view"}">${chart.views.map((view, viewIndex) => `<button type="button" data-chart-view="${index}" data-view="${view.id}" aria-pressed="${viewIndex === 0}">${view.label}</button>`).join("")}</div>` : "";
  const heading = chart.title ? `<h3 data-editable-key="topic:${topicId}:chart:${index}:title">${chart.title}</h3>` : "";
  return `<details class="chart-card ${chart.fullWidth ? "full-width" : ""}" open><summary class="chart-card-heading">${heading}</summary><div class="chart-card-content"><p class="chart-subtitle" data-editable-key="topic:${topicId}:chart:${index}:subtitle" data-subtitle="${index}">${active.subtitle || ""}</p>${controls}<div class="chart-wrap" data-chart="${index}"></div><div class="series-summary" data-summary="${index}"></div><details class="source-disclosure"><summary>Sources</summary><div class="source-line"></div></details></div></details>`;
}

function formatValue(chart, value) {
  const number = format(value, chart.decimals ?? 1);
  return chart.tooltipUnit === "%" ? `${number}%` : `${number} ${chart.tooltipUnit || ""}`.trim();
}

function switchChartView(container, chart) {
  const content = container.parentElement, controls = content.querySelector(".view-toggle");
  const before = controls.getBoundingClientRect().top, scrollBefore = window.scrollY;
  const expandedHeight = [...content.querySelectorAll("details[open]")].reduce((sum, details) => sum + details.getBoundingClientRect().height - details.querySelector("summary").getBoundingClientRect().height, 0);
  content.viewHeight = Math.max(content.viewHeight || 0, content.getBoundingClientRect().height - expandedHeight);
  // Keep the document from briefly shrinking while the old SVG is replaced.
  content.style.minHeight = `${content.getBoundingClientRect().height}px`;
  drawChart(container, chart);
  applySavedTextEdits(content);
  content.style.minHeight = `${content.viewHeight}px`;
  const restore = () => {
    if (content.isConnected) window.scrollTo({ top: scrollBefore + controls.getBoundingClientRect().top - before, behavior: "instant" });
  };
  restore();
  cancelAnimationFrame(content.viewFrame);
  content.viewFrame = requestAnimationFrame(() => { restore(); sendHeight(); });
  document.querySelector("#open-tracker").href = standaloneURL();
}

function drawChart(container, chart) {
  hideTooltip();
  container.chartConfig = chart;
  if (chart.usdaFilter) chart = filteredUSDAChart(chart);
  renderUSDAFilter(container, chart);
  container.parentElement.querySelector(".chart-compare")?.remove();
  container.replaceChildren();
  const card = container.closest(".chart-card");
  chart = { ...chart, title: chart.title || card.querySelector("h3")?.textContent || chart.yLabel || "Chart" };
  card.querySelector(".chart-subtitle").textContent = chart.subtitle || "";
  card.querySelector(".source-disclosure").hidden = !chart.source;
  card.querySelector(".source-line").innerHTML = chart.source || "";
  const summary = card.querySelector(".chart-card-content > .series-summary");
  summary.replaceChildren();
  card.querySelector(".chart-methods")?.remove();
  card.querySelector(".chart-explainer")?.remove();
  card.querySelector(".crop-breakdown")?.remove();
  if (!chart.series?.length || chart.series.some(series => !series.values?.length)) {
    container.innerHTML = chart.usdaFilter ? '<p class="chart-empty">Select at least one review pathway to see records.</p>' : '<p class="chart-empty">Detailed data are unavailable.</p>';
    return;
  }
  const fullChart = chart;
  if (!chart.series.some(series => series.name === container.focusedSeries)) container.focusedSeries = null;
  const parentSeries = chart.series.find(series => series.name === container.focusedSeries);
  if (parentSeries) {
    const children = parentSeries.breakdownSeries;
    if (!children?.some(series => series.name === container.focusedChild)) container.focusedChild = null;
    chart = { ...chart, series: children ? children.filter(series => !container.focusedChild || series.name === container.focusedChild) : [parentSeries], overlaySeries: [], totalLabel: null, isolatedSeries: true, subtitle: children ? `${parentSeries.name} · ${container.focusedChild || "agency breakdown"}, ${parentSeries.values[0].year}–${parentSeries.values.at(-1).year}` : chart.subtitle };
  }
  const axisUnit = document.createElement("p"); axisUnit.className = "chart-axis-unit"; axisUnit.textContent = chart.yLabel; container.append(axisUnit);
  if (chart.type === "stacked") drawStackedAreaChart(container, chart);
  else if (chart.type === "bar") drawBarChart(container, chart);
  else drawLineChart(container, chart);
  renderChartContext(container, chart);
  attachChartInteractions(container, chart);
  attachSeriesFocus(container, fullChart);
  applySavedTextEdits(card);
  if (parentSeries?.breakdownSeries) card.querySelector(".chart-subtitle").textContent = chart.subtitle;
}

function otherCropCounts(chart, year) {
  return (chart.otherCrops || []).map(series => ({ name: series.name, value: series.values.find(point => point.year === year)?.value || 0 }))
    .filter(crop => crop.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function chartPointTooltip(chart, series, point) {
  let html = `<strong>${escapeHTML(series.name || "Five-survey mean")}</strong><br>${point.year}: ${point.approximate ? "≈" : ""}${formatValue(chart, point.value)}${point.source ? `<br>${escapeHTML(point.source)}` : ""}`;
  if (series.breakdownSeries) html += "<br><small>Click to explore the agency breakdown.</small>";
  if (chart.otherCrops && series.name === "Other crops") {
    const crops = otherCropCounts(chart, point.year), leading = crops.slice(0, 5);
    html += `<div class="tooltip-crops">${leading.map(crop => `${escapeHTML(crop.name)}: ${crop.value}`).join("<br>")}${crops.length > 5 ? `<br>Remaining crops: ${crops.slice(5).reduce((sum, crop) => sum + crop.value, 0)}` : ""}</div><small>Select this area or “Explore other crops” for the full breakdown.</small>`;
  }
  return html;
}

function openOtherCropBreakdown(container, year) {
  const details = container.parentElement.querySelector(".crop-breakdown");
  if (!details) return;
  details.updateYear(year);
  details.open = true;
  sendHeight();
}

function renderChartContext(container, chart) {
  const summary = container.parentElement.querySelector(":scope > .series-summary");
  if (chart.explanations) {
    const explanation = document.createElement("details"); explanation.className = "chart-methods";
    explanation.innerHTML = `<summary>${escapeHTML(chart.explanationTitle || "About these records")}</summary><div class="chart-explainer">${chart.explanations.map(item => `<section><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.body)}</p></section>`).join("")}</div>`;
    explanation.addEventListener("toggle", sendHeight);
    summary.after(explanation);
  }
  if (!chart.otherCrops) return;
  const years = chart.series[0].values.map(point => point.year);
  const details = document.createElement("details"); details.className = "crop-breakdown";
  details.innerHTML = `<summary>Explore other crops</summary><label>Cumulative decisions through <select aria-label="Year for other crops">${years.map(year => `<option value="${year}">${year}</option>`).join("")}</select></label><p class="crop-breakdown-note"></p><ul class="crop-counts"></ul>`;
  const select = details.querySelector("select");
  details.updateYear = year => {
    select.value = String(year);
    const crops = otherCropCounts(chart, year), total = crops.reduce((sum, crop) => sum + crop.value, 0);
    details.querySelector(".crop-breakdown-note").textContent = `${total} records across ${crops.length} crops${year === 2026 ? "; 2026 through October 2" : ""}. Each crop is shown separately below.`;
    details.querySelector("ul").innerHTML = crops.map(crop => `<li><span>${escapeHTML(crop.name)}</span><strong>${crop.value}</strong></li>`).join("");
  };
  select.addEventListener("change", () => { details.updateYear(Number(select.value)); sendHeight(); });
  details.addEventListener("toggle", sendHeight);
  details.updateYear(years.at(-1));
  summary.after(details);
  summary.querySelector(".other-crops-button")?.addEventListener("click", () => openOtherCropBreakdown(container, years.at(-1)));
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
  svg.setAttribute("aria-label", `${chart.title}. ${chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc");
  description.textContent = chart.rollingSeries ? `Bars show completed annual surveys, the overlaid line averages the last five measured summers, and the dashed line shows the ${chart.goalLabel || "goal"}. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years.` : "One bar per completed annual survey. Missing survey years have no bar. Focus a bar and use the arrow keys to explore measured years.";
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
  renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
}

function drawLineChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: chart.series.length > 1 ? 24 : 16, bottom: 34, left: width < 380 ? 52 : 64 };
  const all = chart.series.flatMap(s => s.values);
  const allYears = all.map(d => d.year), values = all.map(d => d.value);
  const xMin = Math.min(...allYears), xMax = Math.max(...allYears);
  const yScale = niceScale(Math.max(...values, 1));
  const yMin = chart.yMin ?? 0;
  const yMax = chart.yMax ?? yScale.max;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = chart.yTicks || yScale.ticks;
  const xTicks = yearTicks(xMin, xMax, width - margin.left - margin.right);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title}. ${chart.subtitle || ""}`); svg.innerHTML = `<title>${chart.title}</title>`;
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a series at its latest point, then use the left and right arrow keys to explore plotted values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), tick === 0 ? "grid-line zero-line" : "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, `${axisNumber(tick, chart.yTicks || yScale.ticks)}${chart.tickSuffix || ""}`, "tick-label", "end")); });
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
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
}

function drawStackedAreaChart(container, chart) {
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width || 720));
  const height = width < 380 ? 280 : 320;
  const margin = { top: 18, right: 16, bottom: 34, left: width < 380 ? 52 : 64 };
  const maps = chart.series.map(series => new Map(series.values.map(d => [d.year, d.value])));
  const years = chart.series[0].values.map(d => d.year).filter(year => maps.every((map, i) => chart.series[i].partialCoverage || map.has(year))).sort((a, b) => a - b);
  if (!years.length) { container.innerHTML = '<p class="chart-empty">The component series do not share a common time period.</p>'; return; }
  const totals = years.map(year => maps.reduce((sum, map) => sum + (map.get(year) ?? 0), 0));
  const overlays = chart.overlaySeries || [];
  const overlayPoints = overlays.flatMap(series => series.values);
  const positiveTotals = years.map(year => maps.reduce((sum, map) => sum + Math.max(0, map.get(year) ?? 0), 0));
  const negativeTotals = years.map(year => maps.reduce((sum, map) => sum + Math.min(0, map.get(year) ?? 0), 0));
  const xMin = Math.min(years[0], ...overlayPoints.map(d => d.year)), xMax = Math.max(years.at(-1), ...overlayPoints.map(d => d.year)), yScale = niceScale(Math.max(...positiveTotals, ...overlayPoints.map(d => d.value), chart.isolatedSeries ? 0.001 : 1)), yMax = yScale.max;
  const step = yScale.ticks[1] - yScale.ticks[0];
  const yMin = Math.min(...negativeTotals) < 0 ? -Math.ceil(Math.abs(Math.min(...negativeTotals)) / (step / 2)) * (step / 2) : 0;
  const x = year => margin.left + (year - xMin) / (xMax - xMin || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const yTicks = yMin < 0 ? [yMin, ...yScale.ticks] : yScale.ticks;
  const xTicks = yearTicks(xMin, xMax, width - margin.left - margin.right);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${chart.title || "Stacked area chart"}. ${chart.subtitle || ""}`);
  const description = document.createElementNS("http://www.w3.org/2000/svg", "desc"); description.textContent = "Focus a category at its latest point, then use the left and right arrow keys to explore annual values."; svg.append(description);
  yTicks.forEach(tick => { svg.append(line(margin.left, y(tick), width - margin.right, y(tick), tick === 0 ? "grid-line zero-line" : "grid-line")); svg.append(text(margin.left - 9, y(tick) + 4, axisNumber(tick, yTicks), "tick-label", "end")); });
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
        area.setAttribute("d", `${topPath} ${bottomPath} Z`); area.setAttribute("class", "area-path"); area.setAttribute("fill", series.color || COLORS[index % COLORS.length]); area.chartSeries = series; svg.append(area);
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
      const show = event => showTooltip(event, chartPointTooltip(chart, series, point)); circle.addEventListener("pointerenter", show); circle.addEventListener("pointermove", show); circle.addEventListener("focus", show); circle.addEventListener("pointerleave", hideTooltip); circle.addEventListener("blur", hideTooltip); svg.append(circle);
      circle.addEventListener("keydown", event => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const next = Math.max(0, Math.min(circles.length - 1, circles.indexOf(circle) + (event.key === 'ArrowRight' ? 1 : -1))); circles[next]?.focus(); });
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
      Object.entries({ cx: x(d.year), cy: y(d.value), r: series.pointsOnly ? 5 : 4, fill: series.marker === "hollow" ? "#f8f9f9" : series.color, stroke: series.color, "stroke-width": series.marker === "hollow" ? 2 : 0, style: series.marker === "hollow" ? `stroke: ${series.color}; stroke-width: 2` : "", class: `data-point line-point${series.pointsOnly ? " always-visible" : ""}${series.marker === "hollow" ? " hollow-point" : ""}`, tabindex: i === sorted.length - 1 ? "0" : "-1", "aria-label": `${series.name}, ${d.year}: ${formatValue(chart, d.value)}` }).forEach(([key, value]) => circle.setAttribute(key, value));
      const show = event => showTooltip(event, `<strong>${series.name}</strong><br>${d.year}: ${formatValue(chart, d.value)}`);
      ["pointerenter", "pointermove", "focus"].forEach(event => circle.addEventListener(event, show));
      ["pointerleave", "blur"].forEach(event => circle.addEventListener(event, hideTooltip));
      circle.addEventListener("keydown", event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); circles[Math.max(0, Math.min(circles.length - 1, i + (event.key === "ArrowRight" ? 1 : -1)))]?.focus(); });
      circles.push(circle); svg.append(circle);
    });
  });
  container.append(svg); renderSeriesSummary(container.parentElement.querySelector(":scope > .series-summary"), chart);
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
  comparison.innerHTML = `<details><summary>Compare dates</summary><div class="compare-controls"><label>Series<select class="compare-series" aria-label="Series to compare">${candidates.map((series, i) => `<option value="${i}">${escapeHTML(name(series))}</option>`).join("")}</select></label><label>From<select class="compare-from" aria-label="Start year"></select></label><label>To<select class="compare-to" aria-label="End year"></select></label><button type="button" class="compare-clear">Clear</button></div><p class="compare-result" role="status" aria-live="polite"></p></details>`;
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
    const rangeDescription = chart.comparisonMode === "absolute" && first.year !== last.year ? `${format(last.value - first.value, 0)} ${chart.comparisonLabel || "additional records"}` : rangeChangeText(first, last);
    result.innerHTML = `<strong>${escapeHTML(name(activeSeries))} · ${first.year}–${last.year}: ${rangeDescription}${percentagePoints}</strong><br>${first.approximate ? "≈" : ""}${formatValue(chart, first.value)} → ${last.approximate ? "≈" : ""}${formatValue(chart, last.value)}${caution || approximate || rescission ? `<br><span>${escapeHTML(caution + approximate + rescission)}</span>` : ""}`;
    drawSelection(a, b);
  };
  const local = event => {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  const nearest = event => {
    const point = local(event), matrix = svg.getScreenCTM(), radius = 18 / Math.hypot(matrix.a, matrix.b);
    if ((chart.otherCrops && event.target.chartSeries?.name === "Other crops") || event.target.chartSeries) {
      return records.filter(record => record.series === event.target.chartSeries).reduce((best, record) => !best || Math.abs(record.x - point.x) < Math.abs(best.x - point.x) ? record : best, null);
    }
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
    showTooltip(event, chartPointTooltip(chart, record.series, record.point));
  };
  const stopDrag = () => { if (drag && svg.hasPointerCapture(drag.pointerId)) svg.releasePointerCapture(drag.pointerId); drag = null; svg.classList.remove("is-dragging"); hideTooltip(); };
  select.addEventListener("change", () => { activeSeries = candidates[Number(select.value)]; fillYears(); updateResult(); });
  [from, to].forEach(control => control.addEventListener("change", updateResult));
  details.addEventListener("toggle", () => { if (details.open) updateResult(); sendHeight(); });
  comparison.querySelector(".compare-clear").addEventListener("click", () => { selection.replaceChildren(); details.open = false; result.replaceChildren(); fillYears(); });
  fillYears();
  let touchStart = null;
  svg.addEventListener("pointerdown", event => { if (event.pointerType === "touch") touchStart = { x: event.clientX, y: event.clientY }; });
  svg.addEventListener("pointermove", event => {
    if (!drag) { if (event.pointerType !== "touch") hover(event, nearest(event)); return; }
    const point = local(event), points = pointsFor(activeSeries);
    const end = points.reduce((best, record) => Math.abs(record.x - point.x) < Math.abs(best.x - point.x) ? record : best);
    to.value = String(end.point.year);
    if (from.value !== to.value) { details.open = true; updateResult(); hideTooltip(); }
  });
  svg.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (event.pointerType === "touch") return;
    const start = nearest(event);
    if (chart.otherCrops && start?.series.name === "Other crops") {
      event.preventDefault(); openOtherCropBreakdown(container, start.point.year); hideTooltip(); return;
    }
    if (!start || !candidates.includes(start.series)) return;
    event.preventDefault(); activeSeries = start.series; select.value = String(candidates.indexOf(activeSeries)); fillYears();
    from.value = to.value = String(start.point.year); selection.replaceChildren();
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, series: start.series }; svg.setPointerCapture(event.pointerId); svg.classList.add("is-dragging");
  });
  svg.addEventListener("pointerup", event => {
    if (event.pointerType === "touch") {
      const start = touchStart;
      touchStart = null;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10) {
        const record = nearest(event);
        if (record && chart.otherCrops && record.series.name === "Other crops") openOtherCropBreakdown(container, record.point.year);
        else if (record && container.focusSeries) container.focusSeries(record.series.name);
        else if (record) hover(event, record);
      }
    }
    if (drag) {
      const clicked = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5;
      const name = drag.series.name;
      stopDrag();
      if (clicked && container.focusSeries) container.focusSeries(name);
      else if (details.open) updateResult();
    } });
  svg.addEventListener("pointercancel", () => { touchStart = null; stopDrag(); selection.replaceChildren(); details.open = false; });
  svg.addEventListener("keydown", event => {
    if (chart.otherCrops && event.key === "Enter" && event.target.chartDatum?.series.name === "Other crops") {
      event.preventDefault(); openOtherCropBreakdown(container, event.target.chartDatum.point.year);
    }
    if (["Enter", " "].includes(event.key) && event.target.chartDatum && !(chart.otherCrops && event.target.chartDatum.series.name === "Other crops")) {
      event.preventDefault(); container.focusSeries?.(event.target.chartDatum.series.name);
    }
    if (event.key === "Escape") { if (container.focusedSeries) container.focusSeries?.(container.focusedSeries); stopDrag(); selection.replaceChildren(); details.open = false; } });
  svg.addEventListener("pointerleave", () => { if (!drag) { hovered?.mark.classList.remove("is-hovered"); hovered = null; hideTooltip(); } });
}

// Isolating a series puts it on a zero baseline and rescales the axis; stacked
// offsets no longer obscure small categories. Keep the complete legend for switching.
function attachSeriesFocus(container, chart) {
  container.parentElement.querySelector(".series-focus-controls")?.remove();
  container.parentElement.querySelector(".series-breakdown-legend")?.remove();
  container.focusSeries = null;
  if (chart.series.length < 2) return;
  const summary = container.parentElement.querySelector(":scope > .series-summary");
  const parent = chart.series.find(series => series.name === container.focusedSeries);
  renderSeriesSummary(summary, chart);
  container.focusSeries = name => {
    if (parent?.breakdownSeries?.some(series => series.name === name)) {
      container.focusedChild = container.focusedChild === name ? null : name;
    } else {
      container.focusedSeries = container.focusedSeries === name ? null : name;
      container.focusedChild = null;
    }
    drawChart(container, chart);
    sendHeight();
  };
  const controls = document.createElement("div"); controls.className = "series-focus-controls";
  const status = document.createElement("span"); status.setAttribute("role", "status");
  status.textContent = parent?.breakdownSeries
    ? (container.focusedChild ? `Showing only ${container.focusedChild}. Axis rescaled.` : `${parent.name} · agency breakdown. Axis rescaled.`)
    : container.focusedSeries ? `Showing only ${container.focusedSeries}. Axis rescaled.` : "";
  controls.append(status);
  if (container.focusedChild) {
    const back = document.createElement("button"); back.type = "button"; back.textContent = "Show full breakdown";
    back.addEventListener("click", () => container.focusSeries(container.focusedChild)); controls.append(back);
  }
  if (container.focusedSeries) {
    const reset = document.createElement("button"); reset.type = "button"; reset.textContent = "Show all";
    reset.addEventListener("click", () => container.focusSeries(container.focusedSeries)); controls.append(reset);
  }
  if (container.focusedSeries) summary.before(controls);
  const makeButtons = (legend, seriesList, child = false) => {
    legend.querySelectorAll(":scope > span").forEach(row => {
      const series = seriesList.find(series => row.textContent.trim().startsWith(series.name + " "));
      const label = row.querySelector("b");
      if (!series || !label || row.querySelector("button")) return;
      const active = child ? container.focusedChild === series.name : container.focusedSeries === series.name;
      const button = document.createElement("button"); button.type = "button"; button.className = "series-focus-button";
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? (child ? "Show full breakdown" : "Show all series") : `${series.breakdownSeries ? "Explore breakdown of " : "Focus on "}${series.name}`);
      button.innerHTML = label.innerHTML; label.replaceWith(button);
      button.addEventListener("click", () => {
        container.focusSeries(series.name);
        [...container.parentElement.querySelectorAll(".series-focus-button")].find(item => item.textContent === button.textContent)?.focus();
      });
      row.classList.toggle("series-muted", Boolean(child ? container.focusedChild && !active : container.focusedSeries && !active));
    });
  };
  if (parent?.breakdownSeries) {
    const breakdown = document.createElement("div"); breakdown.className = "series-breakdown-legend";
    const heading = document.createElement("h4"); heading.textContent = "Agency breakdown"; breakdown.append(heading);
    const childLegend = document.createElement("div"); childLegend.className = "series-summary";
    renderSeriesSummary(childLegend, { ...chart, series: parent.breakdownSeries, overlaySeries: [], caption: "", totalLabel: null });
    breakdown.append(childLegend); makeButtons(childLegend, parent.breakdownSeries, true);
    const note = document.createElement("p"); note.className = "change-note"; note.textContent = parent.breakdownNote || ""; breakdown.append(note);
    const fullLabel = document.createElement("h4"); fullLabel.textContent = "All funding sources"; breakdown.append(fullLabel);
    summary.before(breakdown);
  }
  makeButtons(summary, chart.series);
}

function renderSeriesSummary(summary, chart) {
  summary.classList.toggle("multi", chart.series.length > 1);
  summary.classList.toggle("regulatory-legend", Boolean(chart.hideLegendValues));
  const caption = chart.caption === undefined ? (chart.summaryMode === "latest" ? "Latest available values" : DEFAULT_CHART_CAPTION) : chart.caption;
  const note = caption ? `<p class="change-note">${escapeHTML(caption)}</p>` : "";
  let total = "";
  if (chart.totalLabel) {
    const firstYear = Math.max(...chart.series.map(series => series.values[0].year));
    const lastYear = Math.min(...chart.series.map(series => series.values.at(-1).year));
    const first = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === firstYear).value, 0);
    const last = chart.series.reduce((sum, series) => sum + series.values.find(point => point.year === lastYear).value, 0);
    const totalValue = chart.summaryMode === "latest" ? formatValue(chart, last) : pct((last / first - 1) * 100);
    total = `<strong class="total-change">${chart.totalLabel}: ${totalValue} <small>${chart.summaryMode === "latest" ? lastYear : `${firstYear}–${lastYear}`}</small></strong>`;
  }
  const legendSeries = [...chart.series, ...(chart.overlaySeries || []).filter(series => !series.hideInLegend).map(series => ({ ...series, isOverlay: true }))].map((series, index) => ({ ...series, color: series.color || COLORS[index % COLORS.length] }));
  if (chart.legendReverse) legendSeries.reverse();
  const rows = legendSeries.map((series, index) => {
    if (chart.hideSingleSeriesSummary && chart.series.length === 1) return "";
    const latest = series.values.at(-1);
    const latestTotal = chart.legendShare ? chart.series.reduce((sum, item) => sum + (item.values.find(point => point.year === latest.year)?.value || 0), 0) : 0;
    const delta = series.hideLegendValue || chart.hideLegendValues || (chart.labelPointSeriesOnly && series.pointsOnly) ? "" : chart.legendShare ? `${format(100 * latest.value / latestTotal, chart.decimals ?? 1)}%` : chart.summaryMode === "latest" ? formatValue(chart, latest.value) : pct(change(series.values));
    const range = `${series.values[0].year}–${series.values.at(-1).year}`;
    if (series.sourceBoundary) {
      const earlier = series.values.find(point => point.year === series.sourceBoundary.earlierEnd);
      const color = series.color || COLORS[index % COLORS.length];
      return `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3" stroke-dasharray="5 4"></line></svg><b>No-till · CTIC/USGS ${formatValue(chart, earlier.value)} <small>${series.sourceBoundary.earlierEnd}</small></b></span><span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="${color}" stroke-width="3"></line></svg><b>No-till · Census ${delta} <small>${series.values.at(-1).year}</small></b></span>`;
    }
    return chart.series.length === 1
      ? `<span class="single-change"><strong>${delta}</strong> <small>${chart.summaryMode === "latest" ? series.values.at(-1).year : range}</small></span>`
      : chart.type === "stacked" && !series.isOverlay
        ? `<span><i style="background:${series.color || COLORS[index % COLORS.length]}"></i>${chart.otherCrops && series.name === "Other crops" ? `<button type="button" class="other-crops-button" aria-label="Explore other crop records">${series.name} ${delta}</button>` : `<b>${series.name} ${delta}${chart.showChangeYears ? ` <small>${range}</small>` : ""}</b>`}</span>`
        : `<span><svg class="legend-line" viewBox="0 0 18 4" aria-hidden="true">${series.pointsOnly ? `<circle cx="9" cy="2" r="1.5" fill="${series.marker === "hollow" ? "none" : series.color || COLORS[index % COLORS.length]}" stroke="${series.color || COLORS[index % COLORS.length]}" stroke-width="${series.marker === "hollow" ? 1 : 0}"></circle>` : `<line x1="0" y1="2" x2="18" y2="2" stroke="${series.color || COLORS[index % COLORS.length]}" stroke-width="3" ${series.dasharray ? `stroke-dasharray="${series.dasharray}"` : ""}></line>`}</svg><b>${series.name} ${delta}${chart.showChangeYears && !(chart.labelPointSeriesOnly && series.pointsOnly) ? ` <small>${range}</small>` : chart.latestYearLabel ? ` <small>${series.values.at(-1).year}</small>` : ""}</b></span>`;
  }).join("");
  const overlayKey = chart.rollingSeries ? `<div class="overlay-key"><span><i class="key-bar"></i> Annual survey</span><span><i class="key-average"></i> Five-survey mean</span><span><i class="key-goal"></i> ${chart.goalLabel || "Goal"}</span></div>` : "";
  summary.innerHTML = note + overlayKey + total + rows;
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
function standaloneURL() {
  const url = new URL(location.href); url.searchParams.delete("embed");
  ["chart", "view", "measure", "change", "pathways"].forEach(key => url.searchParams.delete(key));
  if (ACTIVE_TOPIC === "products") url.searchParams.set("measure", selectedMatrixMetric);
  else if (ACTIVE_TOPIC) {
    url.searchParams.set("chart", String(MOBILE_CHART));
    const card = [...panel.querySelectorAll(".chart-card, .product-evidence")][MOBILE_CHART];
    const view = card?.querySelector('[data-chart-view][aria-pressed="true"]')?.dataset.view;
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
  const expanded = !!document.fullscreenElement || document.body.classList.contains("focus-view");
  fullscreenButton.setAttribute("aria-pressed", String(expanded));
  fullscreenButton.querySelector(".fullscreen-label").textContent = expanded ? "Exit full screen" : "Full screen";
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
        const state = comparison ? { open: comparison.querySelector("details").open, series: comparison.querySelector(".compare-series").value, from: comparison.querySelector(".compare-from").value, to: comparison.querySelector(".compare-to").value } : null;
        drawChart(container, container.chartConfig);
        const controls = container.parentElement.querySelector(".chart-compare");
        if (state?.open && controls) {
          controls.querySelector(".compare-series").value = state.series;
          controls.querySelector(".compare-series").dispatchEvent(new Event("change"));
          controls.querySelector(".compare-from").value = state.from;
          controls.querySelector(".compare-to").value = state.to;
          controls.querySelector("details").open = true;
          controls.querySelector(".compare-to").dispatchEvent(new Event("change"));
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
    const metric = ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[document.querySelector("#topic-select").value];
    const bars = panel.querySelector(".product-bars");
    if (metric && bars) bars.innerHTML = studyBarRows(metric);
    sendHeight();
    return;
  }
  const modeButton = event.target.closest("[data-change-mode]");
  if (modeButton) {
    CHANGE_MODE = modeButton.dataset.changeMode;
    panel.querySelectorAll("[data-change-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.changeMode === CHANGE_MODE)));
    const metric = ({ land: "land", water: "water", climate: "greenhouse_gas", nitrogen: "fertilizer_n" })[document.querySelector("#topic-select").value];
    if (metric) panel.querySelector(".product-bars").innerHTML = studyBarRows(metric);
    document.querySelector("#open-tracker").href = standaloneURL();
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
Promise.all(["data.json", "product-studies.json", "text-edits.json", "biotech-decisions.json"].map(path => fetch(path).then(response => { if (!response.ok) throw new Error(`${path} failed to load`); return response.json(); }))).then(([data, studies, textEdits, biotech]) => {
  DATA = data; BIOTECH = biotech; STUDIES = studies.studies; PROJECT_TEXT_EDITS = textEdits; applySavedTextEdits(document); const ghg2023 = { year: 2023, value: 595.4 }; [DATA.overview.ghg, DATA.climate.total].forEach(series => { if (!series.some(d => d.year === 2023)) series.push(ghg2023); });
  const requested = location.hash.slice(1), initial = TOPICS[requested] ? requested : "overview";
  const params = new URLSearchParams(location.search);
  const chartIndex = Math.max(0, Number.parseInt(params.get("chart"), 10) || 0);
  CHART_CHOICES.set(initial, chartIndex);
  if (params.get("view")) CHART_STATES.set(`${initial}:${chartIndex}`, { view: params.get("view") });
  if (MATRIX_METRICS.includes(params.get("measure"))) selectedMatrixMetric = params.get("measure");
  if (params.get("change") === "total") CHANGE_MODE = "total";
  if (params.has("pathways")) selectedUSDAPathways = new Set(params.get("pathways").split(",").filter(key => Object.hasOwn(USDA_PATHWAYS, key)));
  renderTopic(initial);
  document.fonts?.ready.then(() => { updateToolbarSize(); sendHeight(); });
}).catch(() => { panel.innerHTML = location.protocol === "file:"
  ? '<div class="loading">To preview locally, double-click preview.command in this folder and keep its Terminal window open.</div>'
  : '<div class="loading">The data could not be loaded. Please refresh the page.</div>'; });

new ResizeObserver(sendHeight).observe(document.body);
