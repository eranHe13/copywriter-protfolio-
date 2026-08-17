/* ============================================================
   main.js — hero typing intro, scroll reveals, smooth-scroll nav,
   footer year. (Marquee is pure CSS.)
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero intro ----------
     One line at a time: it types itself, holds, erases, and only then does the
     next one start (the punch line lingers a second longer). Once the last line
     clears, the nav wordmark types itself out in the corner, the rest of the nav
     joins it, and the chrome mark fades up in the centre. Nothing else is on
     screen and the page is scroll-locked until then. Afterwards, scrolling
     shrinks the chrome mark into the middle of the nav, where it stays.
     Click or any key skips to the end. */
  var hero = document.getElementById("hero");
  var manifesto = hero ? hero.querySelector(".hero__manifesto") : null;
  var lines = manifesto ? [].slice.call(manifesto.querySelectorAll("p")) : [];
  var nav = document.querySelector(".nav");
  var navMark = document.querySelector(".nav__mark");
  var chrome = document.getElementById("chrome");

  if (lines.length && nav && navMark && chrome && !reduceMotion) {
    var CHAR_MS    = 55;     // typing speed, per character
    var ERASE_MS   = 26;     // erasing runs faster than typing
    var HOLD_MS    = 850;    // beat between a finished line and its erase
    var LAST_EXTRA = 1000;   // the punch line lingers this much longer
    var GAP_MS     = 240;    // blank beat between lines
    var FADE_MS    = 850;    // the closing line's dissolve
    var MARK_MS    = 70;     // wordmark typing speed
    var DOCK_H     = 40;     // height the chrome mark docks to, in px

    var texts = lines.map(function (p) { return p.textContent.trim(); });
    var markText = navMark.textContent.trim();
    var timer = 0, done = false;

    hero.classList.add("hero--type");
    document.body.classList.add("is-intro");
    lines.forEach(function (p) { p.textContent = ""; });
    navMark.textContent = "";

    var teardown = function () {
      document.removeEventListener("click", skip);
      document.removeEventListener("keydown", skip);
    };

    // Scroll dock: the chrome mark shrinks and rides up into the nav's centre.
    var dockDy = 0, dockScale = 1, narrow = false, queued = false;

    var measure = function () {
      chrome.style.transform = "translate(-50%, -50%)";
      var c = chrome.getBoundingClientRect(), n = nav.getBoundingClientRect();
      dockScale = c.height ? Math.min(1, DOCK_H / c.height) : 1;
      dockDy = (n.top + n.height / 2) - (c.top + c.height / 2);
      // On phones the wordmark fills the bar, so there is no middle to dock into.
      narrow = window.matchMedia("(max-width: 620px)").matches;
    };

    var applyDock = function () {
      queued = false;
      var range = window.innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, window.scrollY / range));
      chrome.style.transform =
        "translate(-50%, -50%) translateY(" + (dockDy * p).toFixed(1) + "px)" +
        " scale(" + (1 + (dockScale - 1) * p).toFixed(3) + ")";
      chrome.style.opacity = narrow ? (1 - p).toFixed(3) : "";
    };

    var onScroll = function () {
      if (!queued) { queued = true; requestAnimationFrame(applyDock); }
    };

    var openSite = function () {
      document.body.classList.remove("is-intro");
      measure();
      applyDock();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", function () { measure(); applyDock(); });
    };

    var showChrome = function (instant) {
      document.body.classList.add("is-chrome");
      if (instant) { openSite(); return; }
      timer = setTimeout(function () {
        done = true;
        teardown();
        openSite();
      }, 900);
    };

    // The wordmark types itself into the corner, then the rest of the nav joins.
    var typeMark = function () {
      document.body.classList.add("is-mark");
      navMark.classList.add("is-typing");
      var pos = 0;
      var step = function () {
        if (done) return;
        navMark.textContent = markText.slice(0, ++pos);
        if (pos < markText.length) { timer = setTimeout(step, MARK_MS); return; }
        navMark.classList.remove("is-typing");
        timer = setTimeout(function () {
          document.body.classList.add("is-nav");
          timer = setTimeout(function () { showChrome(false); }, 700);
        }, 320);
      };
      timer = setTimeout(step, 260);
    };

    var skip = function () {
      if (done) return;
      done = true;
      clearTimeout(timer);
      lines.forEach(function (p) {
        p.textContent = "";
        p.classList.remove("is-live", "is-shown", "is-typing");
      });
      navMark.textContent = markText;
      navMark.classList.remove("is-typing");
      document.body.classList.add("is-mark", "is-nav");
      teardown();
      showChrome(true);
    };

    var eraseLine = function (el, next) {
      var text = el.textContent, pos = text.length;
      el.classList.add("is-typing");
      var step = function () {
        if (done) return;
        el.textContent = text.slice(0, --pos);
        if (pos > 0) { timer = setTimeout(step, ERASE_MS); return; }
        el.classList.remove("is-typing", "is-shown");
        timer = setTimeout(function () {
          el.classList.remove("is-live");
          next();
        }, 200);
      };
      timer = setTimeout(step, 80);
    };

    // The closing line is not backspaced — it dissolves and drifts up, handing
    // off to the wordmark rather than being un-typed like the ones before it.
    var fadeLine = function (el, next) {
      el.classList.add("is-fading");
      timer = setTimeout(function () {
        el.classList.remove("is-live", "is-shown", "is-fading");
        el.textContent = "";
        next();
      }, FADE_MS + 120);
    };

    var typeLine = function (i) {
      if (done) return;
      if (i >= lines.length) { typeMark(); return; }

      var el = lines[i], text = texts[i], pos = 0;
      var isLast = (i === lines.length - 1);
      el.classList.add("is-live", "is-typing");
      void el.offsetWidth;               // flush, so the reveal has a state to animate from
      el.classList.add("is-shown");

      var step = function () {
        if (done) return;
        el.textContent = text.slice(0, ++pos);
        if (pos < text.length) { timer = setTimeout(step, CHAR_MS); return; }
        el.classList.remove("is-typing");
        var hold = HOLD_MS + (isLast ? LAST_EXTRA : 0);
        var leave = isLast ? fadeLine : eraseLine;
        timer = setTimeout(function () {
          leave(el, function () {
            timer = setTimeout(function () { typeLine(i + 1); }, GAP_MS);
          });
        }, hold);
      };
      timer = setTimeout(step, 180);
    };

    document.addEventListener("click", skip);
    document.addEventListener("keydown", skip);
    typeLine(0);
  }

  /* ---------- Work list → project popup ----------
     Nothing expands in the list. Clicking a title opens a dialog built from that
     row's own markup, so the copy and artwork live in the HTML exactly once.
     Closes on the ✕, the backdrop, or Escape, and hands focus back where it came
     from. */
  var workRows = [].slice.call(document.querySelectorAll("[data-row]"));
  var modal = document.getElementById("modal");

  if (workRows.length && modal) {
    var mTitle = modal.querySelector(".modal__title");
    var mBody = modal.querySelector(".modal__body");
    var mMedia = modal.querySelector(".modal__media");
    var closeBtn = modal.querySelector(".modal__close");
    var opener = null;

    var closeModal = function () {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");
      var finish = function () {
        modal.hidden = true;
        mBody.textContent = "";
        mMedia.textContent = "";
      };
      if (reduceMotion) finish();
      else setTimeout(finish, 320);         // let the fade finish before unmounting
      if (opener) { opener.focus(); opener = null; }
    };

    var openModal = function (row, btn) {
      opener = btn;
      var title = row.querySelector(".row__title");
      var copy = row.querySelector(".row__more > div");
      var media = row.querySelector(".row__media");

      mTitle.textContent = title ? title.textContent : "";

      // Append the cloned block whole: moving its children one by one would walk
      // a live NodeList while emptying it, and silently drop half the copy.
      mBody.textContent = "";
      if (copy) mBody.appendChild(copy.cloneNode(true));

      mMedia.textContent = "";
      if (media) {
        [].forEach.call(media.querySelectorAll("img"), function (img) {
          var c = img.cloneNode(true);
          c.loading = "eager";               // it is on screen the moment it mounts
          mMedia.appendChild(c);
        });
      }

      modal.hidden = false;
      document.body.classList.add("modal-open");
      void modal.offsetWidth;                // flush, so the fade has a start state
      modal.classList.add("is-open");
      closeBtn.focus();
    };

    workRows.forEach(function (row) {
      var btn = row.querySelector("button");
      if (!btn) return;
      btn.removeAttribute("aria-expanded");
      btn.removeAttribute("aria-controls");
      btn.setAttribute("aria-haspopup", "dialog");
      btn.addEventListener("click", function () { openModal(row, btn); });
    });

    modal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  // Footer year.
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll reveals via IntersectionObserver (skipped under reduced motion).
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Smooth-scroll for in-page nav links (respects reduced motion).
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
})();
