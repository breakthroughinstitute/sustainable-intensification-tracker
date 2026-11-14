/* Display transformations and direct labels; source observations are never mutated. */
function presentationControls(container, chart, scope) {
  const key = `${chart.id || 'default'}:${scope}`;
  container.presentationChoices ||= new Map();
  const series = chart.series || [], all = series.flatMap(s => s.values);
  const unit = chart.tooltipUnit || chart.yLabel || '';
  const percentage = unit === '%' || chart.tickSuffix === '%';
  const mixedUnits = new Set(series.map(s => s.tooltipUnit || unit)).size > 1;
  const alreadyRelative = /change from|index|relative change|growth rate/i.test(`${chart.yLabel} ${unit}`);
  const common = series.length ? series[0].values.map(p => p.year).filter(year => series.every(s => s.values.some(p => p.year === year && Number.isFinite(p.value)))) : [];
  const baselineYears = common.filter(year => percentage || series.every(s => s.values.find(p => p.year === year).value > 0));
  const modes = [{ id: 'absolute', label: 'Original values' }];
  const positiveTotals = [...new Set(all.map(p => p.year))].every(year => series.reduce((sum,s)=>sum+(s.values.find(p=>p.year===year)?.value || 0),0)>0);
  if (chart.type === 'stacked' && !chart.dualAxis && !chart.overlaySeries?.length && series.length > 1 && all.every(p => p.value >= 0) && positiveTotals) modes.push({ id: 'share', label: 'Share of total (%)' });
  else if (!chart.type || chart.type === 'line') {
    if (!mixedUnits && !chart.dualAxis && !alreadyRelative && baselineYears.length > 1 && !chart.rollingSeries) modes.push({ id: percentage ? 'points' : 'relative', label: percentage ? 'Percentage-point change' : 'Relative change (%)' });
  }
  const saved = container.presentationChoices.get(key) || { mode: 'absolute', baseline: baselineYears[0] };
  const state = { mode: modes.some(m => m.id === saved.mode) ? saved.mode : 'absolute', baseline: baselineYears.includes(saved.baseline) ? saved.baseline : baselineYears[0] };
  return { key, modes, baselineYears, state };
}
function applyChartPresentation(chart, settings) {
  const mode = settings.state.mode;
  const unit = chart.tooltipUnit || chart.yLabel || '';
  let result = { ...chart, transformMode: mode, originalUnit: unit, baselineYear: mode === 'relative' || mode === 'points' ? settings.state.baseline : undefined };
  if (mode === 'absolute') return result;
  const baseYear = settings.state.baseline;
  const maps = chart.series.map(s => new Map(s.values.map(p => [p.year, p.value])));
  result.series = chart.series.map((series, i) => {
    const base = maps[i].get(baseYear);
    const values = series.values.filter(p => mode === 'share' || p.year >= baseYear).flatMap(point => {
      let value;
      if (mode === 'share') {
        const covered = chart.series.every((s, j) => maps[j].has(point.year) || (s.partialCoverage && (point.year < s.values[0].year || point.year > s.values.at(-1).year)));
        const total = maps.reduce((sum, map) => sum + (map.get(point.year) || 0), 0);
        if (!covered || total <= 0) return [];
        value = point.value / total * 100;
      } else value = mode === 'points' ? point.value - base : (point.value / base - 1) * 100;
      return [{ ...point, value, originalValue: point.value, originalUnit: unit }];
    });
    return { ...series, tooltipUnit: mode === 'points' ? 'percentage points' : '%', decimals: 2, values };
  });
  result.currency = false; result.decimals = 2; result.tickSuffix = mode === 'points' ? '' : '%';
  result.tooltipUnit = mode === 'points' ? 'percentage points' : '%';
  result.yLabel = mode === 'share' ? (chart.visibility?.hidden.length ? 'Share of selected total (%)' : 'Share of total (%)') : mode === 'points' ? `Percentage-point change since ${baseYear}` : `% change since ${baseYear}`;
  delete result.yTicks; delete result.yMax; delete result.yMin; delete result.totalLabel;
  result.integerTicks = false;
  if (mode === 'share') { result.yMin = 0; result.yMax = 100; result.yTicks = [0,25,50,75,100]; }
  else {
    const values = result.series.flatMap(s => s.values.map(p => p.value));
    const low = Math.min(0, ...values), high = Math.max(0, ...values);
    const span = Math.max(high - low, 1), step = niceScale(span).ticks[1] || 1;
    result.yMin = Math.floor(low / step) * step; result.yMax = Math.max(result.yMin + step, Math.ceil(high / step) * step);
    result.yTicks = Array.from({ length: Math.round((result.yMax-result.yMin)/step)+1 }, (_, i) => result.yMin+i*step);
    result.xMin = baseYear;
  }
  result.presentationNote = mode === 'share' ? `${result.yLabel}. Shares describe reported coverage, which may be incomplete.` : `${result.yLabel}. All series use the same baseline year; original values remain available in the data download.`;
  return result;
}
function directLabelPlan(chart, width) {
  const series = [...(chart.series || []), ...(chart.overlaySeries || []).filter(s => !s.hideInLegend)];
  if (chart.disableDirectLabels || chart.type === 'period-bars' || chart.type === 'bar' || chart.dualAxis || chart.hideSeriesLabels || !series.length || series.some(s => (s.sourceBoundary && !s.solidSourceSegments) || s.addonFlag)) return { enabled: false, right: 16 };
  const maxSeries = chart.preferDirectLabels ? 6 : width < 480 ? 3 : width < 680 ? 5 : 8;
  const right = chart.preferDirectLabels && width < 680 ? Math.min(140, Math.round(width*.27)) : width < 480 ? 105 : width < 680 ? 150 : Math.min(220, Math.round(width*.25));
  const chars = Math.max(12, Math.floor((right-22)/6));
  const wrap = value => String(value).split(/\s+/).reduce((rows, word) => { let i=rows.length-1; if ((rows[i]+' '+word).trim().length > chars) rows.push(word); else rows[i]=(rows[i]+' '+word).trim(); return rows; }, ['']);
  const lastYear = Math.max(...series.flatMap(s => s.values.map(p => p.year)));
  const rows = series.map(s => { const lines=wrap(s.name || chart.title); if(!chart.hideLabelYears && s.values.at(-1)?.year<lastYear)lines.push(String(s.values.at(-1).year)); return { series:s, lines, height:lines.length*14+8 }; });
  if (series.length > maxSeries || rows.some(r => r.lines.length > 4) || rows.reduce((n,r)=>n+r.height,0)>245 || width-right-64<160) return { enabled:false, right:16 };
  return { enabled:true, right, rows };
}
function appendDirectLabels(svg, chart, plan, x, y, width, height, margin, stacked = false) {
  if (!plan.enabled) return false;
  const rows = plan.rows.map(row => {
    const point = row.series.values.at(-1); if (!point) return null;
    let value = point.value;
    if (stacked && !row.series.isOverlay) {
      const i = chart.series.indexOf(row.series);
      if (i >= 0) { const values = chart.series.map(s=>s.values.find(p=>p.year===point.year)?.value || 0); value = values.slice(0,i).filter(v=>Math.sign(v)===Math.sign(point.value)).reduce((a,b)=>a+b,0)+point.value/2; }
    }
    return { ...row, point, desired:y(value), actual:y(value) };
  }).filter(Boolean).sort((a,b)=>a.desired-b.desired);
  let cursor=margin.top;
  rows.forEach(row=>{ row.actual=Math.max(row.desired,row.height/2+cursor); cursor=row.actual+row.height/2; });
  cursor=height-margin.bottom;
  [...rows].reverse().forEach(row=>{row.actual=Math.min(row.actual,cursor-row.height/2);cursor=row.actual-row.height/2;});
  rows.forEach(row=>{
    const labelX=width-margin.right+12, color=row.series.color || '#0d4459';
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('class','chart-label-leader');
    path.setAttribute('d',`M${x(row.point.year)},${row.desired} L${labelX-6},${row.actual}`); path.setAttribute('fill','none'); path.setAttribute('stroke',color);path.setAttribute('stroke-width','1');path.style.pointerEvents='none';if(chart.labelLeaders !== false && (!Array.isArray(chart.labelLeaders) || chart.labelLeaders.includes(row.series.name)))svg.append(path);
    const label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('x',labelX);label.setAttribute('y',row.actual-(row.lines.length-1)*7+4);label.setAttribute('class','chart-direct-label');label.setAttribute('fill',chartLabelInk(color));label.style.fill=chartLabelInk(color);
    row.lines.forEach((line,i)=>{const span=document.createElementNS('http://www.w3.org/2000/svg','tspan');span.setAttribute('x',labelX);if(i)span.setAttribute('dy','14');span.textContent=line;label.append(span);});
    svg.append(label);
  });
  return true;
}
function finalizeChartLegend(container, chart, parent) {
  const content=container.parentElement, overview=content.querySelector(':scope > .series-summary');
  const child=content.querySelector('.series-breakdown-legend .series-summary');
  const legend=parent?.breakdownSeries && child ? child : overview;
  renderSeriesSummary(legend, { ...chart, caption: parent ? '' : chart.caption, editableCaption: !parent, totalLabel:null });
  if(parent)overview.hidden=true;
  const rows=[...legend.querySelectorAll(':scope > span')];
  if(chart.type==='stacked' && chart.visibility){
    const panel=content.querySelector('.chart-options-panel');
    const selector=document.createElement('details');selector.className='chart-series-selector';selector.innerHTML='<summary>Show/hide series</summary><div class="chart-series-choices"></div>';
    const choices=selector.querySelector('div');
    const header=legend.querySelector('.series-visibility-header');if(header){header.querySelector('p')?.remove();choices.append(header);}
    rows.forEach(row=>choices.append(row));panel.prepend(selector);
    if(!container.directLabelsRendered){
      chart.series.forEach(series=>{const row=document.createElement('span');row.className='chart-static-legend-item';const key=document.createElement('i');key.style.background=brandSwatch(series);const name=document.createElement('b');name.textContent=series.name;row.append(key,name);legend.append(row);});
    }
  } else if(container.directLabelsRendered || chart.hideSeriesLabels) rows.forEach(row=>row.remove());
  legend.hidden=!legend.textContent.trim();
  const note=content.querySelector('.presentation-note');note?.remove();
  if(chart.presentationNote && chart.transformMode !== "relative"){const p=document.createElement('p');p.className='presentation-note';p.textContent=chart.presentationNote;container.after(p);}
}
function conciseChartCaveat(chart, parent, fullText) {
  if (ACTIVE_TOPIC === 'rd') {
    const name = parent?.name || '';
    if (name === 'NIFA and predecessors') return 'Reporting changes in 2002; historical expenditures and later funding are not directly comparable.';
    if (name === 'State') return parent._breakdownVariant === 'history' ? 'Recipient categories and reporting change in 2007.' : 'State appropriations are split by recipient institution, not by additional funding sources.';
    if (name === 'Other federal') return 'Most 2023–2024 support lacks named-agency detail.';
    if (name === 'Nongovernment') return '2023–2024 industry and institution-generated detail may be incomplete or regrouped.';
    if (name.startsWith('USDA agencies')) return parent._breakdownVariant === 'history' ? 'Before 1999, agency totals include research facilities. From 1999, facilities are reported separately; the category change affects comparability.' : 'Agency research and facilities are reported separately from 1999.';
    if (chart.id === 'funding-reeis') return 'Reported support combines cash outlays, project expenditures and grant obligations. Private SBIR recipients are included here and excluded from the performer chart. Recent source detail may be incomplete or regrouped.';
    if (/budget authority/i.test(chart.title)) return 'Budget authority differs from cash spending. Negative facilities values cancel prior authority; 2025 is preliminary.';
    if (/performer|expenditures by performer/i.test(chart.title)) return 'Calculated estimates after 2001; private SBIR recipients are excluded.';
  }
  if ((fullText || '').length <= 260) return fullText || '';
  const sentences = (fullText || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return sentences.filter(s => /coverage|incomplete|preliminary|different|denominator|break|not comparable|exclud|survey|unavailable/i.test(s)).slice(0,2).join(' ').trim();
}

// Match direct labels to their series.
function chartLabelInk(color) { return color || '#0d4459'; }
