const menuFilters = document.getElementById("menu-filters");
const menuGrid = document.getElementById("menu-grid");
const storeStatus = document.getElementById("store-status");
const heroHoursCard = document.getElementById("hero-hours-card");
const storeWindow = document.getElementById("store-window");
const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("nav-panel");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const testimonialSlider = document.getElementById("testimonial-slider");
const testimonialCards = Array.from(document.querySelectorAll(".testimonial-card"));
const testimonialDots = document.getElementById("testimonial-dots");
const reviewPrev = document.getElementById("review-prev");
const reviewNext = document.getElementById("review-next");
const inquiryForm = document.getElementById("inquiry-form");
const summaryBlock = document.getElementById("summary-block");
const emailLink = document.getElementById("email-link");
const presetButtons = Array.from(document.querySelectorAll(".preset-pill"));

const STORE_CONFIG = {
  timezone: "Asia/Kolkata",
  openHour: 9,
  closeHour: 22,
  phone: "919515767791",
  email: "info@creammore.in"
};

let menuData = [];
let activeMenu = "all";
let activeReview = 0;
let reviewTimer = null;

function getIndiaTimeParts() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_CONFIG.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const map = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  });

  return {
    weekday: map.weekday,
    hour: Number(map.hour),
    minute: Number(map.minute)
  };
}

function updateStoreStatus() {
  const { hour, minute } = getIndiaTimeParts();
  const currentMinutes = hour * 60 + minute;
  const openMinutes = STORE_CONFIG.openHour * 60;
  const closeMinutes = STORE_CONFIG.closeHour * 60;
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const message = isOpen ? "Open now • closes at 10:00 PM" : "Closed now • opens at 9:00 AM";

  storeStatus.textContent = message;
  storeStatus.classList.toggle("is-closed", !isOpen);
  heroHoursCard.textContent = `Today: ${message}`;
  storeWindow.textContent = `Today: ${message}`;
}

function setCurrentYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

function initRevealObserver() {
  const nodes = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initNavigation() {
  if (!navToggle || !navPanel) {
    return;
  }

  navToggle.addEventListener("click", () => {
    const nextExpanded = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(nextExpanded));
    navPanel.classList.toggle("is-open", nextExpanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navPanel.classList.remove("is-open");
    });
  });

  const sections = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return null;
      }

      return document.querySelector(href);
    })
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = `#${entry.target.id}`;
        const link = navLinks.find((navLink) => navLink.getAttribute("href") === id);
        if (link) {
          link.classList.toggle("is-current", entry.isIntersecting);
        }
      });
    },
    {
      rootMargin: "-40% 0px -45% 0px",
      threshold: 0
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  window.addEventListener("scroll", () => {
    siteHeader.classList.toggle("is-compact", window.scrollY > 24);
  });
}

async function loadMenu() {
  try {
    const response = await fetch("assets/menu.json");
    if (!response.ok) {
      throw new Error(`Menu request failed with ${response.status}`);
    }

    menuData = await response.json();
    renderMenuFilters();
    renderMenu();
  } catch (error) {
    menuGrid.innerHTML = `
      <div class="loading-copy">
        The dynamic menu could not load right now. Please call <a href="tel:+919515767791">095157 67791</a>
        or use the planner below for the latest availability.
      </div>
    `;
    console.error(error);
  }
}

function renderMenuFilters() {
  if (!menuFilters) {
    return;
  }

  const buttons = [
    { id: "all", label: "All picks" },
    ...menuData.map((category) => ({
      id: category.id,
      label: category.label
    }))
  ];

  menuFilters.innerHTML = buttons
    .map(
      (button) => `
        <button
          class="chip ${button.id === activeMenu ? "is-active" : ""}"
          type="button"
          data-category="${button.id}"
        >
          ${button.label}
        </button>
      `
    )
    .join("");

  menuFilters.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeMenu = chip.dataset.category || "all";
      renderMenuFilters();
      renderMenu();
    });
  });
}

function getVisibleMenuItems() {
  if (activeMenu === "all") {
    return menuData.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryLabel: category.label
      }))
    );
  }

  const category = menuData.find((entry) => entry.id === activeMenu);
  if (!category) {
    return [];
  }

  return category.items.map((item) => ({
    ...item,
    categoryLabel: category.label
  }));
}

