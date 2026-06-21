(function () {
  var FALLBACK = 77;

  function syncHeaderOffset() {
    var header = document.querySelector('.site-header');
    var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    if (!height) height = FALLBACK;
    document.documentElement.style.setProperty('--header-offset', height + 'px');
    return height;
  }

  function init() {
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
