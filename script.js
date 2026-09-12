document.addEventListener('DOMContentLoaded', () => {
    // AMBIL ELEMENT
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
    const settingsBtn = document.getElementById('settings-toggle-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const overlay = document.getElementById('overlay');

    // TAB
    tabPhoto.onclick = () => switchTab('photo');
    tabVideo.onclick = () => switchTab('video');
    function switchTab(tab) {
        tabPhoto.classList.toggle('active', tab === 'photo');
        tabVideo.classList.toggle('active', tab === 'video');
        sectionPhoto.classList.toggle('active', tab === 'photo');
        sectionVideo.classList.toggle('active', tab === 'video');
    }

    // SIDEBAR
    settingsBtn.onclick = () => { settingsSidebar.classList.add('open'); overlay.classList.add('active'); };
    function closeMenu() { settingsSidebar.classList.remove('open'); overlay.classList.remove('active'); }
    closeSettingsBtn.onclick = closeMenu;
    overlay.onclick = closeMenu;

    // DRAG DROP
    function setupDrop(dropZone, input, preview, icon, text) {
        dropZone.onclick = () => input.click();
        dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('dragover'); };
        dropZone.ondragleave = e => { e.preventDefault(); dropZone.classList.remove('dragover'); };
        dropZone.ondrop = e => { e.preventDefault(); dropZone.classList.remove('dragover'); input.files = e.dataTransfer.files; showPreview(input.files[0], preview, icon, text); };
        input.onchange = () => showPreview(input.files[0], preview, icon, text);
    }
    function showPreview(file, preview, icon, text) {
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        icon.style.display = 'none';
        text.textContent = file.name;
    }
    setupDrop(dropPhoto, inputPhoto, previewPhoto, iconPhoto, textPhoto);
    setupDrop(dropVideo, inputVideo, previewVideo, iconVideo, textVideo);

    // UPLOAD 1 API SAJA - FILE.IO PALING AMAN
    async function uploadFile(file, resultBox, button) {
        if (!file) return alert('Pilih file dulu!');
        if (file.size > 200 * 1024 * 1024) return alert('Max 200MB');

        button.disabled = true;
        resultBox.innerHTML = 'Upload 0%...';

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
                let percent = Math.round(e.loaded / e.total * 100);
                resultBox.innerHTML = `Upload ${percent}%...`;
            }
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                let res = JSON.parse(xhr.responseText);
                if (res.success) {
                    resultBox.innerHTML = `
                        <p style="color:green">Berhasil!</p>
                        <input type="text" value="${res.link}" readonly style="width:70%">
                        <button class="btn-copy">Salin</button>
                    `;
                    resultBox.querySelector('.btn-copy').onclick = () => {
                        navigator.clipboard.writeText(res.link);
                        alert('Tersalin!');
                    };
                } else {
                    resultBox.innerHTML = `<p style="color:red">Gagal: ${res.message}</p>`;
                }
            } else {
                resultBox.innerHTML = `<p style="color:red">Error Server: ${xhr.status}</p>`;
            }
            button.disabled = false;
        };
        xhr.onerror = () => {
            resultBox.innerHTML = `<p style="color:red">Gagal Koneksi. Coba pake HP Data</p>`;
            button.disabled = false;
        };
        xhr.open('POST', 'https://file.io');
        xhr.send(formData);
    }

    btnUploadPhoto.onclick = () => uploadFile(inputPhoto.files[0], resultPhoto, btnUploadPhoto);
    btnUploadVideo.onclick = () => uploadFile(inputVideo.files[0], resultVideo, btnUploadVideo);
});
