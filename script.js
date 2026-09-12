document.addEventListener('DOMContentLoaded', () => {
    //... SEMUA KODE ATAS SAMA KAYAK SEBELUMNYA...
    // COPY DARI VERSI SEBELUMNYA SAMPAI BAGIAN setupDrop

    // FUNGSI BUKA APP / WEB
    document.querySelectorAll('.open-app').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const appUrl = btn.dataset.app;
            const webUrl = btn.dataset.web;
            const start = Date.now();

            window.location.href = appUrl; // Coba buka app dulu

            setTimeout(() => { // Kalau 1.5 detik gak kebuka, berarti app gak ada
                if (Date.now() - start < 1600) {
                    window.open(webUrl, '_blank'); // Buka web
                }
            }, 1500);
        });
    });

    // FUNGSI UPLOAD 3X FALLBACK API GRATIS
    async function uploadFile(file, resultContainer, button) {
        if (!file) return alert('Pilih file terlebih dahulu!');
        if (file.size > 512 * 1024 * 1024) return alert('File terlalu besar! Maks 512MB');

        button.disabled = true;
        resultContainer.innerHTML = `<p><i class="fa-solid fa-spinner fa-spin"></i> Mengunggah 0%...</p>`;

        const apis = [
            { name: '0x0.st', url: 'https://0x0.st', field: 'file' }, // Max 512MB
            { name: 'tmpfiles.org', url: 'https://tmpfiles.org/api/v1/upload', field: 'file' }, // Max 10GB
            { name: 'file.io', url: 'https://file.io', field: 'file' } // Max 2GB, 14 hari
        ];

        for (let i = 0; i < apis.length; i++) {
            const api = apis[i];
            try {
                resultContainer.innerHTML = `<p><i class="fa-solid fa-spinner fa-spin"></i> Mencoba ${api.name}... 0%</p>`;
                const url = await uploadToAPI(file, api, resultContainer);
                if (url) {
                    showResult(resultContainer, url, api.name);
                    button.disabled = false;
                    return;
                }
            } catch (error) {
                console.log(`${api.name} gagal:`, error);
                if (i === apis.length - 1) { // Kalau ini API terakhir
                    resultContainer.innerHTML = `<p style="color: red;">Semua server gagal. Cek internet/VPN</p>`;
                }
            }
        }
        button.disabled = false;
    }

    function uploadToAPI(file, api, resultContainer) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append(api.field, file);

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    resultContainer.innerHTML = `<p><i class="fa-solid fa-spinner fa-spin"></i> Upload ke ${api.name}: ${percent}%</p>`;
                }
            });
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    let url = xhr.responseText.trim();
                    // Format URL khusus per API
                    if (api.name === 'tmpfiles.org') url = JSON.parse(url).data.url;
                    if (api.name === 'file.io') url = JSON.parse(url).link;
                    if (url.startsWith('http')) resolve(url);
                    else reject('Invalid URL');
                } else {
                    reject(`Status ${xhr.status}`);
                }
            });
            xhr.addEventListener('error', () => reject('Network Error'));
            xhr.open('POST', api.url);
            xhr.send(formData);
        });
    }

    btnUploadPhoto.addEventListener('click', () => {
        uploadFile(inputPhoto.files[0], resultPhoto, btnUploadPhoto);
    });
    btnUploadVideo.addEventListener('click', () => {
        uploadFile(inputVideo.files[0], resultVideo, btnUploadVideo);
    });

    function showResult(container, url, apiName) {
        container.innerHTML = `
            <p style="color: #25D366;"><i class="fa-solid fa-check"></i> Berhasil via ${apiName}!</p>
            <input type="text" value="${url}" readonly>
            <button class="expand-effect btn-copy">Salin</button>
        `;
        container.querySelector('.btn-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(url);
            alert('URL Berhasil Disalin!');
        });
    }

    //... SISA KODE BAWAHNYA SAMA...
});
