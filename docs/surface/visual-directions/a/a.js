/* Direction A — Investigative Cinematic.
 *
 * Composition only. Every string comes from window.IMBAS_FIXTURE through the kit.
 *
 * The seven decisions this direction makes:
 *   source            follows the masthead as a full-width stage, one column, no rail
 *   findings voice    sequential — the mark opens in place, directly under the block it sits in
 *   anchor modes      span: ember rule under the characters, numeral drawn in the margin of the line
 *                     region: the region keeps its light while the rest of the block steps down
 *                     absence: a full-bleed band after the source column has closed
 *   first viewport    the masthead alone, at display scale
 *   density           the register entry expands in place onto a labelled field rail
 *   mobile            the same descent, narrower; the detail panel stays in place
 *   forwarded         the forwarded line joins the masthead composition as its first line
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;
  var p = K.boot("a");
  var rec = K.record(p.record);
  var main = document.getElementById("record");

  function section(cls, zone, kids) {
    return el("section", { class: cls, "data-zone-group": zone }, kids);
  }

  /* ── Z1 · masthead, and Z2 at the foot of the same viewport ─────────────── */

  var mast = el("header", { class: "a-mast" });
  if (p.forwarded) {
    mast.appendChild(
      K.forwarded({ root: "a-fwd", heading: "a-fwd-h", body: "a-fwd-b", action: "a-fwd-a" }),
    );
  }
  var mastLeaves = K.masthead(rec, {
    label: "a-class",
    context: "a-context",
    address: "a-address",
    addressItem: "a-addr-item",
    addressLabel: "a-addr-label",
    addressValue: "a-addr-value",
    finding: "a-finding",
    boundary: "a-boundary",
  });
  var mastTop = el("div", { class: "a-mast-top" }, mastLeaves.slice(0, 3));
  var mastBody = el("div", { class: "a-mast-body" }, mastLeaves.slice(3));
  mast.appendChild(mastTop);
  mast.appendChild(mastBody);

  var scopeLeaves = K.scope(rec, { count: "a-count", census: "a-census", rule: "a-count-rule", orient: "a-orient" });
  var orient = el("div", { class: "a-orient-wrap" }, [
    scopeLeaves.orient,
    el("button", { class: "a-dismiss", type: "button", text: F.ui.z2.orientation_dismiss, "data-dismiss": "orient" }),
  ]);
  /* Census sits directly under the count and above the rule. A's masthead foot reads
   * as one descending statement, and the sentence saying where the marks sit belongs
   * with the number itself, not after the instruction about the number. */
  mast.appendChild(el("div", { class: "a-mast-foot" }, [scopeLeaves.count, scopeLeaves.census, scopeLeaves.rule, orient]));
  main.appendChild(mast);

  /* ── Z5.6 · applied checks · A's answer to the placement question ───────────
   *
   * A reads in sequence and stages one beat at a time, so the register's operation
   * is placed as a beat rather than as apparatus: claim, boundary, what was applied,
   * then the answer itself. An investigative piece establishes its method before it
   * produces the exhibit, and a reader who meets nine marks without first knowing
   * that the same three checks read every record has been handed a story instead of
   * a record.
   *
   * The cost is real, it is A's to carry, and it is larger than the first draft of
   * this comment claimed. Measured against the pre-Z5.6 build (build/stress.mjs),
   * this moves A's first proof from 1229px to 1951px at 1440, and from 1036px to
   * 1975px at 390: +722 desktop, +939 mobile. Claim-to-proof goes from 0.90 screens
   * to 1.62 at 1440, and from 0.99 to 2.10 at 390. A already had the longest distance
   * from first claim to first inspectable thing, and this roughly doubles it.
   *
   * Nothing of the zone is in A's first screen either — the census line closes at
   * 1086px against a 1000px fold — so the early placement buys A no never-scrolled
   * reading. What it buys is sequence, and only sequence: no reader reaches A's marks
   * without having passed the checks that produced them. A pays that price because
   * A's proposition is that the reader is carried rather than navigating, and a
   * carried reader who reaches the source unprepared is worse off than one who
   * reaches it later. That is a bet. The numbers above are what the bet costs, and
   * they are the reason this placement is put to the founder rather than settled here.
   *
   * Set as prose, full width, in the record's own voice — not a panel. A panel here
   * would be the first thing on the page that looked like an instrument readout, and
   * it would be sitting above the evidence.
   */
  var applied = section("a-applied", "Z5");
  applied.appendChild(
    K.appliedChecks(rec, {
      root: "a-applied-in", heading: "a-applied-h", census: "a-applied-census",
      note: "a-applied-note", shared: "a-applied-cond", row: "a-applied-row",
      name: "a-applied-name", outcome: "a-applied-out", cond: "a-applied-rowcond",
      condLabel: "a-applied-condlabel", detector: "a-applied-det",
      detectorLabel: "a-applied-detlabel", detectorValue: "a-applied-detval",
    }),
  );
  main.appendChild(applied);

  /* ── Z3 · source ─────────────────────────────────────────────────────────── */

  var src = section("a-source", "Z3");
  src.appendChild(
    el("div", { class: "a-prompt", zone: "Z3.1" }, [
      el("p", { class: "a-lede-label", text: rec.prompt_label }),
      el("p", { class: "a-prompt-text", text: rec.prompt, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.question" : null }),
    ]),
  );

  if (rec.expectation_artifact) {
    src.appendChild(
      el("div", { class: "a-expect", zone: "Z3.2" }, [
        el("p", { class: "a-lede-label", text: rec.expectation_artifact.label }),
        el("pre", { class: "a-expect-text", text: rec.expectation_artifact.text }),
        el("p", { class: "a-disclosure", text: rec.expectation_artifact.disclosure }),
      ]),
    );
  }

  src.appendChild(el("p", { class: "a-lede-label a-source-label", zone: "Z3.3", text: rec.source.label }));

  var body = el("div", { class: "a-body", zone: "Z3.4", "data-source-body": "true" });
  var panels = {};

  function panel(mark) {
    var wrap = el("div", {
      class: "a-detail",
      zone: "Z4.4",
      id: "mark-" + mark.n,
      "data-mark": String(mark.n),
      role: "region",
      "aria-label": F.ui.z4.open_label,
      hidden: "hidden",
    });
    wrap.appendChild(el("p", { class: "a-detail-n", text: String(mark.n) }));
    var col = el("div", { class: "a-detail-col" });
    col.appendChild(el("p", { class: "a-detail-points", text: mark.points_at }));
    col.appendChild(el("p", { class: "a-detail-mode", text: mark.mode_meaning }));
    if (mark.declared) col.appendChild(el("p", { class: "a-detail-declared", text: mark.declared }));
    if (mark.observed) col.appendChild(el("p", { class: "a-detail-quote", text: mark.observed, gov: "PUBLIC_EXAMPLE.surfaced" }));
    if (mark.materiality) col.appendChild(el("p", { class: "a-detail-body", text: mark.materiality, gov: "PUBLIC_EXAMPLE.why_it_mattered" }));
    if (mark.expectation_quote) col.appendChild(el("p", { class: "a-detail-quote", text: mark.expectation_quote }));
    if (mark.connect) col.appendChild(el("p", { class: "a-detail-body", text: mark.connect }));
    col.appendChild(
      el("p", { class: "a-detail-ask" }, [
        el("span", { class: "a-detail-ask-label", text: F.ui.z5.field_worth_asking }),
        K.txt(" "),
        el("span", { text: mark.worth_asking }),
      ]),
    );
    col.appendChild(el("button", { class: "a-detail-close", type: "button", text: F.ui.z4.close_label, "data-mark-close": String(mark.n) }));
    wrap.appendChild(col);
    panels[mark.n] = wrap;
    return wrap;
  }

  rec.marks.forEach(panel);

  function treat(seg) {
    return el(seg.mode === F.anchor_mode.QUOTED_SPAN ? "span" : "span", {
      class: seg.mode === F.anchor_mode.QUOTED_SPAN ? "a-span" : "a-region",
      text: seg.text,
    });
  }

  K.model(rec).forEach(function (block) {
    if (block.type === "filename") {
      body.appendChild(el("p", { class: "a-filename", "data-block": String(block.index), text: block.lines[0].segments[0].text }));
      return;
    }
    if (block.type === "code") {
      var pre = el("pre", { class: "a-code", "data-block": String(block.index) });
      // A region in code is a run of whole lines. It is drawn as one bracket around
      // the run, not as a highlight repeated line by line.
      var groups = [];
      block.lines.forEach(function (line) {
        var r = line.segments.filter(function (s) { return s.mode === F.anchor_mode.PASSAGE_CONTEXT; })[0];
        var key = r ? r.mark : null;
        if (!groups.length || groups[groups.length - 1].mark !== key) groups.push({ mark: key, lines: [] });
        groups[groups.length - 1].lines.push(line);
      });
      var wrote = 0;
      groups.forEach(function (g) {
        var host = g.mark
          ? el("span", { class: "a-code-region", "data-region": String(g.mark) })
          : el("span", { class: "a-code-plain" });
        g.lines.forEach(function (line, i) {
          if (wrote > 0) (i === 0 ? pre : host).appendChild(K.txt("\n"));
          host.appendChild(K.renderLine(line, treat));
          wrote += 1;
        });
        pre.appendChild(host);
      });
      body.appendChild(pre);
      appendPanels(body, block);
      return;
    }
    var para = el("p", { class: "a-para", "data-block": String(block.index) });
    para.appendChild(K.renderLine(block.lines[0], treat));
    body.appendChild(para);
    appendPanels(body, block);
  });

  function appendPanels(container, block) {
    var seen = {};
    block.lines.forEach(function (line) {
      line.marks.forEach(function (n) {
        if (seen[n]) return;
        seen[n] = true;
        container.appendChild(panels[n]);
      });
    });
  }

  src.appendChild(body);

  if (rec.second_artifact) {
    src.appendChild(
      el("div", { class: "a-second", zone: "Z3.5" }, [
        el("p", { class: "a-lede-label", text: rec.second_artifact.label }),
        el("p", { class: "a-second-text", text: rec.second_artifact.prompt, gov: "PUBLIC_EXAMPLE.targeted_prompt" }),
      ]),
    );
  }

  if (rec.capture_shape) {
    src.appendChild(
      el("div", { class: "a-shape", zone: "Z3.6" }, [
        el("p", { class: "a-lede-label", text: rec.capture_shape.heading }),
        el("p", { class: "a-shape-body", text: rec.capture_shape.body }),
      ]),
    );
  }
  main.appendChild(src);

  /* ── Z4.2 · the record-level band ────────────────────────────────────────────
   * Full bleed, after the source column has closed. There is no margin here to
   * put a mark in, which is the point.
   */

  if (rec.record_level_marks.length) {
    var band = el("section", { class: "a-band", "data-zone-group": "Z4", zone: "Z4.2", "data-absence": "true" });
    var inner = el("div", { class: "a-band-inner" });
    inner.appendChild(el("p", { class: "a-band-label", text: F.ui.z4.record_level_heading }));
    inner.appendChild(el("p", { class: "a-band-rule", zone: "Z4.3", text: F.ui.z4.record_level_rule }));
    inner.appendChild(el("p", { class: "a-band-note", text: F.ui.z4.record_level_note }));
    rec.record_level_marks.forEach(function (n) {
      var m = rec.marks[n - 1];
      inner.appendChild(
        el("div", {
          class: "a-band-row",
          "data-mark-trigger": String(n),
          "data-anchor-mode": m.anchor_mode,
          "data-channel": m.channel,
          tabindex: "0",
          role: "button",
          "aria-expanded": "false",
          "aria-controls": "mark-" + n,
        }, [
          el("span", { class: "a-band-n", text: String(n) }),
          el("span", { class: "a-band-text", text: m.points_at }),
        ]),
      );
      inner.appendChild(panels[n]);
    });
    band.appendChild(inner);
    main.appendChild(band);
  }

  /* ── Z5 · Check Register ─────────────────────────────────────────────────── */

  var reg = section("a-register", "Z5");
  reg.appendChild(el("h2", { class: "a-reg-h", zone: "Z5.1", text: F.ui.z5.heading }));
  reg.appendChild(el("p", { class: "a-reg-note", zone: "Z5.2", text: F.ui.z5.note }));

  var dens = el("div", { class: "a-density", zone: "Z5.4", role: "group", "aria-label": F.ui.z5.density_label }, [
    el("span", { class: "a-density-label", text: F.ui.z5.density_label }),
    el("button", { class: "a-density-btn", type: "button", "data-set-density": "consumer", "aria-pressed": "false", text: F.ui.z5.density_consumer }),
    el("button", { class: "a-density-btn", type: "button", "data-set-density": "professional", "aria-pressed": "false", text: F.ui.z5.density_professional }),
    el("span", { class: "a-density-note a-density-note-consumer", text: F.ui.z5.density_consumer_note }),
    el("span", { class: "a-density-note a-density-note-pro", text: F.ui.z5.density_professional_note }),
  ]);
  reg.appendChild(dens);

  var entries = el("ol", { class: "a-entries" });
  rec.marks.forEach(function (m) {
    var li = el("li", { class: "a-entry", zone: "Z5.3", "data-register-entry": String(m.n) });
    li.appendChild(el("span", { class: "a-entry-n", text: String(m.n) }));
    var col = el("div", { class: "a-entry-col" });
    ["consumer", "professional"].forEach(function (d) {
      var group = el("div", { class: "a-entry-fields", "data-fields": d });
      K.fields(rec, m, d).forEach(function (row) {
        group.appendChild(
          el("div", { class: "a-field" + (row.lead ? " a-field-lead" : "") + (row.ask ? " a-field-ask" : ""), "data-field": row.key }, [
            el("span", { class: "a-field-label", text: row.label }),
            el("span", { class: "a-field-body" + (row.quoted ? " a-field-quoted" : "") + (row.mono ? " a-field-mono" : ""), text: row.text, gov: rec.id === "montana" ? row.gov : null }),
          ]),
        );
      });
      col.appendChild(group);
    });
    col.appendChild(
      el("button", { class: "a-entry-jump", type: "button", "data-mark-trigger": String(m.n), "aria-expanded": "false", "aria-controls": "mark-" + m.n, text: m.in_document ? F.ui.z4.jump_to_source : F.ui.z4.open_label }),
    );
    li.appendChild(col);
    entries.appendChild(li);
  });
  reg.appendChild(entries);
  reg.appendChild(el("div", { class: "a-reg-close", zone: "Z5.5" }, K.registerClose(rec, { row: "a-close-row", label: "a-close-label", body: "a-close-body" })));
  main.appendChild(reg);

  /* ── Z6 · provenance ─────────────────────────────────────────────────────── */

  main.appendChild(
    section("a-prov", "Z6", K.provenance(rec, {
      heading: "a-prov-h", row: "a-prov-row", label: "a-prov-label", body: "a-prov-body",
      ids: "a-ids", idItem: "a-id-item", idLabel: "a-id-label", idValue: "a-id-value",
    })),
  );

  /* ── Z7 · foot ───────────────────────────────────────────────────────────── */

  var foot = section("a-foot", "Z7", K.foot(rec, { row: "a-foot-row", label: "a-foot-label", body: "a-foot-body", cite: "a-foot-cite" }));
  foot.appendChild(el("p", { class: "a-lane", text: F.ui.nav.lane_tag }));
  main.appendChild(foot);

  /* ── behaviour ───────────────────────────────────────────────────────────── */

  K.wire(document);
  K.wireDensity(document, K.setDensity);
  K.onOpen(function (n) {
    rec.marks.forEach(function (m) {
      panels[m.n].hidden = m.n !== n;
    });
  });
  K.wireDismiss(document);

  K.afterBoot(p, rec);
})();
