# Weather_app 🌦️
Ứng dụng web đơn giản giúp tra cứu thời tiết theo thành phố, được xây dựng bằng **HTML, CSS, JavaScript** và sử dụng API từ [OpenWeatherMap](https://openweathermap.org/).

## 🚀 Tính năng
- Nhập tên thành phố và xem thông tin thời tiết hiện tại.
- Hiển thị nhiệt độ, độ ẩm, tốc độ gió và mô tả thời tiết (đã dịch sang tiếng Việt).
- Dự báo thời tiết 5 ngày tới (theo giờ trưa).
- Biểu đồ nhiệt độ trực quan bằng Chart.js.
- Cảnh báo thời tiết theo điều kiện (nhiệt độ cao, mưa, gió mạnh...).
- Tự động lấy vị trí người dùng khi mở app.
- Hỗ trợ đa ngôn ngữ: 🇻🇳 Tiếng Việt / 🇺🇸 English.
- Chế độ tối (Dark Mode) thân thiện với mắt.
- Lưu lịch sử tìm kiếm và cho phép tra cứu lại nhanh.
- 💬 Tích hợp AI tư vấn thời tiết thông minh (WeatherAI).
- 🤖 Chat trực tiếp với AI để hỏi về thời tiết theo ngữ cảnh

## 🛠️ Công nghệ sử dụng
- HTML5: cấu trúc giao diện
- CSS3: thiết kế và responsive
- JavaScript (Fetch API): xử lý logic và gọi API
- Chart.js: vẽ biểu đồ nhiệt độ
- OpenWeatherMap API: cung cấp dữ liệu thời tiết
- Spring Boot + Spring AI: backend xử lý tư vấn AI
- Gemini (Google): sinh phản hồi AI theo ngữ cảnh

🧠 Tích hợp AI
- Sử dụng Spring AI và Gemini API để sinh lời khuyên thời tiết thân thiện.
- AI phân tích nhiệt độ, độ ẩm, gió và điều kiện trời để đưa ra gợi ý gần gũi.
- Chat AI hoạt động độc lập, có bộ nhớ ngắn hạn.
- Tự động fallback sang tư vấn nội bộ nếu AI không phản hồi.

## 📦 Cài đặt và chạy dự án
1. Clone repo về máy:
   git clone https://github.com/KieuhoangminhHieu/Weather_app.git
2. Chạy backend (Java Spring Boot):
   - Cấu hình API key trong application.properties
   - Chạy bằng Maven:
   ./mvnw spring-boot:run
3. Mở frontend:
   - Mở index.html bằng trình duyệt
   - Hoặc host bằng server tĩnh như Live Server / Vite / Vercel


