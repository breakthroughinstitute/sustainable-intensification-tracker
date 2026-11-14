/* Resize BTI tracker iframes on an article page. Include once, after the frames
   or with defer. Only messages from each frame's actual origin are accepted. */
(() => {
  function start() {
    const frames = [...document.querySelectorAll('iframe[data-bti-tracker]')];
    const originOf = frame => {
      try {
        const url = new URL(frame.src, document.baseURI);
        return /^(https?:)$/.test(url.protocol) ? url.origin : null;
      } catch { return null; }
    };
    const requestHeight = frame => {
      const origin = originOf(frame);
      if (origin) frame.contentWindow?.postMessage({ type: 'bti-intensification-request-height' }, origin);
    };
    window.addEventListener('message', event => {
      const frame = frames.find(item => item.contentWindow === event.source && originOf(item) === event.origin);
      if (!frame || !event.data || typeof event.data !== 'object' || document.fullscreenElement) return;
      const message = event.data;
      if (message.type === 'bti-intensification-height' && Number.isFinite(message.height) && message.height > 0 && message.height <= 50000) {
        frame.style.height = `${Math.ceil(message.height)}px`;
      }
      if (message.type === 'bti-intensification-navigate') {
        const rect = frame.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight - 150) frame.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    frames.forEach(frame => { frame.addEventListener('load', () => requestHeight(frame)); requestHeight(frame); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
