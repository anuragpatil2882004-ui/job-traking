/**
 * Job Notification Tracker — Built-in test checklist (localStorage)
 * Key: jnt_test_checklist — array of 10 booleans
 */
window.JobTrackerTestChecklist = (function () {
  var KEY = "jnt_test_checklist";
  var TOTAL = 10;

  function getList() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return new Array(TOTAL).fill(false);
      var arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length >= TOTAL ? arr.slice(0, TOTAL) : new Array(TOTAL).fill(false);
    } catch (e) {
      return new Array(TOTAL).fill(false);
    }
  }

  function setList(arr) {
    var list = arr.slice(0, TOTAL);
    while (list.length < TOTAL) list.push(false);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getItem(index) {
    var list = getList();
    return index >= 0 && index < TOTAL ? list[index] : false;
  }

  function setItem(index, checked) {
    var list = getList();
    if (index >= 0 && index < TOTAL) {
      list[index] = !!checked;
      return setList(list);
    }
    return false;
  }

  function allPassed() {
    var list = getList();
    for (var i = 0; i < TOTAL; i++) {
      if (!list[i]) return false;
    }
    return true;
  }

  function passedCount() {
    var list = getList();
    var n = 0;
    for (var i = 0; i < TOTAL; i++) {
      if (list[i]) n++;
    }
    return n;
  }

  function reset() {
    return setList(new Array(TOTAL).fill(false));
  }

  function syncNavShipLink() {
    var el = document.getElementById("jnt-nav-ship");
    if (!el) return;
    if (!allPassed()) {
      el.classList.add("is-locked");
      el.setAttribute("aria-disabled", "true");
      el.title = "Complete all 10 tests to unlock Ship.";
    } else {
      el.classList.remove("is-locked");
      el.removeAttribute("aria-disabled");
      el.title = "";
    }
  }

  return {
    getList: getList,
    setList: setList,
    getItem: getItem,
    setItem: setItem,
    allPassed: allPassed,
    passedCount: passedCount,
    reset: reset,
    syncNavShipLink: syncNavShipLink,
    TOTAL: TOTAL
  };
})();

(function () {
  var Checklist = window.JobTrackerTestChecklist;
  if (!Checklist || !Checklist.syncNavShipLink) return;
  function run() { Checklist.syncNavShipLink(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
