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

  // ---------------- 3. BẢO VỆ ẢNH CƯỚI (CHỐNG LƯU & CHỤP MÀN HÌNH) ----------------
  let blurRecoverTimer = null;

  function triggerPhotoBlur(durationMs = 2200) {
    document.body.classList.add('photo-protected-blur');
    clearTimeout(blurRecoverTimer);
    if (durationMs > 0) {
      blurRecoverTimer = setTimeout(() => {
        if (document.hasFocus() && !document.hidden) {
          document.body.classList.remove('photo-protected-blur');
        }
      }, durationMs);
    }
  }

  // 1. Chặn menu chuột phải & nhấn giữ lưu ảnh trên điện thoại (trừ trong Hộp Quà Mừng)
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#gift-modal')) return;
    e.preventDefault();
  });

  // 2. Chặn kéo thả ảnh
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  // 3. Chặn thao tác vuốt 2-3 ngón tay chụp màn hình trên điện thoại Android/iOS
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length >= 2) {
        triggerPhotoBlur(2500);
      }
    },
    { passive: true }
  );

  // 4. Làm mờ ảnh ngay khi vuốt thanh Trung tâm điều khiển (Control Center) hoặc chuyển ứng dụng
  window.addEventListener('blur', () => {
    triggerPhotoBlur(0);
  });

  window.addEventListener('focus', () => {
    clearTimeout(blurRecoverTimer);
    blurRecoverTimer = setTimeout(() => {
      document.body.classList.remove('photo-protected-blur');
    }, 300);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      triggerPhotoBlur(0);
    } else {
      clearTimeout(blurRecoverTimer);
      blurRecoverTimer = setTimeout(() => {
        document.body.classList.remove('photo-protected-blur');
      }, 300);
    }
  });

  // 5. Chặn phím chụp màn hình (PrintScreen, Cmd+Shift+3/4/5) & phím tắt lưu trang trên máy tính
  window.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      triggerPhotoBlur(3000);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (
      e.key === 'PrintScreen' ||
      (e.metaKey && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key)) ||
      (e.ctrlKey && e.shiftKey && ['s', 'S', 'i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) ||
      (e.ctrlKey && ['s', 'S', 'u', 'U', 'p', 'P'].includes(e.key)) ||
      e.key === 'F12'
    ) {
      triggerPhotoBlur(3000);
      e.preventDefault();
    }
  });
})();

