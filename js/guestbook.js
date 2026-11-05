/* ==========================================================================
   Sổ Lưu Bút (Guestbook):
   - Bộ lọc chặn từ nhạy cảm & link spam (Lớp 1)
   - Lưu & đồng bộ Google Sheets + LocalStorage (Lớp 2)
   - Giới hạn tần suất chống spam (Lớp 3)
   ========================================================================== */

(function () {
  const form = document.getElementById('guestbook-form');
  const aiBtn = document.getElementById('ai-wish-btn');
  const nameInput = document.getElementById('guest-name');
  const wishInput = document.getElementById('guest-wish');
  const list = document.getElementById('guestbook-list');

  if (!form || !nameInput || !wishInput || !list) return;

  const STORAGE_KEY_WISHES = 'wedding_saved_wishes_v1';
  const STORAGE_KEY_SPAM = 'wedding_spam_tracker_v1';

  // Tạo hộp thông báo trạng thái ngay dưới nút Gửi lời chúc
  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'mt-2.5 text-xs text-center font-medium hidden rounded-md px-3 py-2';
  form.querySelector('div').appendChild(feedbackEl);

  function showFeedback(message, isError = false) {
    feedbackEl.textContent = message;
    feedbackEl.classList.remove('hidden');
    if (isError) {
      feedbackEl.style.backgroundColor = 'rgba(185, 28, 28, 0.12)';
      feedbackEl.style.color = '#991b1b';
      feedbackEl.style.border = '1px solid rgba(185, 28, 28, 0.3)';
    } else {
      feedbackEl.style.backgroundColor = 'rgba(81, 20, 25, 0.1)';
      feedbackEl.style.color = 'rgb(81, 20, 25)';
      feedbackEl.style.border = '1px solid rgba(81, 20, 25, 0.25)';
    }
    clearTimeout(feedbackEl._timer);
    feedbackEl._timer = setTimeout(() => {
      feedbackEl.classList.add('hidden');
    }, 5000);
  }

  // ---------------- GỢI Ý LỜI CHÚC BẰNG AI (🪄) ----------------
  const sampleWishes = [
    'Chúc Hoàng Long và Bảo Ngọc trăm năm hạnh phúc, trọn vẹn yêu thương!',
    'Chúc mừng ngày trọng đại của hai bạn! Chúc gia đình nhỏ luôn ngập tràn tiếng cười.',
    'Chúc hai bạn răng long đầu bạc, mãi mãi bên nhau hạnh phúc viên mãn!',
    'Đẹp đôi quá! Chúc cô dâu chú rể trăm năm tình viên mãn, bạc đầu nghĩa phu thê!',
    'Chúc hai bạn có một đám cưới thật ấm áp và khởi đầu hành trình mới thật rực rỡ!'
  ];
  let wishIdx = 0;

  if (aiBtn) {
    aiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wishInput.value = sampleWishes[wishIdx % sampleWishes.length];
      wishIdx++;
      wishInput.focus();
    });
  }

  // ---------------- HIỂN THỊ THẺ LỜI CHÚC ----------------
  function createWishCardElement(name, wish, timeStr) {
    const item = document.createElement('div');
    item.className = 'rounded-[8px] border p-4 text-sm';
    item.style.borderColor = 'rgba(81, 20, 25, 0.333)';
    item.style.backgroundColor = 'rgba(255, 255, 255, 0.55)';
    item.innerHTML = `
      <div class="flex items-start justify-between">
        <span class="font-semibold" style="color: rgb(81, 20, 25);"></span>
        <span class="text-xs opacity-70"></span>
      </div>
      <p class="mt-2 leading-relaxed"></p>
    `;
    item.querySelector('span.font-semibold').textContent = name;
    item.querySelector('span.text-xs').textContent = timeStr;
    item.querySelector('p').textContent = wish;
    return item;
  }

  function formatCurrentTimestamp() {
    const now = new Date();
    return (
      now.toTimeString().split(' ')[0] +
      ' ' +
      now.getDate() +
      '/' +
      (now.getMonth() + 1) +
      '/' +
      now.getFullYear()
    );
  }

  // ---------------- KIỂM TRA CHỐNG SPAM (LỚP 3) ----------------
  function getSpamTracker() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SPAM);
      return raw ? JSON.parse(raw) : { count: 0, lastSentAt: 0 };
    } catch (e) {
      return { count: 0, lastSentAt: 0 };
    }
  }

  function recordSpamAction() {
    try {
      const tracker = getSpamTracker();
      tracker.count += 1;
      tracker.lastSentAt = Date.now();
      localStorage.setItem(STORAGE_KEY_SPAM, JSON.stringify(tracker));
    } catch (e) {}
  }

  function checkSpamAllowed() {
    const cfg = window.WEDDING_CONFIG || {};
    const cooldownMs = (cfg.COOLDOWN_SECONDS || 45) * 1000;
    const maxWishes = cfg.MAX_WISHES_PER_DEVICE || 5;
    const tracker = getSpamTracker();

    if (tracker.count >= maxWishes) {
      return {
        allowed: false,
        reason: `Bạn đã gửi ${maxWishes} lời chúc rồi. Cảm ơn tình cảm của bạn dành cho cô dâu chú rể nhé!`
      };
    }

    const elapsed = Date.now() - (tracker.lastSentAt || 0);
    if (elapsed < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
      return {
        allowed: false,
        reason: `Bạn vừa gửi lời chúc, vui lòng đợi ${waitSec} giây nữa trước khi gửi tiếp nhé!`
      };
    }

    return { allowed: true };
  }

  // ---------------- LƯU & ĐỒNG BỘ DỮ LIỆU (LỚP 2) ----------------
  function loadLocalWishes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WISHES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalWish(entry) {
    try {
      const existing = loadLocalWishes();
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(existing.slice(0, 50)));
    } catch (e) {}
  }

  async function fetchWishesFromGoogleSheet() {
    const cfg = window.WEDDING_CONFIG || {};
    const url = (cfg.GOOGLE_SCRIPT_URL || '').trim();

    if (!url) {
      // Nếu chưa gắn Google Sheet thì hiển thị các lời chúc đã lưu trên trình duyệt này
      const localWishes = loadLocalWishes();
      for (let i = localWishes.length - 1; i >= 0; i--) {
        const w = localWishes[i];
        list.prepend(createWishCardElement(w.name, w.message, w.timestamp));
      }
      return;
    }

    try {
      const res = await fetch(`${url}?action=getWishes`, { method: 'GET' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.wishes)) {
        // Thêm các lời chúc đã được duyệt từ Google Sheet lên đầu danh sách
        for (let i = data.wishes.length - 1; i >= 0; i--) {
          const w = data.wishes[i];
          if (w.name && w.message) {
            list.prepend(createWishCardElement(w.name, w.message, w.timestamp || ''));
          }
        }
      }
    } catch (e) {
      // Dự phòng đọc từ LocalStorage nếu mất mạng
      const localWishes = loadLocalWishes();
      for (let i = localWishes.length - 1; i >= 0; i--) {
        const w = localWishes[i];
        list.prepend(createWishCardElement(w.name, w.message, w.timestamp));
      }
    }
  }

  // Tải lời chúc khi mở trang
  fetchWishesFromGoogleSheet();

  // ---------------- XỬ LÝ KHI KHÁCH BẤM "GỬI LỜI CHÚC" ----------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const wish = wishInput.value.trim();
    if (!name || !wish) return;

    // 1. Kiểm tra bộ lọc từ nhạy cảm / tục tĩu / link spam (Lớp 1)
    if (typeof window.validateWeddingText === 'function') {
      const nameCheck = window.validateWeddingText(name);
      if (!nameCheck.valid) {
        showFeedback(nameCheck.reason, true);
        nameInput.focus();
        return;
      }

      const wishCheck = window.validateWeddingText(wish);
      if (!wishCheck.valid) {
        showFeedback(wishCheck.reason, true);
        wishInput.focus();
        return;
      }
    }

    // 2. Kiểm tra chống spam gửi liên tục (Lớp 3)
    const spamCheck = checkSpamAllowed();
    if (!spamCheck.allowed) {
      showFeedback(spamCheck.reason, true);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'ĐANG GỬI...';

    const timeStr = formatCurrentTimestamp();
    const cfg = window.WEDDING_CONFIG || {};
    const autoApprove = cfg.AUTO_APPROVE_WISHES !== false;
    const scriptUrl = (cfg.GOOGLE_SCRIPT_URL || '').trim();

    // Lưu LocalStorage và ghi nhận lượt gửi
    recordSpamAction();
    if (autoApprove || !scriptUrl) {
      saveLocalWish({ name, message: wish, timestamp: timeStr });
      list.prepend(createWishCardElement(name, wish, timeStr));
    }

    // 3. Gửi lên Google Sheets (nếu đã cấu hình link)
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            type: 'wish',
            name: name,
            message: wish,
            timestamp: timeStr,
            approved: autoApprove
          })
        });
      } catch (err) {}
    }

    nameInput.value = '';
    wishInput.value = '';
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;

    if (scriptUrl && !autoApprove) {
      showFeedback('Cảm ơn bạn! Lời chúc đã được gửi tới cô dâu chú rể và sẽ hiển thị sau khi duyệt ♡', false);
    } else {
      showFeedback('Cảm ơn lời chúc tốt đẹp của bạn dành cho cô dâu chú rể! ♡', false);
    }
  });
})();
