/* ==========================================================================
   3D Photo Album Carousel & Fullscreen Lightbox
   ========================================================================== */

(function () {
  const cards = Array.from(document.querySelectorAll('.carousel-card'));
  const dots = Array.from(document.querySelectorAll('#carousel-dots button'));
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const viewport = document.getElementById('carousel-viewport');

  if (!cards.length || !viewport) return;

  const total = cards.length;
  let activeIndex = 3; // Default center card (photo 4)

  const transformsByOffset = {
    '-3': {
      transform: 'translateX(-180%) translateZ(-450px) rotateY(-135deg) scale(0.7)',
      opacity: '0.3',
      zIndex: '97',
      ring: false
    },
    '-2': {
      transform: 'translateX(-120%) translateZ(-300px) rotateY(-90deg) scale(0.7)',
      opacity: '0.5',
      zIndex: '98',
      ring: false
    },
    '-1': {
      transform: 'translateX(-60%) translateZ(-150px) rotateY(-45deg) scale(0.85)',
      opacity: '0.75',
      zIndex: '99',
      ring: false
    },
    '0': {
      transform: 'translateX(0%) translateZ(0px) rotateY(0deg) scale(1)',
      opacity: '1',
      zIndex: '100',
      ring: true
    },
    '1': {
      transform: 'translateX(60%) translateZ(-150px) rotateY(45deg) scale(0.85)',
      opacity: '0.75',
      zIndex: '99',
      ring: false
    },
    '2': {
      transform: 'translateX(120%) translateZ(-300px) rotateY(90deg) scale(0.7)',
      opacity: '0.5',
      zIndex: '98',
      ring: false
    },
    '3': {
      transform: 'translateX(180%) translateZ(-450px) rotateY(135deg) scale(0.7)',
      opacity: '0.3',
      zIndex: '97',
      ring: false
    }
  };

  function updateCarousel() {
    cards.forEach((card, idx) => {
      let offset = idx - activeIndex;
      if (offset > 3) offset -= total;
      if (offset < -3) offset += total;
      const cfg = transformsByOffset[String(offset)] || transformsByOffset['0'];

      card.style.transform = cfg.transform;
      card.style.opacity = cfg.opacity;
      card.style.zIndex = cfg.zIndex;

      if (cfg.ring) {
        card.classList.add('ring-2', 'ring-white/30');
      } else {
        card.classList.remove('ring-2', 'ring-white/30');
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === activeIndex) {
        dot.className = 'rounded-full transition-all duration-300 w-6 h-2 bg-current opacity-70';
      } else {
        dot.className = 'rounded-full transition-all duration-300 w-2 h-2 bg-current opacity-25 hover:opacity-40';
      }
    });
  }

  function goTo(index) {
    activeIndex = (index + total) % total;
    updateCarousel();
    resetAutoPlay();
  }

  // Tự động chuyển sang ảnh tiếp theo mỗi 3 giây
  const AUTO_SLIDE_INTERVAL_MS = 3000;
  let autoPlayTimer = null;

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      if (lightboxModal && lightboxModal.open) return;
      activeIndex = (activeIndex + 1) % total;
      updateCarousel();
    }, AUTO_SLIDE_INTERVAL_MS);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function resetAutoPlay() {
    startAutoPlay();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(activeIndex + 1);
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(Number(dot.dataset.dot));
    });
  });

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(card.dataset.index);
      if (idx !== activeIndex) {
        goTo(idx);
      }
    });
  });

  // Touch swipe support on carousel
  let startX = 0;
  viewport.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
  }, { passive: true });

  // Lightbox Modal
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxMainImg = document.getElementById('lightbox-main-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxThumbs = Array.from(document.querySelectorAll('#lightbox-thumbs button'));
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let lightboxIndex = 0;

  function updateLightbox() {
    if (lightboxCounter) {
      lightboxCounter.textContent = `${lightboxIndex + 1} / ${total}`;
    }
    if (lightboxMainImg && cards[lightboxIndex]) {
      const cardImg = cards[lightboxIndex].querySelector('img');
      if (cardImg) lightboxMainImg.src = cardImg.src;
    }
    lightboxThumbs.forEach((btn, idx) => {
      if (idx === lightboxIndex) {
        btn.className = 'flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-md sm:rounded-lg overflow-hidden transition-all duration-200 scale-105 shadow-lg';
        btn.style.outline = 'rgb(81, 20, 25) solid 2px';
        btn.style.outlineOffset = '2px';
      } else {
        btn.className = 'flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-md sm:rounded-lg overflow-hidden transition-all duration-200 opacity-60 hover:opacity-100';
        btn.style.outline = 'none';
      }
    });
  }

  function openLightbox(idx) {
    if (!lightboxModal) return;
    lightboxIndex = idx;
    updateLightbox();
    lightboxModal.showModal();
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxIndex = (lightboxIndex - 1 + total) % total;
      updateLightbox();
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxIndex = (lightboxIndex + 1) % total;
      updateLightbox();
    });
  }

  lightboxThumbs.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxIndex = Number(btn.dataset.thumb);
      updateLightbox();
    });
  });

  updateCarousel();
  startAutoPlay();
})();

