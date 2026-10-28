// overlay
const btnOpen = document.querySelector('.btn-open');
const bgMusic = document.getElementById('bgMusic');
const overlay = document.querySelector('.wedding-card-overlay');
// Kiểm tra xem nút có tồn tại không để tránh lỗi
if (btnOpen) {
  btnOpen.addEventListener('click', () => {
    bgMusic.play();
    overlay.classList.add('fade-out');
  });
}


const urlParams = new URLSearchParams(window.location.search);
const encodedId = urlParams.get('id');
// Chỉ xử lý khi có id và không rỗng
if (encodedId && encodedId.trim() !== '') {
    try {
        // Giải mã Base64 hỗ trợ tiếng Việt có dấu
        const binary = atob(encodedId);
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        const guestName = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        // Kiểm tra tên hợp lệ (không rỗng, không chứa ký tự lạ do decode sai)
        if (guestName && guestName.trim() !== '') {
            document.getElementById('guest-name').textContent = guestName;
        }
    } catch (e) {
        // Im lặng, không làm gì cả - không hiện tên, không báo lỗi
        const el = document.getElementById('guest-name');
        if (el) el.textContent = '';
    }
}