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
  document.getElementById("aiAdviceBox").style.display = "none";
  backBtn.style.display = "none"; // ẩn lại khi quay về
});

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
      <div class="forecast-day" data-date="${date}">
        <h4>${date}</h4>
        <img src="${iconUrl}" alt="${item.weather[0].description}">
        <p>${translateDescription(item.weather[0].description)}</p>
        <p>${t.temp}: ${item.main.temp}°C</p>
        <p>${t.humidity}: ${item.main.humidity}%</p>
        <p>${t.wind}: ${item.wind.speed} m/s</p>
      </div>
    `;
  });

  // wrap items in a grid container to match CSS
  forecastContainer.innerHTML = `<div class="forecast-grid">${html}</div>`;

  // Attach click handlers to update the persistent detail panel
  const grid = forecastContainer.querySelector('.forecast-grid');
  const dayEls = Array.from(grid.querySelectorAll('.forecast-day'));
  dayEls.forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const date = el.dataset.date;
      renderPersistentDetail(date, data.list);
      // highlight selected day
      dayEls.forEach(d => d.classList.toggle('selected-day', d === el));
    });
  });

  // By default, render detail for today (if available) or first day
  const todayIso = new Date().toISOString().split('T')[0];
  const hasToday = data.list.some(item => item.dt_txt.startsWith(todayIso));
  const defaultDate = hasToday ? todayIso : (dayEls[0] && dayEls[0].dataset.date);
  if (defaultDate) renderPersistentDetail(defaultDate, data.list);

  // chart removed: nothing to show here
}

// (detailed view creation moved to createDayDetailElement)

// Create a DOM element for day detail (used when injecting into forecast list)
function createDayDetailElement(date, list) {
  const entries = list.filter(item => item.dt_txt.startsWith(date));
  const container = document.createElement('div');
  container.id = 'dayDetail';
  container.className = 'day-detail';

  const header = document.createElement('div');
  header.className = 'day-detail-header';
  const h3 = document.createElement('h3');
  h3.textContent = `Chi tiết: ${date}`;
  const closeBtn = document.createElement('button');
  closeBtn.id = 'closeDayDetail';
  closeBtn.textContent = 'Đóng';
  header.appendChild(h3);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'day-detail-body';

  entries.forEach(item => {
    const time = item.dt_txt.split(' ')[1].slice(0,5);
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const entry = document.createElement('div');
    entry.className = 'day-entry';
    entry.innerHTML = `
      <div class="time">${time}</div>
      <img src="${iconUrl}" alt="${item.weather[0].description}">
      <div class="desc">${translateDescription(item.weather[0].description)}</div>
      <div class="temp">${item.main.temp}°C</div>
    `;
    body.appendChild(entry);
  });

  container.appendChild(header);
  container.appendChild(body);

  // close handler: restore original forecast view
  closeBtn.addEventListener('click', () => {
    const el = document.getElementById('dayDetail');
    if (el) el.remove();
    if (currentForecastData) showForecast(currentForecastData);
  });

  return container;
}

// Render or update a persistent detail panel above the forecast grid
function renderPersistentDetail(date, list) {
  // find or create container at top of forecast area
  const forecastContainer = document.getElementById('forecastContainer');
  let persistent = document.getElementById('persistentDayDetail');
  if (!persistent) {
    persistent = document.createElement('div');
    persistent.id = 'persistentDayDetail';
    persistent.className = 'day-detail persistent';
    forecastContainer.parentNode.insertBefore(persistent, forecastContainer);
  }

  // build content
  const entries = list.filter(item => item.dt_txt.startsWith(date));
  let html = `<div class="day-detail-header"><h3>Chi tiết: ${date}</h3></div><div class="day-detail-body" style="opacity:0;">`;
  entries.forEach(item => {
    const time = item.dt_txt.split(' ')[1].slice(0,5);
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    html += `
      <div class="day-entry">
        <div class="time">${time}</div>
        <img src="${iconUrl}" alt="${item.weather[0].description}">
        <div class="desc">${translateDescription(item.weather[0].description)}</div>
        <div class="temp">${item.main.temp}°C</div>
      </div>`;
  });
  html += `</div>`;

  // Fade: if existing body, fade out then replace
  const oldBody = persistent.querySelector('.day-detail-body');
  if (oldBody) {
    oldBody.style.opacity = '0';
    setTimeout(() => {
      persistent.innerHTML = html;
      const newBody = persistent.querySelector('.day-detail-body');
      if (newBody) {
        newBody.style.overflowX = 'auto';
        // force reflow then fade in
        void newBody.offsetWidth;
        newBody.style.opacity = '1';
      }
    }, 180);
  } else {
    persistent.innerHTML = html;
    const newBody = persistent.querySelector('.day-detail-body');
    if (newBody) {
      newBody.style.overflowX = 'auto';
      setTimeout(() => newBody.style.opacity = '1', 10);
    }
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
  if (langVi && langVi.classList) langVi.classList.toggle("active", lang === "vi");
  if (langEn && langEn.classList) langEn.classList.toggle("active", lang === "en");
}

// Attach language button handlers (safe)
if (langVi) langVi.addEventListener('click', () => setLanguage('vi'));
if (langEn) langEn.addEventListener('click', () => setLanguage('en'));

/* ---------------- Schedule (Lên lịch) ---------------- */
const scheduleForm = document.getElementById('scheduleForm');
const scheduleTitle = document.getElementById('scheduleTitle');
const scheduleDate = document.getElementById('scheduleDate');
const scheduleNote = document.getElementById('scheduleNote');
const scheduleCity = document.getElementById('scheduleCity');
const scheduleStart = document.getElementById('scheduleStart');
const stopsContainer = document.getElementById('stopsContainer');
const addStopBtn = document.getElementById('addStopBtn');
const scheduleListEl = document.getElementById('scheduleList');

let scheduleItems = [];

function loadSchedule() {
  try {
    const raw = localStorage.getItem('weatherSchedules');
    scheduleItems = raw ? JSON.parse(raw) : [];
  } catch (e) {
    scheduleItems = [];
  }
}

function saveSchedule() {
  localStorage.setItem('weatherSchedules', JSON.stringify(scheduleItems));
}

function renderSchedule() {
  if (!scheduleListEl) return; // defensive: element may not exist when script runs
  scheduleListEl.innerHTML = '';
  if (scheduleItems.length === 0) {
    scheduleListEl.innerHTML = '<li>Chưa có lịch</li>';
    return;
  }

  scheduleItems.forEach((it, idx) => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<strong>${it.title}</strong><div class="meta">${it.date}${it.note? ' — '+it.note : ''}</div>`;
    // placeholder for mini weather badge
    const weatherBadge = document.createElement('div');
    weatherBadge.className = 'schedule-weather';
    weatherBadge.textContent = '';
  const del = document.createElement('button');
    del.textContent = 'Xóa';
    del.addEventListener('click', () => {
      scheduleItems.splice(idx, 1);
      saveSchedule();
      renderSchedule();
    });
    li.appendChild(left);
    li.appendChild(weatherBadge);
    li.appendChild(del);
    // details toggle
    const detailsBtn = document.createElement('button');
    detailsBtn.textContent = 'Xem';
    detailsBtn.style.marginLeft = '8px';
    li.appendChild(detailsBtn);
    const details = document.createElement('div');
    details.className = 'schedule-details';
    details.style.display = 'none';
    // fill details: start, stops
    const startHtml = `<div><strong>Điểm bắt đầu:</strong> ${it.start || '—'}</div>`;
    let stopsHtml = '<div><strong>Điểm theo giờ:</strong><ul>';
    if (it.stops && it.stops.length) {
      it.stops.forEach(s => { stopsHtml += `<li>${s.time} — ${s.place}${s.prepare? ' ('+s.prepare+')':''}</li>`; });
    } else {
      stopsHtml += '<li>Chưa có điểm</li>';
    }
    stopsHtml += '</ul></div>';
    details.innerHTML = startHtml + stopsHtml;
    li.appendChild(details);
    detailsBtn.addEventListener('click', () => {
      details.style.display = details.style.display === 'none' ? '' : 'none';
      detailsBtn.textContent = details.style.display === 'none' ? 'Xem' : 'Ẩn';
    });
    scheduleListEl.appendChild(li);

    // try to fetch a mini forecast for the scheduled date if within 5 days
  (async () => {
      try {
        const targetCity = it.city || cityInput.value.trim() || null;
        if (!targetCity) return;
        const targetDate = new Date(it.date);
        const today = new Date();
        const diffDays = Math.ceil((targetDate - today) / (1000*60*60*24));
        if (diffDays < 0 || diffDays > 5) return; // forecast API covers ~5 days

        const forecast = await fetchForecast(targetCity);
        // find closest midday entry for that date
        const iso = it.date;
        const entry = forecast.list.find(l => l.dt_txt.startsWith(iso) && l.dt_txt.includes('12:00:00')) || forecast.list.find(l => l.dt_txt.startsWith(iso));
        if (!entry) return;
        const icon = entry.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}.png`;
        weatherBadge.innerHTML = `<img src="${iconUrl}" alt=""> <span class="temp">${entry.main.temp}°C</span>`;
      } catch (e) {
        // silent fail — don't block rendering
      }
    })();
  });
}

if (scheduleForm) {
  scheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = scheduleTitle ? scheduleTitle.value.trim() : '';
    const date = scheduleDate ? scheduleDate.value : '';
    const note = scheduleNote ? scheduleNote.value.trim() : '';
    const city = scheduleCity ? scheduleCity.value.trim() : '';
      // collect stops from form
      let stops = [];
      if (stopsContainer) {
        const rows = stopsContainer.querySelectorAll('.stop-row');
        rows.forEach(r => {
          const time = r.querySelector('input[type="time"]').value;
          const place = r.querySelector('input[name="stopPlace"]').value;
          const prepare = r.querySelector('input[name="stopPrepare"]').value;
          if (time && place) stops.push({ time, place, prepare });
        });
      }
      if (!title || !date) return alert('Vui lòng nhập tiêu đề và ngày');
      scheduleItems.push({ title, date, note, city, start: scheduleStart ? scheduleStart.value.trim() : '', stops });
    saveSchedule();
    renderSchedule();
    scheduleForm.reset();
      // clear stops UI
      if (stopsContainer) stopsContainer.innerHTML = '';
  });
} else {
  console.warn('Schedule form not found; schedule features disabled');
}

  // add/remove stops UI
  function addStopRow(time='', place='', prepare='') {
    if (!stopsContainer) return;
    const row = document.createElement('div');
    row.className = 'stop-row';
    row.innerHTML = `
      <input type="time" value="${time}" />
      <input type="text" name="stopPlace" placeholder="Địa điểm" value="${place}" />
      <input type="text" name="stopPrepare" placeholder="Cần chuẩn bị" value="${prepare}" />
    `;
    const rm = document.createElement('button'); rm.type='button'; rm.className='remove-stop'; rm.textContent='X';
    rm.addEventListener('click', () => row.remove());
    row.appendChild(rm);
    stopsContainer.appendChild(row);
  }

  if (addStopBtn) addStopBtn.addEventListener('click', () => addStopRow());

// initialize schedule on load
loadSchedule();
if (scheduleListEl) renderSchedule();
// initialize schedule on load
// schedule UI initialized above; tab logic will be set up later in the file

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

// Tab handling: top and bottom tabs share behavior
function setActiveTab(tab) {
  const allTabs = document.querySelectorAll('.tab-button');
  allTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

  const weatherEls = [document.querySelector('.search-container'), document.getElementById('weatherResult'), document.getElementById('historySection')];
  const scheduleEl = document.getElementById('scheduleSection');

  if (tab === 'weather') {
    weatherEls.forEach(e => { if (e) e.style.display = ''; });
    if (scheduleEl) scheduleEl.style.display = 'none';
  } else if (tab === 'schedule') {
    weatherEls.forEach(e => { if (e) e.style.display = 'none'; });
    if (scheduleEl) scheduleEl.style.display = '';
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.dataset.tab)));
  // default to weather
  setActiveTab('weather');
}

document.addEventListener('DOMContentLoaded', initTabs);
