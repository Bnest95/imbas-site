/* Direction C — Forensic Manuscript.
 *
 * Composition only. Every string comes from window.IMBAS_FIXTURE through the kit.
 *
 * The seven decisions this direction makes:
 *   source            an exhibit — an inset bordered plate with a pointing gutter, set
 *                     mid-page, reached only after the record's own docket
 *   findings voice    an apparatus below the plate. Nothing but a reference numeral ever
 *                     touches the document; the reading happens off it
 *   anchor modes      span: a fine dotted underline on the characters and a raised numeral
 *                     region (prose): a hairline outline drawn around the run
 *                     region (code): a bracket in the gutter, spanning the region's lines
 *                     absence: a second plate with no gutter — a plate that cannot point
 *   first viewport    a ruled docket table. No display type anywhere; the finding sentence
 *                     is a row in the table like every other fact about the record
 *   density           the register changes container: plain keeps the plate's measure and
 *                     drops every rule, full breaks out to a wide ruled ledger
 *   mobile            the plate keeps a narrower gutter; docket and ledger stack to lists
 *   forwarded         one more ruled row stamped into the docket, formally identical to
 *                     the rest, because for this direction it is one more fact of filing
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;
  var p = K.boot("c");
  var rec = K.record(p.record);
  var main = document.getElementById("record");

  /* ── Z1/Z2/Z7.4 · the docket ──────────────────────────────────────────────────
   * One ruled margin runs down the whole record: the docket has it, the plate has it,
   * the apparatus has it. In the plate it is where a mark can point; everywhere else
   * it is simply the page's margin, standing empty. Each fact is a row against it,
   * and a row takes a label only where the fixture already carries one.
   */

  function row(label, value, cls) {
    var kids = Array.isArray(value) ? value.slice() : [value];
    if (label) kids.unshift(el("p", { class: "c-label", text: label }));
    return el("div", { class: "c-dk-row" + (cls ? " " + cls : "") }, [
      el("div", { class: "c-margin" }),
      el("div", { class: "c-dk-val" }, kids),
    ]);
  }

  var docket = el("section", { class: "c-docket", "data-zone-group": "Z1" });
  var dk = el("div", { class: "c-dk" });

  if (p.forwarded) {
    var fwd = K.forwarded({ root: "c-fwd", heading: "c-fwd-h", body: "c-fwd-b", action: "c-fwd-a" });
    dk.appendChild(row(null, fwd, "c-dk-row-fwd"));
  }

  var mast = K.masthead(rec, {
    label: "c-class",
    context: "c-context",
    address: "c-address",
    addressItem: "c-addr-item",
    addressLabel: "c-addr-label",
    addressValue: "c-addr-value",
    finding: "c-finding",
    boundary: "c-boundary",
  });

  dk.appendChild(row(null, mast[0], "c-dk-row-class"));
  dk.appendChild(row(null, mast[2], "c-dk-row-addr"));
  dk.appendChild(row(null, mast[3], "c-dk-row-finding"));
  dk.appendChild(row(null, mast[1], "c-dk-row-context"));
  dk.appendChild(row(F.ui.z1.boundary_label, mast[4], "c-dk-row-boundary"));

  var sc = K.scope(rec, { count: "c-count", census: "c-census", rule: "c-count-rule", orient: "c-orient" });
  var scopeTable = el("div", { class: "c-dk c-dk-scope", "data-zone-group": "Z2" });
  scopeTable.appendChild(row(null, [sc.count, sc.rule], "c-dk-row-count"));
  /* C is a ruled docket, so the census earns its own row rather than being tucked
   * under the count. The row label stays empty: the sentence already opens with
   * "Where they sit:", and all three directions carry that one string byte-identical,
   * so labelling the row would have printed the lead twice in this direction only. */
  scopeTable.appendChild(row(null, [sc.census], "c-dk-row-census"));
  scopeTable.appendChild(
    row(null, [sc.orient, el("button", { class: "c-dismiss", type: "button", text: F.ui.z2.orientation_dismiss, "data-dismiss": "orient" })], "c-dk-row-orient"),
  );

  /* ── Z5.6 · applied checks · C's answer to the placement question ───────────
   *
   * C is a docket, and a docket's front matter is the caption: the particulars that
   * identify the record before its body begins. What was applied to the artifact is
   * such a particular. A caption that listed the marks but not the checks that
   * produced them would be an incomplete caption, and C is the direction with the
   * least room to be incomplete — the whole register of the thing is formality.
   *
   * So it goes in the docket, as ruled rows, at the top. What that actually delivers,
   * measured rather than asserted: at 1440 the census line closes at 809px against a
   * 1000px fold, so C is the one direction where a reader who never scrolls has read
   * that three checks ran and how many produced findings. The rows are not in that
   * screen — the first outcome line closes at 1067px — and at 390 none of the zone is,
   * the census closing at 1024px against an 844px fold. So the first-screen gain is
   * the census sentence, on desktop, and nothing beyond it.
   *
   * The discipline that keeps this from becoming a panel: it is set in the same
   * ruled row grammar as the count, the census and the orientation, with the same
   * label column and the same rules. It gains no border of its own, no ground of its
   * own, and no ember. A docket row is what the front matter already is, so a fourth
   * row-group reads as more caption rather than as an instrument readout.
   *
   * The cost, measured against the pre-Z5.6 build: C's first proof moves from 939px
   * to 1672px at 1440, and from 1188px to 2069px at 390 — +733 desktop, +881 mobile.
   * That spends the one credential the S6 pass gave C. C was the only direction whose
   * Deposit and Furnace both put proof inside the first screen at 1440, at 0.76
   * screens each; neither does now, at 1.50 each. C's front matter also now runs four
   * row-groups before the source, which is the most formal opening of the three and
   * the least inviting to a reader who arrived by accident. Put to the founder with
   * A's, for the same reason: the trade is real and it is his to rule on.
   */
  var appliedTable = el("div", { class: "c-dk c-dk-applied", "data-zone-group": "Z5" });
  appliedTable.appendChild(
    K.appliedChecks(rec, {
      root: "c-applied", heading: "c-applied-h", census: "c-applied-census",
      note: "c-applied-note", shared: "c-applied-cond", row: "c-applied-row",
      name: "c-applied-name", outcome: "c-applied-out", cond: "c-applied-rowcond",
      condLabel: "c-applied-condlabel", detector: "c-applied-det",
      detectorLabel: "c-applied-detlabel", detectorValue: "c-applied-detval",
    }),
  );

  docket.appendChild(el("div", { class: "c-wrap" }, [dk, scopeTable, appliedTable]));
  main.appendChild(docket);

  /* ── Z3 + Z4.1 · the exhibit plate ────────────────────────────────────────────
   * The plate has two columns: a gutter that points, and the answer. Only the gutter
   * and a raised numeral are allowed to touch the answer.
   */

  var exhibit = el("section", { class: "c-exhibit", "data-zone-group": "Z3" });
  var plate = el("div", { class: "c-plate" });

  plate.appendChild(
    el("div", { class: "c-plate-row c-plate-meta", zone: "Z3.1" }, [
      el("div", { class: "c-gutter" }),
      el("div", { class: "c-face" }, [
        el("p", { class: "c-label", text: rec.prompt_label }),
        el("p", { class: "c-prompt", text: rec.prompt, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.question" : null }),
      ]),
    ]),
  );

  if (rec.expectation_artifact) {
    plate.appendChild(
      el("div", { class: "c-plate-row c-plate-meta", zone: "Z3.2" }, [
        el("div", { class: "c-gutter" }),
        el("div", { class: "c-face" }, [
          el("p", { class: "c-label", text: rec.expectation_artifact.label }),
          el("pre", { class: "c-expect", text: rec.expectation_artifact.text }),
          el("p", { class: "c-disclosure", text: rec.expectation_artifact.disclosure }),
        ]),
      ]),
    );
  }

  plate.appendChild(
    el("div", { class: "c-plate-row c-plate-srclabel", zone: "Z3.3" }, [
      el("div", { class: "c-gutter" }),
      el("div", { class: "c-face" }, [el("p", { class: "c-label", text: rec.source.label })]),
    ]),
  );

  function treat(seg) {
    return el("span", {
      class: seg.mode === F.anchor_mode.QUOTED_SPAN ? "c-span" : "c-region",
      text: seg.text,
    });
  }

  var body = el("div", { class: "c-body", zone: "Z3.4", "data-source-body": "true" });

  K.model(rec).forEach(function (block) {
    var line = el("div", { class: "c-plate-row c-src-row" });
    var gutter = el("div", { class: "c-gutter" });
    var face = el("div", { class: "c-face" });

    if (block.type === "filename") {
      face.appendChild(el("p", { class: "c-filename", "data-block": String(block.index), text: block.lines[0].segments[0].text }));
    } else if (block.type === "code") {
      var pre = el("pre", { class: "c-code", "data-block": String(block.index) });
      var groups = [];
      block.lines.forEach(function (l) {
        var r = l.segments.filter(function (s) { return s.mode === F.anchor_mode.PASSAGE_CONTEXT; })[0];
        var key = r ? r.mark : null;
        if (!groups.length || groups[groups.length - 1].mark !== key) groups.push({ mark: key, lines: [] });
        groups[groups.length - 1].lines.push(l);
      });
      var wrote = 0;
      groups.forEach(function (g) {
        var host = g.mark
          ? el("span", { class: "c-code-region", "data-region": String(g.mark) })
          : el("span", { class: "c-code-plain" });
        g.lines.forEach(function (l, i) {
          if (wrote > 0) (i === 0 ? pre : host).appendChild(K.txt("\n"));
          host.appendChild(K.renderLine(l, treat));
          wrote += 1;
        });
        pre.appendChild(host);
      });
      face.appendChild(pre);
    } else {
      var para = el("p", { class: "c-para", "data-block": String(block.index) });
      para.appendChild(K.renderLine(block.lines[0], treat));
      face.appendChild(para);
    }

    line.appendChild(gutter);
    line.appendChild(face);
    body.appendChild(line);
  });

  plate.appendChild(body);

  if (rec.second_artifact) {
    plate.appendChild(
      el("div", { class: "c-plate-row c-plate-meta", zone: "Z3.5" }, [
        el("div", { class: "c-gutter" }),
        el("div", { class: "c-face" }, [
          el("p", { class: "c-label", text: rec.second_artifact.label }),
          el("p", { class: "c-second", text: rec.second_artifact.prompt, gov: "PUBLIC_EXAMPLE.targeted_prompt" }),
        ]),
      ]),
    );
  }

  if (rec.capture_shape) {
    plate.appendChild(
      el("div", { class: "c-plate-row c-plate-meta", zone: "Z3.6" }, [
        el("div", { class: "c-gutter" }),
        el("div", { class: "c-face" }, [
          el("p", { class: "c-label", text: rec.capture_shape.heading }),
          el("p", { class: "c-shape", text: rec.capture_shape.body }),
        ]),
      ]),
    );
  }

  exhibit.appendChild(el("div", { class: "c-wrap" }, [plate]));
  main.appendChild(exhibit);

  /* ── Z4.4 · the apparatus ─────────────────────────────────────────────────────
   * One line per mark, under the plate, in mark order. Opening a mark opens the
   * entry's own ruled sub-table. The document above never changes shape.
   */

  function entryFor(mark) {
    var wrap = el("div", {
      class: "c-app-entry",
      zone: "Z4.4",
      id: "mark-" + mark.n,
      "data-mark": String(mark.n),
      role: "region",
      "aria-label": F.ui.z4.open_label,
    });
    wrap.appendChild(
      el("button", {
        class: "c-app-head",
        type: "button",
        "data-mark-trigger": String(mark.n),
        "aria-expanded": "false",
        "aria-controls": "mark-" + mark.n,
      }, [
        el("span", { class: "c-app-n", text: String(mark.n) }),
        el("span", { class: "c-app-points", text: mark.points_at }),
      ]),
    );

    var open = el("div", { class: "c-app-open" });
    /* The field key is stamped as data-field, the same key the register entry carries
     * for the same fact, because the plate and the register are two views of one mark.
     * The plate assembles its rows by hand rather than through K.fields — it opens
     * inside the exhibit and takes a different order — and while it did not carry the
     * attribute, C was the one direction whose in-plate quote could not be told from
     * C's own writing by anything reading the record's own attributes. The gate found
     * it: the counting rule fired on the artifact's words here and nowhere else. */
    function detail(key, label, value, kind, gov) {
      open.appendChild(
        el("div", { class: "c-app-row" + (kind ? " c-app-row-" + kind : ""), "data-field": key }, [
          el("div", { class: "c-app-key" }, [el("span", { class: "c-app-key-text", text: label })]),
          el("div", { class: "c-app-val" }, [
            el("span", { class: "c-app-val-text" + (kind === "quote" ? " c-quoted" : ""), text: value, gov: gov || null }),
          ]),
        ]),
      );
    }
    detail("anchor_mode", F.ui.z4.mode_label, mark.mode_meaning);
    if (mark.quote) detail("quote", F.ui.z5.field_quote, mark.quote, "quote");
    if (mark.region_start) detail("region", F.ui.z5.field_region, mark.region_start + " … " + mark.region_end, "quote");
    if (mark.declared) detail("declared", F.ui.z4.record_level_rule, mark.declared);
    if (mark.expectation_quote) detail("expectation", F.ui.z5.field_expectation, mark.expectation_quote, "quote");
    if (mark.observed) {
      detail("observed", F.ui.z5.field_observed, mark.observed, "quote", rec.id === "montana" ? "PUBLIC_EXAMPLE.surfaced" : null);
    }
    if (mark.materiality) {
      detail("materiality", F.ui.z5.field_materiality, mark.materiality, null, rec.id === "montana" ? "PUBLIC_EXAMPLE.why_it_mattered" : null);
    }
    if (mark.connect) detail("connect", F.ui.z5.field_connect, mark.connect);
    detail("worth_asking", F.ui.z5.field_worth_asking, mark.worth_asking, "ask");
    open.appendChild(
      el("button", { class: "c-app-close", type: "button", text: F.ui.z4.close_label, "data-mark-close": String(mark.n) }),
    );
    wrap.appendChild(open);
    return wrap;
  }

  var app = el("section", { class: "c-apparatus", "data-zone-group": "Z4" });
  var appInner = el("div", { class: "c-wrap" });
  var appList = el("div", { class: "c-app-list" });
  rec.in_document_marks.forEach(function (n) { appList.appendChild(entryFor(rec.marks[n - 1])); });
  if (rec.in_document_marks.length) appInner.appendChild(appList);

  /* ── Z4.2 · the plate that cannot point ───────────────────────────────────────
   * A second plate, below the first, drawn without a gutter. In this direction the
   * gutter is the only thing that points at a place, so its absence is the statement.
   */
  if (rec.record_level_marks.length) {
    var out = el("div", { class: "c-nogutter", zone: "Z4.2", "data-absence": "true" });
    out.appendChild(el("p", { class: "c-nogutter-label", text: F.ui.z4.record_level_heading }));
    out.appendChild(el("p", { class: "c-nogutter-rule", zone: "Z4.3", text: F.ui.z4.record_level_rule }));
    out.appendChild(el("p", { class: "c-nogutter-note", text: F.ui.z4.record_level_note }));
    var outList = el("div", { class: "c-app-list c-app-list-outside" });
    rec.record_level_marks.forEach(function (n) { outList.appendChild(entryFor(rec.marks[n - 1])); });
    out.appendChild(outList);
    appInner.appendChild(out);
  }
  app.appendChild(appInner);
  main.appendChild(app);

  /* ── Z5 · Check Register ──────────────────────────────────────────────────────
   * Plain keeps the plate's measure and drops every rule. Full leaves that measure
   * and becomes a wide ruled ledger. The entries are the same entries either way.
   */

  var reg = el("section", { class: "c-register", "data-zone-group": "Z5" });
  var regWrap = el("div", { class: "c-reg-wrap" });
  regWrap.appendChild(
    el("div", { class: "c-reg-head" }, [
      el("h2", { class: "c-reg-h", zone: "Z5.1", text: F.ui.z5.heading }),
      el("p", { class: "c-reg-note", zone: "Z5.2", text: F.ui.z5.note }),
      el("div", { class: "c-density", zone: "Z5.4", role: "group", "aria-label": F.ui.z5.density_label }, [
        el("span", { class: "c-density-label", text: F.ui.z5.density_label }),
        el("div", { class: "c-density-set" }, [
          el("button", { class: "c-density-btn", type: "button", "data-set-density": "consumer", "aria-pressed": "false", text: F.ui.z5.density_consumer }),
          el("button", { class: "c-density-btn", type: "button", "data-set-density": "professional", "aria-pressed": "false", text: F.ui.z5.density_professional }),
        ]),
        el("p", { class: "c-density-note c-density-note-consumer", text: F.ui.z5.density_consumer_note }),
        el("p", { class: "c-density-note c-density-note-pro", text: F.ui.z5.density_professional_note }),
      ]),
    ]),
  );

  var ledger = el("div", { class: "c-ledger" });
  rec.marks.forEach(function (m) {
    var entry = el("div", { class: "c-led-entry", zone: "Z5.3", "data-register-entry": String(m.n) });
    entry.appendChild(
      el("div", { class: "c-led-rowhead" }, [
        el("span", { class: "c-led-n", text: String(m.n) }),
        el("button", {
          class: "c-led-jump", type: "button", "data-mark-trigger": String(m.n),
          "aria-expanded": "false", "aria-controls": "mark-" + m.n,
          text: m.in_document ? F.ui.z4.jump_to_source : F.ui.z4.open_label,
        }),
      ]),
    );
    var cols = el("div", { class: "c-led-cols" });
    ["consumer", "professional"].forEach(function (d) {
      var group = el("div", { class: "c-led-fields", "data-fields": d });
      K.fields(rec, m, d).forEach(function (r) {
        group.appendChild(
          el("div", { class: "c-led-row" + (r.lead ? " c-led-row-lead" : "") + (r.ask ? " c-led-row-ask" : ""), "data-field": r.key }, [
            el("div", { class: "c-led-key" }, [el("span", { class: "c-led-key-text", text: r.label })]),
            el("div", { class: "c-led-val" }, [
              el("span", {
                class: "c-led-val-text" + (r.quoted ? " c-quoted" : "") + (r.mono ? " c-mono" : ""),
                text: r.text,
                gov: rec.id === "montana" ? r.gov : null,
              }),
            ]),
          ]),
        );
      });
      cols.appendChild(group);
    });
    entry.appendChild(cols);
    ledger.appendChild(entry);
  });
  regWrap.appendChild(ledger);
  regWrap.appendChild(
    el("div", { class: "c-reg-close", zone: "Z5.5" }, K.registerClose(rec, { row: "c-close-row", label: "c-close-label", body: "c-close-body" })),
  );
  reg.appendChild(regWrap);
  main.appendChild(reg);

  /* ── Z6 · provenance, Z7 · foot ──────────────────────────────────────────── */

  var prov = el("section", { class: "c-prov", "data-zone-group": "Z6" });
  prov.appendChild(el("div", { class: "c-wrap" }, K.provenance(rec, {
    heading: "c-prov-h", row: "c-prov-row", label: "c-prov-label", body: "c-prov-body",
    ids: "c-ids", idItem: "c-id-item", idLabel: "c-id-label", idValue: "c-id-value",
  })));
  main.appendChild(prov);

  var foot = el("footer", { class: "c-foot", "data-zone-group": "Z7" });
  var footInner = el("div", { class: "c-wrap" }, K.foot(rec, { row: "c-foot-row", label: "c-foot-label", body: "c-foot-body", cite: "c-foot-cite" }));
  footInner.appendChild(el("p", { class: "c-lane", text: F.ui.nav.lane_tag }));
  foot.appendChild(footInner);
  main.appendChild(foot);

  /* ── behaviour ───────────────────────────────────────────────────────────── */

  K.wire(document);
  K.wireDensity(document, K.setDensity);
  K.wireDismiss(document);

  K.afterBoot(p, rec);
})();
