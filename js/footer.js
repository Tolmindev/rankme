/* RankMe shared footer — single source of truth */
(function () {
  var root = document.getElementById('site-footer');
  if (!root) return;

  root.className = 'site';
  root.innerHTML =
    '<img class="footer-logo" src="assets/brand/Footer_logo.svg" alt="RankMe">' +
    '<div class="footer-legal">© 2026 rankme.lol | ' +
      '<a href="privacy.html">Privacy Policy</a> | ' +
      '<a href="terms.html">Terms of Use</a> | ' +
      '<a href="dmca.html">DMCA</a></div>' +
    '<div class="footer-social">' +
      '<a href="https://x.com/rankmelol" target="_blank" rel="noopener noreferrer" title="RankMe on X" aria-label="X">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6L17.7 20Z"/></svg>' +
      '</a>' +
      '<a href="mailto:lolrankme@gmail.com" title="Email RankMe" aria-label="Email">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>' +
      '</a>' +
    '</div>';
})();
