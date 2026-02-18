/**
 * Job Notification Tracker — Test checklist page UI
 */
(function () {
  var Checklist = window.JobTrackerTestChecklist;
  if (!Checklist) return;

  var summaryCountEl = document.getElementById("jnt-test-summary-count");
  var listEl = document.getElementById("jnt-test-checklist");
  var shipLink = document.getElementById("jnt-nav-ship");

  function updateSummary() {
    var passed = Checklist.passedCount();
    var total = Checklist.TOTAL;
    
    if (summaryCountEl) summaryCountEl.textContent = passed + "/" + total + " PASSED";
    
    if (shipLink) {
      if (Checklist.allPassed()) {
        shipLink.classList.remove("is-locked");
        shipLink.removeAttribute("aria-disabled");
        shipLink.title = "";
      } else {
        shipLink.classList.add("is-locked");
        shipLink.setAttribute("aria-disabled", "true");
        shipLink.title = "Complete all 10 tests to unlock Ship.";
      }
      shipLink.href = "08-ship.html";
    }
  }

  function renderChecklist() {
    var list = Checklist.getList();
    if (!listEl) return;
    var items = listEl.querySelectorAll(".jnt-test-checklist__item");
    items.forEach(function (item, i) {
      var input = item.querySelector(".jnt-test-checklist__input");
      if (input) input.checked = list[i] === true;
    });
    updateSummary();
  }

  function bindChecklist() {
    if (!listEl) return;
    listEl.addEventListener("change", function (e) {
      var input = e.target;
      if (!input || input.type !== "checkbox") return;
      var item = input.closest(".jnt-test-checklist__item");
      if (!item) return;
      var index = parseInt(item.getAttribute("data-index"), 10);
      if (!isNaN(index)) {
        Checklist.setItem(index, input.checked);
        updateSummary();
      }
    });
  }

  function bindReset() {
    var btn = document.getElementById("jnt-test-reset-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        Checklist.reset();
        renderChecklist();
      });
    }
  }

  function init() {
    renderChecklist();
    bindChecklist();
    bindReset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
