/* Движение на сайте GMM Digital — без библиотек.
   1) Экран Отклика на первом экране «оживает»: по очереди загораются звёзды, затем всплывает плашка
      «4–5 звёзд → отзыв в 2ГИС», потом сценарий недовольного гостя «1–3 звезды → вам в Telegram».
   2) Заголовки, карточки и работы мягко выплывают снизу, когда до них доходит прокрутка.
   3) На компьютере карточки приподнимаются и подсвечиваются при наведении.
   Если человек в настройках телефона выключил анимацию — ничего не двигается. Если файл не загрузился —
   страница остаётся как была: всё прячется только этим же скриптом, поэтому без него ничего не пропадает. */
(function () {
  if (!("IntersectionObserver" in window) || !document.querySelector) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css = document.createElement("style");
  css.textContent =
    ".rv{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}" +
    ".rv.in{opacity:1;transform:none}" +
    ".rvi{opacity:0;transform:scale(.97);transition:opacity .5s ease,transform .5s ease}" +
    ".rvi.in{opacity:1;transform:none}" +
    "@media (hover:hover) and (prefers-reduced-motion:no-preference){" +
    ".pc,.work,.tile,.tier{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}" +
    ".pc:hover,.work:hover,.tile:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 12px 32px rgba(255,106,23,.14)}" +
    ".tier:hover{transform:translateX(4px)}}" +
    ".ostars{position:absolute;pointer-events:none;z-index:2}" +
    ".ostars svg{position:absolute;transform:translate(-50%,-50%) scale(.5);opacity:0;fill:#FF6A17;" +
    "transition:opacity .25s ease,transform .25s ease;filter:drop-shadow(0 0 6px rgba(255,106,23,.55))}" +
    ".ostars svg.on{opacity:1;transform:translate(-50%,-50%) scale(1)}" +
    ".phone.live .float{opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease}" +
    ".phone.live .float.show{opacity:1;transform:none}";
  document.head.appendChild(css);
  if (reduce) return;

  // ---------- 2) появление при прокрутке ----------
  var sel = "section:not(.hero) h2, section:not(.hero) .lead, .pc, .step, .terms .t, .tile, .work, " +
            ".contact-card, .flow figure, .tab-wrap, .gets, .can";
  var items = [].slice.call(document.querySelectorAll(sel));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      el.classList.add("in");
      // снимки внутри работы — по очереди
      [].slice.call(el.querySelectorAll(".rvi")).forEach(function (img, i) {
        setTimeout(function () { img.classList.add("in"); }, 250 + i * 160);
      });
      // после появления убираем служебные классы, чтобы не мешать наведению
      setTimeout(function () { el.classList.remove("rv", "in"); el.style.transitionDelay = ""; }, 1400);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  var fold = window.innerHeight;
  items.forEach(function (el) {
    // то, что видно сразу при открытии, не прячем — иначе страница «дёргается» на входе
    if (el.getBoundingClientRect().top < fold) return;
    var sib = [].slice.call(el.parentNode.children).filter(function (c) { return items.indexOf(c) >= 0; });
    var i = sib.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 80 + "ms";
    el.classList.add("rv");
    if (el.classList.contains("work"))
      [].slice.call(el.querySelectorAll("img")).forEach(function (img) { img.classList.add("rvi"); });
    io.observe(el);
  });

  // ---------- 1) живой экран Отклика ----------
  var phone = document.querySelector(".hero .phone");
  var img = phone && phone.querySelector("img[src*='otklik-1']");
  var one = phone && phone.querySelector(".float.one"), two = phone && phone.querySelector(".float.two");
  if (!img || !one || !two) return;
  // центры звёзд на снимке otklik-1 (в % ширины и высоты снимка), размер звезды
  var X = [23.75, 36.83, 49.9, 62.98, 76.06], Y = 52.39, SIZE = 11.5;
  var path = '<path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5L2.5 9.7l6.6-.9z"/>';
  var box = document.createElement("div");
  box.className = "ostars";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = X.map(function (x) {
    return '<svg viewBox="0 0 24 24" style="left:' + x + "%;top:" + Y + "%;width:" + SIZE + '%">' + path + "</svg>";
  }).join("");
  phone.appendChild(box);
  function place() {
    box.style.left = img.offsetLeft + "px"; box.style.top = img.offsetTop + "px";
    box.style.width = img.offsetWidth + "px"; box.style.height = img.offsetHeight + "px";
  }
  place();
  img.addEventListener("load", place);
  window.addEventListener("resize", place);

  var stars = box.querySelectorAll("svg"), timers = [], running = false;
  function light(n) { for (var i = 0; i < 5; i++) stars[i].classList.toggle("on", i < n); }
  function stop() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function cycle() {
    stop(); light(0); one.classList.remove("show"); two.classList.remove("show");
    [1, 2, 3, 4, 5].forEach(function (n, i) { at(400 + i * 220, function () { light(n); }); });
    at(1700, function () { one.classList.add("show"); });            // довольный → 2ГИС
    at(4400, function () { light(0); one.classList.remove("show"); });
    [1, 2].forEach(function (n, i) { at(5000 + i * 260, function () { light(n); }); });
    at(5900, function () { two.classList.add("show"); });            // недовольный → Telegram
    at(8700, function () { light(0); two.classList.remove("show"); });
    at(9300, cycle);
  }
  // на входе плашки уже стоят на месте (как без скрипта); оживление начинается через пару секунд плавно
  one.classList.add("show"); two.classList.add("show");
  phone.classList.add("live");
  var first = true;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !running) {
        running = true;
        if (first) {
          first = false;
          at(1800, function () { one.classList.remove("show"); two.classList.remove("show"); at(600, cycle); });
        }
        else cycle();
      }
      else if (!e.isIntersecting && running) {
        running = false; stop(); light(0); one.classList.add("show"); two.classList.add("show");
      }
    });
  }).observe(phone);
})();
