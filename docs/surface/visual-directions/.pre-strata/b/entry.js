/* Direction B · reader entry (Z8)
 *
 * B's grammar is two columns working at once. Entry uses the same shape: both the
 * paste field and the way to watch the check are on screen together, side by side,
 * in every state. The state decides which one takes the wide column — it never
 * decides which one exists.
 *
 * Z8.4 exists only in the arriving state, because only that visitor arrived through
 * a record.
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;

  var p = K.boot("b");
  var state = F.entry.states.indexOf(p.state) >= 0 ? p.state : "empty";
  document.documentElement.setAttribute("data-entry-state", state);

  var parts = K.entryParts({
    fieldWrap: "b-e-field",
    fieldLabel: "b-e-field-label",
    field: "b-e-textarea",
    action: "b-e-action",
    mechanism: "b-e-mech",
    mechHeading: "b-e-mech-heading",
    mechBody: "b-e-mech-body",
    mechAction: "b-e-mech-action",
    arriving: "b-e-arriving",
    arrivingHeading: "b-e-arriving-heading",
    arrivingBody: "b-e-arriving-body",
    arrivingAction: "b-e-arriving-action",
    scope: "b-e-scope",
    ready: "b-e-ready",
  });

  if (state === "answer") parts.textarea.value = F.entry.sample_answer;

  function pasteBlock() {
    return el("div", { class: "b-e-paste" }, [
      parts.field,
      el("div", { class: "b-e-paste-foot" }, [parts.action, parts.scope]),
      parts.ready,
    ]);
  }

  function arrivedRecord() {
    var rec = K.record(F.entry.shared_record);
    return el("div", { class: "b-e-arrived" }, [
      el("p", { class: "b-e-arrived-label", text: rec.class_label }),
      el("p", { class: "b-e-arrived-finding", text: rec.finding_sentence, gov: "PUBLIC_EXAMPLE.headline" }),
      el("p", { class: "b-e-arrived-count", text: rec.count_line }),
      el("a", { class: "b-e-arrived-open", href: "record.html?record=" + rec.id, text: F.ui.z1.address_read }),
    ]);
  }

  /* Every zone comes from the kit parts, which carry their own zone attributes. */
  var primary = el("div", { class: "b-e-primary" });
  var secondary = el("div", { class: "b-e-secondary" });

  if (state === "empty") {
    primary.appendChild(parts.mechanism);
    secondary.appendChild(pasteBlock());
  } else if (state === "answer") {
    primary.appendChild(pasteBlock());
    secondary.appendChild(parts.mechanism);
  } else {
    primary.appendChild(parts.arriving);
    primary.appendChild(arrivedRecord());
    secondary.appendChild(pasteBlock());
    secondary.appendChild(parts.mechanism);
  }

  var work = el("div", { class: "b-e-work" }, [el("div", { class: "b-e-cols" }, [primary, secondary])]);

  var host = document.getElementById("entry");
  host.appendChild(work);

  K.afterBoot(p, null);
})();
