/* Loads Google Analytics only after the visitor accepts. The choice is kept in this browser (localStorage). */
(function () {
  var ID = "G-77JZGT3FDK", KEY = 'zl-consent';
  var me = document.currentScript, root = me ? me.src.replace(/assets\/consent\.js.*$/, '') : '/';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = 1;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
  }
  function wipe() {
    window['ga-disable-' + ID] = true;
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0) {
        var host = location.hostname.split('.');
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        for (var i = 0; i < host.length - 1; i++) document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + host.slice(i).join('.');
      }
    });
  }
  function close(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function show() {
    if (document.getElementById('zl-consent')) return;
    var box = document.createElement('div');
    box.id = 'zl-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.style.cssText = 'position:fixed;z-index:90;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:460px;padding:16px 18px;border-radius:14px;background:var(--bg2,#151B33);color:var(--text,#E8EBF4);border:1px solid var(--line,#2A3354);font:.92rem/1.5 var(--body,system-ui,sans-serif);box-shadow:0 12px 40px -12px rgba(0,0,0,.5)';
    box.innerHTML = '<p style="margin:0 0 12px">This site uses cookies to measure traffic and improve the site. No ads. <a href="' + root + 'privacy/" style="color:inherit">Learn more</a></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-a="yes" style="cursor:pointer;font:inherit;font-weight:600;padding:9px 18px;border-radius:999px;border:1px solid var(--text,#E8EBF4);background:var(--text,#E8EBF4);color:var(--bg,#0E1326)">Accept</button><button type="button" data-a="no" style="cursor:pointer;font:inherit;font-weight:600;padding:9px 18px;border-radius:999px;border:1px solid var(--text,#E8EBF4);background:transparent;color:var(--text,#E8EBF4)">Decline</button></div>';
    box.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      if (a === 'yes') { set('granted'); load(); } else { set('denied'); wipe(); }
      close(box);
    });
    document.body.appendChild(box);
  }
  function start() {
    var v = get();
    if (v === 'granted') load(); else if (v !== 'denied') show();
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!t) return;
      e.preventDefault();
      show();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
