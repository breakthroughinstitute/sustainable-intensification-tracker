/* Public-facing citations for charts. Source metadata and data files remain unchanged. */
function renderPublicChartSource(container, chart) {
  container.querySelectorAll(':scope > .public-chart-source').forEach(node => node.remove());
  if (!chart || !chart.source) return;
  const parsed = document.createElement('template');
  parsed.innerHTML = chart.source;
  const references = [...parsed.content.querySelectorAll('a[href]')].flatMap(link => {
    if (link.hasAttribute('download')) return [];
    let url;
    try { url = new URL(link.getAttribute('href'), document.baseURI); } catch { return []; }
    if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return [];
    const label = link.textContent.trim().replace(/^Source:\s*/i, '');
    if (!label || /\b(?:internal memo|reconciliation|source comparison|download)\b/i.test(label)) return [];
    return [{ url: url.href, label, short: chart.useSourceLabels ? label : publicSourceName(url, label) }];
  });
  const downloads = [...parsed.content.querySelectorAll('a[href]')].flatMap(link => {
    const href = link.getAttribute('href');
    return !/^https?:/i.test(href) && /\.(csv|json)$/i.test(href) ? [{ url: href, label: link.textContent.trim() }] : [];
  }).filter((item, index, items) => items.findIndex(other => other.url === item.url) === index);
  const unique = references.filter((item, index) => references.findIndex(other => other.url === item.url) === index);
  if (!unique.length && !downloads.length) return;
  const sourceNotes = [...parsed.content.querySelectorAll('p')].flatMap(paragraph => {
    const copy = paragraph.cloneNode(true); copy.querySelectorAll('a').forEach(a => a.remove()); const value = copy.textContent.trim();
    return /[a-z]{3}/i.test(value) && value.length > 30 ? [value] : [];
  });
  const notes = (chart.publicMethods ? [chart.publicMethods] : [chart.caption, chart.processingNotes, ...sourceNotes]).flatMap(value => Array.isArray(value) ? value : [value])
    .filter(value => typeof value === 'string').map(value => value.replace(/<[^>]*>/g, '').trim())
    .filter(value => value && !/^(?:latest available values|latest values)(?:\s*[·:–-].*)?$/i.test(value))
    .map(value => value.replace(/See the reconciliation above\./gi, '').replace(/\s+[;,](?:\s*[.;,])*$/g, '').replace(/^[;,\s]+|[;,\s]+$/g, '').trim()).filter(Boolean);
  const footer = document.createElement('div');
  footer.className = 'public-chart-source';
  if (unique.length) footer.append(document.createTextNode('Source: '));
  const named = new Map();
  unique.forEach(reference => { if (!named.has(reference.short)) named.set(reference.short, reference); });
  [...named.values()].forEach((reference, index) => {
    if (index) footer.append(document.createTextNode('; '));
    footer.append(publicSourceLink(reference.url, reference.short));
  });
  // Show methods only when they add something beyond the chart's visible text.
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const visible = normalize(chart.visibleSourceContext || '');
  const additionalNotes = notes.filter(note => {
    if (visible.includes(normalize(note))) return false;
    if (/^Series are expressed as .* Each series retains its source coverage and reporting definition\.$/.test(note)) return false;
    return true;
  });
  if (chart.sourceSuffix) footer.append(document.createTextNode(chart.sourceSuffix));
  if (!chart.hideSourceDetails && ((chart.sourceDetails !== false && additionalNotes.length) || unique.length > named.size || downloads.length)) {
    if (unique.length) footer.append(document.createTextNode(' · '));
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'public-chart-source-details'; button.textContent = additionalNotes.length && chart.sourceDetails !== false ? 'See details' : downloads.length ? 'Data downloads' : 'All sources';
    button.addEventListener('click', () => openPublicChartSourceDetails(button, chart, unique, chart.sourceDetails === false ? [] : additionalNotes, downloads));
    footer.append(button);
  }
  container.append(footer);
}

