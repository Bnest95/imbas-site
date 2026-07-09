(function () {
  var FALLBACK = 77;
  var MORE_PAGES = ['/field-notes', '/methodology.html', '/public-interest.html', '/faq.html', '/contact.html'];

  function isFieldNotesPath(path) {
    return path === '/field-notes' || path.indexOf('/field-notes/') === 0;
  }

  function isMoreSectionPath(path) {
    if (isFieldNotesPath(path)) return true;
    return MORE_PAGES.indexOf(path) !== -1;
  }

  function syncHeaderOffset() {
    var header = document.querySelector('.site-header');
    var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    if (!height) height = FALLBACK;
    document.documentElement.style.setProperty('--header-offset', height + 'px');
    return height;
  }

  function closeMobileNav() {
    var nav = document.getElementById('primary-nav');
    var btn = document.querySelector('.nav__menu-btn');
    if (nav && nav.classList.contains('is-open') && btn) {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Menu';
      document.body.classList.remove('nav-open');
    }
  }

  function normalizePath(pathname) {
    var path = pathname.replace(/\/$/, '') || '/';
    if (path.endsWith('/index.html')) {
      path = path.slice(0, -'/index.html'.length) || '/';
    }
    return path;
  }

  function ensureNavMore() {
    var nav = document.getElementById('primary-nav');
    if (!nav || nav.querySelector('.nav-more')) return;

    var path = normalizePath(window.location.pathname);

    var wrap = document.createElement('div');
    wrap.className = 'nav-more';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-more__toggle';
    toggle.id = 'nav-more-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'menu');
    toggle.setAttribute('aria-controls', 'nav-more-menu');
    toggle.innerHTML = 'More <span class="nav-more__caret" aria-hidden="true">\u25BE</span>';

    if (isMoreSectionPath(path)) {
      toggle.setAttribute('aria-current', 'page');
    }

    var menu = document.createElement('ul');
    menu.className = 'nav-more__menu';
    menu.id = 'nav-more-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    [
      { href: '/field-notes/', label: 'Field Notes', fieldNotes: true, desktopOnly: true },
      { href: '/methodology.html', label: 'Methodology' },
      { href: '/public-interest.html', label: 'Public Interest' },
      { href: '/faq.html', label: 'FAQ' },
      { href: '/contact.html', label: 'Contact' }
    ].forEach(function (item) {
      var li = document.createElement('li');
      li.setAttribute('role', 'none');
      if (item.desktopOnly) li.className = 'nav-more__item--desktop-only';
      var link = document.createElement('a');
      link.href = item.href;
      link.setAttribute('role', 'menuitem');
      link.textContent = item.label;
      if (item.fieldNotes ? isFieldNotesPath(path) : path === item.href) {
        link.setAttribute('aria-current', 'page');
      }
      li.appendChild(link);
      menu.appendChild(li);
    });

    wrap.appendChild(toggle);
    wrap.appendChild(menu);
    nav.appendChild(wrap);

    var menuLinks = menu.querySelectorAll('[role="menuitem"]');
    var focusIdx = -1;

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
      wrap.classList.toggle('is-open', open);
      if (!open) focusIdx = -1;
    }

    function closeMore(focusToggle) {
      if (!isOpen()) return;
      setOpen(false);
      if (focusToggle) toggle.focus();
    }

    function openMore() {
      setOpen(true);
      focusIdx = 0;
      menuLinks[0].focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) closeMore(false);
      else openMore();
    });

    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen()) openMore();
        else {
          focusIdx = 0;
          menuLinks[0].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen()) openMore();
        focusIdx = menuLinks.length - 1;
        menuLinks[focusIdx].focus();
      } else if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        closeMore(true);
      }
    });

    menu.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      var len = menuLinks.length;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMore(true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusIdx = (focusIdx + 1) % len;
        menuLinks[focusIdx].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusIdx = (focusIdx - 1 + len) % len;
        menuLinks[focusIdx].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusIdx = 0;
        menuLinks[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        focusIdx = len - 1;
        menuLinks[focusIdx].focus();
      }
    });

    menuLinks.forEach(function (link, i) {
      link.addEventListener('click', closeMobileNav);
      link.addEventListener('focus', function () {
        focusIdx = i;
      });
    });

    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (!wrap.contains(e.target)) closeMore(false);
    });

    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        if (!nav.classList.contains('is-open')) closeMore(false);
      }).observe(nav, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function ensureMobileFieldNotesNav() {
    var nav = document.getElementById('primary-nav');
    if (!nav || nav.querySelector('.nav__link--mobile-field-notes')) return;

    var path = normalizePath(window.location.pathname);
    var link = document.createElement('a');
    link.href = '/field-notes/';
    link.className = 'nav__link--mobile-field-notes';
    link.textContent = 'Field Notes';
    if (isFieldNotesPath(path)) {
      link.setAttribute('aria-current', 'page');
    }

    var more = nav.querySelector('.nav-more');
    if (more) nav.insertBefore(link, more);
    else nav.appendChild(link);

    link.addEventListener('click', closeMobileNav);
  }

  function init() {
    ensureNavMore();
    ensureMobileFieldNotesNav();
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
