/**
 * Job Notification Tracker — Proof artifact links (localStorage)
 * Key: jnt_proof_links — { lovableLink, githubLink, deployedUrl }
 */
window.JobTrackerProofLinks = (function () {
  var KEY = "jnt_proof_links";

  function isValidUrl(s) {
    if (!s || typeof s !== "string") return false;
    var t = s.trim();
    if (t.length < 10) return false;
    return /^https?:\/\/[^\s]+$/i.test(t);
  }

  function get() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { lovableLink: "", githubLink: "", deployedUrl: "" };
      var o = JSON.parse(raw);
      return {
        lovableLink: o.lovableLink || "",
        githubLink: o.githubLink || "",
        deployedUrl: o.deployedUrl || ""
      };
    } catch (e) {
      return { lovableLink: "", githubLink: "", deployedUrl: "" };
    }
  }

  function set(links) {
    var o = {
      lovableLink: (links.lovableLink || "").trim(),
      githubLink: (links.githubLink || "").trim(),
      deployedUrl: (links.deployedUrl || "").trim()
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
      return true;
    } catch (e) {
      return false;
    }
  }

  function setOne(key, value) {
    var o = get();
    o[key] = (value || "").trim();
    return set(o);
  }

  function allProvided() {
    var o = get();
    return isValidUrl(o.lovableLink) && isValidUrl(o.githubLink) && isValidUrl(o.deployedUrl);
  }

  return {
    get: get,
    set: set,
    setOne: setOne,
    isValidUrl: isValidUrl,
    allProvided: allProvided
  };
})();