function publicSourceName(url, label) {
  const host = url.hostname.toLowerCase();
  const text = label.toLowerCase();
  if (/^NASS (QuickStats|Crop Production) \(20\d{2}\)$/.test(label)) return label;
  if (host.includes('nifa.usda.gov') || /\breeis\b/.test(text)) return 'USDA REEIS';
  if (host.includes('ncses.nsf.gov') || /\bncses\b/.test(text)) return 'NSF NCSES';
  if (host.includes('nass.usda.gov')) return 'USDA NASS';
  if (host.includes('ers.usda.gov')) return 'USDA ERS';
  if (host.includes('nrcs.usda.gov')) return 'USDA NRCS';
  if (host.includes('aphis.usda.gov')) return 'USDA APHIS';
  if (host.includes('usda.gov') || host.includes('usda.azureedge.us')) return 'USDA';
  if (host.includes('epa.gov') || host === 'downloads.regulations.gov') return 'EPA';
  if (host.includes('fda.gov')) return 'FDA';
  if (host.includes('usgs.gov') && /CTIC/.test(label)) return 'CTIC/USGS';
  if (host.includes('water.usgs.gov') && /Water Use/i.test(label)) return 'USGS Water Use';
  if (host.includes('usgs.gov')) return 'USGS';
  if (host.includes('fao.org')) return 'FAOSTAT';
  if (host.includes('noaa.gov')) return 'NOAA';
  if (host.includes('nih.gov')) return 'NIH/BEA';
  if (host.includes('bea.gov')) return 'BEA';
  if (host.includes('fieldtomarket.org')) return 'Field to Market (2021)';
  if (host.includes('pubs.usgs.gov') && /CTIC/.test(label)) return 'CTIC/USGS';
  if (host.includes('porkcheckoff.org')) return 'Putman et al.';
  if (host.includes('doi.org')) return label.split(',')[0].trim();
  if (host.includes('nsf.gov') || /\bnsf\b/.test(text)) return 'NSF';
  return label.split(/[,;:]/)[0].trim().replace(/\s*\([^)]*\)\s*$/, '') || host.replace(/^www\./, '');
}

function publicSourceLink(url, label) {
  const link = document.createElement('a');
  link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = label;
  return link;
}

function openPublicChartSourceDetails(trigger, chart, references, notes, downloads = []) {
  const dialog = document.createElement('dialog');
  dialog.className = 'public-chart-source-dialog';
  const heading = document.createElement('h2');
  heading.id = 'public-chart-source-dialog-title';
  heading.textContent = notes.length ? 'Sources and methods' : downloads.length ? 'Sources and data' : 'Sources';
  dialog.setAttribute('aria-labelledby', heading.id);
  const header = document.createElement('header');
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'public-chart-source-close'; close.setAttribute('aria-label', 'Close details'); close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close); dialog.append(header);
  const body = document.createElement('div'); body.className = 'public-chart-source-dialog-body';
  const notesHeading = document.createElement('h3'); notesHeading.textContent = 'Methods and coverage'; if (notes.length && !chart.hideSourceLists) body.append(notesHeading);
  const distinct = [];
  [...new Set(notes)].forEach(note => {
    const tokens = value => new Set(value.toLowerCase().match(/[a-z0-9]+/g) || []);
    const a = tokens(note);
    const match = distinct.findIndex(other => { const b=tokens(other); const union=new Set([...a,...b]); return [...a].filter(token=>b.has(token)).length / union.size > .82; });
    if(match<0)distinct.push(note); else if(note.length>distinct[match].length)distinct[match]=note;
  });
  distinct.forEach(note => { const p = document.createElement('p'); p.textContent = note; body.append(p); });
  if (!chart.hideSourceLists && references.length > 1) {
  const sourceHeading = document.createElement('h3'); sourceHeading.textContent = 'Original sources'; body.append(sourceHeading);
  const list = document.createElement('ul');
  references.forEach(reference => { const item = document.createElement('li'); item.append(publicSourceLink(reference.url, reference.label)); list.append(item); });
  body.append(list); }
  if (!chart.hideSourceLists && downloads.length) {
    const title = document.createElement('h3'); title.textContent = 'Data downloads'; body.append(title);
    const list = document.createElement('ul');
    downloads.forEach(file => { const item = document.createElement('li'); const link = document.createElement('a'); link.href = file.url; link.download = ''; link.textContent = file.label; item.append(link); list.append(item); });
    body.append(list);
  }
  dialog.append(body); document.body.append(dialog);
  dialog.addEventListener('close', () => { dialog.remove(); trigger.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)dialog.close(); } });
  dialog.addEventListener('keydown', event => { containChartDialogFocus(dialog,event); if(event.key==='Escape')event.stopPropagation(); });
  dialog.showModal(); close.focus();
}

function containChartDialogFocus(dialog, event) {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button, a[href], input, select, summary, [tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
