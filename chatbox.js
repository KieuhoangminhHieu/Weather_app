const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatBox = document.getElementById("chatBox");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

// Hiện/ẩn khung chat
chatToggleBtn.addEventListener("click", () => {
  chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
});

// Gửi khi nhấn nút hoặc Enter
chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

// Gửi tin nhắn đến backend
async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage("Bạn", message);
  chatInput.value = "";

  try {
    const response = await fetch("http://localhost:8080/ai/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const result = await response.json();

    // Hiển thị phản hồi từ AI
    appendMessage("WeatherAI", `${result.content}<br><small>${result.timestamp}</small>`);
  } catch (error) {
    appendMessage("WeatherAI", "❌ Xin lỗi, tôi không thể phản hồi lúc này.");
    console.error("Lỗi khi gọi AI:", error);
  }
}

// Thêm tin nhắn vào khung chat
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = "chat-message";
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}