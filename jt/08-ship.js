/**
 * Job Notification Tracker — Ship page: unlocked only when all 10 tests passed and all 3 proof links provided
 */
(function () {
  var Checklist = window.JobTrackerTestChecklist;
  var ProofLinks = window.JobTrackerProofLinks;
  var lockEl = document.getElementById("jnt-ship-lock");
  var contentEl = document.getElementById("jnt-ship-content");
  var reqTestsEl = document.getElementById("jnt-ship-req-tests");
  var reqLinksEl = document.getElementById("jnt-ship-req-links");
  var testStatusEl = document.getElementById("jnt-ship-test-status");
  var linkStatusEl = document.getElementById("jnt-ship-link-status");
  var shipBtn = document.getElementById("jnt-ship-btn");
  var goTestBtn = document.getElementById("jnt-ship-go-test");
  var goProofBtn = document.getElementById("jnt-ship-go-proof");

  function updateRequirementStatus(element, isComplete) {
    if (!element) return;
    var bulletEl = element.querySelector(".jnt-ship-locked__bullet");
    if (bulletEl) {
      bulletEl.textContent = isComplete ? "✓" : "○";
    }
    if (isComplete) {
      element.classList.add("is-complete");
    } else {
      element.classList.remove("is-complete");
    }
  }

  function updateStatusBadges(testsOk, linksOk) {
    if (testStatusEl) {
      testStatusEl.textContent = testsOk ? "COMPLETED" : "PENDING";
      testStatusEl.className = "jnt-ship-summary__status " + (testsOk ? "jnt-ship-summary__status--completed" : "jnt-ship-summary__status--pending");
    }
    if (linkStatusEl) {
      linkStatusEl.textContent = linksOk ? "COMPLETED" : "PENDING";
      linkStatusEl.className = "jnt-ship-summary__status " + (linksOk ? "jnt-ship-summary__status--completed" : "jnt-ship-summary__status--pending");
    }
  }

  function shipProject() {
    if (shipBtn) {
      shipBtn.textContent = "Shipped!";
      shipBtn.style.backgroundColor = "#38a169";
      setTimeout(function() {
        alert("Congratulations! Your project has been shipped successfully!");
      }, 300);
    }
  }

  function init() {
    var testsOk = Checklist && Checklist.allPassed();
    var linksOk = ProofLinks && ProofLinks.allProvided();
    var unlocked = testsOk && linksOk;
    
    if (lockEl) lockEl.style.display = unlocked ? "none" : "block";
    if (contentEl) contentEl.style.display = unlocked ? "block" : "none";
    
    // Update requirement indicators
    updateRequirementStatus(reqTestsEl, testsOk);
    updateRequirementStatus(reqLinksEl, linksOk);
    
    // Update status badges
    updateStatusBadges(testsOk, linksOk);
    
    // Show/hide buttons based on unlock status
    if (unlocked) {
      if (goTestBtn) goTestBtn.style.display = "none";
      if (goProofBtn) goProofBtn.style.display = "none";
      if (shipBtn) shipBtn.style.display = "inline-block";
    }
    
    // Bind ship button
    if (shipBtn) {
      shipBtn.addEventListener("click", shipProject);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
