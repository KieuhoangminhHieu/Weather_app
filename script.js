const apiKey = "fa71133247a2cf1b3230a54f371ac4f5";
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const appTitle = document.getElementById("appTitle");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const backBtn = document.getElementById("backBtn");
const shareBtn = document.getElementById("shareBtn");

let currentWeatherData = null;
let currentForecastData = null;
let currentLang = "vi";
let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];
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

  // ✅ Cập nhật tiêu đề thời tiết hôm nay nếu đã hiển thị
  const todayTitle = document.querySelector("#weatherResult h3");
  if (todayTitle) todayTitle.textContent = t.todayTitle;

  // ✅ Cập nhật tiêu đề dự báo nếu đã hiển thị
  const forecastTitle = document.querySelector("#weatherResult h3 + h3");
  if (forecastTitle) forecastTitle.textContent = t.forecast;

  // ✅ Cập nhật tiêu đề biểu đồ nếu đã hiển thị
  const chartTitle = document.querySelector("#chartSection h3");
  if (chartTitle) chartTitle.textContent = "📊 " + t.forecast;

  // ✅ Cập nhật tiêu đề lịch sử
  const historyTitle = document.querySelector("#historySection h3");
  if (historyTitle) historyTitle.textContent = lang === "vi" ? "Lịch sử tìm kiếm" : "Search History";

  // ✅ Cập nhật nút quay lại
  backBtn.textContent = lang === "vi" ? "🔙 Quay lại" : "🔙 Back";
}

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
  document.getElementById("chartSection").style.display = "none";
  document.getElementById("aiAdviceBox").style.display = "none";
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

  // 🔔 Kiểm tra và hiển thị cảnh báo
  showWeatherAlert(main.temp, weather[0].main, wind.speed);
  getAiAdvice(data);
  document.getElementById("aiAdviceBox").style.display = "block";
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

  let html = "";
  for (const date in dailyData) {
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
    document.getElementById("aiAdviceBox").style.display = "none";
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
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", themeToggle.checked);
});
const langVi = document.getElementById("langVi");
const langEn = document.getElementById("langEn");

function setLanguage(lang) {
  currentLang = lang;
  updateLanguage(currentLang);
  langVi.classList.toggle("active", lang === "vi");
  langEn.classList.toggle("active", lang === "en");

  // ✅ Re-render nếu đã có dữ liệu
  if (currentWeatherData) showWeather(currentWeatherData);
  if (currentForecastData) showForecast(currentForecastData);
}
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

    // Hiển thị lời khuyên từ AI
    document.getElementById("aiAdviceBox").innerHTML = `<p>${result.advice}</p>`;
  } catch (error) {
    console.warn("Lỗi AI, dùng tư vấn nội bộ:", error.message);

    // ✅ Fallback: dùng hàm nội bộ nếu AI lỗi
    const fallback = generateWeatherAdvice(data);
    document.getElementById("aiAdviceBox").innerHTML = `<p>${fallback}</p>`;
  }
}

langVi.addEventListener("click", () => setLanguage("vi"));
langEn.addEventListener("click", () => setLanguage("en"));
// ✅ Khởi tạo trạng thái ban đầu
setLanguage(currentLang);
// 🚀 Khởi động app
updateLanguage(currentLang);
renderHistory();