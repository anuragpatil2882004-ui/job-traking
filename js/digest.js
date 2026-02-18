/**
 * Job Notification Tracker — Daily Digest Engine
 * Top 10 by matchScore desc, then postedDaysAgo asc. Persist per day.
 */
(function () {
  var Prefs = window.JobTrackerPreferences;

  function getTodayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return "jobTrackerDigest_" + y + "-" + m + "-" + day;
  }

  function getDigestForKey(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getDigestForToday() {
    return getDigestForKey(getTodayKey());
  }

  function setDigestForKey(key, jobs) {
    try {
      localStorage.setItem(key, JSON.stringify(jobs));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Same scoring rules as dashboard (deterministic).
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

  /**
   * Generate top 10: sort by matchScore desc, then postedDaysAgo asc.
   * Returns array of job objects with matchScore attached.
   */
  function generateDigest() {
    var prefs = Prefs ? Prefs.get() : null;
    if (!prefs) return { jobs: null, error: "no_prefs" };

    var jobs = window.JOB_LIST;
    if (!jobs || !Array.isArray(jobs)) return { jobs: [], error: null };

    var withScore = jobs.map(function (j) {
      var copy = {};
      for (var k in j) if (Object.prototype.hasOwnProperty.call(j, k)) copy[k] = j[k];
      copy.matchScore = computeMatchScore(copy, prefs);
      return copy;
    });

    withScore.sort(function (a, b) {
      var sa = a.matchScore || 0;
      var sb = b.matchScore || 0;
      if (sb !== sa) return sb - sa;
      return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0);
    });

    var top10 = withScore.slice(0, 10);
    return { jobs: top10, error: null };
  }

  /**
   * Get or create today's digest. If already stored for today, return stored; else generate, store, return.
   */
  function getOrCreateTodayDigest() {
    var key = getTodayKey();
    var existing = getDigestForKey(key);
    if (existing && Array.isArray(existing) && existing.length > 0) return { jobs: existing, fromCache: true };

    var result = generateDigest();
    if (result.error === "no_prefs") return result;
    if (result.jobs && result.jobs.length > 0) setDigestForKey(key, result.jobs);
    return { jobs: result.jobs || [], fromCache: false };
  }

  function formatDigestPlainText(jobs, dateLabel) {
    var lines = ["Top 10 Jobs For You — 9AM Digest", dateLabel || "", ""];
    if (!jobs || !jobs.length) return lines.join("\n");
    jobs.forEach(function (j, i) {
      lines.push((i + 1) + ". " + (j.title || "") + " at " + (j.company || ""));
      lines.push("   Location: " + (j.location || "") + " | Experience: " + (j.experience || "") + " | Match: " + (j.matchScore || 0) + "%");
      lines.push("   Apply: " + (j.applyUrl || ""));
      lines.push("");
    });
    lines.push("This digest was generated based on your preferences.");
    return lines.join("\n");
  }

  function getTodayDateLabel() {
    var d = new Date();
    return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  window.JobTrackerDigest = {
    getTodayKey: getTodayKey,
    getDigestForToday: getDigestForToday,
    getOrCreateTodayDigest: getOrCreateTodayDigest,
    generateDigest: generateDigest,
    formatDigestPlainText: formatDigestPlainText,
    getTodayDateLabel: getTodayDateLabel
  };
})();
