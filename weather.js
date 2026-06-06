document.addEventListener("DOMContentLoaded", () => {
  const weatherWidget = document.getElementById("weatherWidget");
  const previewWidget = document.getElementById("previewWidget");

  const cityInput = document.getElementById("cityInput");
  const locationPopup = document.getElementById("locationPopup");
  const locationBtn = document.getElementById("locationBtn");

  const themeToggle = document.getElementById("themeToggle");
  const themeOptions = document.getElementById("themeOptions");
  const themeCircles = document.querySelectorAll(".theme-circle");

  const appearanceToggle = document.getElementById("appearanceToggle");
  const appearanceOptions = document.getElementById("appearanceOptions");
  const appearanceChoices = document.querySelectorAll(".appearance-option");

  const fontToggle = document.getElementById("fontToggle");
  const fontOptions = document.getElementById("fontOptions");
  const fontChoices = document.querySelectorAll(".font-option");

  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const copyMessage = document.getElementById("copyMessage");

  const liveDateEl = document.getElementById("liveDate");
  const previewLiveDateEl = document.getElementById("previewLiveDate");

  const cityNameEl = document.getElementById("cityName");
  const stateNameEl = document.getElementById("stateName");
  const weeklyGridEl = document.getElementById("weeklyGrid");

  const previewCityNameEl = document.getElementById("previewCityName");
  const previewStateNameEl = document.getElementById("previewStateName");
  const previewWeeklyGridEl = document.querySelector(".preview-weekly-grid");

  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get("embed") === "true";

  if (isEmbed) {
    document.documentElement.classList.add("embed-mode");
  }

  const state = {
    city: params.get("city") || localStorage.getItem("weeklyWeatherCity") || "Los Angeles",
    theme: params.get("theme") || localStorage.getItem("weeklyWeatherTheme") || "pink",
    font: params.get("font") || localStorage.getItem("weeklyWeatherFont") || "default",
    appearance:
      params.get("appearance") ||
      localStorage.getItem("weeklyWeatherAppearance") ||
      "system"
  };

  const themeColors = {
    pink: "#f4dfeb",
    beige: "#faebdd",
    blue: "#ddebf1",
    green: "#ddedea",
    black: "#17171a",
    white: "#f8f6f3"
  };

  const iconMap = {
    Clear: "https://i.pinimg.com/originals/09/fb/e5/09fbe54e3fdbf459e490006c56f999f9.gif",
    Clouds: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
    Rain: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
    Snow: "https://i.pinimg.com/originals/6e/36/7c/6e367ce95ab109121d03f12ed7d250c8.gif",
    Thunderstorm: "https://i.pinimg.com/originals/86/5e/10/865e10e7bcc6a739e01598dfbe38e300.gif",
    Fog: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif"
  };

  function saveState() {
    localStorage.setItem("weeklyWeatherCity", state.city);
    localStorage.setItem("weeklyWeatherTheme", state.theme);
    localStorage.setItem("weeklyWeatherFont", state.font);
    localStorage.setItem("weeklyWeatherAppearance", state.appearance);
  }

  function updateBothWidgets(callback) {
    [weatherWidget, previewWidget].forEach((widget) => {
      if (widget) callback(widget);
    });
  }

  function applyTheme(theme) {
    state.theme = theme || "pink";

    updateBothWidgets((widget) => {
      widget.classList.remove("pink", "beige", "blue", "green", "black", "white");
      widget.classList.add(state.theme);
    });

    if (themeToggle) {
      themeToggle.style.setProperty(
        "--theme-color",
        themeColors[state.theme] || themeColors.pink
      );

      themeToggle.style.backgroundColor =
        themeColors[state.theme] || themeColors.pink;
    }

    saveState();
  }

  function applyFont(font) {
    state.font = font || "default";

    updateBothWidgets((widget) => {
      widget.classList.remove("font-default", "font-serif", "font-mono");
      widget.classList.add(`font-${state.font}`);
    });

    saveState();
  }

  function applyAppearance(appearance) {
    state.appearance = appearance || "system";

    document.body.classList.remove(
      "appearance-light",
      "appearance-dark",
      "appearance-system"
    );

    document.body.classList.add(`appearance-${state.appearance}`);

    saveState();
  }

  function updateLiveDate() {
    const now = new Date();

    const dateText = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).toLowerCase();

    if (liveDateEl) liveDateEl.textContent = dateText;
    if (previewLiveDateEl) previewLiveDateEl.textContent = dateText;
  }

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

  async function getCoords(city) {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );

    const data = await res.json();

    if (!data.results?.length) {
      throw new Error("city not found");
    }

    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      name: data.results[0].name,
      state: data.results[0].admin1 || data.results[0].country || ""
    };
  }

  function renderOneForecast(gridEl, daily) {
    if (!gridEl) return;

    gridEl.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const temp = daily.temperature_2m_max[i];
      const code = daily.weathercode[i];
      const type = getWeatherType(code);

      const card = document.createElement("div");
      card.className = "day";

      if (i === 0) {
        card.classList.add("today");
      }

      card.innerHTML = `
        <p class="day-name">
          ${date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()}
        </p>

        <img class="day-icon" src="${iconMap[type] || iconMap.Clouds}" alt="" />

        <p class="day-temp">${Math.round(temp)}°</p>
      `;

      gridEl.appendChild(card);
    }
  }

  async function getWeeklyWeather(city) {
    try {
      const { lat, lon, name, state: placeState } = await getCoords(city);

      state.city = name;
      saveState();

      if (cityNameEl) cityNameEl.textContent = name;
      if (stateNameEl) stateNameEl.textContent = (placeState || "").toLowerCase();

      if (previewCityNameEl) previewCityNameEl.textContent = name;
      if (previewStateNameEl) previewStateNameEl.textContent = (placeState || "").toLowerCase();

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&temperature_unit=fahrenheit&timezone=auto`
      );

      const data = await res.json();

      renderOneForecast(weeklyGridEl, data.daily);
      renderOneForecast(previewWeeklyGridEl, data.daily);
    } catch (err) {
      console.error(err);

      if (cityNameEl) cityNameEl.textContent = "weather unavailable";
      if (stateNameEl) stateNameEl.textContent = "";

      if (previewCityNameEl) previewCityNameEl.textContent = "weather unavailable";
      if (previewStateNameEl) previewStateNameEl.textContent = "";
    }
  }

  function closeMenus() {
    locationPopup?.classList.add("hidden");
    themeOptions?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
  }

  locationBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    locationPopup?.classList.toggle("hidden");
    themeOptions?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");

    if (!locationPopup?.classList.contains("hidden")) {
      cityInput?.focus();
    }
  });

  cityInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const city = cityInput.value.trim();
    if (!city) return;

    state.city = city;
    saveState();

    locationPopup?.classList.add("hidden");
    getWeeklyWeather(city);
  });

  themeToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    themeOptions?.classList.toggle("hidden");
    locationPopup?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
  });

  themeCircles.forEach((circle) => {
    circle.addEventListener("click", (e) => {
      e.stopPropagation();

      applyTheme(circle.dataset.theme);
      themeOptions?.classList.add("hidden");
    });
  });

  appearanceToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    appearanceOptions?.classList.toggle("hidden");
    locationPopup?.classList.add("hidden");
    themeOptions?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
  });

  appearanceChoices.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();

      applyAppearance(option.dataset.appearance);
      appearanceOptions?.classList.add("hidden");
    });
  });

  fontToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    fontOptions?.classList.toggle("hidden");
    locationPopup?.classList.add("hidden");
    themeOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
  });

  fontChoices.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();

      applyFont(option.dataset.font);
      fontOptions?.classList.add("hidden");
    });
  });

  copyLinkBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();

    const url =
      `${location.origin}${location.pathname}` +
      `?city=${encodeURIComponent(state.city)}` +
      `&theme=${encodeURIComponent(state.theme)}` +
      `&font=${encodeURIComponent(state.font)}` +
      `&appearance=${encodeURIComponent(state.appearance)}` +
      `&embed=true`;

    await navigator.clipboard.writeText(url);

    copyMessage?.classList.remove("hidden");
    copyMessage?.classList.add("show");

    clearTimeout(window.__copyTimer);
    window.__copyTimer = setTimeout(() => {
      copyMessage?.classList.add("hidden");
      copyMessage?.classList.remove("show");
    }, 1500);
  });

  document.addEventListener("click", closeMenus);

  updateLiveDate();
  setInterval(updateLiveDate, 60000);

  applyTheme(state.theme);
  applyFont(state.font);
  applyAppearance(state.appearance);
  getWeeklyWeather(state.city);
});
