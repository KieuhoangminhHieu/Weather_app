function showWeatherAlert(temp, condition, windSpeed) {
  const alertBox = document.getElementById("weatherAlert");
  let alertMessage = "";
  let alertColor = "";

  if (temp >= 38) {
    alertMessage = "🔥 Nhiệt độ quá cao! Hạn chế ra ngoài.";
    alertColor = "#e74c3c";
  } else if (temp <= 5) {
    alertMessage = "❄️ Trời rất lạnh! Nhớ mặc ấm.";
    alertColor = "#3498db";
  } else if (condition.toLowerCase().includes("rain")) {
    alertMessage = "🌧️ Có mưa lớn! Mang theo áo mưa.";
    alertColor = "#2ecc71";
  } else if (condition.toLowerCase().includes("storm") || windSpeed >= 15) {
    alertMessage = "🌪️ Gió mạnh hoặc bão! Tránh ra ngoài.";
    alertColor = "#f39c12";
  }

  if (alertMessage) {
    alertBox.innerHTML = `<div style="
      background: ${alertColor};
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    ">${alertMessage}</div>`;
  } else {
    alertBox.innerHTML = "";
  }
}