/**
 * Job Notification Tracker — Digest page UI: generate, render, copy, email draft
 */
(function () {
  var Digest = window.JobTrackerDigest;
  var Prefs = window.JobTrackerPreferences;
  var Status = window.JobTrackerStatus;

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : s;
    return div.innerHTML;
  }

  function renderDigestCard(jobs) {
    var listEl = document.getElementById("jnt-digest-card-list");
    var dateEl = document.getElementById("jnt-digest-card-date");
    if (!listEl) return;

    if (dateEl) dateEl.textContent = Digest.getTodayDateLabel();

    listEl.innerHTML = "";
    if (!jobs || !jobs.length) return;

    jobs.forEach(function (job) {
      var li = document.createElement("li");
      li.className = "jnt-digest-card__job";
      var meta = [job.location || "", job.experience || ""].filter(Boolean).join(" · ");
      var score = typeof job.matchScore === "number" ? job.matchScore : 0;
      var applyUrl = job.applyUrl || "#";
      li.innerHTML =
        "<h3 class=\"jnt-digest-card__job-title\">" + escapeHtml(job.title || "") + "</h3>" +
        "<p class=\"jnt-digest-card__job-meta\">" + escapeHtml(job.company || "") + (meta ? " · " + escapeHtml(meta) : "") + " · Match: " + score + "%</p>" +
        "<div class=\"jnt-digest-card__job-row\">" +
          "<a href=\"" + applyUrl.replace(/"/g, "&quot;") + "\" target=\"_blank\" rel=\"noopener\" class=\"kn-btn kn-btn--primary\">Apply</a>" +
        "</div>";
      listEl.appendChild(li);
    });
  }

  function showState(state) {
    var noPrefs = document.getElementById("jnt-digest-no-prefs");
    var generateWrap = document.getElementById("jnt-digest-generate-wrap");
    var noMatches = document.getElementById("jnt-digest-no-matches");
    var empty = document.getElementById("jnt-digest-empty");
    var cardWrap = document.getElementById("jnt-digest-card-wrap");

    if (noPrefs) noPrefs.style.display = state === "no_prefs" ? "block" : "none";
    if (generateWrap) generateWrap.style.display = (state === "ready" || state === "empty") ? "block" : "none";
    if (noMatches) noMatches.style.display = state === "no_matches" ? "block" : "none";
    if (empty) empty.style.display = state === "empty" ? "block" : "none";
    if (cardWrap) cardWrap.style.display = state === "has_digest" ? "block" : "none";
  }

  function runGenerate() {
    var result = Digest.getOrCreateTodayDigest();

    if (result.error === "no_prefs") {
      showState("no_prefs");
      return;
    }

    if (!result.jobs || result.jobs.length === 0) {
      showState("no_matches");
      return;
    }

    renderDigestCard(result.jobs);
    showState("has_digest");

    var mailtoBtn = document.getElementById("jnt-digest-mailto-btn");
    if (mailtoBtn) {
      var text = Digest.formatDigestPlainText(result.jobs, Digest.getTodayDateLabel());
      var body = encodeURIComponent(text);
      var subject = encodeURIComponent("My 9AM Job Digest");
      mailtoBtn.href = "mailto:?subject=" + subject + "&body=" + body;
    }
  }

  function copyToClipboard() {
    var jobs = Digest.getDigestForToday();
    if (!jobs || !jobs.length) return;
    var text = Digest.formatDigestPlainText(jobs, Digest.getTodayDateLabel());

    function doFallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "2em";
      ta.style.height = "2em";
      ta.style.padding = "0";
      ta.style.border = "none";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
      return ok;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopyFeedback(true);
      }).catch(function () {
        var ok = doFallbackCopy();
        showCopyFeedback(ok);
      });
    } else {
      var ok = doFallbackCopy();
      showCopyFeedback(ok);
    }
  }

  function showCopyFeedback(success) {
    var btn = document.getElementById("jnt-digest-copy-btn");
    if (!btn) return;
    var originalText = btn.textContent;
    btn.textContent = success ? "Copied!" : "Copy failed — try selecting text manually";
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  }

  function formatStatusDate(isoString) {
    if (!isoString) return "";
    try {
      var d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleDateString() + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return isoString;
    }
  }

  function renderRecentStatusUpdates() {
    var listEl = document.getElementById("jnt-digest-updates-list");
    var emptyEl = document.getElementById("jnt-digest-updates-empty");
    if (!listEl) return;

    var updates = Status ? Status.getRecentUpdates(20) : [];
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = updates.length === 0 ? "block" : "none";

    updates.forEach(function (u) {
      var li = document.createElement("li");
      li.className = "jnt-digest-updates__item";
      li.innerHTML =
        "<span class=\"jnt-digest-updates__item-title\">" + escapeHtml(u.title || "Job") + "</span>" +
        "<span class=\"jnt-digest-updates__item-meta\">" + escapeHtml(u.company || "") + " · " + escapeHtml(u.status || "") + " · " + escapeHtml(formatStatusDate(u.dateChanged)) + "</span>";
      listEl.appendChild(li);
    });
  }

  function init() {
    var prefs = Prefs ? Prefs.get() : null;

    if (!prefs) {
      showState("no_prefs");
      return;
    }

    var existing = Digest.getDigestForToday();
    if (existing && existing.length > 0) {
      renderDigestCard(existing);
      showState("has_digest");
      var mailtoBtn = document.getElementById("jnt-digest-mailto-btn");
      if (mailtoBtn) {
        var text = Digest.formatDigestPlainText(existing, Digest.getTodayDateLabel());
        mailtoBtn.href = "mailto:?subject=" + encodeURIComponent("My 9AM Job Digest") + "&body=" + encodeURIComponent(text);
      }
      return;
    }

    showState("empty");
  }

  function bind() {
    init();
    renderRecentStatusUpdates();

    var genBtn = document.getElementById("jnt-digest-generate-btn");
    if (genBtn) genBtn.addEventListener("click", function () {
      runGenerate();
      renderRecentStatusUpdates();
    });

    var copyBtn = document.getElementById("jnt-digest-copy-btn");
    if (copyBtn) copyBtn.addEventListener("click", copyToClipboard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
