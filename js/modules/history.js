const STORAGE_KEY = 'weatherHistory';

export function loadHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function addToHistory(city, max = 5) {
  const history = loadHistory();
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > max) history.pop();
    saveHistory(history);
  }
  return history;
}
