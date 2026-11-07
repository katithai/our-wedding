/* ==========================================================================
   Hộp thoại Hộp Quà Mừng (Gift Box) & Xác Nhận Tham Dự (RSVP)
   - Kết nối biểu mẫu Xác nhận tham dự (RSVP) với Google Sheets & Bộ lọc từ cấm
   ========================================================================== */

window.copyBankInfo = function (accNum, btnEl, qrUrl, fileName) {
  if (navigator.clipboard && accNum) {
    navigator.clipboard.writeText(accNum).catch(() => {});
  }
  if (qrUrl) {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = fileName || 'qr-code.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  const span = btnEl.querySelector('span');
  if (!span) return;
  const prev = span.textContent;
  span.textContent = 'Đã lưu QR & copy STK';
  setTimeout(() => {
    span.textContent = prev;
  }, 1800);
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
