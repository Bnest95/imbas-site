/* The founder comparison surface.
 *
 * One selection drives all three panes. The controls are the axes the brief named:
 * screen, record or entry state, expanded finding, density, viewport and motion.
 * Everything here is a label, a path, or a control. No commentary, no ordering that
 * implies a preference, no fourth thing on the page.
 *
 * Two modes, because they answer different questions and neither one answers both.
 *   live   — the real page in the real viewport, so sticky, 100vh and every
 *            interaction behave exactly as they do standalone. Panes scroll on
 *            their own, since a file:// frame cannot be reached from its parent.
 *   frames — the captured full-page images, scroll-synchronised, so the whole
 *            record can be walked down at the same place in all three.
 */
(function () {
  "use strict";

  var D = window.IMBAS_FRAMES;
  var VP = { desktop: { w: 1440, h: 1000 }, mobile: { w: 390, h: 844 } };

  var NAME = { a: "Investigative Cinematic", b: "Editorial Instrument", c: "Forensic Manuscript" };

  var SUBJECT_LABEL = {
    empty: "nothing to paste",
    answer: "answer in hand",
    shared: "arriving shared",
    montana: "Montana · governed packet",
    furnace: "Furnace · one capture",
    website: "Website · adherence",
    deposit: "Deposit · nine marks",
  };

  var STATE_LABEL = {
    default: "as it opens",
    "open-2": "mark 2 expanded",
    "density-consumer": "register · plain",
    "density-professional": "register · full",
    forwarded: "forwarded cold",
  };

  var sel = {
    screen: "record",
    subject: "montana",
    state: "default",
    viewport: "desktop",
    motion: "ordinary",
    mode: "live",
    zoom: "fit",
  };

  /* ── helpers ──────────────────────────────────────────────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) { n.appendChild(k); });
    return n;
  }

  function key(dir) {
    return [dir, sel.screen, sel.subject, sel.viewport, sel.state, sel.motion].join("__");
  }

  /* Which rows of the matrix are reachable from the current screen. The controls
   * disable what was never captured rather than hiding it, so the founder can see
   * the whole matrix and see where it stops. */
  function rowsFor(screen) {
    return D.rows.filter(function (r) { return r.screen === screen; });
  }

  function has(patch) {
    var next = Object.assign({}, sel, patch);
    return D.rows.some(function (r) {
      return (
        r.screen === next.screen &&
        r.subject === next.subject &&
        r.state === next.state &&
        r.motion === next.motion &&
        r.views.indexOf(next.viewport) >= 0
      );
    });
  }

  /* Move to the nearest captured selection when a control change lands off the
   * matrix — pick the first row that keeps what was just chosen. */
  function settle(patch) {
    Object.assign(sel, patch);
    if (has({})) return;
    var candidates = rowsFor(sel.screen);
    var keep = Object.keys(patch);
    var best =
      candidates.find(function (r) {
        return keep.every(function (k) { return k === "viewport" ? r.views.indexOf(sel.viewport) >= 0 : r[k] === sel[k]; });
      }) ||
      candidates.find(function (r) { return keep.every(function (k) { return k === "viewport" || r[k] === sel[k]; }); }) ||
      candidates[0];
    sel.subject = best.subject;
    sel.state = best.state;
    sel.motion = best.motion;
    if (best.views.indexOf(sel.viewport) < 0) sel.viewport = best.views[0];
  }

  /* ── control bar ──────────────────────────────────────────────────────────── */

  function group(label, options, field) {
    var kids = [el("span", { text: label })];
    options.forEach(function (o) {
      var patch = {};
      patch[field] = o.value;
      var free = field === "mode" || field === "zoom";
      var b = el("button", {
        type: "button",
        text: o.label,
        "aria-pressed": String(sel[field] === o.value),
      });
      if (!free && field !== "screen" && !has(patch)) b.setAttribute("disabled", "");
      b.addEventListener("click", function () {
        if (free) sel[field] = o.value;
        else settle(patch);
        render();
      });
      kids.push(b);
    });
    return el("div", { class: "cmp-group" }, kids);
  }

  function uniq(list) {
    var seen = [];
    list.forEach(function (v) { if (seen.indexOf(v) < 0) seen.push(v); });
    return seen;
  }

  function bar() {
    var host = document.getElementById("bar");
    host.textContent = "";

    host.appendChild(
      group("screen", [
        { value: "record", label: "record" },
        { value: "entry", label: "reader entry" },
      ], "screen"),
    );

    var subjects = uniq(rowsFor(sel.screen).map(function (r) { return r.subject; }));
    host.appendChild(
      group(sel.screen === "entry" ? "state" : "record", subjects.map(function (s) {
        return { value: s, label: SUBJECT_LABEL[s] || s };
      }), "subject"),
    );

    var states = uniq(
      rowsFor(sel.screen).filter(function (r) { return r.subject === sel.subject; }).map(function (r) { return r.state; }),
    );
    if (states.length > 1 || states[0] !== "default") {
      host.appendChild(
        group("showing", states.map(function (s) { return { value: s, label: STATE_LABEL[s] || s }; }), "state"),
      );
    }

    host.appendChild(
      group("viewport", [
        { value: "desktop", label: "1440" },
        { value: "mobile", label: "390" },
      ], "viewport"),
    );

    host.appendChild(
      group("motion", [
        { value: "ordinary", label: "ordinary" },
        { value: "reduced", label: "reduced" },
      ], "motion"),
    );

    host.appendChild(
      group("mode", [
        { value: "live", label: "live" },
        { value: "frames", label: "frames" },
      ], "mode"),
    );

    host.appendChild(
      group("zoom", [
        { value: "fit", label: "fit" },
        { value: "full", label: "1:1" },
      ], "zoom"),
    );

    host.appendChild(el("p", { class: "cmp-note", text: D.renderer + " · " + Object.keys(D.frames).length + " frames" }));

    /* The stress board lives on its own page because it answers a different question:
     * this board sweeps every screen and state, that one holds six loads still and
     * puts the measured distance under each. A link, not a tab — switching between
     * them should not throw away the selection made here. */
    var link = el("a", { class: "cmp-note cmp-link", href: "stress.html", text: "stress captures · 18 frames →" });
    host.appendChild(link);
  }

  /* ── stage ────────────────────────────────────────────────────────────────── */

  var syncing = false;

  function pane(dir) {
    var name = key(dir);
    var frame = D.frames[name];

    var head = el("div", { class: "cmp-head" }, [
      el("span", { class: "cmp-letter", text: dir.toUpperCase() }),
      el("span", { class: "cmp-name", text: NAME[dir] }),
    ]);
    if (frame) {
      head.appendChild(el("a", { class: "cmp-open", href: frame.url, target: "_blank", rel: "noopener", text: "open" }));
      if (sel.mode === "frames") {
        head.appendChild(el("a", { class: "cmp-open", href: frame.file, target: "_blank", rel: "noopener", text: "png" }));
      }
    }

    var view = el("div", { class: "cmp-view" });
    if (!frame) {
      view.appendChild(el("p", { class: "cmp-miss", text: "not in the capture matrix" }));
      return el("section", { class: "cmp-pane" }, [head, view]);
    }

    var vp = VP[sel.viewport];
    var scaler = el("div", { class: "cmp-scaler" });
    scaler.style.width = vp.w + "px";

    if (sel.mode === "live") {
      var f = el("iframe", { src: frame.url, title: NAME[dir] });
      f.style.width = vp.w + "px";
      f.style.height = vp.h + "px";
      scaler.appendChild(f);
    } else {
      var img = el("img", { src: frame.file, alt: NAME[dir] + " — " + name });
      img.style.width = vp.w + "px";
      scaler.appendChild(img);
      img.addEventListener("load", fit);
      /* Frames carry the whole page, so walking one pane walks all three. */
      view.addEventListener("scroll", function () {
        if (syncing) return;
        syncing = true;
        var span = Math.max(1, view.scrollHeight - view.clientHeight);
        var ratio = view.scrollTop / span;
        [].forEach.call(document.querySelectorAll(".cmp-view"), function (other) {
          if (other !== view) other.scrollTop = ratio * Math.max(0, other.scrollHeight - other.clientHeight);
        });
        requestAnimationFrame(function () { syncing = false; });
      });
    }

    view.appendChild(scaler);
    view.appendChild(el("div", { class: "cmp-shim" }));
    return el("section", { class: "cmp-pane" }, [head, view]);
  }

  /* Each pane holds the real viewport width, so what is on screen is the layout at
   * 1440 or at 390 rather than a narrower layout that would cross a breakpoint. At
   * "fit" the pane is scaled down to the column; at 1:1 it is not scaled at all. */
  function fit() {
    var vp = VP[sel.viewport];
    [].forEach.call(document.querySelectorAll(".cmp-view"), function (view) {
      var scaler = view.querySelector(".cmp-scaler");
      if (!scaler) return;
      var s = sel.zoom === "full" ? 1 : Math.min(1, view.clientWidth / vp.w);
      var kid = scaler.firstChild;
      var h = sel.mode === "live" ? vp.h : kid.naturalWidth ? (kid.naturalHeight / kid.naturalWidth) * vp.w : vp.h;
      scaler.style.transform = "scale(" + s + ")";
      view.querySelector(".cmp-shim").style.height = h * s + "px";
    });
  }

  function render() {
    bar();
    var stage = document.getElementById("stage");
    stage.textContent = "";
    stage.setAttribute("data-zoom", sel.zoom);
    stage.setAttribute("data-viewport", sel.viewport);
    D.directions.forEach(function (d) { stage.appendChild(pane(d)); });
    fit();
    var q = new URLSearchParams(sel);
    history.replaceState(null, "", "index.html?" + q.toString());
  }

  var q = new URLSearchParams(location.search);
  ["screen", "subject", "state", "viewport", "motion", "mode", "zoom"].forEach(function (k) {
    if (q.get(k)) sel[k] = q.get(k);
  });
  if (!has({})) settle({});

  window.addEventListener("resize", fit);
  render();
  document.documentElement.setAttribute("data-ready", "true");
})();
