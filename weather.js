const weatherWidget = document.getElementById("weatherWidget");
const weatherIcon = document.getElementById("weatherIcon");

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

const iconMap = {
  Clear: "https://i.pinimg.com/originals/09/fb/e5/09fbe54e3fdbf459e490006c56f999f9.gif",
  Clouds: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Rain: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
  Snow: "https://i.pinimg.com/originals/6e/36/7c/6e367ce95ab109121d03f12ed7d250c8.gif",
  Thunderstorm: "https://i.pinimg.com/originals/86/5e/10/865e10e7bcc6a739e01598dfbe38e300.gif",
  Drizzle: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
  Mist: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Fog: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Haze: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif"
};

const cloudIconURL =
  "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif";

/* =========================
   EMBED MODE
========================= */
if (isEmbed) {
  const builderUI = document.querySelector(".builder-ui");
  if (builderUI) builderUI.style.display = "none";
}

/* =========================
   UTILS
========================= */
function getLocalDateKey(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    .toISOString()
    .split("T")[0];
}

/* =========================
   FONT SYSTEM
========================= */
fontToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  fontOptions.classList.toggle("hidden");
});

fontChoices.forEach(option => {
  option.addEventListener("click", () => {
    const font = option.getAttribute("data-font");
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

function applyFont(font) {
  let fontFamily = "";

  if (font === "serif") fontFamily = "Georgia, serif";
  else if (font === "mono") fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  else fontFamily = "'Satoshi', sans-serif";

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   LOCATION POPUP
========================= */
locationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  locationPopup.classList.toggle("hidden");
  if (!locationPopup.classList.contains("hidden")) cityInput.focus();
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const city = cityInput.value.trim();
    if (!city) return;

    localStorage.setItem("userCity", city);
    locationPopup.classList.add("hidden");

    getWeeklyWeather(city);
  }
});

document.addEventListener("click", (e) => {
  if (!locationPopup?.contains(e.target) && !locationBtn.contains(e.target)) {
    locationPopup.classList.add("hidden");
  }
});

/* =========================
   THEME SYSTEM
========================= */
themeToggle.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.getAttribute("data-theme");
    weatherWidget.className = `widget ${theme} weekly-widget`;
    localStorage.setItem("userTheme", theme);
    themeOptions.classList.add("hidden");
  });
});

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
   WEATHER CORE
========================= */
async function getWeeklyWeather(city) {
  try {
    const { lat, lon, name, state } = await getCoords(city);

    const cityEl = document.getElementById("cityName");
    const stateEl = document.getElementById("stateName");

    if (cityEl) cityEl.textContent = name || city;
    if (stateEl) stateEl.textContent = (state || "").toLowerCase();

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&timezone=auto`
    );

    const data = await res.json();

    const days = data?.daily?.time || [];
    const temps = data?.daily?.temperature_2m_max || [];
    const codes = data?.daily?.weathercode || [];

    const todayKey = getLocalDateKey();

    const cards = document.querySelectorAll(".day");

    cards.forEach((card, i) => {
      const iconEl = card.querySelector(".day-icon");
      const tempEl = card.querySelector(".day-temp");
      const nameEl = card.querySelector(".day-name");

      if (!iconEl || !tempEl || !nameEl) return;

      const date = days[i] || null;

      /* fallback safety */
      const temp = temps[i] ?? "--";
      const code = codes[i] ?? 0;

      const weatherType =
        code === 0 ? "Clear" :
        code <= 3 ? "Clouds" :
        code <= 48 ? "Fog" :
        code <= 67 ? "Rain" :
        code <= 77 ? "Snow" :
        code <= 82 ? "Rain" :
        code <= 86 ? "Snow" :
        "Thunderstorm";

      iconEl.src = iconMap[weatherType] || cloudIconURL;
      tempEl.textContent = temp === "--" ? "--" : `${Math.round(temp)}°`;

      if (date) {
        const isToday = date === todayKey;
        card.classList.toggle("today", isToday);

        nameEl.textContent = new Date(date)
          .toLocaleDateString("en-US", { weekday: "short" })
          .toLowerCase();
      }
    });

  } catch (err) {
    console.error(err);
    const cityEl = document.getElementById("cityName");
    if (cityEl) cityEl.textContent = "unable to catch weather :(";
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const urlCity = new URLSearchParams(window.location.search).get("city");

  const savedCity =
    urlCity || localStorage.getItem("userCity") || "Los Angeles";

  const savedTheme = localStorage.getItem("userTheme") || "pink";
  const savedFont = localStorage.getItem("userFont") || "default";

  weatherWidget.className = `widget ${savedTheme} weekly-widget`;

  applyFont(savedFont);

  cityInput.value = savedCity;

  getWeeklyWeather(savedCity);
});

/* =========================
   COPY LINK
========================= */
if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", () => {
    const city = localStorage.getItem("userCity") || "Los Angeles";
    const theme = localStorage.getItem("userTheme") || "pink";
    const font = localStorage.getItem("userFont") || "default";

    const url =
      window.location.origin +
      window.location.pathname +
      `?city=${encodeURIComponent(city)}&theme=${theme}&font=${font}&embed=true`;

    navigator.clipboard.writeText(url);
  });
}
