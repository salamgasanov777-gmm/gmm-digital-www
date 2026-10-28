/* Первый экран GMM Digital: шар из точек (решение владельца 24.10.2026).
   Шар из точек вращается и «дышит», из него вытекает надпись GMM Digital и стекает обратно.
   Мышь или палец расталкивают точки и поворачивают шар. Без библиотек, рисует на <canvas id="ai">.
   Кто выключил анимацию в настройках телефона — видит неподвижную надпись из точек.
   Когда экран с анимацией прокручен или вкладка скрыта — рисование останавливается. */
(function () {
  var cv = document.getElementById("ai");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COL = { w: "242,245,249", o: "255,106,23", b: "59,130,246" };
  var spr = {};
  Object.keys(COL).forEach(function (k) {
    var s = document.createElement("canvas"); s.width = s.height = 16;
    var g = s.getContext("2d"), gr = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    gr.addColorStop(0, "rgba(" + COL[k] + ",1)");
    gr.addColorStop(0.3, "rgba(" + COL[k] + ",.6)");
    gr.addColorStop(1, "rgba(" + COL[k] + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 16, 16); spr[k] = s;
  });

  var W = 0, H = 0, P = [], ptr = { x: -1e4, y: -1e4, on: false }, rotX = 0, rotY = 0;

  // точки надписи: «GMM» белым, «Digital» оранжевым; на узком экране — в две строки
  function textTargets(max) {
    var off = document.createElement("canvas"); off.width = W; off.height = H;
    var g = off.getContext("2d", { willReadFrequently: true }); g.textBaseline = "middle";
    var two = W < 460;
    var fs = two ? Math.min(W * 0.29, H * 0.3) : Math.min(W * 0.16, H * 0.3);
    var f1 = "700 " + fs + "px Onest, Inter, sans-serif", f2 = "600 " + fs + "px Onest, Inter, sans-serif";
    g.font = f1; var w1 = g.measureText("GMM").width;
    g.font = f2; var w2 = g.measureText("Digital").width;
    var parts = two
      ? [["GMM", f1, (W - w1) / 2, H * 0.36, "w"], ["Digital", f2, (W - w2) / 2, H * 0.66, "o"]]
      : [["GMM", f1, (W - w1 - fs * 0.24 - w2) / 2, H / 2, "w"], ["Digital", f2, (W + w1 + fs * 0.24 - w2) / 2, H / 2, "o"]];
    var masks = parts.map(function (p) {
      g.clearRect(0, 0, W, H); g.font = p[1]; g.fillStyle = "#fff"; g.fillText(p[0], p[2], p[3]);
      return { d: g.getImageData(0, 0, W, H).data, c: p[4] };
    });
    var pts;
    for (var step = 2; step < 12; step++) {
      pts = [];
      masks.forEach(function (m) {
        for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step)
          if (m.d[(y * W + x) * 4 + 3] > 140) pts.push({ x: x, y: y, c: m.c });
      });
      if (pts.length <= max) break;
    }
    return pts;
  }

  function build() {
    var r = cv.getBoundingClientRect();
    W = Math.max(200, Math.round(r.width)); H = Math.max(160, Math.round(r.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var T = textTargets(W < 520 ? 900 : 1600), N = T.length;
    P = T.map(function (t, i) {
      var y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), th = i * 2.399963;   // равномерно по шару
      return {
        tx: t.x, ty: t.y, tc: t.c,
        sx: Math.cos(th) * rr, sy: y, sz: Math.sin(th) * rr,
        d: Math.random() * 0.5, k: (Math.random() - 0.5) * 2,   // задержка и изгиб струйки
        ox: 0, oy: 0
      };
    });
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // круг: шар → вытекает в надпись → надпись → стекает обратно (секунды)
  var PH = [["sphere", 3.2], ["out", 2.6], ["text", 3.4], ["back", 2.4]];
  var CYCLE = PH.reduce(function (s, p) { return s + p[1]; }, 0);
  function phaseAt(t) {
    t %= CYCLE;
    for (var i = 0; i < PH.length; i++) { if (t < PH[i][1]) return [PH[i][0], t / PH[i][1]]; t -= PH[i][1]; }
    return [PH[0][0], 0];
  }

  function spherePos(p, t) {
    var R = Math.min(W, H) * 0.34 * (1 + 0.035 * Math.sin(t * 1.7));
    var ay = t * 0.35 + rotY, ax = 0.35 + rotX;
    var x = p.sx * Math.cos(ay) + p.sz * Math.sin(ay), z = -p.sx * Math.sin(ay) + p.sz * Math.cos(ay);
    var y = p.sy * Math.cos(ax) - z * Math.sin(ax); z = p.sy * Math.sin(ax) + z * Math.cos(ax);
    var s = 1.7 / (1.7 - z);
    return { x: W / 2 + x * R * s, y: H / 2 + y * R * s, a: 0.25 + 0.75 * (z + 1) / 2, s: s,
             c: p.sy > 0.15 ? "o" : p.sy < -0.25 ? "b" : "w" };
  }

  function frame(t) {
    var ph = phaseAt(t), name = ph[0], f = ph[1];
    if (ptr.on) { rotY += ((ptr.x - W / 2) / W * 0.9 - rotY) * 0.05; rotX += ((ptr.y - H / 2) / H * 0.6 - rotX) * 0.05; }
    else { rotY *= 0.97; rotX *= 0.97; }
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < P.length; i++) {
      var p = P[i], sp = spherePos(p, t), x, y, a, s, c, e;
      if (name === "sphere") { x = sp.x; y = sp.y; a = sp.a; s = sp.s; c = sp.c; }
      else if (name === "text") {
        x = p.tx + Math.sin(t * 2 + i) * 0.5; y = p.ty + Math.cos(t * 1.7 + i) * 0.5; a = 1; s = 1.3; c = p.tc;
      } else {
        e = ease(clamp(f * 1.5 - p.d));
        if (name === "back") e = 1 - e;
        var bx = -(p.ty - sp.y), by = p.tx - sp.x, bl = Math.hypot(bx, by) || 1, bulge = Math.sin(Math.PI * e) * 46 * p.k;
        x = sp.x + (p.tx - sp.x) * e + bx / bl * bulge; y = sp.y + (p.ty - sp.y) * e + by / bl * bulge;
        a = sp.a + (1 - sp.a) * e; s = sp.s + (1.3 - sp.s) * e; c = e > 0.55 ? p.tc : sp.c;
      }
      if (ptr.on) {   // рука расталкивает точки, потом они возвращаются
        var dx = x + p.ox - ptr.x, dy = y + p.oy - ptr.y, dd = dx * dx + dy * dy;
        if (dd < 8100) { var dist = Math.sqrt(dd) || 1, push = (90 - dist) / 90; p.ox += dx / dist * push * 9; p.oy += dy / dist * push * 9; }
      }
      p.ox *= 0.9; p.oy *= 0.9;
      var sz = 5.2 * s;
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(spr[c], x + p.ox - sz / 2, y + p.oy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  function still() {
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter";
    P.forEach(function (p) { ctx.drawImage(spr[p.tc], p.tx - 3.4, p.ty - 3.4, 6.8, 6.8); });
    ctx.globalCompositeOperation = "source-over";
  }

  var running = false, visible = true, clock = 0, last = 0;
  function loop(now) {
    if (!running) return;
    clock += Math.min(now - last, 100) / 1000; last = now;   // после паузы продолжаем с того же места
    frame(clock);
    requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
  function stop() { running = false; }

  function pos(e) { var r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; }
  function off() { ptr.on = false; }
  cv.addEventListener("pointermove", pos);
  cv.addEventListener("pointerdown", pos);
  cv.addEventListener("pointerleave", off);
  cv.addEventListener("pointercancel", off);
  cv.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") off(); });

  var fonts = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load("700 80px Onest"), document.fonts.load("600 80px Onest")])["catch"](function () {})
    : Promise.resolve();
  fonts.then(function () {
    build();
    // перестраиваем только при смене ширины (на телефоне высота «прыгает» от адресной строки)
    var rt, lastW = W;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.round(cv.getBoundingClientRect().width) === lastW) return;
        build(); lastW = W; if (reduce) still();
      }, 200);
    });
    if (reduce) { still(); return; }
    if ("IntersectionObserver" in window)
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(cv);
    else start();
    document.addEventListener("visibilitychange", function () { !document.hidden && visible ? start() : stop(); });
  });
})();
