/* ==========================================================================
   Cấu hình Google Sheets & Bộ lọc bảo vệ Sổ Lưu Bút / Xác Nhận Tham Dự
   ========================================================================== */

window.WEDDING_CONFIG = {
  // 1. Dán link Web App Google Apps Script của bạn vào giữa 2 dấu nháy bên dưới:
  // Ví dụ: 'https://script.google.com/macros/s/AKfycbx.../exec'
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwvckvQBeQQpv_efeiijizfA_T7H4YCM2ARKS51nSNWILAIijHDBYqUBPhdPwMcqK72/exec',

  // 2. Chế độ duyệt lời chúc:
  // - true  : Lời chúc sạch (vượt qua bộ lọc từ cấm) sẽ tự động hiện lên web luôn.
  //           Nếu muốn ẩn câu nào, bạn chỉ cần vào Google Sheet xóa dòng đó hoặc đổi cột Duyệt thành FALSE.
  // - false : Khách gửi xong phải đợi bạn vào Google Sheet đổi cột Duyệt thành TRUE thì người khác mới thấy.
  AUTO_APPROVE_WISHES: true,

  // 3. Chống Spam:
  COOLDOWN_SECONDS: 45,       // Thời gian chờ tối thiểu giữa 2 lần gửi liên tiếp (giây)
  MAX_WISHES_PER_DEVICE: 5,   // Số lời chúc tối đa trên 1 thiết bị

  // 4. Danh sách từ khóa nhạy cảm / tục tĩu / phá đám bị chặn tự động:
  // (Bạn có thể thêm bất kỳ từ nào muốn chặn vào danh sách dưới đây)
  BAD_WORDS: [
    // Từ tục tĩu tiếng Việt (có dấu & không dấu)
    'đụ', 'địt', 'dit me', 'địt mẹ', 'đm', 'dm', 'đmm', 'dmm', 'đcm', 'dcm',
    'vcl', 'vl', 'vkl', 'vãi lồn', 'vai lon', 'lồn', 'cặc', 'buồi', 'dái',
    'đéo', 'deo', 'đĩ', 'con đĩ', 'điếm', 'chó đẻ', 'cho de', 'súc vật', 'suc vat',
    'khốn nạn', 'khon nan', 'mất dạy', 'mat day', 'ngu dốt', 'óc chó', 'oc cho',
    'bố láo', 'bo lao', 'láo toét', 'mẹ mày', 'me may', 'cha mày', 'bố mày',
    'con mẹ', 'cc', 'cl', 'clm', 'cmm', 'đb', 'fuck', 'shit', 'bitch', 'asshole',

    // Từ nhạy cảm trong đám cưới / phá đám / đòi nợ / người yêu cũ
    'người yêu cũ', 'nguoi yeu cu', 'nyc', 'tình cũ', 'tinh cu',
    'tiểu tam', 'tieu tam', 'trà xanh', 'tra xanh', 'giật chồng', 'giat chong',
    'giật vợ', 'giat vo', 'ngoại tình', 'ngoai tinh', 'cắm sừng', 'cam sung',
    'đổ vỏ', 'do vo', 'nuôi con tu hú', 'con rơi', 'con roi',
    'đòi nợ', 'doi no', 'trả nợ', 'tra no', 'trả tiền', 'tra tien',
    'quỵt tiền', 'quyt tien', 'quỵt nợ', 'lừa đảo', 'lua dao', 'bùng tiền',
    'ly hôn', 'ly dị', 'li hon', 'li di', 'tan vỡ', 'chia tay', 'bỏ nhau',

    // Spam quảng cáo / cờ bạc
    'nhà cái', 'nha cai', 'cá độ', 'ca do', 'cờ bạc', 'co bac', 'tài xỉu', 'tai xiu',
    'nổ hũ', 'no hu', 'vay tiền', 'vay vốn', 'tín dụng đen', 'sex', 'xxx', '18+'
  ]
};

/**
 * Kiểm tra nội dung văn bản có chứa từ nhạy cảm, link rác hoặc ký tự spam không.
 * Trả về { valid: true } hoặc { valid: false, reason: '...' }
 */
window.validateWeddingText = function (rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { valid: false, reason: 'Vui lòng nhập nội dung.' };
  }

  const text = rawText.trim();

  // 1. Chặn chèn đường link quảng cáo / web lạ
  const urlRegex = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|vn|net|org|io|me|info|xyz|bet|club|vip|top)\b)/i;
  if (urlRegex.test(text)) {
    return {
      valid: false,
      reason: 'Vui lòng không chèn đường dẫn (link) vào nội dung nhé!'
    };
  }

  // 2. Chặn spam ký tự lặp vô nghĩa (ví dụ: aaaaaaaaaaaa)
  if (/(.)\1{9,}/i.test(text)) {
    return {
      valid: false,
      reason: 'Nội dung có quá nhiều ký tự lặp lại, bạn viết lại giúp mình nhé!'
    };
  }

  // 3. Chuẩn hóa văn bản để so khớp từ cấm (tách theo ranh giới từ)
  const normalized = text
    .toLowerCase()
    .replace(/[.,!?;:"'()[\]{}<>\/\\|_*~`@#$%^&+=—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const paddedText = ` ${normalized} `;
  const badWords = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.BAD_WORDS) || [];

  for (let i = 0; i < badWords.length; i++) {
    const bw = badWords[i].toLowerCase().trim();
    if (!bw) continue;
    if (paddedText.includes(` ${bw} `)) {
      return {
        valid: false,
        reason: 'Nội dung có chứa từ ngữ chưa phù hợp với ngày cưới. Bạn vui lòng chỉnh sửa lại nhé!'
      };
    }
  }

  return { valid: true };
};
