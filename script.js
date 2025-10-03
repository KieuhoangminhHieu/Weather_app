const apiKey = "fa71133247a2cf1b3230a54f371ac4f5";
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const languageSelect = document.getElementById("languageSelect");
const appTitle = document.getElementById("appTitle");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const backBtn = document.getElementById("backBtn");

let currentLang = languageSelect.value;
let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];

const translations = {
  vi: {
    title: "Ứng dụng thời tiết",
    placeholder: "Nhập tên thành phố...",
    search: "Tìm kiếm",
    loading: "Đang tải dữ liệu...",
    notFound: "Không tìm thấy thành phố",
    temp: "🌡️ Nhiệt độ",
    humidity: "💧 Độ ẩm",
    wind: "💨 Gió",
    forecast: "Dự báo 5 ngày tới",
    todayTitle: "Thời tiết hôm nay"
  },
  en: {
    title: "Weather App",
    placeholder: "Enter city name...",
    search: "Search",
    loading: "Loading...",
    notFound: "City not found",
    temp: "🌡️ Temperature",
    humidity: "💧 Humidity",
    wind: "💨 Wind",
    forecast: "5-Day Forecast",
    todayTitle: "Current Weather"
  }
};

function updateLanguage(lang) {
  const t = translations[lang];
  appTitle.textContent = t.title;
  cityInput.placeholder = t.placeholder;
  searchBtn.textContent = t.search;
}

languageSelect.addEventListener("change", (e) => {
  currentLang = e.target.value;
  updateLanguage(currentLang);
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    weatherResult.innerHTML = `<p>${translations[currentLang].loading}</p>`;
    getWeather(city);
    getForecast(city);
    saveToHistory(city);
  } else {
    alert(translations[currentLang].placeholder);
  }
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

backBtn.addEventListener("click", () => {
  weatherResult.innerHTML = "";
  historySection.style.display = "none";
  cityInput.style.display = "inline-block";
  searchBtn.style.display = "inline-block";
  languageSelect.style.display = "inline-block";
  document.getElementById("chartSection").style.display = "none"; // Ẩn biểu đồ khi quay lại
});

function saveToHistory(city) {
  if (!searchHistory.includes(city)) {
    searchHistory.unshift(city);
    if (searchHistory.length > 5) searchHistory.pop();
    localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
  }
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
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

  historySection.style.display = "block";
  cityInput.style.display = "none";
  searchBtn.style.display = "none";
  languageSelect.style.display = "none";
}

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(translations[currentLang].notFound);
    const data = await response.json();
    showWeather(data);
  } catch (error) {
    weatherResult.innerHTML = `<p style="color:red">${error.message}</p>`;
    document.getElementById("chartSection").style.display = "none"; // Ẩn biểu đồ nếu lỗi
  }
}

async function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(translations[currentLang].notFound);
    const data = await response.json();
    showForecast(data);
  } catch (error) {
    const forecastContainer = document.getElementById("forecastContainer");
    if (forecastContainer) {
      forecastContainer.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
    document.getElementById("chartSection").style.display = "none"; // Ẩn biểu đồ nếu lỗi
  }
}

function showWeather(data) {
  const { name, main, weather, wind } = data;
  const icon = weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const t = translations[currentLang];

  weatherResult.innerHTML = `
    <h3>${t.todayTitle}</h3>
    <h2>${name}</h2>
    <img src="${iconUrl}" alt="${weather[0].description}">
    <p>${weather[0].description}</p>
    <p>${t.temp}: ${main.temp}°C</p>
    <p>${t.humidity}: ${main.humidity}%</p>
    <p>${t.wind}: ${wind.speed} m/s</p>
    <h3>${t.forecast}</h3>
    <div id="forecastContainer"></div>
  `;
}

function showForecast(data) {
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

  let html = "";
  for (const date in dailyData) {
    const item = dailyData[date];
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    html += `
      <div class="forecast-day">
        <h4>${date}</h4>
        <img src="${iconUrl}" alt="${item.weather[0].description}">
        <p>${item.weather[0].description}</p>
        <p>${t.temp}: ${item.main.temp}°C</p>
        <p>${t.humidity}: ${item.main.humidity}%</p>
        <p>${t.wind}: ${item.wind.speed} m/s</p>
      </div>
    `;
  }

  forecastContainer.innerHTML = html;

  // ✅ Chỉ hiển thị biểu đồ nếu có ít nhất 2 ngày dữ liệu
  if (Object.keys(dailyData).length >= 2) {
    document.getElementById("chartSection").style.display = "block";
    renderTemperatureChart(dailyData);
  } else {
    document.getElementById("chartSection").style.display = "none";
  }
}

// 📍 Tự động lấy vị trí khi mở app
window.addEventListener("load", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
        getForecastByCoords(latitude, longitude);
      },
      (error) => {
        console.warn("Không lấy được vị trí:", error.message);
        document.getElementById("chartSection").style.display = "none";
      }
    );
  } else {
    console.warn("Trình duyệt không hỗ trợ định vị.");
    document.getElementById("chartSection").style.display = "none";
  }
});

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(translations[currentLang].notFound);
    const data = await response.json();
    showWeather(data);
  } catch (error) {
    weatherResult.innerHTML = `<p style="color:red">${error.message}</p>`;
    document.getElementById("chartSection").style.display = "none";
  }
}

async function getForecastByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(translations[currentLang].notFound);
    const data = await response.json();
    showForecast(data);
  } catch (error) {
    const forecastContainer = document.getElementById("forecastContainer");
    if (forecastContainer) {
      forecastContainer.innerHTML = `<p style="color:red">${error.message}</p>`;
    }
    document.getElementById("chartSection").style.display = "none"; // Ẩn biểu đồ nếu lỗi
  }
}

// 🚀 Khởi động app
updateLanguage(currentLang);
renderHistory();