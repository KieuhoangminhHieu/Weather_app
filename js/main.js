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
const scheduleStartTime = document.getElementById('scheduleStartTime');
const stopsContainer = document.getElementById('stopsContainer');
const addStopBtn = document.getElementById('addStopBtn');
const scheduleListEl = document.getElementById('scheduleList');

let scheduleItems = [];
let openDetailIndex = null; // preserve which item details are open

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
  // fill details: start, start time, stops
  const startHtml = `<div><strong>Điểm bắt đầu:</strong> ${it.start || '—'} ${it.startTime ? ' — ' + it.startTime : ''}</div>`;
    let stopsHtml = '';
    if (it.stops && it.stops.length) {
      stopsHtml = '<div><strong>Điểm theo giờ:</strong><ul>';
      it.stops.forEach(s => { stopsHtml += `<li>${s.time} — ${s.place}${s.prepare? ' ('+s.prepare+')':''}</li>`; });
      stopsHtml += '</ul></div>';
    }
    details.innerHTML = startHtml + stopsHtml;
    // add quick add-stop UI inside details
    const addQuick = document.createElement('div');
    addQuick.style.marginTop = '8px';
    const quickBtn = document.createElement('button');
    quickBtn.type = 'button'; quickBtn.className = 'search-button'; quickBtn.textContent = '+ Thêm điểm';
    addQuick.appendChild(quickBtn);

    const quickForm = document.createElement('div');
    quickForm.style.display = 'none';
    quickForm.style.marginTop = '8px';
    quickForm.innerHTML = `
      <input type="time" class="quick-time" />
      <input type="text" class="quick-place" placeholder="Địa điểm" />
      <input type="text" class="quick-prepare" placeholder="Cần chuẩn bị" />
    `;
    const qMapBtn = document.createElement('button'); qMapBtn.type='button'; qMapBtn.className='search-button'; qMapBtn.textContent='Map';
    const qAddBtn = document.createElement('button'); qAddBtn.type='button'; qAddBtn.className='search-button'; qAddBtn.textContent='Thêm';
    const qCancelBtn = document.createElement('button'); qCancelBtn.type='button'; qCancelBtn.className='remove-stop'; qCancelBtn.textContent='Hủy';
    quickForm.appendChild(qMapBtn);
    quickForm.appendChild(qAddBtn);
    quickForm.appendChild(qCancelBtn);
    addQuick.appendChild(quickForm);
    details.appendChild(addQuick);

    quickBtn.addEventListener('click', () => { quickForm.style.display = quickForm.style.display === 'none' ? '' : 'none'; });
    qCancelBtn.addEventListener('click', () => { quickForm.style.display = 'none'; });

    // map button in quick form targets this quickForm (it contains .quick-place)
    qMapBtn.addEventListener('click', () => openMap({ type: 'stop', row: quickForm }));

    qAddBtn.addEventListener('click', () => {
      const time = quickForm.querySelector('.quick-time').value;
      const place = quickForm.querySelector('.quick-place').value.trim();
      const prepare = quickForm.querySelector('.quick-prepare').value.trim();
      if (!time || !place) return alert('Vui lòng nhập giờ và địa điểm');
      if (!it.stops) it.stops = [];
      it.stops.push({ time, place, prepare });
      saveSchedule();
      toast('Đã thêm điểm');
      // keep details open for this item after re-render
      openDetailIndex = idx;
      renderSchedule();
    });
    li.appendChild(details);
    detailsBtn.addEventListener('click', () => {
      const isOpen = details.style.display !== 'none';
      if (isOpen) {
        details.style.display = 'none';
        detailsBtn.textContent = 'Xem';
        openDetailIndex = null;
      } else {
        details.style.display = '';
        detailsBtn.textContent = 'Ẩn';
        openDetailIndex = idx;
      }
    });
    // preserve open state
    if (openDetailIndex === idx) { details.style.display = ''; detailsBtn.textContent = 'Ẩn'; }
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
    const startVal = scheduleStart ? scheduleStart.value.trim() : '';
    const startTimeVal = scheduleStartTime ? scheduleStartTime.value : '';
    scheduleItems.push({ title, date, note, city, start: startVal, startTime: startTimeVal, stops });
    // keep this new item open after adding
    openDetailIndex = scheduleItems.length; // temporarily index (will be length-1 after push)
    saveSchedule();
    openDetailIndex = scheduleItems.length - 1;
    renderSchedule();
    scheduleForm.reset();
      // clear stops UI
      if (stopsContainer) stopsContainer.innerHTML = '';
    toast('Đã thêm lịch');
  });
} else {
  console.warn('Schedule form not found; schedule features disabled');
}

  // (addStopRow with map picker is declared later)

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

/* ---------------- Map picker & PDF export ---------------- */
const mapModal = document.getElementById('mapModal');
const closeMapModal = document.getElementById('closeMapModal');
const confirmMapBtn = document.getElementById('confirmMapBtn');
const confirmMapBtnHeader = document.getElementById('confirmMapBtnHeader');
const mapContainer = document.getElementById('mapContainer');
let mapInstance = null;
let currentMapTarget = null; // { type: 'start'|'stop', rowElement }
let currentMarker = null;
const mapSearchInput = document.getElementById('mapSearchInput');
const mapSearchBtn = document.getElementById('mapSearchBtn');
const mapSearchResults = document.getElementById('mapSearchResults');

