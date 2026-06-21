(function () {
  var SUCCESS = "You're on the list.";
  var INVALID = "Enter a valid email address.";
  var UNAVAILABLE = "Signup is not available right now. Email brendan@imbaslabs.com.";
  var ENDPOINT = "/api/field-notes-signup";

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
        if (emailInput) emailInput.focus();
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
          source: window.location.pathname || "/",
        }),
        credentials: "same-origin",
      })
        .then(function (res) {
          return res.json().catch(function () {
            return { ok: false };
          }).then(function (data) {
            if (res.status === 400 && data && data.error === "invalid_email") {
              throw new Error("invalid");
            }
            if (!res.ok || !data || data.ok !== true) {
              throw new Error("failed");
            }
            return data;
          });
        })
        .then(function () {
          showMsg(msg, SUCCESS);
          emailInput.disabled = true;
          form.classList.add("is-subscribed");
          if (btn) btn.removeAttribute("aria-busy");
        })
        .catch(function (err) {
          showMsg(msg, err && err.message === "invalid" ? INVALID : UNAVAILABLE);
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
