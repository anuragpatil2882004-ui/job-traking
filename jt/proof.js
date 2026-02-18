/**
 * Job Notification Tracker — Proof page: steps, artifacts, copy, status
 */
(function () {
  var Checklist = window.JobTrackerTestChecklist;
  var ProofLinks = window.JobTrackerProofLinks;
  if (!ProofLinks) return;

  var statusBadgeEl = document.getElementById("jnt-proof-status-badge");
  var shippedMsgEl = document.getElementById("jnt-proof-shipped-msg");
  var stepsListEl = document.getElementById("jnt-proof-steps");
  var lovableInput = document.getElementById("jnt-proof-lovable");
  var githubInput = document.getElementById("jnt-proof-github");
  var deployedInput = document.getElementById("jnt-proof-deployed");
  var lovableError = document.getElementById("jnt-proof-lovable-error");
  var githubError = document.getElementById("jnt-proof-github-error");
  var deployedError = document.getElementById("jnt-proof-deployed-error");
  var copyBtn = document.getElementById("jnt-proof-copy-btn");

  function allTestsPassed() {
    return Checklist && Checklist.allPassed();
  }

  function allLinksProvided() {
    return ProofLinks.allProvided();
  }

  function isShipped() {
    return allLinksProvided() && allTestsPassed();
  }

  function getProjectStatus() {
    if (isShipped()) return "shipped";
    var links = ProofLinks.get();
    var hasAnyLink = ProofLinks.isValidUrl(links.lovableLink) || ProofLinks.isValidUrl(links.githubLink) || ProofLinks.isValidUrl(links.deployedUrl);
    var testsPassed = Checklist ? Checklist.passedCount() : 0;
    if (hasAnyLink || testsPassed > 0) return "in-progress";
    return "not-started";
  }

  function updateStepStatus() {
    if (!stepsListEl) return;
    var items = stepsListEl.querySelectorAll(".jnt-proof-steps__item");
    var testDone = allTestsPassed();
    var shipped = isShipped();
    items.forEach(function (item, i) {
      var statusEl = item.querySelector("[data-status]");
      if (!statusEl) return;
      if (i < 6) {
        statusEl.textContent = "Completed";
        statusEl.className = "jnt-proof-steps__status is-completed";
      } else if (i === 6) {
        statusEl.textContent = testDone ? "Completed" : "Pending";
        statusEl.className = "jnt-proof-steps__status " + (testDone ? "is-completed" : "is-pending");
      } else {
        statusEl.textContent = shipped ? "Completed" : "Pending";
        statusEl.className = "jnt-proof-steps__status " + (shipped ? "is-completed" : "is-pending");
      }
    });
  }

  function updateStatusBadge() {
    var status = getProjectStatus();
    if (statusBadgeEl) {
      statusBadgeEl.setAttribute("data-status", status);
      if (status === "shipped") statusBadgeEl.textContent = "Shipped";
      else if (status === "in-progress") statusBadgeEl.textContent = "In Progress";
      else statusBadgeEl.textContent = "Not Started";
    }
    if (shippedMsgEl) {
      shippedMsgEl.style.display = status === "shipped" ? "block" : "none";
    }
    updateStepStatus();
  }

  function validateAndSaveInput(input, key, errorEl) {
    var val = (input && input.value || "").trim();
    if (!val) {
      ProofLinks.setOne(key, "");
      if (errorEl) errorEl.textContent = "";
      return;
    }
    if (!ProofLinks.isValidUrl(val)) {
      if (errorEl) errorEl.textContent = "Please enter a valid URL (e.g. https://...).";
      return;
    }
    if (errorEl) errorEl.textContent = "";
    ProofLinks.setOne(key, val);
  }

  function renderInputs() {
    var links = ProofLinks.get();
    if (lovableInput) lovableInput.value = links.lovableLink;
    if (githubInput) githubInput.value = links.githubLink;
    if (deployedInput) deployedInput.value = links.deployedUrl;
  }

  function buildSubmissionText() {
    var links = ProofLinks.get();
    var lovable = (links.lovableLink || "").trim() || "(not provided)";
    var github = (links.githubLink || "").trim() || "(not provided)";
    var deployed = (links.deployedUrl || "").trim() || "(not provided)";
    return [
      "------------------------------------------",
      "Job Notification Tracker — Final Submission",
      "------------------------------------------",
      "",
      "Lovable Project:",
      lovable,
      "",
      "GitHub Repository:",
      github,
      "",
      "Live Deployment:",
      deployed,
      "",
      "Core Features:",
      "- Intelligent match scoring",
      "- Daily digest simulation",
      "- Status tracking",
      "- Test checklist enforced",
      "------------------------------------------"
    ].join("\n");
  }

  function copyToClipboard() {
    var text = buildSubmissionText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (copyBtn) {
          var orig = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = orig; }, 2000);
        }
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
    if (copyBtn) {
      copyBtn.textContent = ok ? "Copied!" : "Copy failed";
      setTimeout(function () { copyBtn.textContent = "Copy Final Submission"; }, 2000);
    }
  }

  function bindInputs() {
    function blurLovable() { validateAndSaveInput(lovableInput, "lovableLink", lovableError); updateStatusBadge(); }
    function blurGithub() { validateAndSaveInput(githubInput, "githubLink", githubError); updateStatusBadge(); }
    function blurDeployed() { validateAndSaveInput(deployedInput, "deployedUrl", deployedError); updateStatusBadge(); }
    if (lovableInput) {
      lovableInput.addEventListener("blur", blurLovable);
      lovableInput.addEventListener("input", function () { if (lovableError) lovableError.textContent = ""; });
    }
    if (githubInput) {
      githubInput.addEventListener("blur", blurGithub);
      githubInput.addEventListener("input", function () { if (githubError) githubError.textContent = ""; });
    }
    if (deployedInput) {
      deployedInput.addEventListener("blur", blurDeployed);
      deployedInput.addEventListener("input", function () { if (deployedError) deployedError.textContent = ""; });
    }
  }

  function bindCopy() {
    if (copyBtn) copyBtn.addEventListener("click", copyToClipboard);
  }

  function bindSave() {
    var saveBtn = document.getElementById("jnt-proof-save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function() {
        // Save all inputs
        validateAndSaveInput(lovableInput, "lovableLink", lovableError);
        validateAndSaveInput(githubInput, "githubLink", githubError);
        validateAndSaveInput(deployedInput, "deployedUrl", deployedError);
        updateStatusBadge();
        
        // Show feedback
        var originalText = saveBtn.textContent;
        saveBtn.textContent = "Saved!";
        setTimeout(function() {
          saveBtn.textContent = originalText;
        }, 2000);
      });
    }
  }

  function init() {
    renderInputs();
    updateStatusBadge();
    bindInputs();
    bindCopy();
    bindSave();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
