/* ============================================================
   VetVida — Clínica Veterinária | main.js
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initFaq();
    initForm();
    initBackToTop();
    initActiveNav();
    initFooterYear();
  });

  /* ---------- Sticky header shadow ---------- */
  function initHeader() {
    const header = $("#site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    const toggle = $("#nav-toggle");
    const nav = $("#main-nav");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 880) setOpen(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    const nums = $$(".stat-num");
    if (!nums.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString("pt-BR");
        return;
      }
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("pt-BR");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    nums.forEach((el) => io.observe(el));
  }

  /* ---------- FAQ accordion (only one open at a time) ---------- */
  function initFaq() {
    const items = $$(".faq-item");
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ---------- Contact form validation ---------- */
  function initForm() {
    const form = $("#contact-form");
    if (!form) return;

    const fields = {
      nome: { input: $("#nome"), validate: (v) => v.trim().length >= 3 || "Please enter your full name." },
      email: { input: $("#email"), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address." },
      telefone: { input: $("#telefone"), validate: (v) => v.replace(/\D/g, "").length >= 10 || "Please enter a valid phone number." },
      assunto: { input: $("#assunto"), validate: (v) => v !== "" || "Please select a subject." },
      mensagem: { input: $("#mensagem"), validate: (v) => v.trim().length >= 10 || "Please tell us a bit more (min. 10 characters)." }
    };

    const lgpd = $("#lgpd");
    const lgpdError = $(".lgpd-error", form);
    const status = $(".form-status", form);

    const setError = (field, message) => {
      const wrap = field.closest(".form-group");
      const err = wrap ? $(".form-error", wrap) : null;
      field.classList.add("invalid");
      field.setAttribute("aria-invalid", "true");
      if (err) err.textContent = message;
    };

    const clearError = (field) => {
      const wrap = field.closest(".form-group");
      const err = wrap ? $(".form-error", wrap) : null;
      field.classList.remove("invalid");
      field.removeAttribute("aria-invalid");
      if (err) err.textContent = "";
    };

    Object.values(fields).forEach(({ input }) => {
      input.addEventListener("input", () => clearError(input));
      input.addEventListener("blur", () => {
        if (input.value !== "") {
          const res = fields[input.id].validate(input.value);
          if (res !== true) setError(input, res);
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.textContent = "";
      status.className = "form-status";

      let firstInvalid = null;
      Object.keys(fields).forEach((key) => {
        const { input, validate } = fields[key];
        const res = validate(input.value);
        if (res !== true) {
          setError(input, res);
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearError(input);
        }
      });

      if (!lgpd.checked) {
        lgpd.classList.add("invalid");
        lgpdError.textContent = "You need to accept the terms to send your message.";
        if (!firstInvalid) firstInvalid = lgpd;
      } else {
        lgpd.classList.remove("invalid");
        lgpdError.textContent = "";
      }

      if (firstInvalid) {
        firstInvalid.focus();
        status.textContent = "Oops! Please review the highlighted fields and try again.";
        status.className = "form-status error";
        return;
      }

      status.textContent = "Message sent successfully! We'll get back to you within 1 business hour. Thank you!";
      status.className = "form-status success";
      form.reset();
    });

    lgpd.addEventListener("change", () => {
      lgpd.classList.remove("invalid");
      lgpdError.textContent = "";
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    const btn = $("#back-to-top");
    if (!btn) return;

    const onScroll = () => btn.classList.toggle("visible", window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
  }

  /* ---------- Active nav link on scroll ---------- */
  function initActiveNav() {
    const links = $$(".nav-link");
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach((sec) => io.observe(sec));
  }

  /* ---------- Footer year ---------- */
  function initFooterYear() {
    const el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
