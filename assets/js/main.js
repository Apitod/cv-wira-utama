(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.getElementById("site-header");
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var themeToggle = document.getElementById("theme-toggle");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var menuOpen = false;

  /* Year */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Hero entrance */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("loaded");
    });
  });

  /* Header solid state via sentinel */
  var sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:44px;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.appendChild(sentinel);

  function syncHeaderSolid() {
    header.classList.toggle(
      "is-solid",
      menuOpen || sentinel.getBoundingClientRect().bottom < 0
    );
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function () {
      syncHeaderSolid();
    }).observe(sentinel);
  } else {
    header.classList.add("is-solid");
  }

  /* Theme */
  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#07131d" : "#0b2133");
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
      );
    }
    if (persist) {
      try { localStorage.setItem("wu-theme", theme); } catch (e) {}
    }
  }
  applyTheme(currentTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", function (event) {
      var stored = null;
      try { stored = localStorage.getItem("wu-theme"); } catch (e) {}
      if (!stored) applyTheme(event.matches ? "dark" : "light", false);
    });
  }

  /* Mobile menu */
  function openMenu() {
    if (!mobileMenu || !menuToggle) return;
    menuOpen = true;
    mobileMenu.hidden = false;
    document.body.classList.add("menu-open");
    header.classList.add("is-solid");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Tutup menu");
    requestAnimationFrame(function () {
      mobileMenu.classList.add("is-open");
      requestAnimationFrame(function () {
        var first = mobileMenu.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      });
    });
  }

  function closeMenu(restoreFocus) {
    if (!mobileMenu || !menuToggle) return;
    menuOpen = false;
    mobileMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka menu");
    window.setTimeout(function () {
      if (!menuOpen) mobileMenu.hidden = true;
    }, 340);
    syncHeaderSolid();
    if (restoreFocus) menuToggle.focus();
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      if (menuOpen) closeMenu(true);
      else openMenu();
    });

    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }
      if (event.key === "Tab") {
        var focusable = mobileMenu.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1020 && menuOpen) closeMenu(false);
    });
  }

  /* Reveal on scroll */
  var revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  /* Active nav link */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var navSections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    var navVisible = new Set();
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) navVisible.add(entry.target.id);
          else navVisible.delete(entry.target.id);
        });

        var activeId = null;
        for (var i = 0; i < navSections.length; i += 1) {
          if (navVisible.has(navSections[i].id)) {
            activeId = navSections[i].id;
            break;
          }
        }

        navLinks.forEach(function (link) {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === "#" + activeId
          );
        });
      },
      { rootMargin: "-34% 0px -56% 0px", threshold: 0 }
    );
    navSections.forEach(function (section) { navObserver.observe(section); });
  }

  /* Floating WhatsApp after hero */
  var waFloat = document.getElementById("wa-float");
  var hero = document.querySelector(".hero");
  if (waFloat && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        waFloat.classList.toggle("is-visible", !entries[0].isIntersecting);
      },
      { threshold: 0.18 }
    ).observe(hero);
  } else if (waFloat) {
    waFloat.classList.add("is-visible");
  }

  /* Gallery controls */
  var galleryTrack = document.getElementById("gallery-track");
  var galleryPrev = document.getElementById("gallery-prev");
  var galleryNext = document.getElementById("gallery-next");

  if (galleryTrack && galleryPrev && galleryNext) {
    function updateGalleryButtons() {
      var maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
      galleryPrev.disabled = galleryTrack.scrollLeft <= 4;
      galleryNext.disabled = galleryTrack.scrollLeft >= maxScroll - 4;
    }
    function scrollGallery(direction) {
      var card = galleryTrack.querySelector(".gcard");
      var step = card ? card.getBoundingClientRect().width + 14 : galleryTrack.clientWidth * 0.6;
      galleryTrack.scrollBy({
        left: direction * step,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    }
    galleryPrev.addEventListener("click", function () { scrollGallery(-1); });
    galleryNext.addEventListener("click", function () { scrollGallery(1); });

    var galleryTicking = false;
    galleryTrack.addEventListener(
      "scroll",
      function () {
        if (galleryTicking) return;
        galleryTicking = true;
        requestAnimationFrame(function () {
          updateGalleryButtons();
          galleryTicking = false;
        });
      },
      { passive: true }
    );
    updateGalleryButtons();
    window.addEventListener("resize", updateGalleryButtons);
  }

  /* Contact form to WhatsApp */
  var form = document.getElementById("wa-form");
  var status = document.getElementById("form-status");
  var WA_NUMBER = "6282123477887";

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = form.elements.nama;
      var phone = form.elements.telp;
      var service = form.elements.layanan;
      var message = form.elements.pesan;
      var cleanPhone = phone.value.replace(/[^0-9]/g, "");

      if (!name.value.trim() || name.value.trim().length < 2) {
        status.textContent = "Mohon isi nama lengkap Anda.";
        status.classList.add("is-error");
        name.focus();
        return;
      }
      if (cleanPhone.length < 9) {
        status.textContent = "Mohon isi nomor WhatsApp yang valid.";
        status.classList.add("is-error");
        phone.focus();
        return;
      }

      status.classList.remove("is-error");
      status.textContent = "Membuka WhatsApp...";

      var text =
        "Halo CV Wira Utama, saya " + name.value.trim() + ".\n" +
        "No. WhatsApp: " + phone.value.trim() + "\n" +
        "Layanan: " + service.value + "\n\n" +
        (message.value.trim() || "Saya ingin konsultasi mengenai pembangunan rumah.");

      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
      window.setTimeout(function () {
        status.textContent = "Jika WhatsApp tidak terbuka, hubungi 0821-2347-7887.";
      }, 1600);
    });
  }

  /* Scroll-driven process section, loaded only where it is used */
  var desktopQuery = window.matchMedia("(min-width: 961px)");
  var processLoadStarted = false;

  function loadScript(src, done) {
    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  function initProcess() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    var processSection = document.querySelector(".process");
    var processPin = document.querySelector(".process-pin");
    var stepEls = Array.prototype.slice.call(document.querySelectorAll(".pstep"));
    var mediaEls = Array.prototype.slice.call(document.querySelectorAll(".pm-item"));
    var counter = document.getElementById("process-current");
    var barFill = document.getElementById("process-bar-fill");

    if (!processSection || !processPin || !stepEls.length) return;

    var activeIndex = -1;
    var setActive = function (index) {
      if (index === activeIndex) return;
      activeIndex = index;
      stepEls.forEach(function (step, i) {
        step.classList.toggle("is-active", i === index);
      });
      mediaEls.forEach(function (item, i) {
        item.classList.toggle("is-active", i === index);
      });
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");
      if (barFill) {
        barFill.style.transform = "scaleX(" + (index + 1) / stepEls.length + ")";
      }
    };

    setActive(0);

    var mm = window.gsap.matchMedia();
    mm.add("(min-width: 961px) and (prefers-reduced-motion: no-preference)", function () {
      var trigger = window.ScrollTrigger.create({
        trigger: processSection,
        start: "top top",
        end: "+=260%",
        pin: processPin,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var index = Math.min(
            stepEls.length - 1,
            Math.floor(self.progress * stepEls.length)
          );
          setActive(index);
        }
      });
      return function () {
        trigger.kill();
        setActive(0);
      };
    });

    window.ScrollTrigger.refresh();
    window.setTimeout(function () {
      window.ScrollTrigger.refresh();
    }, 400);
  }

  function ensureProcess() {
    if (processLoadStarted || !desktopQuery.matches || reduceMotion.matches) return;
    processLoadStarted = true;
    loadScript("assets/js/gsap.min.js", function () {
      loadScript("assets/js/ScrollTrigger.min.js", initProcess);
    });
  }

  ensureProcess();
  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", ensureProcess);
  }

})();
