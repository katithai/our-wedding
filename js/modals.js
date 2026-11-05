/* ==========================================================================
   Modals (Gift Box & RSVP) + Red Envelope Fallback SVG
   - Kết nối form Xác nhận tham dự (RSVP) với Google Sheets & Bộ lọc từ cấm
   ========================================================================== */

// Fallback SVG for the red lucky envelope in Hộp Quà Mừng
window.__RED_ENVELOPE_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6b161e"/>
          <stop offset="50%" stop-color="#511419"/>
          <stop offset="100%" stop-color="#3c0c10"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f3d98b"/>
          <stop offset="50%" stop-color="#c9a24a"/>
          <stop offset="100%" stop-color="#9a7422"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="200" height="300" rx="14" fill="url(#bg)" stroke="url(#gold)" stroke-width="2.5"/>
      <rect x="20" y="20" width="180" height="280" rx="9" fill="none" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.5"/>
      <path d="M10 24 Q110 115 210 24" fill="none" stroke="url(#gold)" stroke-width="2" stroke-opacity="0.75"/>
      <circle cx="110" cy="145" r="38" fill="url(#gold)"/>
      <circle cx="110" cy="145" r="33" fill="none" stroke="#511419" stroke-width="1.5"/>
      <text x="110" y="160" text-anchor="middle" font-size="42" font-family="serif" font-weight="bold" fill="#511419">囍</text>
    </svg>
  `);

window.copyBankInfo = function (accNum, btnEl) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(accNum).catch(() => {});
  }
  const span = btnEl.querySelector('span');
  if (!span) return;
  const prev = span.textContent;
  span.textContent = 'Đã sao chép STK';
  setTimeout(() => {
    span.textContent = prev;
  }, 1500);
};

(function () {
  const openGiftBtn = document.getElementById('open-gift-btn');
  const giftModal = document.getElementById('gift-modal');
  const openRsvpBtn = document.getElementById('open-rsvp-btn');
  const rsvpModal = document.getElementById('rsvp-modal');
  const rsvpForm = document.getElementById('rsvp-form');

  if (openGiftBtn && giftModal) {
    openGiftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      giftModal.showModal();
    });
  }

  if (openRsvpBtn && rsvpModal) {
    openRsvpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rsvpModal.showModal();
    });
  }

  if (rsvpForm && rsvpModal) {
    const errorEl = document.createElement('p');
    errorEl.className = 'text-xs text-center font-medium hidden rounded-md px-3 py-2';
    errorEl.style.backgroundColor = 'rgba(185, 28, 28, 0.12)';
    errorEl.style.color = '#991b1b';
    rsvpForm.insertBefore(errorEl, rsvpForm.querySelector('button[type="submit"]'));

    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.classList.add('hidden');

      const nameInput = rsvpForm.querySelector('input[type="text"]');
      const attendRadio = rsvpForm.querySelector('input[name="attend"]:checked');
      const countSelect = rsvpForm.querySelector('select');
      const btn = rsvpForm.querySelector('button[type="submit"]');

      const guestName = (nameInput ? nameInput.value : '').trim();
      const attendStatus = attendRadio && attendRadio.value === 'no' ? 'Không thể đến' : 'Tôi sẽ đến';
      const guestCount = attendRadio && attendRadio.value === 'no' ? 0 : Number(countSelect ? countSelect.value : 1);

      if (typeof window.validateWeddingText === 'function') {
        const check = window.validateWeddingText(guestName);
        if (!check.valid) {
          errorEl.textContent = check.reason;
          errorEl.classList.remove('hidden');
          if (nameInput) nameInput.focus();
          return;
        }
      }

      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'ĐANG GỬI...';

      const now = new Date();
      const timeStr =
        now.toTimeString().split(' ')[0] +
        ' ' +
        now.getDate() +
        '/' +
        (now.getMonth() + 1) +
        '/' +
        now.getFullYear();

      const scriptUrl = ((window.WEDDING_CONFIG && window.WEDDING_CONFIG.GOOGLE_SCRIPT_URL) || '').trim();
      if (scriptUrl) {
        try {
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              type: 'rsvp',
              name: guestName,
              attend: attendStatus,
              guestCount: guestCount,
              timestamp: timeStr
            })
          });
        } catch (err) {}
      }

      btn.textContent = 'Cảm ơn bạn đã xác nhận! ♡';
      setTimeout(() => {
        rsvpModal.close();
        btn.disabled = false;
        btn.textContent = originalText;
        rsvpForm.reset();
      }, 1200);
    });
  }
})();
