// Кнопка «Поделиться» на всех страницах: ссылка на текущую страницу в WhatsApp / Telegram / «Скопировать»
// и QR-код этой страницы на весь экран — чтобы человек рядом навёл камеру и открыл у себя.
// Нужна прежде всего для режима «иконка на экране iPhone», где у Safari нет адресной строки и своей кнопки.
// QR рисуется на телефоне библиотекой /js/qrcode.js (MIT, лежит у нас — работает без VPN).
(function () {
  var url = location.origin + location.pathname;
  var title = document.title.split(" — ")[0];

  var css =
    ".shr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;min-width:40px;padding:0 14px;" +
    "border:1px solid var(--line,rgba(255,255,255,.12));border-radius:10px;background:var(--surface,var(--panel,#111A2B));" +
    "color:var(--ink,#F2F5F9);font-family:inherit;font-size:14px;font-weight:600;line-height:1;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}" +
    ".shr-btn svg{width:18px;height:18px;flex:none}" +
    "header .hdr .shr-btn{height:38px;min-width:38px;padding:0;background:transparent}" +
    ".shr-group{display:inline-flex;gap:8px;align-items:center}" +
    "@media(max-width:340px){.shr-btn .shr-t{display:none}.shr-btn{padding:0}}" +
    ".shr-back{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}" +
    ".shr-sheet{width:100%;max-width:440px;max-height:100%;overflow:auto;background:var(--bg-2,var(--surface,#0B1322));color:var(--ink,#F2F5F9);" +
    "border:1px solid var(--line,rgba(255,255,255,.12));border-bottom:0;border-radius:20px 20px 0 0;" +
    "padding:18px 18px calc(18px + env(safe-area-inset-bottom));font-family:inherit;box-sizing:border-box}" +
    "@media(min-width:600px){.shr-back{align-items:center}.shr-sheet{border-radius:20px;border-bottom:1px solid var(--line,rgba(255,255,255,.12))}}" +
    ".shr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}" +
    ".shr-head b{font-size:17px;line-height:1.3}" +
    ".shr-x{border:0;background:none;color:var(--muted,#9AA7B8);font-size:28px;line-height:1;cursor:pointer;padding:0 4px}" +
    ".shr-qr{background:#fff;border-radius:14px;padding:14px;margin:0 auto 8px;width:min(100%,280px);box-sizing:border-box}" +
    ".shr-qr svg{display:block;width:100%;height:auto}" +
    ".shr-hint{text-align:center;color:var(--muted,#9AA7B8);font-size:13px;margin:0 0 16px}" +
    ".shr-acts{display:grid;gap:8px}" +
    ".shr-acts a,.shr-acts button{display:flex;align-items:center;justify-content:center;gap:10px;height:48px;border-radius:12px;" +
    "border:1px solid var(--line,rgba(255,255,255,.12));background:var(--surface,var(--panel,#111A2B));color:var(--ink,#F2F5F9);" +
    "font-family:inherit;font-size:15px;font-weight:600;line-height:1;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".shr-acts .shr-main{background:var(--ink,#F2F5F9);color:var(--bg,#080D18);border-color:transparent}" +
    ".shr-acts svg{width:20px;height:20px;flex:none}";

  var ICON_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>';
  var ICON_TG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.4 4.2 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.5zM9.6 14.4l-.4 4-1.4-4.6 10-6.3-8.2 6.9z"/></svg>';
  var ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function loadQr(cb) {
    if (window.qrcode) return cb();
    var s = document.createElement("script");
    s.src = "/js/qrcode.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function copy(btn) {
    var done = function () {
      var old = btn.innerHTML;
      btn.textContent = "Ссылка скопирована";
      setTimeout(function () { btn.innerHTML = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { prompt("Скопируйте ссылку:", url); });
    } else {
      prompt("Скопируйте ссылку:", url);
    }
  }

  function open() {
    var back = el("div", "shr-back");
    back.setAttribute("role", "dialog");
    back.setAttribute("aria-modal", "true");
    back.setAttribute("aria-label", "Поделиться страницей");
    var sheet = el("div", "shr-sheet");
    var head = el("div", "shr-head");
    var name = el("div");
    name.appendChild(el("b")).textContent = title;
    var x = el("button", "shr-x", "×");
    x.setAttribute("aria-label", "Закрыть");
    head.appendChild(name);
    head.appendChild(x);
    var qr = el("div", "shr-qr");
    var hint = el("p", "shr-hint", "Наведите камеру телефона — страница откроется сразу");
    var acts = el("div", "shr-acts");
    var msg = encodeURIComponent(title + "\n" + url);
    if (navigator.share) {
      var sys = el("button", "shr-main", ICON_SHARE + "Отправить ссылку");
      sys.onclick = function () { navigator.share({ title: title, url: url }).catch(function () {}); };
      acts.appendChild(sys);
    }
    var wa = el("a", navigator.share ? "" : "shr-main", ICON_WA + "В WhatsApp");
    wa.href = "https://wa.me/?text=" + msg;
    wa.target = "_blank";
    wa.rel = "noopener";
    var tg = el("a", "", ICON_TG + "В Telegram");
    tg.href = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(title);
    tg.target = "_blank";
    tg.rel = "noopener";
    var cp = el("button", "", ICON_COPY + "Скопировать ссылку");
    cp.onclick = function () { copy(cp); };
    acts.appendChild(wa);
    acts.appendChild(tg);
    acts.appendChild(cp);
    sheet.appendChild(head);
    sheet.appendChild(qr);
    sheet.appendChild(hint);
    sheet.appendChild(acts);
    back.appendChild(sheet);
    document.body.appendChild(back);
    document.documentElement.style.overflow = "hidden";

    function close() {
      back.remove();
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    x.onclick = close;
    back.onclick = function (e) { if (e.target === back) close(); };
    document.addEventListener("keydown", onKey);

    loadQr(function () {
      var q = qrcode(0, "M");
      q.addData(url);
      q.make();
      qr.innerHTML = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    });
  }

  function button(withText) {
    var b = el("button", "shr-btn", ICON_SHARE + (withText ? '<span class="shr-t">Поделиться</span>' : ""));
    b.type = "button";
    b.setAttribute("aria-label", "Поделиться страницей");
    b.title = "Поделиться";
    b.onclick = open;
    return b;
  }

  function init() {
    document.head.appendChild(el("style", "", css));
    var home = document.querySelector(".backline .tohome");
    if (home) {                       // презентации: рядом с «← На главную»
      var g = el("div", "shr-group");
      home.parentNode.insertBefore(g, home);
      g.appendChild(home);
      g.appendChild(button(true));
      return;
    }
    var hdr = document.querySelector("header .hdr");
    if (hdr) {                        // главная: в шапке перед WhatsApp
      hdr.insertBefore(button(false), hdr.querySelector(".mini"));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
