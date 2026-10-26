/* KH么Kozak phone-only sidebar behavior 18.64.
   Only handles viewports <=699px. Tablet and desktop controls remain untouched. */
(() => {
  'use strict';
  const phone = () => window.matchMedia('(max-width: 699px)').matches;
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  const toggles = [...document.querySelectorAll('.mobile-menu-toggle')];
  const closeButton = document.getElementById('mobileSidebarClose');
  if (!sidebar || !toggles.length) return;

  const closeMenu = () => {
    body.classList.remove('nexus-nav-open');
    toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (backdrop) backdrop.hidden = true;
  };

  const toggleMenu = event => {
    if (!phone()) return;
    event.preventDefault();
    event.stopPropagation();
    if (body.classList.contains('nexus-nav-open')) {
      closeMenu();
    } else {
      body.classList.add('nexus-nav-open');
      toggles.forEach(button => button.setAttribute('aria-expanded', 'true'));
      if (backdrop) backdrop.hidden = false;
    }
  };

  toggles.forEach(button => button.addEventListener('click', toggleMenu));
  closeButton?.addEventListener('click', event => {
    if (!phone()) return;
    event.preventDefault();
    closeMenu();
  });
  backdrop?.addEventListener('click', () => {
    if (phone()) closeMenu();
  });
  sidebar.addEventListener('click', event => {
    if (phone() && event.target.closest('.nav-item,[data-tab-link]')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (phone() && event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (!phone()) closeMenu();
  }, { passive: true });
})();