function renderMenu() {
  const visibleItems = getVisibleMenuItems();

  if (!visibleItems.length) {
    menuGrid.innerHTML = `<div class="loading-copy">No items found in this category yet.</div>`;
    return;
  }

  menuGrid.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="menu-card reveal is-visible" data-accent="${item.accent}">
          <div class="menu-card-top">
            <div>
              <p class="mini-label">${item.categoryLabel}</p>
              <h3>${item.name}</h3>
            </div>
            <span class="menu-price">${item.price}</span>
          </div>

          <p>${item.description}</p>

          <div class="tag-list">
            ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>

          <div class="menu-card-footer">
            <span class="category-label">${item.note}</span>
            <span class="status-badge ${item.statusTone}">${item.statusLabel}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function getFormValues() {
  return {
    customerName: document.getElementById("customer-name")?.value.trim() || "",
    customerPhone: document.getElementById("customer-phone")?.value.trim() || "",
    orderType: document.getElementById("order-type")?.value || "Custom enquiry",
    guestCount: document.getElementById("guest-count")?.value || "4",
    budgetRange: document.getElementById("budget-range")?.value || "Around ₹300 to ₹600",
    pickupSlot: document.getElementById("pickup-slot")?.value || "Today",
    favoritePick: document.getElementById("favorite-pick")?.value || "Need suggestions",
    orderNotes: document.getElementById("order-notes")?.value.trim() || "Please suggest the best combination."
  };
}

function buildInquiryMessage(values) {
  const lines = [
    "Hi Cream More team,",
    `My name is ${values.customerName || "a customer browsing creamyinn.app"}.`,
    `I am planning: ${values.orderType}.`,
    `Guest count: ${values.guestCount}.`,
    `Budget: ${values.budgetRange}.`,
    `Pickup timing: ${values.pickupSlot}.`,
    `Favourite pick: ${values.favoritePick}.`,
    `Notes: ${values.orderNotes}`
  ];

  if (values.customerPhone) {
    lines.splice(2, 0, `Callback number: ${values.customerPhone}.`);
  }

  lines.push("Please suggest the best options and confirm availability. Thank you.");
  return lines.join("\n");
}

function updateSummary() {
  const values = getFormValues();
  const message = buildInquiryMessage(values);

  summaryBlock.textContent = message;

  const emailSubject = encodeURIComponent(`Cream More enquiry from ${values.customerName || "website visitor"}`);
  const emailBody = encodeURIComponent(message);
  emailLink.href = `mailto:${STORE_CONFIG.email}?subject=${emailSubject}&body=${emailBody}`;
}

function applyPreset(preset) {
  const config = {
    "family-night": {
      orderType: "Family order",
      guestCount: "4",
      budgetRange: "Around ₹300 to ₹600",
      pickupSlot: "Today",
      favoritePick: "Vanilla family pack",
      orderNotes: "We want easy take-home tubs for a family evening."
    },
    "birthday-party": {
      orderType: "Birthday celebration",
      guestCount: "20",
      budgetRange: "Around ₹1,200 to ₹2,500",
      pickupSlot: "This weekend",
      favoritePick: "Need suggestions",
      orderNotes: "Please suggest a good mix for a birthday celebration."
    },
    "office-treats": {
      orderType: "Office treats",
      guestCount: "15",
      budgetRange: "Custom quote needed",
      pickupSlot: "Tomorrow",
      favoritePick: "Butter Scotch family pack",
      orderNotes: "Looking for an easy office-sharing order."
    }
  }[preset];

  if (!config) {
    return;
  }

  document.getElementById("order-type").value = config.orderType;
  document.getElementById("guest-count").value = config.guestCount;
  document.getElementById("budget-range").value = config.budgetRange;
  document.getElementById("pickup-slot").value = config.pickupSlot;
  document.getElementById("favorite-pick").value = config.favoritePick;
  document.getElementById("order-notes").value = config.orderNotes;

  presetButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === preset);
  });

  updateSummary();
}

function initForm() {
  if (!inquiryForm) {
    return;
  }

  inquiryForm.addEventListener("input", updateSummary);
  inquiryForm.addEventListener("change", updateSummary);

  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = getFormValues();

    if (!values.customerName) {
      document.getElementById("customer-name")?.focus();
      return;
    }

    const message = buildInquiryMessage(values);
    const whatsappUrl = `https://wa.me/${STORE_CONFIG.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener");
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset || "");
    });
  });

  updateSummary();
}

function renderReviewDots() {
  if (!testimonialDots) {
    return;
  }

  testimonialDots.innerHTML = testimonialCards
    .map(
      (_, index) => `
        <button
          type="button"
          class="${index === activeReview ? "is-active" : ""}"
          aria-label="Show review ${index + 1}"
          data-review-index="${index}"
        ></button>
      `
    )
    .join("");

  testimonialDots.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      showReview(Number(button.dataset.reviewIndex));
      resetReviewTimer();
    });
  });
}

function showReview(index) {
  activeReview = (index + testimonialCards.length) % testimonialCards.length;

  testimonialCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === activeReview);
  });

  testimonialDots.querySelectorAll("button").forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activeReview);
  });
}

function resetReviewTimer() {
  if (reviewTimer) {
    window.clearInterval(reviewTimer);
  }

  reviewTimer = window.setInterval(() => {
    showReview(activeReview + 1);
  }, 5000);
}

function initReviews() {
  if (!testimonialSlider || !testimonialCards.length) {
    return;
  }

  renderReviewDots();
  showReview(0);
  resetReviewTimer();

  reviewPrev?.addEventListener("click", () => {
    showReview(activeReview - 1);
    resetReviewTimer();
  });

  reviewNext?.addEventListener("click", () => {
    showReview(activeReview + 1);
    resetReviewTimer();
  });
}

function initFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    if (!trigger || !answer) {
      return;
    }

    trigger.addEventListener("click", () => {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
      answer.hidden = isExpanded;
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.location.protocol.startsWith("http")) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}

function init() {
  setCurrentYear();
  updateStoreStatus();
  window.setInterval(updateStoreStatus, 60000);
  initRevealObserver();
  initNavigation();
  initForm();
  initReviews();
  initFaq();
  loadMenu();
  registerServiceWorker();
}

init();
