// Note: API key moved to backend proxy. Frontend should call /api/* endpoints.
import { fetchWeather, fetchForecast, fetchWeatherByCoords, fetchForecastByCoords } from './modules/api.js';
import { loadHistory, addToHistory } from './modules/history.js';

// DOM
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const appTitle = document.getElementById("appTitle");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const backBtn = document.getElementById("backBtn");
const suggestionsList = document.getElementById("suggestions");

// State
let currentWeatherData = null;
let currentForecastData = null;
let currentLang = "vi";
let searchHistory = loadHistory();

/* 🌐 Ngôn ngữ */
function translateDescription(raw) {
  const desc = raw.toLowerCase();
  const map = translations[currentLang].descriptions;
  return map[desc] || raw;
}

function updateLanguage(lang) {
  const t = translations[lang];

  appTitle.textContent = t.title;
  cityInput.placeholder = t.placeholder;
  searchBtn.textContent = t.search;

  if (currentWeatherData) showWeather(currentWeatherData);
  if (currentForecastData) showForecast(currentForecastData);

  const historyTitle = document.querySelector("#historySection h3");
  if (historyTitle) {
    historyTitle.textContent = lang === "vi" ? "Lịch sử tìm kiếm" : "Search History";
  }

  backBtn.textContent = lang === "vi" ? "🔙 Quay lại" : "🔙 Back";
}

/* 🖊️ Sự kiện tìm kiếm */
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    weatherResult.innerHTML = `<p>${translations[currentLang].loading}</p>`;
    getWeather(city);
    getForecast(city);
    searchHistory = addToHistory(city);
    renderHistory();
    suggestionsList.style.display = "none"; // ẩn gợi ý sau khi tìm
  } else {
    alert(translations[currentLang].placeholder);
  }
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

/* ✨ Gợi ý từ cities.js */
cityInput.addEventListener("input", () => {
  const query = cityInput.value.toLowerCase().trim();
  suggestionsList.innerHTML = "";

  if (!query) {
    suggestionsList.style.display = "none";
    return;
  }

  // Lọc thành phố từ cities.js
  const matches = cities.filter(city =>
    city.toLowerCase().includes(query)
  ).slice(0, 10); // giới hạn 10 gợi ý

  if (matches.length === 0) {
    suggestionsList.style.display = "none";
    return;
  }

  // Render danh sách gợi ý
  matches.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.classList.add("suggestion-item");
    li.onclick = () => {
      cityInput.value = city;
      suggestionsList.style.display = "none";
      searchBtn.click();
    };
    suggestionsList.appendChild(li);
  });

  suggestionsList.style.display = "block";
});

// Ẩn gợi ý khi click ra ngoài
document.addEventListener("click", (e) => {
  if (!suggestionsList.contains(e.target) && e.target !== cityInput) {
    suggestionsList.style.display = "none";
  }
});

/* 🔙 Quay lại */
backBtn.addEventListener("click", () => {
  weatherResult.innerHTML = "";
  document.getElementById("chartSection").style.display = "none";
  document.getElementById("aiAdviceBox").style.display = "none";
  backBtn.style.display = "none"; // ẩn lại khi quay về
});

/* 📜 Lịch sử */
function renderHistory() {
  historyList.innerHTML = "";
  if (searchHistory.length === 0) {
    historyList.innerHTML = "<li>Chưa có tìm kiếm nào</li>";
    return;
  }

  searchHistory.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.classList.add("history-item");
    li.onclick = () => {
      cityInput.value = city;
      searchBtn.click();
    };
    historyList.appendChild(li);
  });
  historySection.style.display = "block"; // luôn hiện lịch sử
}

/* 🌦️ Thời tiết hiện tại */
async function getWeather(city) {
  try {
    const data = await fetchWeather(city);
    showWeather(data);
  } catch (error) {
    weatherResult.innerHTML = `<p style="color:red">${error.message}</p>`;
    document.getElementById("chartSection").style.display = "none";
  }
}

