/* Direction A · reader entry (Z8)
 *
 * A's grammar is a descent: one part holds the first viewport at display scale,
 * and the rest of the surface follows underneath at reading scale. Entry uses the
 * same descent. The state decides which part takes the stage; the other parts stay
 * present and complete further down, so no state closes a door on the others.
 *
 * Z8.4 exists only in the arriving state, because only that visitor arrived
 * through a record. The other two states carry Z8.1, Z8.2, Z8.3 and Z8.5 in full.
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;

  var p = K.boot("a");
  var state = F.entry.states.indexOf(p.state) >= 0 ? p.state : "empty";
  document.documentElement.setAttribute("data-entry-state", state);

  var parts = K.entryParts({
    fieldWrap: "a-e-field",
    fieldLabel: "a-e-field-label",
    field: "a-e-textarea",
    action: "a-e-action",
    mechanism: "a-e-mech",
    mechHeading: "a-e-mech-heading",
    mechBody: "a-e-mech-body",
    mechAction: "a-e-mech-action",
    arriving: "a-e-arriving",
    arrivingHeading: "a-e-arriving-heading",
    arrivingBody: "a-e-arriving-body",
    arrivingAction: "a-e-arriving-action",
    scope: "a-e-scope",
    ready: "a-e-ready",
  });

  if (state === "answer") parts.textarea.value = F.entry.sample_answer;

  function pasteBlock(lead) {
    return el("div", { class: "a-e-paste" + (lead ? " is-lead" : "") }, [
      parts.field,
      el("div", { class: "a-e-paste-foot" }, [parts.action, parts.scope]),
      parts.ready,
    ]);
  }

  function arrivedRecord() {
    var rec = K.record(F.entry.shared_record);
    return el("div", { class: "a-e-arrived" }, [
      el("p", { class: "a-e-arrived-label", text: rec.class_label }),
      el("p", { class: "a-e-arrived-finding", text: rec.finding_sentence, gov: "PUBLIC_EXAMPLE.headline" }),
      el("p", { class: "a-e-arrived-count", text: rec.count_line }),
      el("a", { class: "a-e-arrived-open", href: "record.html?record=" + rec.id, text: F.ui.z1.address_read }),
    ]);
  }

  var stage = el("section", { class: "a-e-stage" });
  var inner = el("div", { class: "a-e-stage-inner" });
  var descent = el("section", { class: "a-e-descent" });
  stage.appendChild(inner);

  if (state === "empty") {
    stage.setAttribute("data-zone", "Z8.3");
    inner.appendChild(el("p", { class: "a-e-eyebrow", text: F.ui.z8.mechanism_heading }));
    inner.appendChild(el("p", { class: "a-e-lede", text: F.ui.z8.mechanism_body }));
    inner.appendChild(el("a", { class: "a-e-stage-action", href: "record.html?record=montana", text: F.ui.z8.mechanism_action }));
    descent.appendChild(pasteBlock(false));
  } else if (state === "answer") {
    stage.setAttribute("data-zone", "Z8.1");
    inner.appendChild(el("p", { class: "a-e-eyebrow", text: F.ui.z8.field_label }));
    inner.appendChild(pasteBlock(true));
    descent.appendChild(parts.mechanism);
  } else {
    stage.setAttribute("data-zone", "Z8.4");
    inner.appendChild(el("p", { class: "a-e-eyebrow", text: F.ui.z8.arriving_heading }));
    inner.appendChild(el("p", { class: "a-e-lede", text: F.ui.z8.arriving_body }));
    inner.appendChild(arrivedRecord());
    inner.appendChild(el("a", { class: "a-e-stage-action", href: "entry.html?state=answer", text: F.ui.z8.arriving_action }));
    descent.appendChild(pasteBlock(false));
    descent.appendChild(parts.mechanism);
  }

  var host = document.getElementById("entry");
  host.appendChild(stage);
  host.appendChild(descent);

  K.afterBoot(p, null);
})();
