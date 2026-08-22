/* Shared kit for the visual-direction lane. Plain script, one global, file:// safe.
 *
 * The kit owns text integrity and the data-* contract the harness reads. It owns no
 * layout, no scale, no colour and no interaction shape. Every string it renders comes
 * from window.IMBAS_FIXTURE. Directions A, B and C hold no record copy of their own.
 */
(function () {
  "use strict";

  var F = window.IMBAS_FIXTURE;

  /* ── state ───────────────────────────────────────────────────────────────── */

  var DEFAULTS = {
    record: "montana",
    density: "consumer",
    open: "",
    forwarded: "",
    motion: "",
    state: "empty",
  };

  function params() {
    var q = new URLSearchParams(location.search);
    var out = {};
    for (var k in DEFAULTS) out[k] = q.get(k) != null ? q.get(k) : DEFAULTS[k];
    return out;
  }

  function record(id) {
    var want = id || params().record;
    for (var i = 0; i < F.records.length; i++) if (F.records[i].id === want) return F.records[i];
    return F.records[0];
  }

  /* ── dom ─────────────────────────────────────────────────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else if (k === "zone") n.setAttribute("data-zone", v);
        else if (k === "gov") n.setAttribute("data-gov", v);
        else if (k === "html") throw new Error("kit: markup strings are not accepted");
        else n.setAttribute(k, v);
      }
    }
    if (kids) {
      var list = Array.isArray(kids) ? kids : [kids];
      for (var j = 0; j < list.length; j++) if (list[j]) n.appendChild(list[j]);
    }
    return n;
  }

  function txt(t) {
    return document.createTextNode(t);
  }

  /* ── source model ────────────────────────────────────────────────────────────
   * One place computes how the answer breaks into lines and how marks sit inside
   * it. Three directions render the same model. They cannot disagree about where
   * a mark falls, and none of them can reflow, truncate or restyle a character.
   */

  function model(rec) {
    var lineNo = 0;
    return rec.source.blocks.map(function (block, bi) {
      var pieces = block.type === "code" ? splitLines(block.segments) : [block.segments];
      return {
        type: block.type,
        index: bi,
        lines: pieces.map(function (segs) {
          lineNo += 1;
          return {
            n: lineNo,
            marks: segs.filter(function (s) { return s.mark; }).map(function (s) { return s.mark; }),
            segments: segs,
          };
        }),
      };
    });
  }

  function splitLines(segments) {
    var lines = [[]];
    segments.forEach(function (seg) {
      var parts = seg.text.split("\n");
      parts.forEach(function (part, i) {
        if (i > 0) lines.push([]);
        if (part.length || parts.length === 1) lines[lines.length - 1].push({ text: part, mark: seg.mark, mode: seg.mode });
      });
    });
    return lines.map(function (l) { return l.length ? l : [{ text: "", mark: null, mode: null }]; });
  }

  /* Renders one line's segments into a container. `treat` is direction-supplied and
   * decides what a marked span looks like; it receives the segment and must return an
   * element whose textContent is exactly the segment text. The kit checks that. */
  function renderLine(line, treat) {
    var frag = document.createDocumentFragment();
    line.segments.forEach(function (seg) {
      if (!seg.mark) {
        frag.appendChild(txt(seg.text));
        return;
      }
      var node = treat(seg);
      if (node.textContent !== seg.text) throw new Error("kit: a direction altered marked source text");
      node.setAttribute("data-anchor", String(seg.mark));
      node.setAttribute("data-anchor-mode", seg.mode);
      node.setAttribute("data-channel", F.anchor_channel[seg.mode]);
      node.setAttribute("data-zone", "Z4.1");
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.setAttribute("aria-expanded", "false");
      node.setAttribute("aria-controls", "mark-" + seg.mark);
      frag.appendChild(node);
    });
    return frag;
  }

  /* ── mark selection ──────────────────────────────────────────────────────── */

  var listeners = [];
  var openMark = null;

  function onOpen(fn) { listeners.push(fn); }

  function setOpen(n, opts) {
    if (opts && opts.close) openMark = null;
    else openMark = openMark === n && !(opts && opts.force) ? null : n;
    document.documentElement.setAttribute("data-open-mark", openMark == null ? "" : String(openMark));
    Array.prototype.forEach.call(document.querySelectorAll("[data-anchor]"), function (a) {
      a.setAttribute("aria-expanded", String(Number(a.getAttribute("data-anchor")) === openMark));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-mark-trigger]"), function (a) {
      a.setAttribute("aria-expanded", String(Number(a.getAttribute("data-mark-trigger")) === openMark));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-mark]"), function (m) {
      m.setAttribute("data-open", String(Number(m.getAttribute("data-mark")) === openMark));
    });
    listeners.forEach(function (fn) { fn(openMark); });
  }

  /* Pointer and keyboard reach every mark. Nothing is available on hover alone.
   * A trigger opens a mark and announces whether it is open; a close control only
   * closes, so it carries no expanded state to announce. */
  var SEL = "[data-anchor], [data-mark-trigger], [data-mark-close]";

  function act(t) {
    if (t.hasAttribute("data-mark-close")) return setOpen(Number(t.getAttribute("data-mark-close")), { close: true });
    setOpen(Number(t.getAttribute("data-anchor") || t.getAttribute("data-mark-trigger")));
  }

  function wire(root) {
    root.addEventListener("click", function (e) {
      var t = e.target.closest(SEL);
      if (!t) return;
      e.preventDefault();
      act(t);
    });
    root.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      var t = e.target.closest(SEL);
      if (!t) return;
      e.preventDefault();
      act(t);
    });
  }

  function wireDensity(root, apply) {
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-set-density]");
      if (!t) return;
      apply(t.getAttribute("data-set-density"));
    });
  }

  /* Dismissing the orientation is one behaviour, so it lives in one place. Three
   * directions had written it three ways — two set a root attribute, one hid a node
   * outright — which left no single point where the forwarded guarantee could be
   * enforced. It is enforced here: on a forwarded record the control does nothing,
   * because the marks explanation is part of what the record carries to its second
   * reader rather than part of how its first reader chose to sit with it.
   *
   * The state is a root attribute and never a hidden node. A direction styles it,
   * so a direction can fade it, collapse it or fold it away, and the paragraph
   * stays in the document and in the accessibility tree either way. */
  function wireDismiss(root) {
    root.addEventListener("click", function (e) {
      if (!e.target.closest("[data-dismiss]")) return;
      if (document.documentElement.getAttribute("data-forwarded") === "true") return;
      document.documentElement.setAttribute("data-orient", "dismissed");
    });
  }

  function setDensity(value) {
    document.documentElement.setAttribute("data-density", value);
    Array.prototype.forEach.call(document.querySelectorAll("[data-set-density]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-density") === value));
    });
  }

  /* ── register fields ─────────────────────────────────────────────────────────
   * The field list per density lives here, once. Professional adds fields to the
   * same entries; it never adds or removes an entry.
   */

  function fields(rec, mark, density) {
    var u = F.ui.z5;
    var rows = [{ key: "points_at", label: u.field_points_at, text: mark.points_at, lead: true }];

    if (density === "professional") {
      if (mark.quote) rows.push({ key: "quote", label: u.field_quote, text: mark.quote, quoted: true });
      if (mark.region_start) rows.push({ key: "region", label: u.field_region, text: mark.region_start + " … " + mark.region_end, quoted: true });
      if (mark.declared) rows.push({ key: "declared", label: F.ui.z4.record_level_rule, text: mark.declared });
      if (mark.declared_by) rows.push({ key: "declared_by", label: u.field_declared_by, text: mark.declared_by });
      if (mark.observed) rows.push({ key: "observed", label: u.field_observed, text: mark.observed, quoted: true, gov: "PUBLIC_EXAMPLE.surfaced" });
      if (mark.materiality) rows.push({ key: "materiality", label: u.field_materiality, text: mark.materiality, gov: "PUBLIC_EXAMPLE.why_it_mattered" });
      rows.push({ key: "anchor_mode", label: F.ui.z4.mode_label, text: mark.anchor_mode + " · " + mark.mode_meaning, mono: true });
      rows.push({ key: "evidence", label: u.field_evidence, text: mark.evidence_text });
      if (mark.signal_class) rows.push({ key: "signal_class", label: u.field_signal_class, text: mark.signal_class });
      if (mark.relation) rows.push({ key: "relation", label: u.field_signal_class, text: mark.relation });
      if (mark.rests_on) rows.push({ key: "rests_on", label: u.field_rests_on, text: mark.rests_on });
      if (mark.carries) rows.push({ key: "carries", label: u.field_carries, text: mark.carries });
      if (mark.expectation_quote) rows.push({ key: "expectation", label: u.field_expectation, text: mark.expectation_quote, quoted: true });
      if (mark.connect) rows.push({ key: "connect", label: u.field_connect, text: mark.connect });
    } else {
      if (mark.declared) rows.push({ key: "declared", label: F.ui.z4.record_level_rule, text: mark.declared });
      if (mark.observed) rows.push({ key: "observed", label: u.field_observed, text: mark.observed, quoted: true, gov: "PUBLIC_EXAMPLE.surfaced" });
    }

    rows.push({ key: "worth_asking", label: u.field_worth_asking, text: mark.worth_asking, ask: true });
    return rows;
  }

  /* ── zone leaves ─────────────────────────────────────────────────────────────
   * Leaf content only. Every direction wraps these in its own structure, and every
   * direction therefore carries the same zones with the same strings.
   */

  function masthead(rec, cls) {
    var c = cls || {};
    return [
      el("p", { class: c.label, zone: "Z1.1", text: rec.class_label }),
      el("p", { class: c.context, zone: "Z1.2", text: rec.context, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.context" : null }),
      el("p", { class: c.address, zone: "Z1.3" }, rec.address.map(function (a, i) {
        return el("span", { class: c.addressItem }, [
          el("span", { class: c.addressLabel, text: a.label }),
          txt(" "),
          el("span", { class: c.addressValue, text: a.value }),
        ]);
      })),
      el("h1", { class: c.finding, zone: "Z1.4", text: rec.finding_sentence, gov: rec.id === "montana" ? "PUBLIC_EXAMPLE.headline" : null }),
      el("p", { class: c.boundary, zone: "Z1.5", text: rec.boundary }),
    ];
  }

  /* Z2.4 · the census, emitted by the kit so all three directions carry the same
   * sentence and no direction can drop the one line above the fold that is bound to
   * this run's own facts. The per-channel counts ride along as a data attribute so
   * the harness can check the rendered prose against arithmetic rather than against
   * a second copy of the prose. */
  /* Named, not positional. This returned an array and all three directions reached
   * into it by index, so adding the census at index 1 silently moved the count rule
   * and the orientation one slot down in every composition — a shift that renders
   * without erroring and reads as a layout opinion rather than a bug. A shared kit
   * that hands out ordered tuples makes every later addition a breaking change. */
  function scope(rec, cls) {
    var c = cls || {};
    return {
      count: el("p", { class: c.count, zone: "Z2.1", "data-count-line": String(rec.count), text: rec.count_line }),
      census: el("p", {
        class: c.census, zone: "Z2.4", text: rec.census_line,
        "data-census": JSON.stringify(rec.census_counts),
      }),
      rule: el("p", { class: c.rule, zone: "Z2.2", text: F.ui.z2.count_rule }),
      orient: el("p", { class: c.orient, zone: "Z2.3", text: F.ui.z2.orientation }),
    };
  }

  /* ── INSPECT · the disclosure ────────────────────────────────────────────────
   *
   * Native `<details>`, and the choice is load-bearing rather than a preference.
   *
   * A scripted disclosure would have to be given keyboard operation, a focus ring, an
   * expanded state to announce, and a way to survive the record being printed or
   * read with scripting unavailable — four things this element already does, none of
   * which a lane would get right on the first pass and all of which fail silently. It
   * also keeps the contents in the document at full text whether open or closed, so
   * the containment guarantee is a property of the element and not of a discipline.
   *
   * The kit owns it for the same reason it owns the census and the applied checks: a
   * direction that could build its own disclosure could build one that renders its
   * contents only on open, and the difference between that and this is invisible in a
   * screenshot. Every disclosure on a record page therefore carries `data-strata`,
   * which is how the harness finds them all, opens them all, and proves the open page
   * and the closed page hold the same zones and the same text.
   *
   * `open` is a presentation default, never a content decision: the same children are
   * in the DOM either way. It exists so a viewport with room can show the detail
   * standing rather than make a reader ask for what would have fitted anyway.
   */
  function disclose(cls, summaryText, children, opts) {
    var c = cls || {};
    var o = opts || {};
    var attrs = { class: c.root, "data-strata": "inspect" };
    if (o.name) attrs["data-strata-name"] = o.name;
    if (o.open) attrs.open = "";
    var d = el("details", attrs, [
      el("summary", { class: c.summary }, [el("span", { class: c.summaryText, text: summaryText })]),
    ]);
    var body = el("div", { class: c.body }, children);
    d.appendChild(body);
    return d;
  }

  /* Z6.3 · the durable handles.
   *
   * Run, packet and anatomy used to sit in the masthead, three lines under the class
   * label, where the first thing a person met was a hex string. They are exact and
   * they are worth keeping to the character, but they answer the second reader's
   * question, not the first one's. They live at the end of the provenance block now,
   * which is where a person goes when they have decided to cite the thing.
   *
   * The kit appends this rather than handing it to the directions, so no direction
   * can quietly restore an identifier to the top of its own composition. */
  function identity(rec, c) {
    /* The anatomy handle is appended here rather than carried in the record, because
     * its value is the one identifier that depends on which direction is rendering.
     * It reads from the same `anatomyFor()` result that stamps the document element,
     * so what a reader is told to cite and what the harness proves are one value. */
    var ids = rec.identifiers.concat([
      { label: F.ui.z6.address_anatomy, value: (ANATOMY || anatomyFor(document.documentElement.getAttribute("data-direction"))).version },
    ]);
    return el("div", { class: c.row, zone: "Z6.3", "data-prov": "identity" }, [
      el("p", { class: c.label, text: F.ui.z6.identity_heading }),
      el("p", { class: c.ids }, ids.map(function (a) {
        return el("span", { class: c.idItem }, [
          el("span", { class: c.idLabel, text: a.label }),
          txt(" "),
          el("span", { class: c.idValue, text: a.value }),
        ]);
      })),
      el("p", { class: c.body, text: F.ui.z6.identity_note }),
    ]);
  }

  function provenance(rec, cls) {
    var c = cls || {};
    return [el("h2", { class: c.heading, zone: "Z6.1", text: F.ui.z6.heading })]
      .concat(
        rec.provenance.map(function (row, i) {
          var isGov = rec.id === "montana";
          return el("div", { class: c.row, zone: "Z6.2", "data-prov": row.id }, [
            el("p", { class: c.label, text: row.label, gov: isGov ? "PUBLIC_EXAMPLE.provenance[" + i + "].label" : null }),
            el(row.pre ? "pre" : "p", { class: c.body, text: row.body, gov: isGov ? "PUBLIC_EXAMPLE.provenance[" + i + "].body" : null }),
          ]);
        }),
      )
      .concat([identity(rec, c)]);
  }

  function foot(rec, cls) {
    var c = cls || {};
    return [
      el("div", { class: c.row, zone: "Z7.1" }, [
        el("p", { class: c.label, text: F.ui.z7.method_label }),
        el("p", { class: c.body, text: F.ui.z7.method_body }),
      ]),
      el("div", { class: c.row, zone: "Z7.2" }, [
        el("p", { class: c.label, text: F.ui.z7.archive_label }),
        el("p", { class: c.body, text: F.ui.z7.archive_body }),
      ]),
      el("div", { class: c.row, zone: "Z7.3" }, [
        el("p", { class: c.label, text: F.ui.z7.citation_label }),
        el("p", { class: c.cite, text: citation(rec) }),
      ]),
    ];
  }

  /* The cold reader arrived without the entry surface. Z7.4 is the only place a
   * record offers the way back into it.
   *
   * `opts.compact` sets the three parts on one line instead of stacking them. That is
   * the whole of it: the same three strings, in the same order, all three still
   * separate elements the gate reads separately, and nothing conditional about the
   * link. It exists because the measurement said the stack cost the forwarded arrival
   * three rendered blocks and about 145px above the finding sentence at 390, and the
   * reader with the least context was the one paying it.
   *
   * What was refused: shortening the body, dropping the heading to an icon, and
   * making any part of it open on request. A cold reader is the one person on the
   * record who cannot supply missing context themselves, so this zone may change its
   * setting and may not change its contents. */
  function forwarded(cls, opts) {
    var c = cls || {};
    var o = opts || {};
    var tag = o.compact ? "span" : "p";
    return el("div", { class: c.root, zone: "Z7.4", role: "note", "data-compact": o.compact ? "true" : null }, [
      el(tag, { class: c.heading, text: F.ui.z7.forwarded_heading }),
      el(tag, { class: c.body, text: F.ui.z7.forwarded_body }),
      el("a", { class: c.action, href: "entry.html?state=empty", text: F.ui.z8.entry_return }),
    ]);
  }

  /* Z5.6 · the applied checks.
   *
   * Emitted by the kit, like the census, so no direction can drop the stratum that
   * represents checks which produced nothing. A direction wanting a quieter register
   * could otherwise render only the rows carrying findings, and the zone would go
   * back to speaking only when something surfaced — the exact shape this addition
   * exists to end.
   *
   * Named leaves, not an array: the census taught that a shared kit handing out
   * ordered tuples makes every later addition a breaking change in three directions
   * at once, and the breakage renders without erroring.
   *
   * The detector id and version are professional fields. They are the machine end of
   * the check's identity and belong in the entry's provenance stratum under S7 —
   * kept, never led with. Density adds them; it never removes a row, because a row
   * is a check that ran.
   */
  /* `opts.strata` gives the zone its compact state, per ANATOMY.md v2: the census
   * sentence stands, and the rows, the conditions, the detector identities and the
   * silence note move into an INSPECT disclosure. The census sentence is not
   * shortened, replaced or joined by anything — it is the sanctioned counting
   * sentence, and it is the only string here that already answers "what was checked"
   * without standing in for the rows.
   *
   * Opt-in, and the default is the v1 rendering. Not out of caution: A and C are
   * archived evidence pinned to a hash, and a shared helper that changed shape under
   * them would falsify renders that were captured as the record of a closed decision. */
  function appliedChecks(rec, cls, opts) {
    var c = cls || {};
    var o = opts || {};
    var z = F.ui.z5;
    var rows = rec.applied_checks.map(function (chk) {
      var kids = [
        el("p", { class: c.name, "data-check-name": chk.key, text: chk.label }),
        el("p", { class: c.outcome, "data-check-outcome": chk.outcome, text: chk.outcome_text }),
      ];
      /* Only where the instrument genuinely carries a condition of its own. Two of
       * the three rows have none, and printing an empty label for them would invent
       * a symmetry the register does not have. */
      if (chk.condition) {
        kids.push(
          el("p", { class: c.cond, "data-check-condition": "own" }, [
            el("span", { class: c.condLabel, text: z.applied_condition_label + ". " }),
            txt(chk.condition),
          ]),
        );
      }
      kids.push(
        el("p", { class: c.detector, "data-field": "detector", "data-density": "professional" }, [
          el("span", { class: c.detectorLabel, text: z.applied_field_detector + " " }),
          el("span", { class: c.detectorValue, text: chk.detector_id + " · " + chk.detector_version }),
        ]),
      );
      return el("div", { class: c.row, "data-check-row": chk.key }, kids);
    });

    var head = [
      el("h3", { class: c.heading, text: z.applied_heading }),
      el("p", {
        class: c.census, "data-check-census": JSON.stringify(rec.check_census), text: rec.check_census_line,
      }),
      el("p", { class: c.note, text: z.applied_note }),
      el("p", { class: c.shared, text: z.applied_condition_shared }),
    ];
    var tail = [el("p", { class: c.note, text: z.applied_silence_note })];
    /* A record these checks do not read says so once, under the rows, rather than
     * repeating the reason on each of three lines. */
    if (rec.check_census.not_applicable) tail.push(el("p", { class: c.note, text: z.applied_not_applicable_why }));

    if (o.strata) {
      /* The heading and the census stay standing; everything the zone says about how
       * it read and what each row produced goes inside. Splitting the head array at
       * index 2 rather than rebuilding it keeps one construction of these leaves, so
       * the compact state cannot acquire a string the full state does not have. */
      var standing = head.slice(0, 2);
      var detail = head.slice(2).concat(rows).concat(tail);
      return el("div", { class: c.root, zone: "Z5.6" }, standing.concat([
        disclose(o.discloseCls, F.ui.strata.checks_detail, detail, { name: "checks", open: o.open }),
      ]));
    }

    return el("div", { class: c.root, zone: "Z5.6" }, head.concat(rows).concat(tail));
  }

  function registerClose(rec, cls) {
    var c = cls || {};
    var out = [
      el("div", { class: c.row }, [
        el("p", { class: c.label, text: F.ui.z5.classes_heading }),
        el("p", { class: c.body, text: rec.signal_classes_line }),
      ]),
    ];
    rec.register_close.forEach(function (r, i) {
      out.push(
        el("div", { class: c.row }, [
          el("p", { class: c.label, text: r.label }),
          el("p", { class: c.body, text: r.text, gov: rec.id === "montana" ? ["PUBLIC_EXAMPLE.counts_line", "PUBLIC_EXAMPLE.source_line", "PUBLIC_EXAMPLE.tag"][i] : null }),
        ]),
      );
    });
    return out;
  }

  /* ── reader entry ────────────────────────────────────────────────────────────
   * Z8 carries five parts and three states. The kit owns the parts and their
   * zone attributes; each direction decides the order, the weight and which part
   * leads. No state may remove a part, so none of the three can close a door.
   */

  function entryParts(cls) {
    var c = cls || {};
    var z = F.ui.z8;
    var area = el("textarea", {
      class: c.field,
      id: "entry-answer",
      rows: "6",
      placeholder: z.field_placeholder,
      spellcheck: "false",
    });
    return {
      field: el("div", { class: c.fieldWrap, zone: "Z8.1" }, [
        el("label", { class: c.fieldLabel, for: "entry-answer", text: z.field_label }),
        area,
      ]),
      textarea: area,
      action: el("button", { class: c.action, zone: "Z8.2", type: "button", text: z.action }),
      mechanism: el("div", { class: c.mechanism, zone: "Z8.3" }, [
        el("p", { class: c.mechHeading, text: z.mechanism_heading }),
        el("p", { class: c.mechBody, text: z.mechanism_body }),
        el("a", { class: c.mechAction, href: "record.html?record=montana", text: z.mechanism_action }),
      ]),
      arriving: el("div", { class: c.arriving, zone: "Z8.4" }, [
        el("p", { class: c.arrivingHeading, text: z.arriving_heading }),
        el("p", { class: c.arrivingBody, text: z.arriving_body }),
        el("a", { class: c.arrivingAction, href: "entry.html?state=answer", text: z.arriving_action }),
      ]),
      scope: el("p", { class: c.scope, zone: "Z8.5", text: z.scope }),
      ready: el("p", { class: c.ready, text: z.ready_note }),
    };
  }

  /* ── boot ────────────────────────────────────────────────────────────────── */

  /* The record that travels is complete.
   *
   * Density and the orientation dismiss are runner-view states. They describe how
   * one reader chose to look at a record; they say nothing about what the record
   * holds. A forwarded record therefore discards both on arrival and opens at full
   * annotation with the orientation standing. The second reader gets every field,
   * every mark, the whole scope block and the whole provenance block, whatever the
   * first reader had collapsed when they sent it.
   *
   * The controls stay live afterwards — the cold reader becomes a runner of their
   * own view and may collapse whatever they like. What is refused is the first
   * reader's preference arriving pre-applied and deciding what the second reader is
   * allowed to see. A preference may change a view. It may never change a record.
   *
   * Two things make this hold rather than merely intend it. This function is the
   * only writer of data-density at boot, so no direction can route around it. And
   * the lane carries no persistence layer at all — no localStorage, no
   * sessionStorage, no cookie, no history write on any record page — so a
   * dismissed orientation cannot outlive the tab it was dismissed in, let alone
   * reach a URL someone else opens.
   */
  function canonical(p) {
    if (!p.forwarded) return p;
    p.density = "professional";
    return p;
  }

  /* Which anatomy this direction was built against.
   *
   * Selection closed on 2026-08-10: B is the production chassis and moves with
   * ANATOMY.md; A and C are archived evidence and stay pinned to the v1 snapshot. One
   * function decides that, and both the stamped hash and the citable version handle in
   * Z6.3 read from it, so a direction cannot stamp one anatomy while telling a reader
   * to cite another. The list of archived directions comes from the fixture rather
   * than from a condition written here, because a name test written in the kit is a
   * rule three files can disagree with. */
  function anatomyFor(direction) {
    var arc = F.anatomy_archived;
    if (arc && arc.directions.indexOf(direction) >= 0) return { version: arc.version, sha: arc.sha };
    return { version: F.anatomy_version, sha: F.anatomy_sha };
  }
  var ANATOMY = null;

  /* Z7.3 · the citation a reader is invited to quote elsewhere.
   *
   * The anatomy version is joined here rather than baked into the fixture for the
   * same reason as the Z6.3 identity row: the record is one thing, the anatomy the
   * record was drawn against is another, and only the rendering direction knows the
   * second. A citation that names the wrong anatomy is worse than most render bugs,
   * because it is the one string on the page built to survive being copied away from
   * it. */
  function citation(rec) {
    var v = (ANATOMY || anatomyFor(document.documentElement.getAttribute("data-direction"))).version;
    return rec.citation_head + " · " + v + " · " + rec.citation_tail;
  }

  function boot(direction) {
    var p = canonical(params());
    var root = document.documentElement;
    ANATOMY = anatomyFor(direction);
    root.setAttribute("data-direction", direction);
    root.setAttribute("data-record", p.record);
    root.setAttribute("data-density", p.density);
    root.setAttribute("data-forwarded", p.forwarded ? "true" : "false");
    root.setAttribute("data-entry-state", p.state);
    /* The anatomy this direction was built against, carried as a hash as well as a
     * version string. A version string is a name two documents can share while their
     * texts diverge; a hash cannot be. Both are stamped from one `anatomyFor()` call
     * so the citable handle in Z6.3 and the digest the harness proves cannot drift
     * apart, and the harness reads the digest back against the file on disk. Not
     * user-facing — no reader is asked to check a hash. */
    root.setAttribute("data-anatomy-sha", ANATOMY.sha);
    root.setAttribute("data-anatomy-version", ANATOMY.version);
    if (p.motion === "reduced") root.setAttribute("data-motion", "reduced");
    return p;
  }

  /* Presentation metadata, computed once so three directions scale the same record
   * the same way. It carries no content. */
  function afterBoot(p, rec) {
    if (rec) {
      var n = rec.finding_sentence.length;
      document.documentElement.setAttribute("data-finding-length", n < 90 ? "short" : n < 160 ? "medium" : "long");
      document.documentElement.setAttribute("data-record-count", String(rec.count));
      document.documentElement.setAttribute("data-record-class", rec.record_class);
    }
    setDensity(p.density);
    if (p.open) setOpen(Number(p.open), { force: true });
    document.documentElement.setAttribute("data-ready", "true");
  }

  window.IMBAS_KIT = {
    F: F,
    params: params,
    record: record,
    el: el,
    txt: txt,
    model: model,
    renderLine: renderLine,
    setOpen: setOpen,
    onOpen: onOpen,
    wire: wire,
    wireDensity: wireDensity,
    wireDismiss: wireDismiss,
    setDensity: setDensity,
    fields: fields,
    masthead: masthead,
    scope: scope,
    disclose: disclose,
    provenance: provenance,
    foot: foot,
    forwarded: forwarded,
    appliedChecks: appliedChecks,
    registerClose: registerClose,
    entryParts: entryParts,
    boot: boot,
    afterBoot: afterBoot,
  };
})();
