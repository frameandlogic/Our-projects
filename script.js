/* La'Delicious — theme, mobile nav, filters, bookings. */

const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
const modal = document.querySelector("#reserve-modal");
const form = document.querySelector("#reserve-form");
const bookingList = document.querySelector("#booking-list");
const emptyBookings = document.querySelector("#empty-bookings");
const STORAGE_KEY = "momo-bookings";

/* ----- Restaurant identity ----- */
document.title = "La'Delicious | Himalayan Kitchen";
const description = document.querySelector('meta[name="description"]');
if (description) {
  description.content = "La'Delicious — Himalayan kitchen in Melbourne. View the menu, gallery, hours, location, and book a table.";
}
document.querySelectorAll(".brand-name").forEach((brand) => {
  brand.textContent = "La'Delicious";
});
document.querySelector('.brand[aria-label]')?.setAttribute("aria-label", "La'Delicious home");
document.querySelector('.about-media img')?.setAttribute("alt", "Warm dining room at La'Delicious");
const copyright = document.querySelector(".copyright span");
if (copyright) copyright.textContent = "© 2026 La'Delicious";
const emailLink = document.querySelector('a[href^="mailto:"]');
if (emailLink) emailLink.href = "mailto:hello@ladelicious.com";

/* ----- Refreshed navigation layout ----- */
const navStyles = document.createElement("style");
navStyles.textContent = `
  @media (min-width: 761px) {
    .nav-wrap {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 28px;
    }

    .main-nav {
      justify-self: center;
      align-items: center;
      gap: 4px;
      margin-left: 0;
      padding: 5px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: color-mix(in srgb, var(--card) 82%, transparent);
      box-shadow: 0 6px 18px rgba(20, 37, 59, 0.08);
    }

    .main-nav a {
      padding: 9px 14px;
      border-radius: 999px;
      transition: color 0.3s ease, background 0.3s ease;
    }

    .main-nav a:hover,
    .main-nav a.is-active {
      color: var(--text);
      background: var(--bg-soft);
    }

    .main-nav a.is-active::after {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .main-nav {
      border-radius: 0;
      box-shadow: none;
    }
  }
`;
document.head.appendChild(navStyles);

/* ----- Theme ----- */
const savedTheme = localStorage.getItem("momo-theme");
if (savedTheme === "dark" || savedTheme === "light") {
  root.dataset.theme = savedTheme;
}

function syncThemeButton() {
  const dark = root.dataset.theme === "dark";
  themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

syncThemeButton();

themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("momo-theme", root.dataset.theme);
  syncThemeButton();
});

/* ----- Mobile navigation ----- */
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

/* ----- Active section underline ----- */
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...nav.querySelectorAll("a")];

function setActiveNav() {
  const y = window.scrollY + 120;
  let current = "home";
  sections.forEach((section) => {
    if (section.offsetTop <= y) current = section.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
  });
}

window.addEventListener("scroll", setActiveNav, { passive: true });

/* ----- Menu filters ----- */
document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".menu-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

/* ----- Bookings ----- */
function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function renderBookings() {
  const bookings = loadBookings();
  bookingList.innerHTML = "";
  emptyBookings.classList.toggle("is-hidden", bookings.length > 0);

  bookings.forEach((booking, index) => {
    const item = document.createElement("li");
    item.className = "booking-item";
    item.innerHTML = `
      <div>
        <strong>${booking.name}</strong>
        <small>${booking.date} · ${booking.time} · ${booking.guests} guests</small>
      </div>
      <button type="button" class="btn btn-ghost" data-remove="${index}" aria-label="Cancel booking">Cancel</button>
    `;
    bookingList.appendChild(item);
  });
}

bookingList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const bookings = loadBookings();
  bookings.splice(Number(button.dataset.remove), 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  renderBookings();
});

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  form.elements.name.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", openModal);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const booking = {
    name: String(data.get("name")).trim(),
    email: String(data.get("email")).trim(),
    date: String(data.get("date")),
    time: form.elements.time.selectedOptions[0].text,
    guests: String(data.get("guests")),
  };
  const bookings = loadBookings();
  bookings.unshift(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  renderBookings();
  form.querySelector(".form-status").textContent = `Thanks, ${booking.name}. Your table is held.`;
  form.reset();
  setTimeout(closeModal, 900);
});

const dateInput = form.elements.date;
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;
dateInput.value = today;

renderBookings();
setActiveNav();