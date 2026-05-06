window.__TEST_TODAY_INDEX__ = null;
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

const params = new URLSearchParams(window.location.search);
const isEmbed = params.get("embed") === "true";

/* =========================
   ICON MAP
========================= */
const iconMap = {
  Clear: "https://i.pinimg.com/originals/09/fb/e5/09fbe54e3fdbf459e490006c56f999f9.gif",
  Clouds: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Rain: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
  Snow: "https://i.pinimg.com/originals/6e/36/7c/6e367ce95ab109121d03f12ed7d250c8.gif",
  Thunderstorm: "https://i.pinimg.com/originals/86/5e/10/865e10e7bcc6a739e01598dfbe38e300.gif",
  Fog: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif"
};

const cloudIconURL = iconMap.Clouds;

/* =========================
   EMBED MODE
========================= */
if (isEmbed) {
  document.querySelector(".builder-ui")?.style.setProperty("display", "none");
}

/* =========================
   FONT SYSTEM
========================= */
function applyFont(font) {
  let fontFamily = "";

  if (font === "serif") fontFamily = "Georgia, serif";
  else if (font === "mono") fontFamily = "ui-monospace, monospace";
  else fontFamily = "'Satoshi', sans-serif";

  weatherWidget.style.fontFamily = fontFamily;
}

fontToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  fontOptions.classList.toggle("hidden");
});

fontChoices.forEach(opt => {
  opt.addEventListener("click", () => {
    const font = opt.dataset.font;
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

/* =========================
   THEME SYSTEM
========================= */
themeToggle?.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;
    weatherWidget.className = `widget ${theme} weekly-widget`;
    localStorage.setItem("userTheme", theme);
    themeOptions.classList.add("hidden");
  });
});

/* =========================
   LOCATION
========================= */
locationBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  locationPopup.classList.toggle("hidden");
  if (!locationPopup.classList.contains("hidden")) cityInput?.focus();
});

document.addEventListener("click", (e) => {
  if (!locationPopup?.contains(e.target) && !locationBtn?.contains(e.target)) {
    locationPopup?.classList.add("hidden");
  }
});

cityInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (!city) return;

    localStorage.setItem("userCity", city);
    locationPopup.classList.add("hidden");
    getWeeklyWeather(city);
  }
});

/* =========================
   GRID SAFETY (auto-fix if missing)
========================= */
function ensureGrid() {
  let grid = document.querySelector(".weekly-grid");

  if (!grid) {
    grid = document.createElement("div");
    grid.className = "weekly-grid";
    document.querySelector(".weather-content")?.appendChild(grid);
  }

  return grid;
}

/* =========================
   GEO
========================= */
async function getCoords(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
  );
  const data = await res.json();

  if (!data.results?.length) throw new Error("city not found");

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    state: data.results[0].admin1 || data.results[0].country || ""
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
    const grid = ensureGrid();
    grid.innerHTML = "";

    const { lat, lon, name, state } = await getCoords(city);

    document.getElementById("cityName").textContent = name;
    document.getElementById("stateName").textContent = (state || "").toLowerCase();

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&timezone=auto`
    );

    const data = await res.json();

   const todayIndex =
  window.__TEST_TODAY_INDEX__ !== null
    ? window.__TEST_TODAY_INDEX__
    : 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const temp = data.daily.temperature_2m_max[i];
      const code = data.daily.weathercode[i];

      const card = document.createElement("div");
      card.className = "day";

      if (i === todayIndex) card.classList.add("today");

      card.innerHTML = `
        <p class="day-name">${date.toLocaleDateString("en-US", {
          weekday: "short"
        }).toLowerCase()}</p>

        <img class="day-icon" src="${iconMap[getWeatherType(code)] || cloudIconURL}" />

        <p class="day-temp">${Math.round(temp)}°</p>
      `;

      grid.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    document.getElementById("cityName").textContent = "weather broke :(";
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const city =
    new URLSearchParams(window.location.search).get("city") ||
    localStorage.getItem("userCity") ||
    "Los Angeles";

  const theme = localStorage.getItem("userTheme") || "pink";
  const font = localStorage.getItem("userFont") || "default";

  weatherWidget.className = `widget ${theme} weekly-widget`;

  applyFont(font);
  getWeeklyWeather(city);
});

/* =========================
   COPY LINK
========================= */
copyLinkBtn?.addEventListener("click", () => {
  const city = localStorage.getItem("userCity") || "Los Angeles";
  const url = `${location.origin}${location.pathname}?city=${encodeURIComponent(
    city
  )}&embed=true`;

  navigator.clipboard.writeText(url);

  document.getElementById("copyMessage")?.classList.add("show");
});
