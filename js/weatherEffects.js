// 🧹 Xóa hiệu ứng cũ
function removeWeatherEffects() {
  const container = document.getElementById("weatherEffects");
  if (container) container.innerHTML = "";
}

// 🌧️ Mưa rơi
function startRainEffect() {
  const container = document.getElementById("weatherEffects");
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = Math.random() * window.innerWidth + "px";
    container.appendChild(drop);
  }
}

// ☀️ Nắng lấp lánh
function showSunGlow() {
  const glow = document.createElement("div");
  glow.className = "sun-glow";
  document.getElementById("weatherEffects").appendChild(glow);
}

// 🌫️ Sương mù
function showFogLayer() {
  const fog = document.createElement("div");
  fog.className = "fog-layer";
  document.getElementById("weatherEffects").appendChild(fog);
}

// ❄️ Tuyết rơi (tuỳ chọn)
function startSnowEffect() {
  const container = document.getElementById("weatherEffects");
  for (let i = 0; i < 80; i++) {
    const flake = document.createElement("div");
    flake.className = "snow-flake";
    flake.style.left = Math.random() * window.innerWidth + "px";
    container.appendChild(flake);
  }
}

// 🔄 Kích hoạt hiệu ứng theo mô tả thời tiết
function applyWeatherEffect(description) {
  removeWeatherEffects();
  const desc = description.toLowerCase();

  const effectMap = {
    rain: startRainEffect,
    drizzle: startRainEffect,
    shower: startRainEffect,
    thunderstorm: startRainEffect,
    snow: startSnowEffect,
    sleet: startSnowEffect,
    clear: showSunGlow,
    sunny: showSunGlow,
    cloud: showSunGlow,
    few: showSunGlow,
    scattered: showSunGlow,
    broken: showSunGlow,
    overcast: showSunGlow,
    mist: showFogLayer,
    fog: showFogLayer,
    haze: showFogLayer,
    smoke: showFogLayer,
    dust: showFogLayer,
    ash: showFogLayer
  };

  for (const key in effectMap) {
    if (desc.includes(key)) {
      effectMap[key]();
      return;
    }
  }

  console.log("Không có hiệu ứng phù hợp cho:", desc);
}