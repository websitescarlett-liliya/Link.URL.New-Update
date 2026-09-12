/* =========================================================
   Upload V/F To URL — script.js
   API gratis:
   - Foto  -> freeimage.host API (key demo publik dari dokumentasi resmi mereka)
   - Video -> catbox.moe API (upload anonim, tanpa key)
   ========================================================= */

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

/* ---------- Util ---------- */
function $(id){ return document.getElementById(id); }

function showToast(msg){
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Upload dengan progress (XHR) ---------- */
function uploadWithProgress(url, formData, onProgress){
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
      else reject(new Error('Server menolak permintaan (status ' + xhr.status + ')'));
    };
    xhr.onerror = () => reject(new Error('Gagal terhubung ke server upload'));
    xhr.send(formData);
  });
}

async function uploadPhotoToFreeimage(file, onProgress){
  const base64 = await fileToBase64(file);
  const fd = new FormData();
  fd.append('key', FREEIMAGE_API_KEY);
  fd.append('action', 'upload');
  fd.append('source', base64.split(',')[1]);
  fd.append('format', 'json');
  const raw = await uploadWithProgress('https://freeimage.host/api/1/upload', fd, onProgress);
  const data = JSON.parse(raw);
  if (!data || data.status_code !== 200) {
    throw new Error(data?.error?.message || 'Upload foto gagal');
  }
  return data.image.url;
}

async function uploadVideoToCatbox(file, onProgress){
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', file);
  const text = await uploadWithProgress('https://catbox.moe/user/api.php', fd, onProgress);
  if (!text.startsWith('http')) throw new Error(text || 'Upload video gagal');
  return text.trim();
}

/* ---------- Setup satu kartu upload (video/foto) ---------- */
function setupUploadCard({ btnId, inputId, progressId, barId, resultId, urlInputId, copyId, statusId, uploader }){
  const btn = $(btnId), input = $(inputId), progress = $(progressId),
        bar = $(barId), result = $(resultId), urlInput = $(urlInputId),
        copyBtn = $(copyId), status = $(statusId);

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;

    result.hidden = true;
    status.textContent = '';
    status.className = 'status';
    progress.hidden = false;
    bar.style.width = '0%';
    btn.disabled = true;

    try {
      const url = await uploader(file, (pct) => { bar.style.width = pct + '%'; });
      bar.style.width = '100%';
      urlInput.value = url;
      result.hidden = false;
      status.textContent = 'Berhasil! Tautan siap dipakai.';
      status.classList.add('success');
    } catch (err) {
      status.textContent = err.message || 'Terjadi kesalahan saat upload.';
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      setTimeout(() => { progress.hidden = true; }, 600);
      input.value = '';
    }
  });

  copyBtn.addEventListener('click', () => {
    urlInput.select();
    navigator.clipboard?.writeText(urlInput.value).then(() => showToast('Tautan disalin ke clipboard'));
  });
}

/* ---------- Profil (persisten lewat localStorage) ---------- */
function setupProfile(){
  const avatar = $('avatar');
  const fallback = $('avatar-fallback');
  const usernameEl = $('username');
  const avatarInput = $('avatar-input');

  const savedName = localStorage.getItem('svf_username');
  const savedAvatar = localStorage.getItem('svf_avatar');

  if (savedName) usernameEl.textContent = savedName;
  if (savedAvatar) {
    avatar.style.backgroundImage = `url(${savedAvatar})`;
    fallback.style.display = 'none';
  } else {
    fallback.textContent = (usernameEl.textContent || 'S').charAt(0).toUpperCase();
  }

  avatar.addEventListener('click', () => avatarInput.click());

  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const dataUrl = await fileToBase64(file);
    avatar.style.backgroundImage = `url(${dataUrl})`;
    fallback.style.display = 'none';
    try { localStorage.setItem('svf_avatar', dataUrl); }
    catch { showToast('Foto terlalu besar untuk disimpan permanen'); }
  });

  usernameEl.addEventListener('dblclick', () => {
    usernameEl.contentEditable = 'true';
    usernameEl.focus();
  });
  usernameEl.addEventListener('blur', () => {
    usernameEl.contentEditable = 'false';
    const name = usernameEl.textContent.trim() || 'Pengguna';
    usernameEl.textContent = name;
    localStorage.setItem('svf_username', name);
  });
  usernameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); usernameEl.blur(); }
  });
}

/* ---------- Tema Light/Dark ---------- */
function setupTheme(){
  const toggle = $('theme-toggle');
  const saved = localStorage.getItem('svf_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggle.checked = true;
  }
  toggle.addEventListener('change', () => {
    const theme = toggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('svf_theme', theme);
  });
}

/* ---------- Warna aksen ---------- */
function setupAccentColor(){
  const picker = $('color-picker');
  const saved = localStorage.getItem('svf_accent');
  if (saved) {
    document.documentElement.style.setProperty('--accent', saved);
    picker.value = saved;
  }
  picker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--accent', picker.value);
    localStorage.setItem('svf_accent', picker.value);
  });
}

