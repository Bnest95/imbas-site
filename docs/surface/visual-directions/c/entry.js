/* Direction C · reader entry (Z8)
 *
 * C's grammar is a ruled form, and the entry is the same form. Every part is a row,
 * and every row is filled in on every state. The state decides which row comes first
 * and how much room it takes — never which rows exist, so no state closes a door.
 *
 * Z8.4 belongs only to the arriving state, because only that visitor arrived through
 * a record.
 */
(function () {
  "use strict";

  var K = window.IMBAS_KIT;
  var F = K.F;
  var el = K.el;

  var p = K.boot("c");
  var state = F.entry.states.indexOf(p.state) >= 0 ? p.state : "empty";
  document.documentElement.setAttribute("data-entry-state", state);

  var parts = K.entryParts({
    fieldWrap: "c-e-field",
    fieldLabel: "c-e-field-label",
    field: "c-e-textarea",
    action: "c-e-action",
    mechanism: "c-e-mech",
    mechHeading: "c-e-mech-heading",
    mechBody: "c-e-mech-body",
    mechAction: "c-e-mech-action",
    arriving: "c-e-arriving",
    arrivingHeading: "c-e-arriving-heading",
    arrivingBody: "c-e-arriving-body",
    arrivingAction: "c-e-arriving-action",
    scope: "c-e-scope",
    ready: "c-e-ready",
  });

  if (state === "answer") parts.textarea.value = F.entry.sample_answer;

  /* The same ruled margin the record uses, and each part is a row against it. */
  function row(kids, lead) {
    return el("div", { class: "c-e-row" + (lead ? " c-e-row-lead" : "") }, [
      el("div", { class: "c-margin" }),
      el("div", { class: "c-e-val" }, kids),
    ]);
  }

  function pasteRow(lead) {
    return row([parts.field, el("div", { class: "c-e-foot" }, [parts.action, parts.scope]), parts.ready], lead);
  }

  function arrivingRow() {
    var rec = K.record(F.entry.shared_record);
    return row([
      parts.arriving,
      el("div", { class: "c-e-arrived" }, [
        el("p", { class: "c-e-arrived-label", text: rec.class_label }),
        el("p", { class: "c-e-arrived-finding", text: rec.finding_sentence, gov: "PUBLIC_EXAMPLE.headline" }),
        el("p", { class: "c-e-arrived-count", text: rec.count_line }),
        el("a", { class: "c-e-arrived-open", href: "record.html?record=" + rec.id, text: F.ui.z1.address_read }),
      ]),
    ], true);
  }

  var form = el("div", { class: "c-e-form" });

  if (state === "empty") {
    form.appendChild(row([parts.mechanism], true));
    form.appendChild(pasteRow(false));
  } else if (state === "answer") {
    form.appendChild(pasteRow(true));
    form.appendChild(row([parts.mechanism], false));
  } else {
    form.appendChild(arrivingRow());
    form.appendChild(pasteRow(false));
    form.appendChild(row([parts.mechanism], false));
  }

  document.getElementById("entry").appendChild(el("div", { class: "c-e-page" }, [form]));

  K.afterBoot(p, null);
})();
