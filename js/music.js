const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
let isPlaying = false;
let awaitingGesture = false;

// Friendly initial label
musicBtn.textContent = "🎵 Bật nhạc";

async function tryPlay() {
  try {
    await bgMusic.play();
    isPlaying = true;
    musicBtn.textContent = "⏸️ Tắt nhạc";
    awaitingGesture = false;
  } catch (err) {
    // Play was blocked by browser autoplay policy. Wait for a user gesture.
    console.warn('bgMusic.play() was blocked:', err && err.message ? err.message : err);
    isPlaying = false;
    musicBtn.textContent = "▶️ Nhấn để bật nhạc";

    if (!awaitingGesture) {
      awaitingGesture = true;
      // One-time listener: next click anywhere will retry play
      const onGesture = () => {
        tryPlay();
      };
      document.addEventListener('click', onGesture, { once: true, passive: true });
    }
  }
}

musicBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!isPlaying) {
    await tryPlay();
  } else {
    bgMusic.pause();
    isPlaying = false;
    musicBtn.textContent = "🎵 Bật nhạc";
  }
});