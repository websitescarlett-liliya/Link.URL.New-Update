document.addEventListener('DOMContentLoaded', () => {
    const tabPhoto = document.getElementById('tab-photo');
    const tabVideo = document.getElementById('tab-video');
    const sectionPhoto = document.getElementById('section-photo');
    const sectionVideo = document.getElementById('section-video');

    const inputPhoto = document.getElementById('input-photo');
    const inputVideo = document.getElementById('input-video');
    const dropPhoto = document.getElementById('drop-photo');
    const dropVideo = document.getElementById('drop-video');
    const previewPhoto = document.getElementById('preview-photo');
    const previewVideo = document.getElementById('preview-video');
    const iconPhoto = document.getElementById('icon-photo');
    const iconVideo = document.getElementById('icon-video');
    const textPhoto = document.getElementById('text-photo');
    const textVideo = document.getElementById('text-video');

    const btnUploadPhoto = document.getElementById('btn-upload-photo');
    const btnUploadVideo = document.getElementById('btn-upload-video');
    const resultPhoto = document.getElementById('result-photo');
    const resultVideo = document.getElementById('result-video');

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

    const savedUsername = localStorage.getItem('scarlet_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(savedUsername)}&background=0D8ABC&color=fff`;
    }

    usernameInput.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('scarlet_username', val);
        profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(val)}&background=0D8ABC&color=fff`;
    });

    const savedTheme = localStorage.getItem('scarlet_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    toggleThemeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('scarlet_theme', document.body.classList.contains('dark-mode')? 'dark' : 'light');
    });

    const savedHeaderColor = localStorage.getItem('scarlet_header_color');
    if (savedHeaderColor) {
        mainHeader.style.backgroundColor = savedHeaderColor;
        headerColorPicker.value = savedHeaderColor;
    }
    headerColorPicker.addEventListener('input', (e) => {
        mainHeader.style.backgroundColor = e.target.value;
        localStorage.setItem('scarlet_header_color', e.target.value);
    });

    const savedBg = localStorage.getItem('scarlet_bg');
    const savedBgType = localStorage.getItem('scarlet_bg_type');
    if (savedBg) applyBackground(savedBg, savedBgType);

    bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            const type = file.type.startsWith('video')? 'video' : 'image';
            try {
                localStorage.setItem('scarlet_bg', result);
                localStorage.setItem('scarlet_bg_type', type);
                applyBackground(result, type);
            } catch {
                alert('Ukuran file background terlalu besar untuk disimpan di browser!');
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
        bgFileInput.value = '';
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

    tabPhoto.addEventListener('click', () => switchTab('photo'));
    tabVideo.addEventListener('click', () => switchTab('video'));
    function switchTab(tab) {
        tabPhoto.classList.toggle('active', tab === 'photo');
        tabVideo.classList.toggle('active', tab === 'video');
        sectionPhoto.classList.toggle('active', tab === 'photo');
        sectionVideo.classList.toggle('active', tab === 'video');
    }

    settingsBtn.addEventListener('click', () => {
        settingsSidebar.classList.add('open');
        overlay.classList.add('active');
    });
    function closeMenu() {
        settingsSidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
    closeSettingsBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    function setupDrop(dropZone, input, preview, icon, text) {
        dropZone.addEventListener('click', () => input.click());
        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });
        dropZone.addEventListener('drop', e => {
            input.files = e.dataTransfer.files;
            showPreview(input.files[0], preview, icon, text);
        });
        input.addEventListener('change', () => showPreview(input.files[0], preview, icon, text));
    }

    function showPreview(file, preview, icon, text) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        icon.style.display = 'none';
        text.textContent = file.name;
    }

    setupDrop(dropPhoto, inputPhoto, previewPhoto, iconPhoto, textPhoto);
    setupDrop(dropVideo, inputVideo, previewVideo, iconVideo, textVideo);

    async function uploadToCatbox(file, resultContainer, button) {
        if (!file) return alert('Pilih file terlebih dahulu!');
        if (file.size > 200 * 1024 * 1024) return alert('File terlalu besar! Maks 200MB');

        button.disabled = true;
        resultContainer.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Mengunggah ke Catbox...</p>';

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', file);

        try {
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });
            const url = await res.text();
            if (url.startsWith('http')) {
                showResult(resultContainer, url);
            } else {
                resultContainer.innerHTML = `<p style="color: red;">Gagal: ${url}</p>`;
            }
        } catch (error) {
            console.error(error);
            resultContainer.innerHTML = `<p style="color: red;">Gagal: ${error.message}. Coba ganti jaringan/WiFi</p>`;
        } finally {
            button.disabled = false;
        }
    }

    btnUploadPhoto.addEventListener('click', () => {
        uploadToCatbox(inputPhoto.files[0], resultPhoto, btnUploadPhoto);
    });

    btnUploadVideo.addEventListener('click', () => {
        uploadToCatbox(inputVideo.files[0], resultVideo, btnUploadVideo);
    });

    function showResult(container, url) {
        container.innerHTML = `
            <p style="color: #25D366;"><i class="fa-solid fa-check"></i> Berhasil!</p>
            <input type="text" value="${url}" readonly>
            <button class="expand-effect btn-copy">Salin</button>
        `;
        container.querySelector('.btn-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(url);
            alert('URL Berhasil Disalin!');
        });
    }
});
