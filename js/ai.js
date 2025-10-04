function generateWeatherAdvice(data) {
  const { main, weather, wind } = data;
  const temp = main.temp;
  const condition = weather[0].main.toLowerCase();
  const windSpeed = wind.speed;

  let advice = `🤖 AI tư vấn: Hôm nay trời ${condition}, nhiệt độ khoảng ${temp}°C. `;

  if (temp >= 35) advice += "Trời khá nóng, bạn nên mặc đồ nhẹ và uống đủ nước.";
  else if (temp <= 10) advice += "Trời lạnh, nhớ mặc ấm và hạn chế ra ngoài lâu.";

  if (condition.includes("rain")) advice += " Có mưa, hãy mang theo ô hoặc áo mưa.";
  if (condition.includes("storm") || windSpeed >= 15) advice += " Gió mạnh, nên tránh đi xe máy hoặc ra ngoài nhiều.";

  if (temp >= 20 && temp <= 30 && !condition.includes("rain")) {
    advice += " Thời tiết khá dễ chịu, bạn có thể ra ngoài đi dạo hoặc cafe cùng bạn bè.";
  }

  return advice;
}