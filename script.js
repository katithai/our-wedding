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