/**
 * Job Notification Tracker — Saved: render jobs from localStorage, empty state
 */
(function () {
  var STORAGE_KEY = "jnt_saved_ids";
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

  function renderCard(job, saved) {
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
        '<span class="jnt-job-card__source">' + escapeHtml(job.source || "") + '</span>' +
      '</div>' +
      '<p class="jnt-job-card__company">' + escapeHtml(job.company || "") + '</p>' +
      '<div class="jnt-job-card__meta">' + escapeHtml(metaParts.join(" · ")) + '</div>' +
      (job.salaryRange ? '<div class="jnt-job-card__salary">' + escapeHtml(job.salaryRange) + '</div>' : '') +
      '<div class="jnt-job-card__posted">' + postedLabel(typeof job.postedDaysAgo === "number" ? job.postedDaysAgo : 0) + '</div>' +
      '<div class="jnt-job-card__actions">' +
        '<button type="button" class="kn-btn kn-btn--secondary jnt-job-card__view">View</button>' +
        '<button type="button" class="kn-btn kn-btn--secondary jnt-job-card__save">Unsave</button>' +
        '<a href="' + escapeAttr(job.applyUrl || "#") + '" target="_blank" rel="noopener" class="kn-btn kn-btn--primary jnt-job-card__apply">Apply</a>' +
      '</div>' +
      statusRow;
    var activeBtn = card.querySelector("[data-status=\"" + escapeAttr(status) + "\"]");
    if (activeBtn) activeBtn.classList.add("is-active");
    return card;
  }

  function bindSaved() {
    var jobs = window.JOB_LIST;
    if (!jobs || !Array.isArray(jobs)) jobs = [];

    var emptyEl = document.getElementById("jnt-saved-empty");
    var gridEl = document.getElementById("jnt-saved-grid");
    var modalOverlay = document.getElementById("jnt-modal-overlay");
    var modalClose = document.getElementById("jnt-modal-close");

    function render() {
      var ids = getSavedIds();
      var savedJobs = jobs.filter(function (j) { return ids.indexOf(j.id) !== -1; });
      if (savedJobs.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        if (gridEl) gridEl.style.display = "none";
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
      if (gridEl) {
        gridEl.style.display = "grid";
        gridEl.innerHTML = "";
        savedJobs.forEach(function (job) {
          var card = renderCard(job, true);
          gridEl.appendChild(card);
          var viewBtn = card.querySelector(".jnt-job-card__view");
          var saveBtn = card.querySelector(".jnt-job-card__save");
          var statusBtns = card.querySelector("[data-status-btns]");
          if (viewBtn) viewBtn.addEventListener("click", function () { openModal(job); });
          if (saveBtn) {
            saveBtn.addEventListener("click", function () {
              toggleSaved(job.id);
              render();
            });
          }
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
    }

    if (modalOverlay) modalOverlay.addEventListener("click", function (e) { if (e.target === modalOverlay) closeModal(); });
    if (modalClose) modalClose.addEventListener("click", closeModal);

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSaved);
  } else {
    bindSaved();
  }
})();
