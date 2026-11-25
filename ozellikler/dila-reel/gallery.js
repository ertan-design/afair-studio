'use strict';
const videos = Array.from(document.querySelectorAll('video'));
const status = document.getElementById('status');
let active = 0;
let request = 0;
function announce(message) { status.textContent = message; }
function pauseAll() { videos.forEach(video => video.pause()); }
function markActive() {
  videos.forEach((video, index) => {
    video.closest('article').classList.toggle('active', index === active);
  });
  document.getElementById('previous').disabled = active === 0;
  document.getElementById('next').disabled = active === videos.length - 1;
}
async function start(index, reset = false) {
  if (!Number.isInteger(index) || index < 0 || index >= videos.length) return;
  const token = ++request;
  pauseAll();
  active = index;
  markActive();
  const video = videos[index];
  if (reset || video.ended) video.currentTime = 0;
  announce(`Klip ${index + 1}/4 · Açılıyor…`);
  try {
    await video.play();
    if (token !== request) {
      if (active !== index) video.pause();
      return;
    }
    announce(`Klip ${index + 1}/4 · Oynatılıyor`);
  } catch (error) {
    if (token !== request) return;
    pauseAll();
    announce(`Klip ${index + 1}/4 oynatılamadı. Video üzerindeki oynat düğmesini veya MP4 indir bağlantısını kullanın.`);
  }
}
videos.forEach((video, index) => {
  video.addEventListener('play', () => {
    if (index !== active) ++request;
    active = index;
    videos.forEach(other => { if (other !== video) other.pause(); });
    markActive();
    announce(`Klip ${index + 1}/4 · Oynatılıyor`);
  });
  video.addEventListener('pause', () => {
    if (index === active && !video.ended) announce(`Klip ${index + 1}/4 · Duraklatıldı`);
  });
  video.addEventListener('ended', () => {
    if (index !== active) return;
    if (index + 1 < videos.length) void start(index + 1, true);
    else { ++request; announce('4/4 · Zincir tamamlandı. Yeniden başlatabilirsiniz.'); }
  });
  video.addEventListener('error', () => {
    if (index !== active) return;
    ++request;
    pauseAll();
    announce(`Klip ${index + 1}/4 yüklenemedi. MP4 bağlantısını deneyin veya Sonraki düğmesini seçin.`);
  });
});
document.getElementById('play-all').addEventListener('click', () => { void start(0, true); });
document.getElementById('pause').addEventListener('click', () => {
  ++request;
  pauseAll();
  announce(`Klip ${active + 1}/4 · Duraklatıldı`);
});
document.getElementById('previous').addEventListener('click', () => { void start(active - 1, true); });
document.getElementById('next').addEventListener('click', () => { void start(active + 1, true); });
markActive();
