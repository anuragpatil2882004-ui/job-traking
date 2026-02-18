/**
 * Job Notification Tracker — Dashboard: preferences, match score, filter, sort, threshold
 */
(function () {
  var STORAGE_KEY = "jnt_saved_ids";
  var Prefs = window.JobTrackerPreferences;
  var Status = window.JobTrackerStatus;

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function toggleSaved(id) {
    var ids = getSavedIds();
    var i = ids.indexOf(id);
    if (i === -1) ids.push(id);
    else ids.splice(i, 1);
    setSavedIds(ids);
    return ids;
  }

  function isSaved(id) {
    return getSavedIds().indexOf(id) !== -1;
  }

  function postedLabel(days) {
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return days + " days ago";
  }

  /**
   * Match score engine (exact spec):
   * +25 any roleKeyword in job.title (case-insensitive)
   * +15 any roleKeyword in job.description
   * +15 job.location in preferredLocations
   * +10 job.mode in preferredMode
   * +10 job.experience === experienceLevel
   * +15 overlap job.skills and user skills (any match)
   * +5 postedDaysAgo <= 2
   * +5 source === LinkedIn
   * Cap 100.
   */
  function computeMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;
    var roleKeywords = (prefs.roleKeywords || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    var userSkills = (prefs.skills || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    var title = (job.title || "").toLowerCase();
    var desc = (job.description || "").toLowerCase();

    if (roleKeywords.length) {
      for (var r = 0; r < roleKeywords.length; r++) {
        if (title.indexOf(roleKeywords[r]) !== -1) { score += 25; break; }
      }
    }
    if (roleKeywords.length) {
      for (var d = 0; d < roleKeywords.length; d++) {
        if (desc.indexOf(roleKeywords[d]) !== -1) { score += 15; break; }
      }
    }
    if (prefs.preferredLocations && prefs.preferredLocations.length && job.location) {
      if (prefs.preferredLocations.indexOf(job.location) !== -1) score += 15;
    }
    if (prefs.preferredMode && prefs.preferredMode.length && job.mode) {
      if (prefs.preferredMode.indexOf(job.mode) !== -1) score += 10;
    }
    if (prefs.experienceLevel && job.experience === prefs.experienceLevel) score += 10;
    if (userSkills.length && job.skills && Array.isArray(job.skills)) {
      var skillMatched = false;
      for (var u = 0; u < userSkills.length && !skillMatched; u++) {
        for (var s = 0; s < job.skills.length; s++) {
          var js = (job.skills[s] || "").toLowerCase();
          var us = userSkills[u];
          if (js && (js.indexOf(us) !== -1 || us.indexOf(js) !== -1)) {
            score += 15;
            skillMatched = true;
            break;
          }
        }
      }
    }
    if (typeof job.postedDaysAgo === "number" && job.postedDaysAgo <= 2) score += 5;
    if (job.source === "LinkedIn") score += 5;

    return Math.min(100, score);
  }

  function matchBadgeClass(score) {
    if (score >= 80) return "jnt-match-badge--high";
    if (score >= 60) return "jnt-match-badge--medium";
    if (score >= 40) return "jnt-match-badge--neutral";
    return "jnt-match-badge--low";
  }

  function salarySortValue(salaryRange) {
    if (!salaryRange || typeof salaryRange !== "string") return 0;
    var m = salaryRange.match(/\d+/);
    if (!m) return 0;
    var num = parseInt(m[0], 10);
    if (salaryRange.indexOf("k") !== -1 && num < 100) num = num * 1000;
    return num;
  }

  function filterAndSort(jobsWithScore, opts) {
    var list = jobsWithScore.slice();
    var kw = (opts.keyword || "").trim().toLowerCase();
    if (kw) {
      list = list.filter(function (j) {
        return (j.title && j.title.toLowerCase().indexOf(kw) !== -1) ||
               (j.company && j.company.toLowerCase().indexOf(kw) !== -1);
      });
    }
    if (opts.location) list = list.filter(function (j) { return j.location === opts.location; });
    if (opts.mode) list = list.filter(function (j) { return j.mode === opts.mode; });
    if (opts.experience) list = list.filter(function (j) { return j.experience === opts.experience; });
    if (opts.source) list = list.filter(function (j) { return j.source === opts.source; });
    if (opts.status) list = list.filter(function (j) { return Status && Status.getStatus(j.id) === opts.status; });
    if (opts.onlyAboveThreshold && typeof opts.minMatchScore === "number") {
      list = list.filter(function (j) { return (j.matchScore || 0) >= opts.minMatchScore; });
    }
    var sort = opts.sort || "Latest";
    if (sort === "Latest") list.sort(function (a, b) { return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0); });
    else if (sort === "Match Score") list.sort(function (a, b) { return (b.matchScore || 0) - (a.matchScore || 0); });
    else if (sort === "Salary") list.sort(function (a, b) { return salarySortValue(b.salaryRange) - salarySortValue(a.salaryRange); });
    return list;
  }

  function getUniqueValues(jobs, key) {
    var set = {};
    jobs.forEach(function (j) {
      var v = j[key];
      if (v) set[v] = true;
    });
    return Object.keys(set).sort();
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML.replace(/"/g, "&quot;");
  }

  function statusBadgeClass(status) {
    if (status === "Applied") return "jnt-status-badge--applied";
    if (status === "Rejected") return "jnt-status-badge--rejected";
    if (status === "Selected") return "jnt-status-badge--selected";
    return "jnt-status-badge--not-applied";
  }

  function showToast(message) {
    var el = document.getElementById("jnt-toast");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.style.display = "none";
    }, 2500);
  }

  function renderCard(job, options) {
    options = options || {};
    var saved = options.saved !== false && isSaved(job.id);
    var showSave = options.showSave !== false;
    var score = typeof job.matchScore === "number" ? job.matchScore : 0;
    var badgeClass = matchBadgeClass(score);
    var badgeHtml = '<span class="jnt-match-badge ' + badgeClass + '">' + score + '%</span>';
    var status = Status ? Status.getStatus(job.id) : "Not Applied";
    var statusClass = statusBadgeClass(status);
    var statusRow =
      '<div class="jnt-job-card__status-row">' +
        '<span class="jnt-status-label jnt-job-card__status-label">Status</span>' +
        '<span class="jnt-status-badge ' + statusClass + '" data-status-badge>' + escapeHtml(status) + '</span>' +
        '<div class="jnt-job-card__status-btns" data-status-btns>' +
          '<button type="button" data-status="Not Applied">Not Applied</button>' +
          '<button type="button" data-status="Applied">Applied</button>' +
          '<button type="button" data-status="Rejected">Rejected</button>' +
          '<button type="button" data-status="Selected">Selected</button>' +
        '</div>' +
      '</div>';
    var card = document.createElement("article");
    card.className = "jnt-job-card" + (saved ? " is-saved" : "");
    card.dataset.id = job.id;
    var metaParts = [job.location || "", job.mode || "", job.experience || ""].filter(Boolean);
    card.innerHTML =
      '<div class="jnt-job-card__header">' +
        '<h3 class="jnt-job-card__title">' + escapeHtml(job.title || "") + '</h3>' +
        '<div class="jnt-job-card__badges">' + badgeHtml + '<span class="jnt-job-card__source">' + escapeHtml(job.source || "") + '</span></div>' +
      '</div>' +
      '<p class="jnt-job-card__company">' + escapeHtml(job.company || "") + '</p>' +
      '<div class="jnt-job-card__meta">' + escapeHtml(metaParts.join(" · ")) + '</div>' +
      (job.salaryRange ? '<div class="jnt-job-card__salary">' + escapeHtml(job.salaryRange) + '</div>' : '') +
      '<div class="jnt-job-card__posted">' + postedLabel(typeof job.postedDaysAgo === "number" ? job.postedDaysAgo : 0) + '</div>' +
      '<div class="jnt-job-card__actions">' +
        '<button type="button" class="kn-btn kn-btn--secondary jnt-job-card__view">View</button>' +
        (showSave ? '<button type="button" class="kn-btn kn-btn--secondary jnt-job-card__save">' + (saved ? "Saved" : "Save") + '</button>' : '') +
        '<a href="' + escapeAttr(job.applyUrl || "#") + '" target="_blank" rel="noopener" class="kn-btn kn-btn--primary jnt-job-card__apply">Apply</a>' +
      '</div>' +
      statusRow;
    var activeBtn = card.querySelector("[data-status=\"" + escapeAttr(status) + "\"]");
    if (activeBtn) activeBtn.classList.add("is-active");
    return card;
  }

  function openModal(job) {
    var overlay = document.getElementById("jnt-modal-overlay");
    var titleEl = document.getElementById("jnt-modal-title");
    var bodyEl = document.getElementById("jnt-modal-body");
    var skillsEl = document.getElementById("jnt-modal-skills");
    if (!overlay || !titleEl) return;
    if (bodyEl) bodyEl.textContent = job.description || "";
    if (titleEl) titleEl.textContent = (job.title || "") + " at " + (job.company || "");
    if (skillsEl) skillsEl.innerHTML = (job.skills && job.skills.length) ? "<strong>Skills:</strong> " + job.skills.map(function (s) { return "<span>" + escapeHtml(s) + "</span>"; }).join(" ") : "";
    overlay.classList.add("is-open");
  }

  function closeModal() {
    var overlay = document.getElementById("jnt-modal-overlay");
    if (overlay) overlay.classList.remove("is-open");
  }

  function bindDashboard() {
    var jobs = window.JOB_LIST;
    if (!jobs || !Array.isArray(jobs)) return;

    var prefs = Prefs ? Prefs.get() : null;
    var jobsWithScore = jobs.map(function (j) {
      var copy = {};
      for (var k in j) if (Object.prototype.hasOwnProperty.call(j, k)) copy[k] = j[k];
      copy.matchScore = computeMatchScore(copy, prefs);
      return copy;
    });

    var filterBar = document.getElementById("jnt-filter-bar");
    var searchInput = document.getElementById("jnt-filter-keyword");
    var locationSelect = document.getElementById("jnt-filter-location");
    var modeSelect = document.getElementById("jnt-filter-mode");
    var experienceSelect = document.getElementById("jnt-filter-experience");
    var sourceSelect = document.getElementById("jnt-filter-source");
    var statusSelect = document.getElementById("jnt-filter-status");
    var sortSelect = document.getElementById("jnt-filter-sort");
    var gridEl = document.getElementById("jnt-job-grid");
    var bannerEl = document.getElementById("jnt-dashboard-banner");
    var thresholdRow = document.getElementById("jnt-threshold-row");
    var thresholdCheckbox = document.getElementById("jnt-threshold-toggle");
    var emptyFilteredEl = document.getElementById("jnt-empty-filtered");
    var modalOverlay = document.getElementById("jnt-modal-overlay");
    var modalClose = document.getElementById("jnt-modal-close");

    var locations = getUniqueValues(jobsWithScore, "location");
    var modes = getUniqueValues(jobsWithScore, "mode");
    var experiences = getUniqueValues(jobsWithScore, "experience");
    var sources = getUniqueValues(jobsWithScore, "source");

    function fillSelect(sel, options, allLabel) {
      if (!sel) return;
      sel.innerHTML = "<option value=\"\">" + (allLabel || "All") + "</option>";
      options.forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        sel.appendChild(opt);
      });
    }

    fillSelect(locationSelect, locations, "All locations");
    fillSelect(modeSelect, modes, "All modes");
    fillSelect(experienceSelect, experiences, "All experience");
    fillSelect(sourceSelect, sources, "All sources");
    if (sortSelect) {
      sortSelect.innerHTML = "<option value=\"Latest\">Latest</option><option value=\"Match Score\">Match Score</option><option value=\"Salary\">Salary</option>";
    }

    if (bannerEl) {
      bannerEl.style.display = prefs ? "none" : "block";
      if (!prefs) bannerEl.innerHTML = 'Set your preferences to activate intelligent matching. <a href="settings.html">Go to Settings</a>';
    }
    if (thresholdRow) thresholdRow.style.display = prefs ? "flex" : "none";
    if (thresholdCheckbox) thresholdCheckbox.checked = false;

    function getFilterState() {
      return {
        keyword: searchInput ? searchInput.value : "",
        location: locationSelect ? locationSelect.value : "",
        mode: modeSelect ? modeSelect.value : "",
        experience: experienceSelect ? experienceSelect.value : "",
        source: sourceSelect ? sourceSelect.value : "",
        status: statusSelect ? statusSelect.value : "",
        sort: sortSelect ? sortSelect.value || "Latest" : "Latest",
        onlyAboveThreshold: thresholdCheckbox ? thresholdCheckbox.checked : false,
        minMatchScore: prefs ? prefs.minMatchScore : 40
      };
    }

    function render() {
      var state = getFilterState();
      var list = filterAndSort(jobsWithScore, state);

      if (emptyFilteredEl) {
        emptyFilteredEl.style.display = list.length === 0 ? "block" : "none";
        if (list.length === 0) {
          var titleEl = emptyFilteredEl.querySelector(".jnt-empty-state-filtered__title");
          var subEl = emptyFilteredEl.querySelector(".jnt-empty-state-filtered__subtext");
          if (titleEl) titleEl.textContent = "No roles match your criteria.";
          if (subEl) subEl.textContent = "Adjust filters or lower threshold.";
        }
      }

      gridEl.style.display = list.length === 0 ? "none" : "grid";
      gridEl.innerHTML = "";

      list.forEach(function (job) {
        var card = renderCard(job);
        gridEl.appendChild(card);
        var viewBtn = card.querySelector(".jnt-job-card__view");
        var saveBtn = card.querySelector(".jnt-job-card__save");
        var applyLink = card.querySelector(".jnt-job-card__apply");
        var statusBtns = card.querySelector("[data-status-btns]");
        if (viewBtn) viewBtn.addEventListener("click", function () { openModal(job); });
        if (saveBtn) {
          saveBtn.addEventListener("click", function () {
            toggleSaved(job.id);
            render();
          });
        }
        if (applyLink && job.applyUrl) applyLink.setAttribute("href", job.applyUrl);
        if (Status && statusBtns) {
          statusBtns.querySelectorAll("[data-status]").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var newStatus = btn.getAttribute("data-status");
              Status.setStatus(job.id, newStatus);
              if (newStatus === "Applied" || newStatus === "Rejected" || newStatus === "Selected") {
                Status.addStatusUpdate(job.id, job.title || "", job.company || "", newStatus);
                showToast("Status updated: " + newStatus);
              }
              render();
            });
          });
        }
      });
    }

    function addListeners() {
      function run() { render(); }
      if (searchInput) searchInput.addEventListener("input", run);
      if (locationSelect) locationSelect.addEventListener("change", run);
      if (modeSelect) modeSelect.addEventListener("change", run);
      if (experienceSelect) experienceSelect.addEventListener("change", run);
      if (sourceSelect) sourceSelect.addEventListener("change", run);
      if (statusSelect) statusSelect.addEventListener("change", run);
      if (sortSelect) sortSelect.addEventListener("change", run);
      if (thresholdCheckbox) thresholdCheckbox.addEventListener("change", run);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay) closeModal();
      });
    }
    if (modalClose) modalClose.addEventListener("click", closeModal);

    addListeners();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDashboard);
  } else {
    bindDashboard();
  }
})();
