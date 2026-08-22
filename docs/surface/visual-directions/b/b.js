/* Direction B — Editorial Instrument.
 *
 * Composition only. Every string comes from window.IMBAS_FIXTURE through the kit.
 *
 * The seven decisions this direction makes:
 *   source            a left column running beside a findings rail, both live from the first pixel
 *   findings voice    simultaneous — every in-document mark has a standing entry in the right rail,
 *                     level with the block it anchors to; opening one raises it, it never appears
 *   anchor modes      span: tinted ground on the characters, numeral set in the column gutter
 *                     region: a rule drawn down the gutter for the region's whole height
 *                     absence: a block below both columns, where the rail has already ended
 *   first viewport    the finding, the count, and then the instrument, already working
 *   density           the rail entry grows field rows in place; the column does not move
 *   mobile            the rail dissolves and each entry inlines under the block it belongs to
 *   forwarded         a strip fixed to the top of the viewport, carried the whole way down
 *
 * B is the production chassis as of 2026-08-10 and composes to the reading strata in
 * ANATOMY.md v2: GLANCE, then READ, then INSPECT. A and C are archived evidence and
 * stay on ANATOMY.v1.md. Nothing left this record when the strata arrived — every
 * zone is in the document at full text in every state, which invariant 11 proves by
 * opening every disclosure and comparing the zone set and the text against the closed
 * page.
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;
  var p = K.boot("b");
  var rec = K.record(p.record);
  var main = document.getElementById("record");

  /* ── Z1/Z2 · GLANCE, and the rest of the masthead in INSPECT ────────────────
   *
   * This header used to render eleven things above the question, and a forwarded one
   * rendered fourteen. Measured on the pre-strata build: twelve rendered text blocks
   * between the top of the page and the question at 1440, fifteen forwarded, and at
   * 390 the first line of the person's own answer was outside the first screen in all
   * four states. Most of those blocks were the instrument describing itself to a
   * person who had not yet seen their own answer.
   *
   * The fix is not order. Every one of those zones opens above the answer already, so
   * moving things up moves nothing. The fix is first contact: two zones stand, the
   * rest are one keystroke away and rendered in full when they arrive.
   *
   * GLANCE is Z1.4 and Z2.1 — the claim and the arithmetic. Nothing else competes
   * with them. INSPECT is Z1.3, Z1.5, Z2.2, Z2.3 and Z2.4, plus Z1.1 and Z1.2 for a
   * runner who already knows what they pasted.
   *
   * ARRIVAL CHANGES WHERE TWO LEAVES SIT AND NOTHING ELSE. A cold reader does not know
   * what they are holding, so the class label and the context line stand above the
   * finding as one compact line. Same leaves, same strings, a different parent. The
   * scope boundary Z1.5 is not in that line, and that is a judgment: it is two
   * sentences and 148 characters on montana, so setting it above the finding would
   * rebuild the wall this pass exists to take down. What a cold reader needs first is
   * what kind of record this is and what it is about, which is exactly Z1.1 and Z1.2.
   * Z1.5 answers what the record establishes, which is the next question, not the
   * first. That reading of "identity and scope" is put to the founder in the return.
   */

  if (p.forwarded) {
    main.appendChild(
      K.forwarded({ root: "b-fwd", heading: "b-fwd-h", body: "b-fwd-b", action: "b-fwd-a" }, { compact: true }),
    );
  }

  var head = el("header", { class: "b-head", "data-zone-group": "Z1" });
  var headInner = el("div", { class: "b-head-inner" });
  var mastLeaves = K.masthead(rec, {
    label: "b-class",
    context: "b-context",
    address: "b-address",
    addressItem: "b-addr-item",
    addressLabel: "b-addr-label",
    addressValue: "b-addr-value",
    finding: "b-finding",
    boundary: "b-boundary",
  });
  var scopeLeaves = K.scope(rec, { count: "b-count", census: "b-census", rule: "b-count-rule", orient: "b-orient" });

  /* One identity line, built once, placed by arrival. Two spans on one line, so it
   * costs a cold reader one rendered block rather than two. */
  var identityLine = el("div", { class: "b-head-id" }, [mastLeaves[0], mastLeaves[1]]);

  /* Z2.3 · the orientation, and the one leaf whose stratum is decided by arrival for a
   * reason that is not compactness.
   *
   * It is the line that teaches a first-time reader what a mark is — that a mark can
   * point at something in the answer or at something absent from it. A runner has just
   * come from the entry surface and can dismiss it, which is why it is dismissible at
   * all. A cold reader cannot dismiss it, by an existing rule in this stylesheet, and
   * the reason that rule exists is that the cold reader is the person who needs it.
   *
   * A line the record refuses to let a cold reader turn off cannot also be a line the
   * record makes them ask for. So on a forwarded arrival it stands in GLANCE, under the
   * count. That is what "keep cold trust intact" costs here, measured: one rendered
   * block, and cold arrival lands at six against fifteen rather than five. The trade is
   * worth naming rather than optimising away. */
  var orientBlock = el("div", { class: "b-scope-orient" }, [
    scopeLeaves.orient,
    el("button", { class: "b-dismiss", type: "button", text: F.ui.z2.orientation_dismiss, "data-dismiss": "orient" }),
  ]);

  var glance = el("div", { class: "b-glance", "data-strata": "glance" });
  if (p.forwarded) glance.appendChild(identityLine);
  glance.appendChild(mastLeaves[3]);
  glance.appendChild(scopeLeaves.count);
  if (p.forwarded) glance.appendChild(orientBlock);
  headInner.appendChild(glance);

  var headDetail = [];
  if (!p.forwarded) headDetail.push(identityLine);
  headDetail.push(mastLeaves[2]);
  headDetail.push(mastLeaves[4]);
  headDetail.push(
    el("div", { class: "b-head-scope", "data-zone-group": "Z2" }, [
      /* The census leads the scope block now. It used to sit under the count as its
       * gloss, which was right when the count was the visual anchor of a header strip;
       * inside the disclosure the count has already been read, so the first thing this
       * block adds is where those marks are anchored. */
      scopeLeaves.census,
      scopeLeaves.rule,
      p.forwarded ? null : orientBlock,
    ]),
  );
  headInner.appendChild(
    K.disclose(
      { root: "b-more", summary: "b-more-sum", summaryText: "b-more-label", body: "b-more-body" },
      F.ui.strata.header_detail,
      headDetail,
      { name: "header" },
    ),
  );
  head.appendChild(headInner);
  main.appendChild(head);

  /* ── Z3 + Z4.1 + Z4.4 · the instrument: column and rail ───────────────────── */

  var work = el("div", { class: "b-work" });
  var column = el("div", { class: "b-column", "data-zone-group": "Z3" });

  column.appendChild(
    el("div", { class: "b-prompt", zone: "Z3.1" }, [
      el("p", { class: "b-label", text: rec.prompt_label }),
      el("p", { class: "b-prompt-text", text: rec.prompt, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.question" : null }),
    ]),
  );

  if (rec.expectation_artifact) {
    column.appendChild(
      el("div", { class: "b-expect", zone: "Z3.2" }, [
        el("p", { class: "b-label", text: rec.expectation_artifact.label }),
        el("pre", { class: "b-expect-text", text: rec.expectation_artifact.text }),
        el("p", { class: "b-disclosure", text: rec.expectation_artifact.disclosure }),
      ]),
    );
  }

  column.appendChild(el("p", { class: "b-label b-source-label", zone: "Z3.3", text: rec.source.label }));

  var body = el("div", { class: "b-body", zone: "Z3.4", "data-source-body": "true" });

  /* The rail is the right half of every row in the body grid. It carries no heading:
   * a heading would be copy A does not have, and the comparability rule allows this
   * direction a different shape, not different information.
   */

  function treat(seg) {
    return el("span", {
      class: seg.mode === F.anchor_mode.QUOTED_SPAN ? "b-span" : "b-region",
      text: seg.text,
    });
  }

  /* Each block gets a row. The row is the unit the rail aligns to: the block on the
   * left, its entries on the right, sharing one baseline. */
  var rows = [];

  K.model(rec).forEach(function (block) {
    var row = el("div", { class: "b-row", "data-row": String(block.index) });
    var slot = el("div", { class: "b-row-source" });
    var side = el("div", { class: "b-row-marks" });

    if (block.type === "filename") {
      slot.appendChild(el("p", { class: "b-filename", "data-block": String(block.index), text: block.lines[0].segments[0].text }));
    } else if (block.type === "code") {
      var pre = el("pre", { class: "b-code", "data-block": String(block.index) });
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
          ? el("span", { class: "b-code-region", "data-region": String(g.mark) })
          : el("span", { class: "b-code-plain" });
        g.lines.forEach(function (line, i) {
          if (wrote > 0) (i === 0 ? pre : host).appendChild(K.txt("\n"));
          host.appendChild(K.renderLine(line, treat));
          wrote += 1;
        });
        pre.appendChild(host);
      });
      slot.appendChild(pre);
    } else {
      var para = el("p", { class: "b-para", "data-block": String(block.index) });
      para.appendChild(K.renderLine(block.lines[0], treat));
      slot.appendChild(para);
    }

    /* the standing rail entries for this block, in mark order */
    var seen = {};
    block.lines.forEach(function (line) {
      line.marks.forEach(function (n) {
        if (seen[n]) return;
        seen[n] = true;
        side.appendChild(note(rec.marks[n - 1]));
      });
    });

    row.appendChild(slot);
    row.appendChild(side);
    rows.push(row);
    body.appendChild(row);
  });

  /* Z4.4 · a rail note. It is present before it is opened; opening it adds the body,
   * so nothing arrives from nowhere. */
  function note(mark) {
    var wrap = el("div", {
      class: "b-note",
      zone: "Z4.4",
      id: "mark-" + mark.n,
      "data-mark": String(mark.n),
      role: "region",
      "aria-label": F.ui.z4.open_label,
    });
    var head = el("button", {
      class: "b-note-head",
      type: "button",
      "data-mark-trigger": String(mark.n),
      "aria-expanded": "false",
      "aria-controls": "mark-" + mark.n,
    }, [
      el("span", { class: "b-note-n", text: String(mark.n) }),
      el("span", { class: "b-note-points", text: mark.points_at }),
    ]);
    var open = el("div", { class: "b-note-open" });
    open.appendChild(el("p", { class: "b-note-mode", text: mark.mode_meaning }));
    if (mark.observed) open.appendChild(el("p", { class: "b-note-quote", text: mark.observed, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.surfaced" : null }));
    if (mark.materiality) open.appendChild(el("p", { class: "b-note-body", text: mark.materiality, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.why_it_mattered" : null }));
    if (mark.expectation_quote) open.appendChild(el("p", { class: "b-note-quote", text: mark.expectation_quote }));
    if (mark.connect) open.appendChild(el("p", { class: "b-note-body", text: mark.connect }));
    if (mark.declared) open.appendChild(el("p", { class: "b-note-body", text: mark.declared }));
    open.appendChild(
      el("p", { class: "b-note-ask" }, [
        el("span", { class: "b-note-ask-label", text: F.ui.z5.field_worth_asking }),
        K.txt(" "),
        el("span", { text: mark.worth_asking }),
      ]),
    );
    open.appendChild(el("button", { class: "b-note-close", type: "button", text: F.ui.z4.close_label, "data-mark-close": String(mark.n) }));
    wrap.appendChild(head);
    wrap.appendChild(open);
    return wrap;
  }

  column.appendChild(body);

  if (rec.second_artifact) {
    column.appendChild(
      el("div", { class: "b-second", zone: "Z3.5" }, [
        el("p", { class: "b-label", text: rec.second_artifact.label }),
        el("p", { class: "b-second-text", text: rec.second_artifact.prompt, gov: "PUBLIC_EXAMPLE.targeted_prompt" }),
      ]),
    );
  }

  if (rec.capture_shape) {
    column.appendChild(
      el("div", { class: "b-shape", zone: "Z3.6" }, [
        el("p", { class: "b-label", text: rec.capture_shape.heading }),
        el("p", { class: "b-shape-body", text: rec.capture_shape.body }),
      ]),
    );
  }

  work.appendChild(column);
  main.appendChild(work);

  /* ── Z4.2 · the record-level block ───────────────────────────────────────────
   * Below both columns. The rail ends where the source ends, so there is no rail
   * position this could take.
   */

  if (rec.record_level_marks.length) {
    var out = el("section", { class: "b-outside", "data-zone-group": "Z4", zone: "Z4.2", "data-absence": "true" });
    var oi = el("div", { class: "b-outside-inner" });
    oi.appendChild(el("p", { class: "b-outside-label", text: F.ui.z4.record_level_heading }));
    oi.appendChild(el("p", { class: "b-outside-rule", zone: "Z4.3", text: F.ui.z4.record_level_rule }));
    oi.appendChild(el("p", { class: "b-outside-note", text: F.ui.z4.record_level_note }));
    var list = el("div", { class: "b-outside-list" });
    rec.record_level_marks.forEach(function (n) {
      var wrap = note(rec.marks[n - 1]);
      wrap.className = "b-note b-note-outside";
      list.appendChild(wrap);
    });
    oi.appendChild(list);
    out.appendChild(oi);
    main.appendChild(out);
  }

  /* ── Z5 · Check Register ─────────────────────────────────────────────────── */

  var reg = el("section", { class: "b-register", "data-zone-group": "Z5" });
  var regInner = el("div", { class: "b-register-inner" });
  regInner.appendChild(
    el("div", { class: "b-reg-head" }, [
      el("div", {}, [
        el("h2", { class: "b-reg-h", zone: "Z5.1", text: F.ui.z5.heading }),
        el("p", { class: "b-reg-note", zone: "Z5.2", text: F.ui.z5.note }),
      ]),
      el("div", { class: "b-density", zone: "Z5.4", role: "group", "aria-label": F.ui.z5.density_label }, [
        el("span", { class: "b-density-label", text: F.ui.z5.density_label }),
        el("div", { class: "b-density-set" }, [
          el("button", { class: "b-density-btn", type: "button", "data-set-density": "consumer", "aria-pressed": "false", text: F.ui.z5.density_consumer }),
          el("button", { class: "b-density-btn", type: "button", "data-set-density": "professional", "aria-pressed": "false", text: F.ui.z5.density_professional }),
        ]),
        el("span", { class: "b-density-note b-density-note-consumer", text: F.ui.z5.density_consumer_note }),
        el("span", { class: "b-density-note b-density-note-pro", text: F.ui.z5.density_professional_note }),
      ]),
    ]),
  );

  /* ── Z5.6 · applied checks · B's answer to the placement question ───────────
   *
   * B keeps the apparatus with the apparatus. The register opens by saying what was
   * applied, and only then itemizes what each mark holds — so the first thing the
   * register asserts is its own operation rather than its first finding.
   *
   * B does not move it above the source, and the reason is B's architecture rather
   * than habit. B is the only direction that puts marks in a column beside the text,
   * which means its reader is already inspecting by the time they have read two
   * paragraphs. Hoisting the applied checks over the source would push that column
   * down and interrupt the one relationship B exists to make — text beside note —
   * to answer a question B's reader has not asked yet.
   *
   * What that placement costs, measured: nothing. B's first proof sits at 519px at
   * 1440 and 841px at 390, the same pixels as before Z5.6 existed, and B's six stress
   * frames are unchanged to the pixel. B is the only direction where adding this zone
   * moved no evidence. A and C each pushed their first proof down by roughly 700px on
   * desktop and 900px on mobile to place the zone earlier.
   *
   * What it costs instead is depth. The zone opens at 1924px on Deposit and 1325px on
   * Montana at 1440 — 1.9 and 1.3 screens down — and at 3640px and 2041px at 390, so
   * 4.3 and 2.4 screens. A reader who stops at the source never learns that three
   * checks ran. B accepts that. B's proposition is a working surface for someone who
   * will reach the register, not a document that must land its whole case above the
   * fold. Note that B still answers the founder's objection — the zone is not buried
   * under provenance; it is the first thing the register says.
   *
   * COMPACT STATE, added with the reading strata. The zone opens with its heading and
   * its census sentence; the note, the shared condition, the three rows and the
   * silence note are one keystroke behind them. What makes that legitimate rather than
   * a summary is that the standing sentence is the sanctioned counting sentence
   * itself — `3 checks ran. 1 produced one or more findings.` — not a new string
   * written to stand in for the rows. It is the one line in the zone that already
   * answers what was checked on its own terms, and the rows are what it counts. No
   * shorter sentence was written, no ratio joined it, and the disclosure's own label
   * names what is inside rather than offering more.
   */
  regInner.appendChild(
    K.appliedChecks(rec, {
      root: "b-applied", heading: "b-applied-h", census: "b-applied-census",
      note: "b-applied-note", shared: "b-applied-cond", row: "b-applied-row",
      name: "b-applied-name", outcome: "b-applied-out", cond: "b-applied-rowcond",
      condLabel: "b-applied-condlabel", detector: "b-applied-det",
      detectorLabel: "b-applied-detlabel", detectorValue: "b-applied-detval",
    }, {
      strata: true,
      discloseCls: { root: "b-more b-more-checks", summary: "b-more-sum", summaryText: "b-more-label", body: "b-more-body" },
    }),
  );

  var entries = el("ol", { class: "b-entries" });
  rec.marks.forEach(function (m) {
    var li = el("li", { class: "b-entry", zone: "Z5.3", "data-register-entry": String(m.n) });
    li.appendChild(el("span", { class: "b-entry-n", text: String(m.n) }));
    var col = el("div", { class: "b-entry-col" });
    ["consumer", "professional"].forEach(function (d) {
      var group = el("div", { class: "b-entry-fields", "data-fields": d });
      K.fields(rec, m, d).forEach(function (row) {
        group.appendChild(
          el("div", { class: "b-field" + (row.lead ? " b-field-lead" : "") + (row.ask ? " b-field-ask" : ""), "data-field": row.key }, [
            el("span", { class: "b-field-label", text: row.label }),
            el("span", { class: "b-field-body" + (row.quoted ? " b-field-quoted" : "") + (row.mono ? " b-field-mono" : ""), text: row.text, gov: rec.id === "montana" ? row.gov : null }),
          ]),
        );
      });
      col.appendChild(group);
    });
    col.appendChild(
      el("button", {
        class: "b-entry-jump", type: "button", "data-mark-trigger": String(m.n),
        "aria-expanded": "false", "aria-controls": "mark-" + m.n,
        text: m.in_document ? F.ui.z4.jump_to_source : F.ui.z4.open_label,
      }),
    );
    li.appendChild(col);
    entries.appendChild(li);
  });
  regInner.appendChild(entries);
  regInner.appendChild(el("div", { class: "b-reg-close", zone: "Z5.5" }, K.registerClose(rec, { row: "b-close-row", label: "b-close-label", body: "b-close-body" })));
  reg.appendChild(regInner);
  main.appendChild(reg);

  /* ── Z6 · provenance, Z7 · foot ──────────────────────────────────────────── */

  var prov = el("section", { class: "b-prov", "data-zone-group": "Z6" });
  prov.appendChild(el("div", { class: "b-prov-inner" }, K.provenance(rec, {
    heading: "b-prov-h", row: "b-prov-row", label: "b-prov-label", body: "b-prov-body",
    ids: "b-ids", idItem: "b-id-item", idLabel: "b-id-label", idValue: "b-id-value",
  })));
  main.appendChild(prov);

  var foot = el("footer", { class: "b-foot", "data-zone-group": "Z7" });
  var footInner = el("div", { class: "b-foot-inner" }, K.foot(rec, { row: "b-foot-row", label: "b-foot-label", body: "b-foot-body", cite: "b-foot-cite" }));
  footInner.appendChild(el("p", { class: "b-lane", text: F.ui.nav.lane_tag }));
  foot.appendChild(footInner);
  main.appendChild(foot);

  /* ── behaviour ───────────────────────────────────────────────────────────── */

  K.wire(document);
  K.wireDensity(document, K.setDensity);
  K.wireDismiss(document);

  K.afterBoot(p, rec);
})();
