/* The stress board.
 *
 * Six states, three directions each. The frames are grouped by state rather than by
 * direction so the comparison a reviewer actually makes — "what do these three do
 * with the same load?" — is the one the page puts side by side.
 *
 * The numbers under each frame are read from the measurement written by the same run
 * that produced the image. Nothing here recomputes them, so the board cannot drift
 * away from the report by having its own opinion about arithmetic.
 */
(function () {
  var D = window.IMBAS_STRESS;
  var stage = document.getElementById("stage");
  var nav = document.getElementById("nav");

  var STATES = [
    { record: "deposit", view: "desktop", state: "1440 as it opens", id: "d-1440-opens",
      note: "Nine marks across all three channels, the heaviest record the anatomy carries." },
    { record: "deposit", view: "desktop", state: "1440 forwarded cold", id: "d-1440-fwd",
      note: "The same record arriving with nobody present to explain it. Canonical, full state." },
    { record: "deposit", view: "mobile", state: "390 as it opens", id: "d-390-opens",
      note: "Nine marks at 390. The width where a composition either holds its order or stacks." },
    { record: "deposit", view: "mobile", state: "390 forwarded cold", id: "d-390-fwd",
      note: "Forwarded, full annotation, one column." },
    { record: "furnace", view: "desktop", state: "1440 as it opens", id: "f-1440-opens",
      note: "One mark. The opening moment with no paired-answer sentence available to carry it." },
    { record: "furnace", view: "mobile", state: "390 as it opens", id: "f-390-opens",
      note: "One mark at 390." },
  ];

  var NAME = { a: "A · Investigative Cinematic", b: "B · Editorial Instrument", c: "C · Forensic Manuscript" };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function find(dir, st) {
    for (var i = 0; i < D.rows.length; i++) {
      var r = D.rows[i];
      if (r.direction === dir && r.record === st.record && r.view === st.view && r.state === st.state) return r;
    }
    return null;
  }

  STATES.forEach(function (st) {
    nav.appendChild(el("a", { href: "#" + st.id, text: st.record + " · " + st.state }));

    var block = el("section", { class: "st-block", id: st.id });
    block.appendChild(el("h2", { class: "st-head", text: st.record + " · " + st.state }));
    block.appendChild(el("p", { class: "st-note", text: st.note }));

    var row = el("div", { class: "st-row" });
    ["a", "b", "c"].forEach(function (dir) {
      var r = find(dir, st);
      if (!r) return;
      var cell = el("div", { class: "st-cell" + (st.view === "mobile" ? " st-mob" : "") });
      cell.appendChild(el("p", { class: "st-cap", text: NAME[dir] }));
      cell.appendChild(el("img", { src: "../screenshots/stress/" + r.frame, alt: NAME[dir] + " · " + st.record + " · " + st.state, loading: "lazy" }));

      /* Claim, proof, and the distance between them — the S6 numbers, exactly as the
       * measuring run recorded them. "past the first screen" is stated rather than
       * scored: it is a fact about where the pixels landed, not a grade. */
      var num = el("p", { class: "st-num" });
      num.appendChild(el("span", { html:
        "first claim <b>" + r.claim_top + "px</b><br>" +
        "first proof <b>" + r.proof_top + "px</b> · " + r.proof_is + "<br>" +
        "claim to proof <b>" + r.claim_to_proof_px + "px</b> · <b>" + r.claim_to_proof_screens + "</b> screens<br>" +
        "fold " + r.fold_px + "px · page " + r.page_px + "px<br>" +
        (r.proof_in_fold
          ? "proof is on the first screen"
          : "<span class='st-out'>proof sits " + r.proof_below_fold_screens + " screens past the first screen</span>")
      }));
      cell.appendChild(num);
      row.appendChild(cell);
    });
    block.appendChild(row);
    stage.appendChild(block);
  });
})();
