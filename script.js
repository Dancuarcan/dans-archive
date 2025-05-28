const preview = document.getElementById('hoverPreview');
const video = document.getElementById('previewVideo');
const list = document.querySelector('.project-list');

let soundEnabled = false;
let allProjects = [];
let currentHoverUrl = null;

// 🔊 Sound toggle
const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? 'Sonido: On' : 'Sonido: Off';
  soundToggle.classList.toggle('active');
  video.muted = !soundEnabled;
});

// ℹ️ Toggle info panel
const infoToggle = document.getElementById('infoToggle');
const infoPanel = document.getElementById('infoPanel');
const main = document.querySelector('main');


infoToggle.addEventListener('click', () => {
  infoPanel.classList.toggle('show');
  main.classList.toggle('info-visible'); // 👈 Shift main content
});

// 🧠 Video cache map
const videoCache = new Map();


// 🖼️ Render project rows
let openInlinePreview = null;

function renderProjects(projects) {
  const header = document.querySelector('.project-row.header');
  list.innerHTML = '';
  list.appendChild(header);

  const isMobile = () => window.matchMedia('(max-width: 700px)').matches;

  projects.forEach(project => {
    const row = document.createElement('div');
    row.className = 'project-row';
    row.dataset.video = project.video;

    row.innerHTML = `
      <a href="#" class="project-title">${project.title}</a>
      <span class="client">${project.client}</span>
      <span>${project.date}</span>
      <div class="inline-preview" style="display: none;">
        <video muted loop playsinline></video>
      </div>
    `;

    const inlineContainer = row.querySelector('.inline-preview');
    const inlineVideo = inlineContainer.querySelector('video');

    // 📱 MOBILE: Tap to toggle inline preview
    row.addEventListener('click', (e) => {
    if (!isMobile()) return;

    e.preventDefault();

    if (openInlinePreview && openInlinePreview !== inlineContainer) {
      openInlinePreview.style.display = 'none';
      openInlinePreview.querySelector('video').pause();
    }

    if (inlineContainer.style.display === 'block') {
      inlineContainer.style.display = 'none';
      inlineVideo.pause();
      openInlinePreview = null;
    } else {
      const videoUrl = project.video;

      if (videoCache.has(videoUrl)) {
        inlineVideo.src = videoCache.get(videoUrl).src;
      } else {
        fetch(videoUrl)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const vid = document.createElement('video');
            vid.src = blobUrl;
            vid.preload = 'auto';
            vid.muted = true;
            videoCache.set(videoUrl, vid);
            inlineVideo.src = blobUrl;
          });
      }

      // 🔇 Stop all other inline videos and mute them
      document.querySelectorAll('.inline-preview video').forEach(v => {
        v.pause();
        v.muted = true;
      });

      

      inlineContainer.style.display = 'block';
      inlineVideo.currentTime = 0;
      inlineVideo.muted = !soundEnabled; // 🔊 Respect toggle
      inlineVideo.play();
      openInlinePreview = inlineContainer;
    }
    });

    const infoTrigger = document.getElementById('info-trigger');
    const infoPanel = document.getElementById('info-panel');
    const closeInfo = document.getElementById('close-info');

  infoTrigger.addEventListener('click', () => {
    infoPanel.classList.remove('hidden');
  });

  closeInfo.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });

  // Optional: close on clicking outside the panel content
  infoPanel.addEventListener('click', (e) => {
    if (e.target === infoPanel) {
      infoPanel.classList.add('hidden');
    }
  });


    // 🖱️ DESKTOP: Hover preview (floating)
    row.addEventListener('mouseenter', () => {
      if (isMobile()) return;

      const videoUrl = project.video;
      currentHoverUrl = videoUrl;
      video.muted = !soundEnabled;

      if (videoCache.has(videoUrl)) {
        const cached = videoCache.get(videoUrl);
        video.src = cached.src;
        video.currentTime = 0;
        video.muted = !soundEnabled;
        preview.style.display = 'block';
        video.play();
      } else {
        fetch(videoUrl)
          .then(res => res.blob())
          .then(blob => {
            if (currentHoverUrl !== videoUrl) return;
            const blobUrl = URL.createObjectURL(blob);
            const vid = document.createElement('video');
            vid.src = blobUrl;
            vid.preload = 'auto';
            vid.muted = true;
            videoCache.set(videoUrl, vid);

            video.src = blobUrl;
            video.currentTime = 0;
            video.muted = !soundEnabled;
            preview.style.display = 'block';
            video.play();
          });
      }
    });

    row.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      video.muted = true;
      preview.style.display = 'none';
    });

    list.appendChild(row);
  });
}

