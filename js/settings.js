/**
 * Job Notification Tracker — Settings page: prefill and save jobTrackerPreferences
 */
(function () {
  var Prefs = window.JobTrackerPreferences;
  if (!Prefs) return;

  function getUniqueLocations() {
    var jobs = window.JOB_LIST;
    if (!jobs || !Array.isArray(jobs)) return [];
    var set = {};
    jobs.forEach(function (j) {
      if (j.location) set[j.location] = true;
    });
    return Object.keys(set).sort();
  }

  function prefill() {
    var p = Prefs.get();
    var roleKeywords = document.getElementById("roleKeywords");
    var preferredLocations = document.getElementById("preferredLocations");
    var experienceLevel = document.getElementById("experienceLevel");
    var skills = document.getElementById("skills");
    var minMatchScore = document.getElementById("minMatchScore");
    var minMatchScoreValue = document.getElementById("minMatchScoreValue");

    if (roleKeywords) roleKeywords.value = p ? p.roleKeywords : "";
    if (experienceLevel) experienceLevel.value = p ? p.experienceLevel : "";
    if (skills) skills.value = p ? p.skills : "";
    if (minMatchScore) {
      minMatchScore.value = p ? p.minMatchScore : Prefs.DEFAULTS.minMatchScore;
      if (minMatchScoreValue) minMatchScoreValue.textContent = minMatchScore.value;
    }

    if (preferredLocations) {
      var locations = getUniqueLocations();
      preferredLocations.innerHTML = "";
      locations.forEach(function (loc) {
        var opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        if (p && p.preferredLocations && p.preferredLocations.indexOf(loc) !== -1) opt.selected = true;
        preferredLocations.appendChild(opt);
      });
    }

    var modeCheckboxes = document.querySelectorAll("input[name=preferredMode]");
    if (p && p.preferredMode && modeCheckboxes.length) {
      modeCheckboxes.forEach(function (cb) {
        cb.checked = p.preferredMode.indexOf(cb.value) !== -1;
      });
    }
  }

  function collectForm() {
    var roleKeywords = document.getElementById("roleKeywords");
    var preferredLocations = document.getElementById("preferredLocations");
    var experienceLevel = document.getElementById("experienceLevel");
    var skills = document.getElementById("skills");
    var minMatchScore = document.getElementById("minMatchScore");
    var selected = [];
    if (preferredLocations) {
      for (var i = 0; i < preferredLocations.options.length; i++) {
        if (preferredLocations.options[i].selected) selected.push(preferredLocations.options[i].value);
      }
    }
    var modeCheckboxes = document.querySelectorAll("input[name=preferredMode]:checked");
    var preferredMode = [];
    for (var j = 0; j < modeCheckboxes.length; j++) preferredMode.push(modeCheckboxes[j].value);

    return {
      roleKeywords: roleKeywords ? roleKeywords.value.trim() : "",
      preferredLocations: selected,
      preferredMode: preferredMode,
      experienceLevel: experienceLevel ? experienceLevel.value : "",
      skills: skills ? skills.value.trim() : "",
      minMatchScore: minMatchScore ? parseInt(minMatchScore.value, 10) : Prefs.DEFAULTS.minMatchScore
    };
  }

  function bind() {
    prefill();

    var slider = document.getElementById("minMatchScore");
    var valueEl = document.getElementById("minMatchScoreValue");
    if (slider && valueEl) {
      slider.addEventListener("input", function () {
        valueEl.textContent = slider.value;
      });
    }

    var form = document.getElementById("jnt-settings-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = collectForm();
        if (Prefs.set(data)) {
          if (valueEl) valueEl.textContent = data.minMatchScore;
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
