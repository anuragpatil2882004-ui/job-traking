/**
 * Job Notification Tracker — Hamburger menu toggle
 */

(function () {
  var nav = document.querySelector(".jnt-nav");
  var toggle = document.querySelector(".jnt-nav__toggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });

  // Close menu when a link is clicked (mobile)
  var links = nav.querySelectorAll(".jnt-nav__link");
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        nav.classList.remove("is-open");
      }
    });
  }
})();
