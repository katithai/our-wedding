/* ==========================================================================
   Background Music (audio/music.mp3) & Auto-Scroll Controller
   - Tự động cuộn trang mượt mà khi mở web
   - Nhấn 1 cái vào trang là dừng cuộn, nhấn cái nữa là chạy tiếp
   ========================================================================== */

(function () {
  // ---------------- 1. BACKGROUND MUSIC ----------------
  const audio = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-toggle-btn');
  const musicDisc = document.getElementById('music-disc');
  let musicStartedOnce = false;

  function setMusicVisualState(playing) {
    if (!musicDisc) return;
    if (playing) {
      musicDisc.classList.add('animate-spin-cd');
    } else {
      musicDisc.classList.remove('animate-spin-cd');
    }
  }

  function tryPlayMusic() {
    if (!audio) return;
    audio
      .play()
      .then(() => {
        musicStartedOnce = true;
        setMusicVisualState(true);
      })
      .catch(() => {
        // Browser blocked autoplay until first user gesture
      });
  }

  if (audio) {
    audio.addEventListener('play', () => setMusicVisualState(true));
    audio.addEventListener('pause', () => setMusicVisualState(false));
    // Attempt autoplay on load
    window.addEventListener('load', tryPlayMusic);
  }

  if (musicBtn && audio) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      musicStartedOnce = true;
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });
  }

  // Unlock audio on the very first interaction if browser blocked initial autoplay
  function unlockAudioOnFirstGesture() {
    if (!musicStartedOnce && audio && audio.paused) {
      tryPlayMusic();
    }
    window.removeEventListener('click', unlockAudioOnFirstGesture);
    window.removeEventListener('touchstart', unlockAudioOnFirstGesture);
  }
  window.addEventListener('click', unlockAudioOnFirstGesture, { passive: true });
  window.addEventListener('touchstart', unlockAudioOnFirstGesture, { passive: true });

  // ---------------- 2. AUTO-SCROLL CONTROLLER ----------------
  let isAutoScrolling = true;
  let scrollAccumulator = 0;
  let lastFrameTime = null;
  const SCROLL_SPEED_PX_PER_SEC = 55; // Tốc độ cuộn mượt vừa tầm đọc

  function isAnyModalOpen() {
    return Boolean(document.querySelector('dialog[open]'));
  }

  function isFormElementFocused() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function autoScrollStep(timestamp) {
    if (lastFrameTime === null) {
      lastFrameTime = timestamp;
    }
    const deltaSec = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    if (isAutoScrolling && !isAnyModalOpen() && !isFormElementFocused()) {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (window.scrollY < maxScroll - 1) {
        scrollAccumulator += SCROLL_SPEED_PX_PER_SEC * deltaSec;
        const pixelsToScroll = Math.floor(scrollAccumulator);
        if (pixelsToScroll >= 1) {
          window.scrollBy(0, pixelsToScroll);
          scrollAccumulator -= pixelsToScroll;
        }
      } else {
        // Đã cuộn tới cuối trang -> tự động dừng
        isAutoScrolling = false;
      }
    }

    requestAnimationFrame(autoScrollStep);
  }

  // Bắt đầu tự động cuộn sau khi trang tải
  setTimeout(() => {
    requestAnimationFrame(autoScrollStep);
  }, 600);

  // Nhấn 1 cái vào trang là dừng lại, nhấn cái nữa là chạy tiếp
  document.addEventListener('click', (e) => {
    // Bỏ qua nếu người dùng đang nhấn vào nút, link, ô nhập liệu, ảnh carousel hoặc popup modal
    const interactiveTarget = e.target.closest(
      'button, a, input, textarea, select, label, dialog, iframe, .carousel-card'
    );
    if (interactiveTarget) return;

    isAutoScrolling = !isAutoScrolling;
  });

  // ---------------- 3. CHẶN NHẤN GIỮ LƯU ẢNH & CHUỘT PHẢI ----------------
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#gift-modal')) return;
    e.preventDefault();
  });

  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
})();

