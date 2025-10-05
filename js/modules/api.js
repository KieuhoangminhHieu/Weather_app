// Small wrapper around the backend proxy endpoints
export async function fetchWeather(city) {
  const url = `/api/weather?city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

export async function fetchForecast(city) {
  const url = `/api/forecast?city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

export async function fetchWeatherByCoords(lat, lon) {
  const url = `/api/weather/coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

export async function fetchForecastByCoords(lat, lon) {
  const url = `/api/forecast/coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}
