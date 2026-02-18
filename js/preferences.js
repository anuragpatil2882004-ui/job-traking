/**
 * Job Notification Tracker — Preferences load/save (jobTrackerPreferences)
 */
window.JobTrackerPreferences = (function () {
  var KEY = "jobTrackerPreferences";
  var DEFAULTS = {
    roleKeywords: "",
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: "",
    skills: "",
    minMatchScore: 40
  };

  function get() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return {
        roleKeywords: data.roleKeywords != null ? data.roleKeywords : DEFAULTS.roleKeywords,
        preferredLocations: Array.isArray(data.preferredLocations) ? data.preferredLocations : DEFAULTS.preferredLocations,
        preferredMode: Array.isArray(data.preferredMode) ? data.preferredMode : DEFAULTS.preferredMode,
        experienceLevel: data.experienceLevel != null ? data.experienceLevel : DEFAULTS.experienceLevel,
        skills: data.skills != null ? data.skills : DEFAULTS.skills,
        minMatchScore: typeof data.minMatchScore === "number" ? Math.min(100, Math.max(0, data.minMatchScore)) : DEFAULTS.minMatchScore
      };
    } catch (e) {
      return null;
    }
  }

  function set(data) {
    var payload = {
      roleKeywords: data.roleKeywords != null ? String(data.roleKeywords) : DEFAULTS.roleKeywords,
      preferredLocations: Array.isArray(data.preferredLocations) ? data.preferredLocations : DEFAULTS.preferredLocations,
      preferredMode: Array.isArray(data.preferredMode) ? data.preferredMode : DEFAULTS.preferredMode,
      experienceLevel: data.experienceLevel != null ? String(data.experienceLevel) : DEFAULTS.experienceLevel,
      skills: data.skills != null ? String(data.skills) : DEFAULTS.skills,
      minMatchScore: typeof data.minMatchScore === "number" ? Math.min(100, Math.max(0, data.minMatchScore)) : DEFAULTS.minMatchScore
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }

  return { get: get, set: set, KEY: KEY, DEFAULTS: DEFAULTS };
})();
