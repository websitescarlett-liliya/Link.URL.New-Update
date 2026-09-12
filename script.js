document.addEventListener('DOMContentLoaded', () => {
    // === ELEMENT REFERENCES ===
    const tabPhoto = document.getElementById('tab-photo');
    const tabVideo = document.getElementById('tab-video');
    const sectionPhoto = document.getElementById('section-photo');
    const sectionVideo = document.getElementById('section-video');
    
    const inputPhoto = document.getElementById('input-photo');
    const inputVideo = document.getElementById('input-video');
    const btnUploadPhoto = document.getElementById('btn-upload-photo');
    const btnUploadVideo = document.getElementById('btn-upload-video');
    const resultPhoto = document.getElementById('result-photo');
    const resultVideo = document.getElementById('result-video');
    const filePhotoName = document.getElementById('file-photo-name');
    const fileVideoName = document.getElementById('file-video-name');

    const usernameInput = document.getElementById('username-input');
    const profileImg = document.getElementById('profile-img');
    const settingsBtn = document.getElementById('settings-toggle-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const overlay = document.getElementById('overlay');
    
    const toggleThemeBtn = document.getElementById('toggle-theme');
    const headerColorPicker = document.getElementById('header-color-picker');
    const bgFileInput = document.getElementById('bg-file-input');
    const resetBgBtn = document.getElementById('reset-bg');
    const bgVideo = document.getElementById('bg-video');
    const mainHeader = document.getElementById('main-header');

    // === 1. LOCAL STORAGE PERSISTENCE (Username, Theme, Custom BG) ===
    const savedUsername = localStorage.getItem('scarlet_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(savedUsername)}&background=000&color=fff`;
    }

    usernameInput.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('scarlet_username', val);
        profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(val)}&background=000&color=fff`;
    });

    const savedTheme = localStorage.getItem('scarlet_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    toggleThemeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('scarlet_theme', isDark ? 'dark' : 'light');
    });

    const savedHeaderColor = localStorage.getItem('scarlet_header_color');
    if (savedHeaderColor) {
        mainHeader.style.backgroundColor = savedHeaderColor;
        headerColorPicker.value = savedHeaderColor;
    }

    headerColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        mainHeader.style.backgroundColor = color;
        localStorage.setItem('scarlet_header_color', color);
    });

    const savedBg = localStorage.getItem('scarlet_bg');
    const savedBgType = localStorage.getItem('scarlet_bg_type');
    if (savedBg) {
        applyBackground(savedBg, savedBgType);
    }

    bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const result = event.target.result;
            const type = file.type.startsWith('video') ? 'video' : 'image';
            
            try {
                localStorage.setItem('scarlet_bg', result);
                localStorage.setItem('scarlet_bg_type', type);
                applyBackground(result, type);
            } catch (err) {
                alert('Ukuran file background terlalu besar untuk disimpan di memori browser!');
            }
        };
        reader.readAsDataURL(file);
    });

    resetBgBtn.addEventListener('click', () => {
        localStorage.removeItem('scarlet_bg');
        localStorage.removeItem('scarlet_bg_type');
        document.body.style.backgroundImage = 'none';
        bgVideo.style.display = 'none';
        bgVideo.src = '';
    });

    function applyBackground(src, type) {
        if (type === 'video') {
            document.body.style.backgroundImage = 'none';
            bgVideo.src = src;
            bgVideo.style.display = 'block';
        } else {
            bgVideo.style.display = 'none';
            bgVideo.src = '';
            document.body.style.backgroundImage = `url('${src}')`;
        }
    }

    // === 2. ANIMASI GESER TABS (Geser Kiri/Kanan) ===
    tabPhoto.addEventListener('click', () => {
        tabPhoto.classList.add('active');
        tabVideo.classList.remove('active');
        sectionPhoto.classList.add('active');
        sectionVideo.classList.remove('active');
    });

    tabVideo.addEventListener('click', () => {
        tabVideo.classList.add('active');
        tabPhoto.classList.remove('active');
        sectionVideo.classList.add('active');
        sectionPhoto.classList.remove('active');
    });

    // Indikator Nama File Terpilih
    inputPhoto.addEventListener('change', () => {
        if (inputPhoto.files[0]) filePhotoName.innerText = `Terpilih: ${inputPhoto.files[0].name}`;
    });

    inputVideo.addEventListener('change', () => {
        if (inputVideo.files[0]) fileVideoName.innerText = `Terpilih: ${inputVideo.files[0].name}`;
    });

    // === 3. MENU SETTINGS SIDEBAR ===
    settingsBtn.addEventListener('click', () => {
        settingsSidebar.classList.add('open');
        overlay.classList.add('active');
    });

    closeSettingsBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    function closeMenu() {
        settingsSidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    // === 4. API UPLOAD LOGIC (API Gratis ImgBB & Catbox) ===
    btnUploadPhoto.addEventListener('click', () => {
        const file = inputPhoto.files[0];
        if (!file) return alert('Pilih foto terlebih dahulu!');

        resultPhoto.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Mengunggah foto ke URL...</p>';

        const formData = new FormData();
        formData.append('image', file);

        fetch('https://api.imgbb.com/1/upload?key=6d2578c47486241a740751e18ff1fb76', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const url = data.data.url;
                resultPhoto.innerHTML = `
                    <p style="color: green; font-weight: bold;">Upload Berhasil!</p>
                    <div style="display: flex; justify-content: center; margin-top: 5px;">
                        <input type="text" value="${url}" readonly id="photo-url-input">
                        <button onclick="navigator.clipboard.writeText('${url}'); alert('URL Foto Disalin!')" class="expand-effect">Salin</button>
                    </div>
                `;
            } else {
                resultPhoto.innerHTML = '<p style="color: red;">Gagal mengunggah foto.</p>';
            }
        })
        .catch(() => {
            resultPhoto.innerHTML = '<p style="color: red;">Terjadi kesalahan koneksi API.</p>';
        });
    });

    btnUploadVideo.addEventListener('click', () => {
        const file = inputVideo.files[0];
        if (!file) return alert('Pilih video terlebih dahulu!');

        resultVideo.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Mengunggah video ke URL...</p>';

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', file);

        fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.text())
        .then(url => {
            if (url.startsWith('http')) {
                resultVideo.innerHTML = `
                    <p style="color: green; font-weight: bold;">Upload Berhasil!</p>
                    <div style="display: flex; justify-content: center; margin-top: 5px;">
                        <input type="text" value="${url}" readonly id="video-url-input">
                        <button onclick="navigator.clipboard.writeText('${url}'); alert('URL Video Disalin!')" class="expand-effect">Salin</button>
                    </div>
                `;
            } else {
                resultVideo.innerHTML = '<p style="color: red;">Gagal mengunggah video.</p>';
            }
        })
        .catch(() => {
            resultVideo.innerHTML = '<p style="color: red;">Terjadi kesalahan koneksi API.</p>';
        });
    });
});

// === 5. OPSI PENGEMBANG PLATFORM & DEEP LINKING ===
const platformData = {
    x: { app: 'twitter://', web: 'https://x.com', name: 'X / Twitter' },
    tiktok: { app: 'snssdk1180://', web: 'https://www.tiktok.com', name: 'TikTok' },
    instagram: { app: 'instagram://', web: 'https://www.instagram.com', name: 'Instagram' },
    youtube: { app: 'youtube://', web: 'https://www.youtube.com', name: 'YouTube' },
    facebook: { app: 'fb://', web: 'https://www.facebook.com', name: 'Facebook' },
    telegram: { app: 'tg://', web: 'https://telegram.org', name: 'Telegram' },
    codepen: { app: null, web: 'https://codepen.io', name: 'CodePen' },
    github: { app: null, web: 'https://github.com', name: 'GitHub' },
    spotify: { app: 'spotify://', web: 'https://open.spotify.com', name: 'Spotify' }
};

function openPlatform(key) {
    const item = platformData[key];
    if (!item) return;

    let appOpened = false;

    // Cobalah membuka aplikasi native jika terpasang di HP
    if (item.app) {
        const start = Date.now();
        window.location.href = item.app;

        setTimeout(() => {
            if (Date.now() - start < 1500) {
                // Jika aplikasi gagal terbuka (tidak terpasang), buka WebView internal
                openInAppWebView(item.web, item.name);
            }
        }, 1000);
    } else {
        openInAppWebView(item.web, item.name);
    }
}

function openInAppWebView(url, title) {
    const modal = document.getElementById('webview-modal');
    const iframe = document.getElementById('webview-iframe');
    const modalTitle = document.getElementById('webview-title');

    modalTitle.innerText = title;
    iframe.src = url;
    modal.classList.add('active');
}

document.getElementById('close-webview').addEventListener('click', () => {
    const modal = document.getElementById('webview-modal');
    const iframe = document.getElementById('webview-iframe');
    iframe.src = '';
    modal.classList.remove('active');
});
    
