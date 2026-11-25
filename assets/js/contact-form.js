// Sends the contact form through FormSubmit without leaving the page.
// After activating FormSubmit, replace the email address in FORM_ENDPOINT (and in
// the form's action attribute in contact/index.html) with the random alias
// FormSubmit gives you, so your address isn't visible in the page code.
(function () {
  "use strict";

  var FORM_ENDPOINT = "https://formsubmit.co/ajax/ahusseini@icstars.org";
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var button = form.querySelector('button[type="submit"]');

  function show(message, kind) {
    status.className = "form-status" + (kind ? " is-" + kind : "");
    status.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (form.elements._honey.value) return; // a bot filled the spam trap

    button.disabled = true;
    show("Sending...");

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: form.elements.name.value,
        email: form.elements.email.value,
        message: form.elements.message.value,
        _subject: "New message from your portfolio",
        _template: "table",
        _replyto: form.elements.email.value,
      }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || String(data.success) !== "true") throw new Error(data.message || "Failed");
        });
      })
      .then(function () {
        form.reset();
        show("Thanks! Your message was sent. I'll get back to you soon.", "success");
      })
      .catch(function (error) {
        var reason = (error && error.message) || "";
        if (reason) console.warn("Contact form:", reason);
        show(
          /activat/i.test(reason)
            ? "This form is being set up and isn't accepting messages yet. Please reach out on LinkedIn for now."
            : "Sorry, that didn't send. Please try again in a moment, or reach out on LinkedIn.",
          "error"
        );
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