//auto-close previews
document.addEventListener('click', (e) => {
  if (!window.matchMedia('(max-width: 700px)').matches) return;
  if (!e.target.closest('.project-row')) {
    if (openInlinePreview) {
      openInlinePreview.style.display = 'none';
      openInlinePreview.querySelector('video').pause();
      openInlinePreview = null;
    }
  }
});



// 🔁 Initial fetch
fetch('projects.json')
  .then(response => response.json())
  .then(data => {
    allProjects = data;
    preloadAllVideos(allProjects); // 🚀 Preload all videos
    sortByDate(); // Default sort
  });

// 🚀 Preload all videos after fetch
function preloadAllVideos(projects) {
  projects.forEach(project => {
    const videoUrl = project.video;

    if (!videoCache.has(videoUrl)) {
      // Start fetch manually (guaranteed not to be cancelled by hover events)
      fetch(videoUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const vid = document.createElement('video');
          vid.src = blobUrl;
          vid.preload = 'auto';
          vid.muted = true;
          videoCache.set(videoUrl, vid); // Cache the video element
        });
    }
  });
}

// 🧭 Sorting logic
let currentSort = { key: 'date', direction: 'desc' };

function updateSortIndicators() {
  const nameEl = document.getElementById('sortByName');
  const dateEl = document.getElementById('sortByDate');

  [nameEl, dateEl].forEach(el => {
    el.classList.remove('active', 'desc');
    el.textContent = el.dataset.label;
  });

  const activeEl = currentSort.key === 'name' ? nameEl : dateEl;
  activeEl.classList.add('active');
  activeEl.textContent += currentSort.direction === 'desc' ? ' ↓' : ' ↑';
}

function sortByDate() {
  const direction = currentSort.key === 'date' && currentSort.direction === 'asc' ? 'desc' : 'asc';
  currentSort = { key: 'date', direction };

  const sorted = [...allProjects].sort((a, b) => {
    const [dA, mA, yA] = a.date.split('/');
    const [dB, mB, yB] = b.date.split('/');
    const dateA = new Date(`${yA}-${mA}-${dA}`);
    const dateB = new Date(`${yB}-${mB}-${dB}`);
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });

  renderProjects(sorted);
  updateSortIndicators();
}

function sortByName() {
  const direction = currentSort.key === 'name' && currentSort.direction === 'asc' ? 'desc' : 'asc';
  currentSort = { key: 'name', direction };

  const sorted = [...allProjects].sort((a, b) =>
    direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );

  renderProjects(sorted);
  updateSortIndicators();
}

// 👆 Click listeners
document.getElementById('sortByDate').addEventListener('click', (e) => {
  e.preventDefault();
  sortByDate();
});

document.getElementById('sortByName').addEventListener('click', (e) => {
  e.preventDefault();
  sortByName();
});



// 🖱️ Follow mouse for preview video
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;
const ease = 0.1;

function animate() {
  currentX += (targetX - currentX) * ease;
  currentY += (targetY - currentY) * ease;
  preview.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`;
  requestAnimationFrame(animate);
}
animate();

document.addEventListener('mousemove', (e) => {
  targetX = e.clientX;
  targetY = e.clientY;
});
