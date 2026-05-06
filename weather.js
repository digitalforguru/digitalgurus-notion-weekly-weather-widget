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

if (isEmbed) {
  const builderUI = document.querySelector(".builder-ui");
  if (builderUI) builderUI.style.display = "none";
}

function buildWidgetURL(city, theme, font) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?city=${encodeURIComponent(city)}&theme=${theme}&font=${font}&embed=true`;
}

function copyWidgetLink() {
  const city = localStorage.getItem("userCity") || "Los Angeles";
  const theme = localStorage.getItem("userTheme") || "pink";
  const font = localStorage.getItem("userFont") || "default";

  const url = buildWidgetURL(city, theme, font);
  navigator.clipboard.writeText(url);

  const message = document.getElementById("copyMessage");

  if (message) {
    message.classList.remove("hidden");
    message.classList.add("show");
  }
}

/* =========================
   🔤 FONT SYSTEM
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

  if (font === "serif") {
    fontFamily = "Georgia, serif";
  } else if (font === "mono") {
    fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  } else {
    fontFamily = "'Satoshi', sans-serif";
  }

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   📍 LOCATION POPUP
========================= */
locationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  locationPopup.classList.toggle("hidden");

  if (!locationPopup.classList.contains("hidden")) {
    cityInput.focus();
  }
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const city = cityInput.value.trim();

    if (!city) return;

    localStorage.setItem("userCity", city);

    cityInput.blur();
    locationPopup.classList.add("hidden");

    getWeeklyWeather(city);
  }
});

document.addEventListener("click", (e) => {
  const inside = locationPopup?.contains(e.target);
  const clickedBtn = locationBtn.contains(e.target);

  if (!inside && !clickedBtn) {
    locationPopup.classList.add("hidden");
  }
});

/* =========================
   🎨 THEME SYSTEM
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
   🌍 GEO + WEATHER
========================= */
async function getCoords(city) {
  const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  const res = await fetch(geoURL);
  const data = await res.json();

  if (!data.results || !data.results[0]) {
    throw new Error("city not found");
  }

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    state: data.results[0].admin1 || data.results[0].country || ""
  };
}

async function getWeeklyWeather(city) {
  try {
    const { lat, lon, name, state } = await getCoords(city);

    const cityName = name || city;
    const stateName = state ? state.toLowerCase() : "";

    const cityEl = document.getElementById("cityName");
    const stateEl = document.getElementById("stateName");

    if (cityEl) cityEl.textContent = cityName;
    if (stateEl) stateEl.textContent = stateName;

    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    const res = await fetch(weatherURL);
    const data = await res.json();

    const days = data.daily.time;
    const maxTemps = data.daily.temperature_2m_max;
    const codes = data.daily.weathercode;

    const now = new Date();

    const dayIndex = now.getDay();
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });

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

    document.querySelectorAll(".day").forEach(card => {
      card.classList.remove("today");
    });

    const cards = document.querySelectorAll(".day");

    const todayKey = new Date().toISOString().split("T")[0];

    cards.forEach((card, i) => {
      const date = weekDates[i];

      const iconEl = card.querySelector(".day-icon");
      const tempEl = card.querySelector(".day-temp");
      const nameEl = card.querySelector(".day-name");

      if (!iconEl || !tempEl || !nameEl) return;

      const isToday = date === todayKey;
      card.classList.toggle("today", isToday);

      const temp = maxTemps[i];
      const code = codes[i];

      const weatherType = getWeatherType(code);
      const icon = iconMap[weatherType] ?? cloudIconURL;

      iconEl.src = icon;
      tempEl.textContent = `${Math.round(temp)}°`;

      nameEl.textContent = new Date(date)
        .toLocaleDateString("en-US", { weekday: "short" })
        .toLowerCase();
    });

  } catch (err) {
    console.error(err);
    const cityEl = document.getElementById("cityName");
    if (cityEl) cityEl.textContent = "unable to catch weather :(";
  }
}

/* =========================
   🚀 INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const urlCity = new URLSearchParams(window.location.search).get("city");

  const savedCity = urlCity || localStorage.getItem("userCity") || "Los Angeles";
  const savedTheme = localStorage.getItem("userTheme") || "pink";
  const savedFont = localStorage.getItem("userFont") || "default";

  weatherWidget.className = `widget ${savedTheme} weekly-widget`;

  applyFont(savedFont);

  cityInput.value = savedCity;

  getWeeklyWeather(savedCity);
});

/* =========================
   🔗 COPY BUTTON
========================= */
if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", copyWidgetLink);
}
