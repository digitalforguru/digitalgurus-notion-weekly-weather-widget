const weatherWidget = document.getElementById("weatherWidget");

const cityInput = document.getElementById("cityInput");
const locationPopup = document.getElementById("locationPopup");
const locationBtn = document.getElementById("locationBtn");

const themeToggle = document.getElementById("themeToggle");
const themeOptions = document.getElementById("themeOptions");
const themeCircles = document.querySelectorAll(".theme-circle");

const fontToggle = document.getElementById("fontToggle");
const fontOptions = document.getElementById("fontOptions");
const fontChoices = document.querySelectorAll(".font-option");

const copyLinkBtn = document.getElementById("copyLinkBtn");

const liveDateEl = document.getElementById("liveDate");

const params = new URLSearchParams(window.location.search);
const isEmbed = params.get("embed") === "true";

/* =========================
   ICON MAP
========================= */
const iconMap = {
  Clear:
    "https://i.pinimg.com/originals/09/fb/e5/09fbe54e3fdbf459e490006c56f999f9.gif",

  Clouds:
    "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",

  Rain:
    "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",

  Snow:
    "https://i.pinimg.com/originals/6e/36/7c/6e367ce95ab109121d03f12ed7d250c8.gif",

  Thunderstorm:
    "https://i.pinimg.com/originals/86/5e/10/865e10e7bcc6a739e01598dfbe38e300.gif",

  Fog:
    "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif"
};

const cloudIconURL = iconMap.Clouds;

/* =========================
   EMBED MODE
========================= */
if (isEmbed) {
  document
    .querySelector(".builder-ui")
    ?.style.setProperty("display", "none");
}

/* =========================
   LIVE DATE
========================= */
function updateLiveDate() {
  if (!liveDateEl) return;

  const now = new Date();

  liveDateEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

updateLiveDate();
setInterval(updateLiveDate, 60000);

/* =========================
   FONT SYSTEM
========================= */
function applyFont(font) {
  let fontFamily = "";

  if (font === "serif") {
    fontFamily = "Georgia, serif";
  } else if (font === "mono") {
    fontFamily = "ui-monospace, monospace";
  } else {
    fontFamily = "'Satoshi', sans-serif";
  }

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   THEME SYSTEM
========================= */
function applyTheme(theme) {
  weatherWidget.className = `widget ${theme} weekly-widget`;
}

/* =========================
   URL STATE
========================= */
function getStateFromURL() {
  return {
    city: params.get("city") || "Los Angeles",
    theme: params.get("theme") || "pink",
    font: params.get("font") || "default"
  };
}

/* =========================
   FONT UI
========================= */
fontToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  fontOptions.classList.toggle("hidden");
});

fontChoices.forEach((opt) => {
  opt.addEventListener("click", () => {
    const font = opt.dataset.font;

    applyFont(font);

    params.set("font", font);

    window.history.replaceState(
      {},
      "",
      `${location.pathname}?${params.toString()}`
    );

    fontOptions.classList.add("hidden");
  });
});

/* =========================
   THEME UI
========================= */
themeToggle?.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach((circle) => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;

    applyTheme(theme);

    params.set("theme", theme);

    window.history.replaceState(
      {},
      "",
      `${location.pathname}?${params.toString()}`
    );

    themeOptions.classList.add("hidden");
  });
});

/* =========================
   LOCATION UI
========================= */
locationBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  locationPopup.classList.toggle("hidden");

  if (!locationPopup.classList.contains("hidden")) {
    cityInput?.focus();
  }
});

document.addEventListener("click", (e) => {
  if (
    !locationPopup?.contains(e.target) &&
    !locationBtn?.contains(e.target)
  ) {
    locationPopup?.classList.add("hidden");
  }
});

cityInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();

    if (!city) return;

    params.set("city", city);

    window.history.replaceState(
      {},
      "",
      `${location.pathname}?${params.toString()}`
    );

    locationPopup.classList.add("hidden");

    getWeeklyWeather(city);
  }
});

/* =========================
   GEO
========================= */
async function getCoords(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1`
  );

  const data = await res.json();

  if (!data.results?.length) {
    throw new Error("city not found");
  }

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    state:
      data.results[0].admin1 ||
      data.results[0].country ||
      ""
  };
}

/* =========================
   WEATHER TYPE
========================= */
function getWeatherType(code) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Clouds";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain";
  if (code <= 86) return "Snow";

  return "Thunderstorm";
}

/* =========================
   MAIN WEATHER
========================= */
async function getWeeklyWeather(city) {
  try {
    const { lat, lon, name, state } = await getCoords(city);

    document.getElementById("cityName").textContent = name;

    document.getElementById("stateName").textContent =
      (state || "").toLowerCase();

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&temperature_unit=fahrenheit&timezone=auto`
    );

    const data = await res.json();

    const grid = document.querySelector(".weekly-grid");

    if (!grid) return;

    grid.innerHTML = "";

    const todayIndex = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();

      date.setDate(date.getDate() + i);

      const temp = data.daily.temperature_2m_max[i];
      const code = data.daily.weathercode[i];

      const card = document.createElement("div");

      card.className = "day";

      if (i === todayIndex) {
        card.classList.add("today");
      }

      card.innerHTML = `
        <p class="day-name">
          ${date
            .toLocaleDateString("en-US", {
              weekday: "short"
            })
            .toLowerCase()}
        </p>

        <img
          class="day-icon"
          src="${
            iconMap[getWeatherType(code)] || cloudIconURL
          }"
        />

        <p class="day-temp">
          ${Math.round(temp)}°
        </p>
      `;

      grid.appendChild(card);
    }
  } catch (err) {
    console.error(err);

    document.getElementById("cityName").textContent =
      "weather unavailable";
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const state = getStateFromURL();

  applyTheme(state.theme);
  applyFont(state.font);

  getWeeklyWeather(state.city);
});

/* =========================
   COPY LINK
========================= */
copyLinkBtn?.addEventListener("click", async () => {
  const state = getStateFromURL();

  const url =
    `${location.origin}${location.pathname}` +
    `?city=${encodeURIComponent(state.city)}` +
    `&theme=${state.theme}` +
    `&font=${state.font}` +
    `&embed=true`;

  try {
    await navigator.clipboard.writeText(url);

    const msg = document.getElementById("copyMessage");

    if (!msg) return;

    msg.classList.add("hidden");
    msg.classList.remove("show");

    void msg.offsetWidth;

    msg.classList.remove("hidden");
    msg.classList.add("show");

    clearTimeout(window.__copyTimer);

    window.__copyTimer = setTimeout(() => {
      msg.classList.remove("show");
      msg.classList.add("hidden");
    }, 1800);

  } catch (err) {
    console.error("copy failed", err);
  }
});
