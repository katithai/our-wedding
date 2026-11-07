/* ==========================================================================
   Màn hình Bìa Thiệp (Welcome Overlay), Giải mã Tên Khách Mời (?id=...),
   Nhạc nền & Tự động cuộn trang mượt mà
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

  // Mặc định hiển thị "Quý Khách" trước
  const DEFAULT_GUEST_NAME = 'Quý Khách';
  if (overlayGuestEl) overlayGuestEl.textContent = DEFAULT_GUEST_NAME;
  if (inlineGuestEl) inlineGuestEl.textContent = DEFAULT_GUEST_NAME;

  const urlParams = new URLSearchParams(window.location.search);
  const encodedId = urlParams.get('id');

  if (encodedId) {
    try {
      // Kiểm tra chặt: nếu chuỗi Base64 bị thiếu dù chỉ 1 ký tự (không chia hết cho 4) hoặc sai định dạng -> báo lỗi ngay
      if (
        encodedId.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedId)
      ) {
        throw new Error('Mã ID bị thiếu ký tự');
      }

      // Giải mã Base64 tiếng Việt (fatal: true bắt lỗi ngay nếu byte UTF-8 bị hỏng)
      const binary = atob(encodedId);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const guestName = new TextDecoder('utf-8', { fatal: true })
        .decode(bytes)
        .trim();

      // Giải mã thành công mới gán tên
      if (guestName) {
        if (overlayGuestEl) overlayGuestEl.textContent = guestName;
        if (inlineGuestEl) inlineGuestEl.textContent = guestName;

        const guestbookNameInput = document.getElementById('guest-name');
        if (guestbookNameInput && !guestbookNameInput.value) {
          guestbookNameInput.value = guestName;
        }
        const rsvpNameInput = document.querySelector('#rsvp-form input[type="text"]');
        if (rsvpNameInput && !rsvpNameInput.value) {
          rsvpNameInput.value = guestName;
        }
      }
    } catch (e) {
      // Nếu mã sai hoặc thiếu ký tự -> giữ nguyên mặc định "Quý Khách"
      console.error('Mã ID không hợp lệ');
    }
  }

  // ---------------- 1. ĐIỀU KHIỂN NHẠC NỀN ----------------
  const audio = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-toggle-btn');
  const musicDisc = document.getElementById('music-disc');

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
        setMusicVisualState(true);
      })
      .catch(() => {
        // Trình duyệt chặn tự động phát cho đến khi người dùng tương tác lần đầu
      });
  }

  if (audio) {
    audio.addEventListener('play', () => setMusicVisualState(true));
    audio.addEventListener('pause', () => setMusicVisualState(false));
  }

  if (musicBtn && audio) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
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

