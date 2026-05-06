/* =========================
   🌤️ ELEMENTS
========================= */
const weatherWidget = document.getElementById("weatherWidget");
const weatherIcon = document.getElementById("weatherIcon");
const locationElement = document.getElementById("locationName");

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

const apiKey = "8b38a4d3d6920110547bdaef3d73c0ba";

/* =========================
   🎨 ICONS
========================= */
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
   🚫 EMBED MODE
========================= */
if (isEmbed) {
  const builderUI = document.querySelector(".builder-ui");
  if (builderUI) builderUI.style.display = "none";
}

/* =========================
   🔗 COPY LINK SYSTEM
========================= */
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
  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  const res = await fetch(geoURL);
  const data = await res.json();

  if (!data[0]) throw new Error("city not found");

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].name
  };
}

async function getWeeklyWeather(city) {
  try {
    const { lat, lon } = await getCoords(city);
    locationElement.textContent = city.toLowerCase();

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;
     
   const res = await fetch(url);
   const data = await res.json();

const dailyMap = {};

data.list.forEach(item => {
  const date = item.dt_txt.split(" ")[0];

  if (!dailyMap[date]) {
    dailyMap[date] = [];
  }

  dailyMap[date].push(item);
});

const today = new Date();
today.setHours(0, 0, 0, 0);

// get Sunday of current week
const sunday = new Date(today);
sunday.setDate(today.getDate() - today.getDay());

const daysArray = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date(sunday);
  date.setDate(sunday.getDate() + i);

  const key = date.toISOString().split("T")[0];

  return {
    date: key,
    entries: dailyMap[key] || []
  };
});

daysArray.forEach((dayObj, i) => {
  const { date, entries } = dayObj;
   
 const todayKey = new Date().toISOString().split("T")[0];
 const isToday = dayObj.date === todayKey;

let midday;

if (!entries || entries.length === 0) {
  midday = {
    main: { temp: "--" },
    weather: [{ main: "Clear" }]
  };
} else {
  midday =
    entries.find(e => e.dt_txt.includes("12:00:00")) ||
    entries.find(e => e.weather?.[0]) ||
    entries[0];
}
   
  const temp =
  midday.main.temp === "--"
    ? "--"
    : Math.round(midday.main.temp);

  const iconEl = document.querySelectorAll(".day-icon")[i];
if (!iconEl) return;
  const tempEl = document.querySelectorAll(".day-temp")[i];
  const nameEl = document.querySelectorAll(".day-name")[i];
  const dayCard = document.querySelectorAll(".day")[i];

if (isToday && dayCard) {
  dayCard.classList.add("today");
}

  nameEl.textContent = new Date(date)
    .toLocaleDateString("en-US", { weekday: "short" })
    .toLowerCase();

  tempEl.textContent = `${temp}°`;
  const weather =
  midday.weather?.[0]?.main?.trim() || "Clouds";
const icon = iconMap[weather] ?? cloudIconURL;

if (iconEl) {
  iconEl.src = icon;
  iconEl.onerror = () => {
    iconEl.src = cloudIconURL;
  };
}
});
     
  } catch (err) {
    console.error(err);
    locationElement.textContent = "unable to load weather";
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
