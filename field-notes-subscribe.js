(function () {
  var SUCCESS = "You're subscribed to Field Notes.";
  var INVALID = "Please enter a valid email address.";
  var ERROR = "Couldn't subscribe — check the address and try again.";
  var ENDPOINT = "/briefing/members/api/send-magic-link";

  function showMsg(el, text) {
    el.textContent = text;
    el.setAttribute("aria-hidden", "false");
    el.classList.add("is-visible");
  }

  function hideMsg(el) {
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    el.classList.remove("is-visible");
  }

  function wireForm(form, msg) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = form.querySelector('input[type="email"]');
      var btn = form.querySelector('button[type="submit"]');
      if (!emailInput || !emailInput.value.trim() || !emailInput.checkValidity()) {
        showMsg(msg, INVALID);
        emailInput && emailInput.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
      }
      hideMsg(msg);

      fetch(form.getAttribute("action") || ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          emailType: "signup",
          labels: ["field-notes"],
        }),
        credentials: "same-origin",
      })
        .then(function (res) {
          if (!res.ok) throw new Error("subscribe failed");
          showMsg(msg, SUCCESS);
          emailInput.disabled = true;
          form.classList.add("is-subscribed");
        })
        .catch(function () {
          showMsg(msg, ERROR);
          if (btn) {
            btn.disabled = false;
            btn.removeAttribute("aria-busy");
          }
        });
    });
  }

  document.querySelectorAll("form.subscribe--field-notes").forEach(function (form) {
    var msgId = form.getAttribute("data-msg-id");
    var msg = msgId && document.getElementById(msgId);
    if (msg) wireForm(form, msg);
  });
})();
