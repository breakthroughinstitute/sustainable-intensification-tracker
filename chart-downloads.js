/* Standalone download panel for the currently active chart. */
(function () {
  function sourceDetails(html) {
    const root = document.createElement('div');
    root.innerHTML = html || '';
    return [...new Set(Array.from(root.querySelectorAll('a[href]')).flatMap(link => {
      const href = link.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href) || link.hasAttribute('download')) return [];
      let label = link.textContent.trim().replace(/^Source:\s*/i, '');
      try { if (typeof publicSourceName === 'function') label = publicSourceName(new URL(href), label); } catch {}
      return [`${label} (${href})`];
    }))].join('; ');
  }

  function csvFor(chart) {
    const indexed = chart.exportIndexed || /\bindex\b/i.test(chart.yLabel || '');
    const entries = [...(chart.series || []), ...(chart.overlaySeries || []), ...(chart.rollingSeries ? [chart.rollingSeries] : [])]
      .flatMap(series => (series.values || []).map(point => ({ series, point })));
    const hasOriginals = indexed && entries.some(({ point }) => point.rawValue !== undefined);
    const hasSourceValues = entries.some(({ point }) => point.sourceValue !== undefined);
    const hasBaseline = indexed && entries.some(({ point }) => point.baselineYear !== undefined) || indexed && chart.exportBaselineYear !== undefined;
    const calculations = entries.some(({ series, point }) => point.calculation || series.calculation || chart.exportCalculation);
    const caveats = entries.some(({ series, point }) => point.approximate || point.status || point.caveat || series.exportCaveat || series.definitionBreak || series.sourceBoundary || chart.exportCaveat);
    const header = [chart.type === 'period-bars' ? 'period' : 'year', 'series', 'value', 'unit',
      ...(hasOriginals ? ['original_value', 'original_unit'] : []),
      ...(hasSourceValues ? ['source_value', 'source_unit'] : []),
      ...(hasBaseline ? ['baseline_year'] : []), 'source',
      ...(calculations ? ['calculation'] : []), ...(caveats ? ['caveat'] : [])];
    const chartSource = sourceDetails(chart.source);
    const rows = entries.map(({ series, point }) => {
      // rawValue is the absolute observation behind built-in percent-change views.
      // Interactive display transforms are removed before this function is called.
      const absolute = !indexed && point.rawValue !== undefined;
      const value = absolute ? point.rawValue : point.value;
      const unit = absolute ? point.rawUnit : indexed ? (series.tooltipUnit || chart.tooltipUnit || chart.yLabel) :
        (series.rawUnit || series.unit || series.tooltipUnit || chart.rawUnit || chart.tooltipUnit || chart.yLabel);
      const sourceURLs = [point.source_url, point.sourceUrl, series.source_url, series.sourceUrl].filter(Boolean);
      const source = point.exportSource || series.exportSource || [...new Set([point.source || series.source, ...sourceURLs, chartSource].filter(Boolean))].join('; ');
      const boundary = series.definitionBreak || series.sourceBoundary;
      const caveat = [point.approximate ? 'Approximate' : '', point.status, point.caveat, series.exportCaveat, chart.exportCaveat,
        boundary ? `Definition/source break: ${boundary.earlierEnd}–${boundary.laterStart}` : ''].filter(Boolean).join('; ');
      return [point.periodLabel || point.year, series.name, value, unit || '',
        ...(hasOriginals ? [point.rawValue ?? '', point.rawUnit ?? ''] : []),
        ...(hasSourceValues ? [point.sourceValue ?? '', point.sourceUnit ?? ''] : []),
        ...(hasBaseline ? [point.baselineYear ?? chart.exportBaselineYear ?? ''] : []), source,
        ...(calculations ? [point.calculation || series.calculation || chart.exportCalculation || ''] : []),
        ...(caveats ? [caveat] : [])];
    });
    const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [header, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  }

  window.downloadChartCSV = function(container, fullDataChart, displayedChart, scope) {
    const original = container.csvChart || fullDataChart;
    const names = new Set([...(displayedChart.series || []), ...(displayedChart.overlaySeries || [])].map(series => series.name));
    const selected = scope === 'all' ? original : { ...original,
      series: (original.series || []).filter(series => names.has(series.name)),
      overlaySeries: (original.overlaySeries || []).filter(series => names.has(series.name)) };
    const title = container.closest('.chart-card')?.querySelector('h3')?.textContent?.trim() || selected.title || 'Chart';
    const filename = [typeof ACTIVE_TOPIC === 'string' ? ACTIVE_TOPIC : '', title, selected.id, scope === 'all' ? 'all-series' : 'selection']
      .filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    saveChartFile(`${filename}.csv`, csvFor(selected), 'text/csv;charset=utf-8');
  };

  window.openChartDataTable = function(container, chart, trigger) {
    const dialog = document.createElement('dialog'); dialog.className = 'chart-data-dialog';
    dialog.setAttribute('aria-labelledby', 'chart-data-title');
    const header = document.createElement('header');
    const heading = document.createElement('h2'); heading.id = 'chart-data-title'; heading.textContent = `${chart.title || 'Chart'} — data`;
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label','Close data table');
    close.addEventListener('click',()=>dialog.close()); header.append(heading,close); dialog.append(header);
    const description = document.createElement('p'); description.textContent = chart.transformMode && chart.transformMode !== 'absolute' ? chart.yLabel : 'Values for the current chart selection.'; dialog.append(description);
    const scroller = document.createElement('div'); scroller.className = 'chart-data-scroll'; scroller.tabIndex = 0; scroller.setAttribute('role','region'); scroller.setAttribute('aria-label','Chart data; scroll to explore all rows');
    const table = document.createElement('table'); const caption = document.createElement('caption'); caption.textContent = 'Current view, ordered by year and series';table.append(caption);
    const head = document.createElement('thead'); head.innerHTML = `<tr><th scope="col">${chart.type === 'period-bars' ? 'Period' : 'Year'}</th><th scope="col">Series</th><th scope="col">Value</th></tr>`;table.append(head);
    const body = document.createElement('tbody');
    const rows = [...(chart.series || []), ...(chart.overlaySeries || [])].flatMap(series => series.values.map(point=>({series,point}))).sort((a,b)=>a.point.year-b.point.year || a.series.name.localeCompare(b.series.name));
    rows.forEach(({series,point})=>{ const row=document.createElement('tr'); [point.periodLabel || point.year,series.name,formatValue(chart,point.value,series)].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);}); body.append(row); });
    if (!rows.length) { const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=3;cell.textContent='No series selected. Use Chart options → Show/hide series to select data.';row.append(cell);body.append(row); }
    table.append(body);scroller.append(table);dialog.append(scroller);
    const download=document.createElement('button');download.type='button';download.className='chart-data-download';download.textContent='Download absolute data as CSV';download.addEventListener('click',()=>downloadChartCSV(container,chart,chart,'current'));dialog.append(download);
    dialog.addEventListener('close',()=>{dialog.remove();if(trigger?.isConnected)trigger.focus({preventScroll:true});});
    dialog.addEventListener('keydown',event=>{containChartDialogFocus(dialog,event);if(event.key==='Escape')event.stopPropagation();});
    document.body.append(dialog);dialog.showModal();close.focus();
  };

  window.openChartDownloadPanel = function (container, fullDataChart, displayedChart, returnFocus) {
    const dialog = document.createElement('dialog');
    dialog.className = 'chart-download-dialog';
    dialog.setAttribute('aria-labelledby', 'chart-download-title');
    dialog.innerHTML = `<form method="dialog" class="chart-download-panel"><div class="chart-download-heading"><h2 id="chart-download-title">Download chart</h2><button type="submit" class="chart-download-close" aria-label="Close download panel">×</button></div><p>Download an image of the current view or the chart data as a CSV file.</p><button type="button" class="chart-download-image">Download PNG image</button><p class="chart-download-hint">The image reflects the current view.</p><label for="chart-download-scope">CSV data</label><select id="chart-download-scope"><option value="current">Current selection</option><option value="all">All series in this view</option></select><p class="chart-download-description">CSV includes absolute values; indexed charts also include original observations where available.</p><button type="button" class="chart-download-csv">Download CSV</button><p class="chart-download-status" role="status" aria-live="polite"></p></form>`;
    document.body.append(dialog);
    const scope = dialog.querySelector('select');
    const description = dialog.querySelector('.chart-download-description');
    const status = dialog.querySelector('.chart-download-status');
    const image = dialog.querySelector('.chart-download-image');
    scope.addEventListener('change', () => {
      description.textContent = scope.value === 'all' ? 'All series and years, using absolute values; existing indices are retained.' : 'CSV includes absolute values; indexed charts also include original observations where available.';
      status.textContent = '';
    });
    image.addEventListener('click', async () => {
      image.disabled = true;
      status.textContent = 'Preparing image…';
      try {
        if (!container.querySelector('svg')) throw new Error('No chart image is available.');
        await downloadChartImage(container, displayedChart);
        status.textContent = 'Image download started.';
      } catch (error) { status.textContent = 'Could not download the image. Please try again.'; }
      finally { image.disabled = false; }
    });
    dialog.querySelector('.chart-download-csv').addEventListener('click', () => {
      try {
        downloadChartCSV(container, fullDataChart, displayedChart, scope.value);
        status.textContent = 'CSV download started.';
      } catch (error) { status.textContent = 'Could not download the CSV. Please try again.'; }
    });
    dialog.addEventListener('close', () => { dialog.remove(); if (returnFocus?.isConnected) returnFocus.focus(); });
    dialog.showModal();
    dialog.querySelector('.chart-download-close').focus();
  };
}());