function openMap(target) {
  currentMapTarget = target; // store where to insert the chosen location
  mapModal.style.display = '';
  if (!mapInstance) {
    mapInstance = L.map(mapContainer).setView([21.0278, 105.8342], 12); // Hanoi default
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
    mapInstance.on('click', (e) => {
      if (currentMarker) currentMarker.setLatLng(e.latlng);
      else currentMarker = L.marker(e.latlng).addTo(mapInstance);
    });
    // attach search handlers
    if (mapSearchBtn) {
      mapSearchBtn.addEventListener('click', performMapSearch);
      mapSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performMapSearch(); });
    }
  }
  // autofocus search box
  setTimeout(() => { if (mapSearchInput) { mapSearchInput.focus(); mapSearchInput.select(); } }, 150);
}

closeMapModal.addEventListener('click', () => { mapModal.style.display = 'none'; });

confirmMapBtn.addEventListener('click', () => {
  if (!currentMarker) return alert('Hãy chọn vị trí trên bản đồ');
  const { lat, lng } = currentMarker.getLatLng();
  // insert into target
  if (currentMapTarget) {
    if (currentMapTarget.type === 'start') {
      if (scheduleStart) {
        // prefer human-readable name if available
        const name = currentMarker._display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        scheduleStart.value = name;
        // keep coords for potential use
        scheduleStart.dataset.lat = lat.toFixed(6);
        scheduleStart.dataset.lng = lng.toFixed(6);
      }
    } else if (currentMapTarget.type === 'stop' && currentMapTarget.row) {
      const placeInput = currentMapTarget.row.querySelector('input[name="stopPlace"]');
      if (placeInput) {
        const name = currentMarker._display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        placeInput.value = name;
        placeInput.dataset.lat = lat.toFixed(6);
        placeInput.dataset.lng = lng.toFixed(6);
      }
    }
  }
  mapModal.style.display = 'none';
});

if (confirmMapBtnHeader) confirmMapBtnHeader.addEventListener('click', () => confirmMapBtn.click());

async function performMapSearch() {
  const q = mapSearchInput && mapSearchInput.value.trim();
  if (!q) return;
  mapSearchResults.innerHTML = '<li>Đang tìm...</li>';
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=6`,
      { headers: { 'Accept-Language': 'vi' } });
    const items = await res.json();
    mapSearchResults.innerHTML = '';
    if (!items || items.length === 0) { mapSearchResults.innerHTML = '<li>Không tìm thấy</li>'; return; }
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = it.display_name;
      li.addEventListener('click', () => {
        // center map and place marker
        const lat = parseFloat(it.lat), lon = parseFloat(it.lon);
        if (mapInstance) {
          mapInstance.setView([lat, lon], 15);
          if (currentMarker) currentMarker.setLatLng([lat, lon]);
          else currentMarker = L.marker([lat, lon]).addTo(mapInstance);
        }
        // keep the selected display name for confirm
        currentMarker._display_name = it.display_name;
        mapSearchResults.innerHTML = '';
      });
      mapSearchResults.appendChild(li);
    });
  } catch (e) {
    mapSearchResults.innerHTML = '<li>Lỗi khi tìm</li>';
  }
}

// Hook: allow adding a map-picker button to each new stop row
function addStopRow(time='', place='', prepare='') {
  if (!stopsContainer) return;
  const row = document.createElement('div');
  row.className = 'stop-row';
  row.innerHTML = `
    <input type="time" value="${time}" />
    <input type="text" name="stopPlace" placeholder="Địa điểm" value="${place}" />
    <input type="text" name="stopPrepare" placeholder="Cần chuẩn bị" value="${prepare}" />
  `;
  const mapBtn = document.createElement('button'); mapBtn.type='button'; mapBtn.className='search-button'; mapBtn.textContent='Map';
  mapBtn.addEventListener('click', () => openMap({ type: 'stop', row }));
  const rm = document.createElement('button'); rm.type='button'; rm.className='remove-stop'; rm.textContent='X';
  rm.addEventListener('click', () => row.remove());
  row.appendChild(mapBtn);
  row.appendChild(rm);
  stopsContainer.appendChild(row);
}

// add a map selector for start
if (scheduleStart) {
  const startMapBtn = document.createElement('button'); startMapBtn.type='button'; startMapBtn.className='search-button'; startMapBtn.textContent='Chọn từ bản đồ';
  scheduleStart.parentNode.appendChild(startMapBtn);
  startMapBtn.addEventListener('click', () => openMap({ type: 'start' }));
}

if (addStopBtn) addStopBtn.addEventListener('click', () => addStopRow());

// Export PDF
const exportPdfBtn = document.getElementById('exportPdfBtn');
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', async () => {
    // use jsPDF (umd)
    const { jsPDF } = window.jspdf || {}; // some cdn expose jspdf
    if (!jsPDF) return alert('jsPDF chưa được nạp');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Lịch trình', 14, 20);
    let y = 30;
    scheduleItems.forEach((it, idx) => {
      doc.setFontSize(12);
      doc.text(`${idx+1}. ${it.title} — ${it.date}`, 14, y);
      y += 8;
  if (it.start) { doc.text(`   Start: ${it.start}${it.startTime ? ' @'+it.startTime : ''}`, 18, y); y+=6; }
      if (it.note) { doc.text(`   Note: ${it.note}`, 18, y); y+=6; }
      if (it.stops && it.stops.length) {
        it.stops.forEach(s => { doc.text(`   - ${s.time} ${s.place}${s.prepare? ' ('+s.prepare+')':''}`, 18, y); y+=6; });
      }
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save('schedules.pdf');
  });
}

// toast helper
function toast(msg, ms = 2200) {
  const root = document.getElementById('toastContainer');
  if (!root) return;
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 220); }, ms);
}
