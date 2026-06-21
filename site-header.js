(function () {
  var FALLBACK = 77;
  var ANNOUNCEMENT_COPY = 'Agentic AI tools in development';

  function ensureAnnouncement() {
    if (document.querySelector('.site-announcement')) return;
    var header = document.querySelector('.site-header');
    if (!header || !header.parentNode) return;
    var bar = document.createElement('div');
    bar.className = 'site-announcement';
    bar.setAttribute('role', 'note');
    var text = document.createElement('p');
    text.className = 'site-signal';
    text.textContent = ANNOUNCEMENT_COPY;
    bar.appendChild(text);
    header.parentNode.insertBefore(bar, header);
  }

  function syncHeaderOffset() {
    var header = document.querySelector('.site-header');
    var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    if (!height) height = FALLBACK;
    document.documentElement.style.setProperty('--header-offset', height + 'px');
    return height;
  }

  function init() {
    ensureAnnouncement();
    syncHeaderOffset();
    window.addEventListener('resize', syncHeaderOffset);
    var header = document.querySelector('.site-header');
    if (header && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncHeaderOffset).observe(header);
    }
  }

  window.syncHeaderOffset = syncHeaderOffset;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
