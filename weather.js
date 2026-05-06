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

  if (font === "serif") fontFamily = "Georgia, serif";
  else if (font === "mono") fontFamily = "ui-monospace, monospace";
  else fontFamily = "'Satoshi', sans-serif";

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   THEME SYSTEM
========================= */
function applyTheme(theme) {
  weatherWidget.className = `widget ${theme} weekly-widget`;
}

/* =========================
   URL STATE (SOURCE OF TRUTH)
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

fontChoices.forEach(opt => {
  opt.addEventListener("click", () => {
    const font = opt.dataset.font;
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

/* =========================
   THEME UI
========================= */
themeToggle?.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;
    localStorage.setItem("userTheme", theme);
    applyTheme(theme);
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

      if (i === todayIndex) card.classList.add("today");

      card.innerHTML = `
        <p class="day-name">
          ${date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()}
        </p>

        <img class="day-icon" src="${iconMap[getWeatherType(code)] || cloudIconURL}" />

        <p class="day-temp">${Math.round(temp)}°</p>
      `;

      grid.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    document.getElementById("cityName").textContent = "weather unavailable";
  }
}

/* =========================
   INIT (URL FIRST SYSTEM)
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const state = getStateFromURL();

  applyTheme(state.theme);
  applyFont(state.font);

  getWeeklyWeather(state.city);
});

/* =========================
   COPY LINK (FULL EMBED STATE)
========================= */
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

  if (font === "serif") fontFamily = "Georgia, serif";
  else if (font === "mono") fontFamily = "ui-monospace, monospace";
  else fontFamily = "'Satoshi', sans-serif";

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   THEME SYSTEM
========================= */
function applyTheme(theme) {
  weatherWidget.className = `widget ${theme} weekly-widget`;
}

/* =========================
   URL STATE (SOURCE OF TRUTH)
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

fontChoices.forEach(opt => {
  opt.addEventListener("click", () => {
    const font = opt.dataset.font;
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

/* =========================
   THEME UI
========================= */
themeToggle?.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;
    localStorage.setItem("userTheme", theme);
    applyTheme(theme);
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

      if (i === todayIndex) card.classList.add("today");

      card.innerHTML = `
        <p class="day-name">
          ${date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()}
        </p>

        <img class="day-icon" src="${iconMap[getWeatherType(code)] || cloudIconURL}" />

        <p class="day-temp">${Math.round(temp)}°</p>
      `;

      grid.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    document.getElementById("cityName").textContent = "weather unavailable";
  }
}

/* =========================
   INIT (URL FIRST SYSTEM)
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const state = getStateFromURL();

  applyTheme(state.theme);
  applyFont(state.font);

  getWeeklyWeather(state.city);
});

/* =========================
   COPY LINK (FULL EMBED STATE)
========================= */
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

  if (font === "serif") fontFamily = "Georgia, serif";
  else if (font === "mono") fontFamily = "ui-monospace, monospace";
  else fontFamily = "'Satoshi', sans-serif";

  weatherWidget.style.fontFamily = fontFamily;
}

/* =========================
   THEME SYSTEM
========================= */
function applyTheme(theme) {
  weatherWidget.className = `widget ${theme} weekly-widget`;
}

/* =========================
   URL STATE (SOURCE OF TRUTH)
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

fontChoices.forEach(opt => {
  opt.addEventListener("click", () => {
    const font = opt.dataset.font;
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

/* =========================
   THEME UI
========================= */
themeToggle?.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;
    localStorage.setItem("userTheme", theme);
    applyTheme(theme);
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

      if (i === todayIndex) card.classList.add("today");

      card.innerHTML = `
        <p class="day-name">
          ${date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()}
        </p>

        <img class="day-icon" src="${iconMap[getWeatherType(code)] || cloudIconURL}" />

        <p class="day-temp">${Math.round(temp)}°</p>
      `;

      grid.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    document.getElementById("cityName").textContent = "weather unavailable";
  }
}

/* =========================
   INIT (URL FIRST SYSTEM)
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const state = getStateFromURL();

  applyTheme(state.theme);
  applyFont(state.font);

  getWeeklyWeather(state.city);
});

copyLinkBtn?.addEventListener("click", async () => {
  const state = getStateFromURL();

  const city = state.city;
  const theme = state.theme;
  const font = state.font;

  const url =
    `${location.origin}${location.pathname}` +
    `?city=${encodeURIComponent(city)}` +
    `&theme=${theme}` +
    `&font=${font}` +
    `&embed=true`;

  try {
    await navigator.clipboard.writeText(url);

    const msg = document.getElementById("copyMessage");
    if (!msg) return;

    // 🧠 HARD RESET animation state (this is the missing piece)
    msg.classList.add("hidden");
    msg.classList.remove("show");

    // force reflow so animation can replay
    void msg.offsetWidth;

    // show again cleanly
    msg.classList.remove("hidden");
    msg.classList.add("show");

    // auto hide
    clearTimeout(window.__copyTimer);
    window.__copyTimer = setTimeout(() => {
      msg.classList.remove("show");
      msg.classList.add("hidden");
    }, 1800);

  } catch (err) {
    console.error("copy failed", err);
  }
});