/* 🔮 Dự báo 5 ngày */
async function getForecast(city) {
  try {
    const data = await fetchForecast(city);
    showForecast(data);
  } catch (error) {
    const forecastContainer = document.getElementById("forecastContainer");
    if (forecastContainer) {
      forecastContainer.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
    document.getElementById("chartSection").style.display = "none";
  }
}

function showWeather(data) {
  currentWeatherData = data;
  const { name, main, weather, wind } = data;
  const icon = weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const t = translations[currentLang];

  weatherResult.innerHTML = `
    <h3>${t.todayTitle}</h3>
    <h2>${name}</h2>
    <img src="${iconUrl}" alt="${weather[0].description}">
    <p>${translateDescription(weather[0].description)}</p>
    <p>${t.temp}: ${main.temp}°C</p>
    <p>${t.humidity}: ${main.humidity}%</p>
    <p>${t.wind}: ${wind.speed} m/s</p>
    <h3>${t.forecast}</h3>
    <div id="forecastContainer"></div>
  `;

  showWeatherAlert(main.temp, weather[0].main, wind.speed);
  getAiAdvice(data);

  document.getElementById("aiAdviceBox").style.display = "block";
  backBtn.style.display = "inline-block";
  applyWeatherEffect(weather[0].description);
  console.log("Mô tả thời tiết từ API:", data.weather[0].description);
}

function showForecast(data) {
  currentForecastData = data;
  const t = translations[currentLang];
  const forecastContainer = document.getElementById("forecastContainer");
  const dailyData = {};
  const today = new Date().toISOString().split("T")[0];

  data.list.forEach(item => {
    const [date, time] = item.dt_txt.split(" ");
    if (date !== today && time === "12:00:00" && !dailyData[date]) {
      dailyData[date] = item;
    }
  });

  const selectedDays = Object.keys(dailyData).slice(0, 5);

  let html = "";
  selectedDays.forEach(date => {
    const item = dailyData[date];
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    html += `
      <div class="forecast-day">
        <h4>${date}</h4>
        <img src="${iconUrl}" alt="${item.weather[0].description}">
        <p>${translateDescription(item.weather[0].description)}</p>
        <p>${t.temp}: ${item.main.temp}°C</p>
        <p>${t.humidity}: ${item.main.humidity}%</p>
        <p>${t.wind}: ${item.wind.speed} m/s</p>
      </div>
    `;
  });

  forecastContainer.innerHTML = html;

  if (selectedDays.length >= 2) {
    document.getElementById("chartSection").style.display = "block";
    renderTemperatureChart(dailyData);
  } else {
    document.getElementById("chartSection").style.display = "none";
  }
}

/* 📍 Lấy vị trí */
window.addEventListener("load", () => {
  renderHistory();
  backBtn.style.display = "none"; 
  document.getElementById("aiAdviceBox").style.display = "none";

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
        getForecastByCoords(latitude, longitude);
      },
      (error) => console.warn("Không lấy được vị trí:", error.message)
    );
  }
});

async function getWeatherByCoords(lat, lon) {
  try {
    const data = await fetchWeatherByCoords(lat, lon);
    showWeather(data);
  } catch (err) {
    weatherResult.innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

async function getForecastByCoords(lat, lon) {
  try {
    const data = await fetchForecastByCoords(lat, lon);
    showForecast(data);
  } catch (err) {
    document.getElementById("forecastContainer").innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

/* 🌙 Dark mode */
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", themeToggle.checked);
});

/* 🌐 Đa ngôn ngữ */
const langVi = document.getElementById("langVi");
const langEn = document.getElementById("langEn");

function setLanguage(lang) {
  currentLang = lang;
  updateLanguage(lang);
  langVi.classList.toggle("active", lang === "vi");
  langEn.classList.toggle("active", lang === "en");
}
langVi.addEventListener("click", () => setLanguage("vi"));
langEn.addEventListener("click", () => setLanguage("en"));

/* 🤖 AI Advice */
async function getAiAdvice(data) {
  const city = data.name;
  try {
    const response = await fetch("http://localhost:8080/ai/weather/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city })
    });
    if (!response.ok) throw new Error("AI server error");

    const result = await response.json();
    document.getElementById("aiAdviceBox").innerHTML = `<p>${result.advice}</p>`;
  } catch (error) {
    const fallback = generateWeatherAdvice(data);
    document.getElementById("aiAdviceBox").innerHTML = `<p>${fallback}</p>`;
  }
}

// 🚀 Khởi tạo app
setLanguage(currentLang);
updateLanguage(currentLang);
