let chartInstance = null;

function renderTemperatureChart(dailyData) {
  const labels = [];
  const temps = [];

  for (const date in dailyData) {
    labels.push(date);
    temps.push(dailyData[date].main.temp);
  }

  const ctx = document.getElementById("tempChart").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "🌡️ Nhiệt độ (°C)",
        data: temps,
        borderColor: "#4a90e2",
        backgroundColor: "rgba(74,144,226,0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#4a90e2"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}