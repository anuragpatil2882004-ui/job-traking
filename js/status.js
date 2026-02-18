/**
 * Job Notification Tracker — Job status tracking (localStorage)
 * jobTrackerStatus[jobId] = status
 * jobTrackerStatusUpdates = [ { jobId, title, company, status, dateChanged }, ... ]
 */
window.JobTrackerStatus = (function () {
  var STATUS_KEY = "jobTrackerStatus";
  var UPDATES_KEY = "jobTrackerStatusUpdates";
  var MAX_UPDATES = 50;

  function getStatusMap() {
    try {
      var raw = localStorage.getItem(STATUS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function getStatus(jobId) {
    var map = getStatusMap();
    var s = map[String(jobId)];
    return s === "Applied" || s === "Rejected" || s === "Selected" ? s : "Not Applied";
  }

  function setStatus(jobId, status) {
    var map = getStatusMap();
    map[String(jobId)] = status;
    try {
      localStorage.setItem(STATUS_KEY, JSON.stringify(map));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getUpdates() {
    try {
      var raw = localStorage.getItem(UPDATES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function addStatusUpdate(jobId, title, company, status) {
    var list = getUpdates();
    list.push({
      jobId: String(jobId),
      title: title || "",
      company: company || "",
      status: status,
      dateChanged: new Date().toISOString()
    });
    if (list.length > MAX_UPDATES) list = list.slice(-MAX_UPDATES);
    try {
      localStorage.setItem(UPDATES_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getRecentUpdates(limit) {
    var list = getUpdates();
    if (!limit) limit = 20;
    return list.slice(-limit).reverse();
  }

  return {
    getStatus: getStatus,
    setStatus: setStatus,
    getStatusMap: getStatusMap,
    getRecentUpdates: getRecentUpdates,
    addStatusUpdate: addStatusUpdate
  };
})();
