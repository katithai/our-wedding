/* ==========================================================================
   Welcome Overlay, Dynamic Guest Name (?to=...), Background Music & Auto-Scroll
   ========================================================================== */

(function () {
  // Luôn đưa trang về trên cùng mỗi khi F5 / tải lại trang
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
  });

  // ---------------- 0. ĐỌC TÊN KHÁCH MỜI TỪ URL & MÀN HÌNH OVERLAY ----------------
  const overlay = document.getElementById('welcome-overlay');
  const openInviteBtn = document.getElementById('open-invite-btn');
  const overlayGuestEl = document.getElementById('overlay-guest-name');
  const inlineGuestEl = document.getElementById('inline-guest-name');
  const fallingHyContainer = document.getElementById('overlay-falling-hy');

  // Khởi tạo các chữ Hỷ (囍) rơi xuống trên màn hình Overlay
  if (fallingHyContainer) {
    const count = window.innerWidth < 640 ? 18 : 26;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'falling-hy-item';
      span.textContent = '囍';
      const size = 13 + Math.random() * 14; // 13px -> 27px
      const left = Math.random() * 100; // 0% -> 100%
      const duration = 6 + Math.random() * 7; // 6s -> 13s
      const delay = -Math.random() * 12; // Rơi sẵn ngay từ lúc mở trang
      const drift = (Math.random() - 0.5) * 90; // Lắc nhẹ sang trái/phải
      const rot = (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 200);
      const opacity = 0.25 + Math.random() * 0.45;

      span.style.left = `${left}%`;
      span.style.fontSize = `${size.toFixed(1)}px`;
      span.style.animationDuration = `${duration.toFixed(2)}s`;
      span.style.animationDelay = `${delay.toFixed(2)}s`;
      span.style.setProperty('--hy-drift', `${drift.toFixed(0)}px`);
      span.style.setProperty('--hy-rot', `${rot.toFixed(0)}deg`);
      span.style.setProperty('--hy-opacity', opacity.toFixed(2));
      fallingHyContainer.appendChild(span);
    }
  }

  function getGuestNameFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw =
        params.get('to') ||
        params.get('khach') ||
        params.get('name') ||
        params.get('k') ||
        '';
      return raw.trim();
    } catch (e) {
      return '';
    }
  }

  const customGuestName = getGuestNameFromUrl();
  const displayGuestName = customGuestName || 'Quý Khách';

  if (overlayGuestEl) overlayGuestEl.textContent = displayGuestName;
  if (inlineGuestEl) inlineGuestEl.textContent = displayGuestName;

  // Tự động điền sẵn tên khách vào ô Sổ Lưu Bút & Xác nhận tham dự nếu có tên riêng trên link
  if (customGuestName) {
    const guestbookNameInput = document.getElementById('guest-name');
    if (guestbookNameInput && !guestbookNameInput.value) {
      guestbookNameInput.value = customGuestName;
    }
    const rsvpNameInput = document.querySelector('#rsvp-form input[type="text"]');
    if (rsvpNameInput && !rsvpNameInput.value) {
      rsvpNameInput.value = customGuestName;
    }
  }

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

  // ---------------- 2. AUTO-SCROLL & MỞ THIỆP OVERLAY ----------------
  let isOverlayOpen = Boolean(overlay);
  let isAutoScrolling = !isOverlayOpen;
  let scrollAccumulator = 0;
  let lastFrameTime = null;
  const SCROLL_SPEED_PX_PER_SEC = 55; // Tốc độ cuộn mượt vừa tầm đọc

  function openInvitationOverlay(e) {
    if (e) e.stopPropagation();
    if (!isOverlayOpen) return;
    isOverlayOpen = false;

    // Đảm bảo thư chính luôn bắt đầu từ vị trí trên cùng khi mở thiệp
    window.scrollTo(0, 0);
    scrollAccumulator = 0;

    // Bật nhạc ngay khi bấm "Mở Thiệp"
    tryPlayMusic();

    // Hiệu ứng mở tấm màn Overlay
    if (overlay) {
      overlay.classList.add('overlay-hidden');
      document.body.classList.remove('overflow-hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 700);
    }

    // Bắt đầu tự động cuộn mượt mà sau khi mở thiệp
    setTimeout(() => {
      isAutoScrolling = true;
    }, 550);
  }

  // Chỉ mở thiệp khi bấm đúng vào nút "Mở Thiệp"
  if (openInviteBtn) {
    openInviteBtn.addEventListener('click', openInvitationOverlay);
  }

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
    if (isOverlayOpen) return;
    // Bỏ qua nếu người dùng đang nhấn vào nút, link, ô nhập liệu, ảnh carousel hoặc popup modal
    const interactiveTarget = e.target.closest(
      'button, a, input, textarea, select, label, dialog, iframe, .carousel-card, #welcome-overlay'
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