/* ---------- Background kustom dari galeri ---------- */
function setupCustomBackground(){
  const bgBtn = $('bg-picker-btn');
  const bgInput = $('bg-input');
  const resetBtn = $('reset-bg');
  const bgLayer = $('bg-layer');

  function applyBackground(dataUrl, type){
    bgLayer.innerHTML = '';
    if (type.startsWith('video')) {
      const video = document.createElement('video');
      video.src = dataUrl; video.autoplay = true; video.loop = true;
      video.muted = true; video.playsInline = true;
      bgLayer.appendChild(video);
    } else {
      bgLayer.style.backgroundImage = `url(${dataUrl})`;
    }
    document.body.classList.add('has-custom-bg');
  }

  const savedBg = localStorage.getItem('svf_bg');
  const savedType = localStorage.getItem('svf_bg_type');
  if (savedBg && savedType) applyBackground(savedBg, savedType);

  bgBtn.addEventListener('click', () => bgInput.click());

  bgInput.addEventListener('change', async () => {
    const file = bgInput.files[0];
    if (!file) return;
    const dataUrl = await fileToBase64(file);
    applyBackground(dataUrl, file.type);
    try {
      localStorage.setItem('svf_bg', dataUrl);
      localStorage.setItem('svf_bg_type', file.type);
    } catch {
      showToast('File terlalu besar untuk disimpan permanen, tapi tetap ditampilkan sekarang');
    }
  });

  resetBtn.addEventListener('click', () => {
    bgLayer.innerHTML = '';
    bgLayer.style.backgroundImage = '';
    document.body.classList.remove('has-custom-bg');
    localStorage.removeItem('svf_bg');
    localStorage.removeItem('svf_bg_type');
  });
}

/* ---------- Panel pengaturan ---------- */
function setupSettingsPanel(){
  const panel = $('settings-panel');
  const overlay = $('overlay');
  const openBtn = $('settings-toggle');
  const closeBtn = $('settings-close');

  function open(){ panel.classList.add('open'); overlay.classList.add('show'); }
  function close(){ panel.classList.remove('open'); overlay.classList.remove('show'); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

/* ---------- Modal Akses Khusus ---------- */
function setupAksesKhusus(){
  const btn = $('akses-khusus-btn');
  const modal = $('akses-khusus-modal');
  const closeBtn = $('akses-close');
  btn.addEventListener('click', () => modal.classList.add('show'));
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
}

/* ---------- Chat Admin (WhatsApp) ---------- */
function setupAdminChat(){
  $('chat-admin-btn').addEventListener('click', () => {
    const nomor = '6288801883795';
    const pesan = encodeURIComponent('Halo Admin, saya ingin melaporkan error/bug pada website Upload V/F To URL.');
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank');
  });
}

/* ---------- Deep-link ke aplikasi, fallback ke web ---------- */
const PLATFORM_LINKS = {
  google:    { app: null,                       web: 'https://www.google.com/search' },
  codepen:   { app: null,                       web: 'https://codepen.io' },
  github:    { app: null,                       web: 'https://github.com' },
  spotify:   { app: 'spotify://',                web: 'https://open.spotify.com' },
  tiktok:    { app: 'tiktok://',                 web: 'https://www.tiktok.com' },
  instagram: { app: 'instagram://app',           web: 'https://www.instagram.com' },
  x:         { app: 'twitter://',                web: 'https://x.com' },
  claude:    { app: null,                        web: 'https://claude.ai' },
  gemini:    { app: null,                        web: 'https://gemini.google.com' },
  youtube:   { app: 'vnd.youtube://',            web: 'https://www.youtube.com' },
  whatsapp:  { app: 'whatsapp://send',           web: 'https://web.whatsapp.com' },
  telegram:  { app: 'tg://',                     web: 'https://web.telegram.org' },
};

function openPlatform(key){
  const target = PLATFORM_LINKS[key];
  if (!target) return;

  // Tidak punya skema aplikasi -> langsung buka versi web
  if (!target.app) { window.open(target.web, '_blank'); return; }

  // Coba buka aplikasi native; kalau dalam 1.5 detik tab tidak
  // tersembunyi (artinya aplikasi tidak terpasang), fallback ke web.
  let appOpened = false;
  const onVisibility = () => { if (document.hidden) appOpened = true; };
  document.addEventListener('visibilitychange', onVisibility);

  const timer = setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    if (!appOpened) window.open(target.web, '_blank');
  }, 1500);

  window.addEventListener('blur', () => { appOpened = true; clearTimeout(timer); }, { once: true });
  window.location.href = target.app;
}

function setupPlatformButtons(){
  document.querySelectorAll('.platform-btn').forEach((btn) => {
    btn.addEventListener('click', () => openPlatform(btn.dataset.app));
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupProfile();
  setupTheme();
  setupAccentColor();
  setupCustomBackground();
  setupSettingsPanel();
  setupAksesKhusus();
  setupAdminChat();
  setupPlatformButtons();

  setupUploadCard({
    btnId: 'video-btn', inputId: 'video-input', progressId: 'video-progress',
    barId: 'video-bar', resultId: 'video-result', urlInputId: 'video-url',
    copyId: 'video-copy', statusId: 'video-status', uploader: uploadVideoToCatbox,
  });

  setupUploadCard({
    btnId: 'photo-btn', inputId: 'photo-input', progressId: 'photo-progress',
    barId: 'photo-bar', resultId: 'photo-result', urlInputId: 'photo-url',
    copyId: 'photo-copy', statusId: 'photo-status', uploader: uploadPhotoToFreeimage,
  });
});
                     
