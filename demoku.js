document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. INICIALISASI DATA & DOM
    // ----------------------------------------------------

    // Inisialisasi data jika LocalStorage kosong
    if (!localStorage.getItem('warga')) {
        const defaultWarga = [
            // ⭐ FIELD BARU: whatsapp, email, referral, password
            { id: 1, nama: 'Bpk. Budi Santoso', alamat: 'Blok A No. 1', pekerjaan: 'Pegawai Swasta', status: 'Aktif', whatsapp: '0811xxxxxx', email: 'budi@mail.com', referral: 'BUDI123', password: 'password123' },
            { id: 2, nama: 'Ibu Rina Dewi', alamat: 'Blok B No. 5', pekerjaan: 'Wiraswasta', status: 'Aktif', whatsapp: '0812xxxxxx', email: 'rina@mail.com', referral: '', password: 'password123' },
            { id: 3, nama: 'Bpk. Ahmad Fauzi', alamat: 'Blok C No. 10', pekerjaan: 'Pensiunan', status: 'Aktif', whatsapp: '0813xxxxxx', email: 'ahmad@mail.com', referral: '', password: 'password123' }
        ];
        localStorage.setItem('warga', JSON.stringify(defaultWarga));
    }

    // Set tanggal filter default ke hari ini
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date-beranda').value = today;
    document.getElementById('filter-date-iuran').value = today;
    document.getElementById('filter-date-tabungan').value = today;

    // Panggil fungsi awal
    updateTotals();
    renderWargaOptions('iuran-warga');
    renderWargaOptions('tabungan-warga');
    renderDaftarWarga();
    renderRiwayat('beranda');
    renderWargaBelumBayar();

    // ----------------------------------------------------
    // 2. NAVIGASI
    // ----------------------------------------------------
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.dataset.page;
            
            // Hapus kelas 'active-nav' dari semua
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active-nav'));
            // Tambahkan kelas 'active-nav' ke yang diklik
            this.classList.add('active-nav');

            // Sembunyikan semua halaman
            document.querySelectorAll('.tab-page').forEach(page => page.classList.add('hidden'));

            // Tampilkan halaman target
            document.getElementById(`page-${targetPage}`).classList.remove('hidden');
            
            // Panggil fungsi render yang spesifik untuk halaman yang baru diaktifkan
            if (targetPage === 'iuran') {
                renderRiwayat('iuran');
                renderWargaBelumBayar(); 
            } else if (targetPage === 'tabungan') {
                renderRiwayat('tabungan');
            } else if (targetPage === 'warga') {
                renderDaftarWarga();
            } else if (targetPage === 'beranda') {
                renderRiwayat('beranda');
            }
        });
    });

    // ----------------------------------------------------
    // 3. LISTENERS FORM SUBMISSION
    // ----------------------------------------------------

    document.getElementById('transaksi-form').addEventListener('submit', handleGeneralTransaction);
    document.getElementById('iuran-form').addEventListener('submit', handleIuranTransaction);
    document.getElementById('tabungan-form').addEventListener('submit', handleTabunganTransaction);
    document.getElementById('warga-form').addEventListener('submit', handleWargaForm); // ✅ SUBMISSION LISTENER
    document.getElementById('pengeluaran-form').addEventListener('submit', handlePengeluaranForm);
    
    // Tombol buka modal
    document.getElementById('add-warga-btn').addEventListener('click', () => showWargaModal()); // ✅ TAMBAH BARU LISTENER
    document.getElementById('add-pengeluaran-iuran-btn').addEventListener('click', () => showPengeluaranModal());


    // ----------------------------------------------------
    // 4. LISTENERS FILTER DAN PENCARIAN
    // ----------------------------------------------------
    
    document.getElementById('filter-mode-beranda').addEventListener('change', () => renderRiwayat('beranda'));
    document.getElementById('filter-date-beranda').addEventListener('change', () => renderRiwayat('beranda'));
    document.getElementById('search-beranda').addEventListener('input', () => renderRiwayat('beranda'));
    
    document.getElementById('filter-mode-iuran').addEventListener('change', () => renderRiwayat('iuran'));
    document.getElementById('filter-date-iuran').addEventListener('change', () => renderRiwayat('iuran'));
    document.getElementById('search-iuran').addEventListener('input', () => renderRiwayat('iuran'));

    document.getElementById('filter-mode-tabungan').addEventListener('change', () => renderRiwayat('tabungan'));
    document.getElementById('filter-date-tabungan').addEventListener('change', () => renderRiwayat('tabungan'));
    document.getElementById('search-tabungan').addEventListener('input', () => renderRiwayat('tabungan'));

    document.getElementById('search-warga').addEventListener('input', renderDaftarWarga);
    
    document.getElementById('search-profil').addEventListener('input', filterProfilMenu);
    
    // ----------------------------------------------------
    // 5. LISTENERS MODAL
    // ----------------------------------------------------
    document.getElementById('cancel-warga-btn').addEventListener('click', () => hideModal('warga-modal'));
    document.getElementById('cancel-pengeluaran-btn').addEventListener('click', () => hideModal('pengeluaran-modal'));
    document.getElementById('close-profil-detail-btn').addEventListener('click', () => hideModal('profil-detail-modal'));
    
    // Listener untuk menu profil
    document.querySelectorAll('#profil-menu-list .menu-item').forEach(item => {
        item.addEventListener('click', (e) => showProfilDetail(e.currentTarget));
    });
    
    // ----------------------------------------------------
    // 6. DARK MODE TOGGLE
    // ----------------------------------------------------
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const html = document.documentElement;

    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        document.getElementById('sun-icon').classList.remove('hidden');
        document.getElementById('moon-icon').classList.add('hidden');
    } else {
        html.classList.remove('dark');
        document.getElementById('sun-icon').classList.add('hidden');
        document.getElementById('moon-icon').classList.remove('hidden');
    }

    darkModeToggle.addEventListener('click', () => {
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.theme = 'light';
            document.getElementById('sun-icon').classList.add('hidden');
            document.getElementById('moon-icon').classList.remove('hidden');
        } else {
            html.classList.add('dark');
            localStorage.theme = 'dark';
            document.getElementById('sun-icon').classList.remove('hidden');
            document.getElementById('moon-icon').classList.add('hidden');
        }
    });

});


// ====================================================
// FUNGSI UTAMA (CRUD dan RENDER)
// ====================================================

/**
 * Memformat angka menjadi format Rupiah.
 */
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

/**
 * Mengambil total saldo dari LocalStorage dan memperbarui tampilan.
 */
function updateTotals() {
    const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
    const transaksiIuran = JSON.parse(localStorage.getItem('transaksiIuran') || '[]');
    const transaksiTabungan = JSON.parse(localStorage.getItem('transaksiTabungan') || '[]');

    let saldoUmum = 0;
    let saldoIuran = 0;
    let saldoTabungan = 0;
    let pengeluaranIuran = 0;
    let pengeluaranUmum = 0;

    transaksiUmum.forEach(t => {
        if (t.jenis === 'pemasukan') {
            saldoUmum += t.jumlah;
        } else if (t.jenis === 'pengeluaran') {
            saldoUmum -= t.jumlah;
            // Hanya hitung pengeluaran umum yang bukan dari iuran/tabungan
            if (t.kategori === 'umum_pengeluaran') { 
                pengeluaranUmum += t.jumlah;
            }
        }
    });

    transaksiIuran.forEach(t => {
        if (t.jenis === 'pemasukan') {
            saldoIuran += t.jumlah;
        } else if (t.jenis === 'pengeluaran') {
            saldoIuran -= t.jumlah;
            pengeluaranIuran += t.jumlah;
        }
    });
    
    transaksiTabungan.forEach(t => {
        if (t.jenis === 'pemasukan') {
            saldoTabungan += t.jumlah;
        } else if (t.jenis === 'pengeluaran') {
            saldoTabungan -= t.jumlah;
        }
    });


    // Saldo Total Keseluruhan = Saldo Iuran Kas + Saldo Tabungan Warga
    const saldoTotal = saldoIuran + saldoTabungan + saldoUmum; 

    // Perbarui Tampilan
    document.getElementById('saldo-total').textContent = formatRupiah(saldoTotal);
    document.getElementById('saldo-iuran-total').textContent = formatRupiah(saldoIuran);
    document.getElementById('saldo-tabungan-total').textContent = formatRupiah(saldoTabungan);
    
    document.getElementById('pengeluaran-iuran-beranda').textContent = formatRupiah(pengeluaranIuran);
    document.getElementById('pengeluaran-umum-beranda').textContent = formatRupiah(pengeluaranUmum);
    document.getElementById('pengeluaran-iuran-total').textContent = formatRupiah(pengeluaranIuran);
}

/**
 * Mengisi dropdown (select) dengan data warga yang aktif.
 */
function renderWargaOptions(elementId) {
    const select = document.getElementById(elementId);
    if (!select) return; 

    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const selectedValue = select.value; 

    select.innerHTML = '<option value="">--- Pilih Warga ---</option>';

    wargaData.filter(w => w.status === 'Aktif').forEach(warga => {
        const option = document.createElement('option');
        option.value = warga.id;
        option.textContent = `${warga.nama} (${warga.alamat})`;
        select.appendChild(option);
    });
    
    if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
        select.value = selectedValue;
    }
}


// --- RIWAYAT DAN FILTER ---

/**
 * Mengambil, memfilter, dan merender riwayat transaksi.
 */
function renderRiwayat(page) {
    let storageKey;
    let listId;
    let filterDateId;
    let filterModeId;
    let searchId;
    let transaksiData;

    if (page === 'beranda') {
        storageKey = 'transaksiUmum';
        listId = 'riwayat-list-beranda';
        filterDateId = 'filter-date-beranda';
        filterModeId = 'filter-mode-beranda';
        searchId = 'search-beranda';
        transaksiData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } else if (page === 'iuran') {
        storageKey = 'transaksiIuran';
        listId = 'riwayat-list-iuran';
        filterDateId = 'filter-date-iuran';
        filterModeId = 'filter-mode-iuran';
        searchId = 'search-iuran';
        transaksiData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } else if (page === 'tabungan') {
        storageKey = 'transaksiTabungan';
        listId = 'riwayat-list-tabungan';
        filterDateId = 'filter-date-tabungan';
        filterModeId = 'filter-mode-tabungan'; // Perbaikan: Pastikan ID filter mode di tabungan sudah benar
        searchId = 'search-tabungan';
        transaksiData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } else {
        return; 
    }
    
    const listElement = document.getElementById(listId);
    const filterDate = document.getElementById(filterDateId).value;
    const filterMode = document.getElementById(filterModeId).value;
    const searchTerm = document.getElementById(searchId).value.toLowerCase();
    
    // Filter data berdasarkan mode, tanggal, dan pencarian
    let filteredData = transaksiData.filter(t => {
        const tDate = new Date(t.tanggal);
        const fDate = new Date(filterDate);

        // Filter Tanggal
        let passDateFilter = true;
        if (filterMode === 'day') {
            passDateFilter = tDate.toDateString() === fDate.toDateString(); 
        } else if (filterMode === 'month') {
            passDateFilter = tDate.getMonth() === fDate.getMonth() && tDate.getFullYear() === fDate.getFullYear();
        } else if (filterMode === 'year') {
            passDateFilter = tDate.getFullYear() === fDate.getFullYear();
        } 

        // Filter Pencarian
        let passSearchFilter = true;
        const searchTarget = `${t.keterangan || ''} ${t.namaWarga || ''} ${t.nama || ''}`.toLowerCase();
        if (searchTerm) {
            passSearchFilter = searchTarget.includes(searchTerm);
        }

        return passDateFilter && passSearchFilter;
    });

    listElement.innerHTML = '';
    
    if (filteredData.length === 0) {
        listElement.innerHTML = `<li class="p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md text-gray-500 text-sm italic dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">Tidak ada transaksi yang cocok dengan filter.</li>`;
        return;
    }

    // Render item
    filteredData.forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan' || t.jenis === 'menabung';
        const color = isPemasukan ? 'green' : 'red';
        const sign = isPemasukan ? '+' : '-';
        const name = t.namaWarga ? ` (${t.namaWarga})` : '';

        const item = document.createElement('li');
        item.className = `p-3 flex justify-between items-center bg-white shadow-sm rounded-md border-l-4 border-${color}-500 dark:bg-gray-700 dark:border-gray-600`;
        item.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800 dark:text-gray-100">${t.keterangan || t.nama}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(t.tanggal).toLocaleDateString('id-ID')} ${name}</p>
            </div>
            <p class="font-bold text-${color}-600 dark:text-${color}-400">${sign} ${formatRupiah(t.jumlah)}</p>
        `;
        listElement.appendChild(item);
    });
}


// --- Warga Belum Bayar (Fitur Interaktif) ---

/**
 * Menambahkan event listener ke tombol "Bayar" yang dinamis.
 */
function addMarkPaidListeners() {
    document.querySelectorAll('.mark-paid-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const wargaId = event.currentTarget.dataset.wargaId;
            const wargaNama = event.currentTarget.dataset.wargaNama;

            // Asumsi: Iuran Kas Bulanan sebesar 50000
            const jumlahIuran = 50000; 

            const konfirmasi = confirm(`Yakin ingin mencatat pembayaran Iuran Kas Bulanan sebesar ${formatRupiah(jumlahIuran)} dari ${wargaNama}?`);

            if (konfirmasi) {
                const newTransaction = {
                    id: Date.now(),
                    tanggal: new Date().toISOString().split('T')[0],
                    jenis: 'pemasukan',
                    kategori: 'iuran',
                    keterangan: 'Iuran Kas Bulanan',
                    jumlah: jumlahIuran,
                    wargaId: parseInt(wargaId),
                    namaWarga: wargaNama
                };

                // 1. Tambahkan ke Transaksi Iuran
                const transaksiIuran = JSON.parse(localStorage.getItem('transaksiIuran') || '[]');
                transaksiIuran.unshift(newTransaction);
                localStorage.setItem('transaksiIuran', JSON.stringify(transaksiIuran));

                // 2. Tambahkan ke Transaksi Umum (untuk saldo total)
                const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
                const transaksiUmumEntry = {...newTransaction, kategori: 'iuran'}; // Tentukan kategori untuk umum
                transaksiUmum.unshift(transaksiUmumEntry);
                localStorage.setItem('transaksiUmum', JSON.stringify(transaksiUmum));

                alert(`Iuran Kas Bulanan dari ${wargaNama} sebesar ${formatRupiah(jumlahIuran)} berhasil dicatat.`);
                
                // 3. Perbarui UI
                updateTotals();
                renderRiwayat('iuran');
                renderRiwayat('beranda');
                renderWargaBelumBayar();
            }
        });
    });
}

/**
 * Merender daftar warga yang belum membayar Iuran Kas Bulanan.
 */
function renderWargaBelumBayar() {
    const listElement = document.getElementById('warga-belum-bayar-list');
    listElement.innerHTML = '';

    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const transaksiIuran = JSON.parse(localStorage.getItem('transaksiIuran') || '[]');
    
    // Periksa status Iuran Kas Bulanan bulan ini
    const iuranKasBulanIni = new Date().getMonth();
    const iuranKasTahunIni = new Date().getFullYear();
    let countBelumBayar = 0;

    wargaData.filter(w => w.status === 'Aktif').forEach(warga => {
        // Cari transaksi Iuran Kas Bulanan oleh warga ini di bulan ini
        const sudahBayar = transaksiIuran.some(t => {
            const tDate = new Date(t.tanggal);
            return t.wargaId === warga.id && 
                   t.keterangan === 'Iuran Kas Bulanan' && 
                   tDate.getMonth() === iuranKasBulanIni && 
                   tDate.getFullYear() === iuranKasTahunIni;
        });

        if (!sudahBayar) {
            countBelumBayar++;
            const item = document.createElement('li');
            item.className = `p-3 flex justify-between items-center bg-white shadow-sm rounded-md border-l-4 border-orange-500 dark:bg-gray-700 dark:border-orange-700`;
            item.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800 dark:text-gray-100">${warga.nama}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${warga.alamat}</p>
                </div>
                <button class="mark-paid-btn bg-green-500 text-white text-xs py-1 px-3 rounded-full hover:bg-green-600 transition duration-150" 
                        data-warga-id="${warga.id}" 
                        data-warga-nama="${warga.nama}">
                    Bayar Kas
                </button>
            `;
            listElement.appendChild(item);
        }
    });
    
    if (countBelumBayar === 0) {
        listElement.innerHTML = `<li class="p-3 bg-gray-50 border-l-4 border-green-500 rounded-md text-green-700 text-sm italic dark:bg-gray-800 dark:border-green-700 dark:text-green-400">🎉 Semua warga aktif sudah membayar Iuran Kas Bulanan.</li>`;
    }
    
    // Setelah rendering selesai, tambahkan listener
    addMarkPaidListeners();
}

// --- WARGA ---

/**
 * Merender daftar warga, mendukung fitur edit/detail.
 */
function renderDaftarWarga() {
    const listElement = document.getElementById('daftar-warga-list');
    listElement.innerHTML = '';
    
    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const searchTerm = document.getElementById('search-warga').value.toLowerCase();
    
    let filteredWarga = wargaData.filter(w => {
        // ⭐ PERUBAHAN: Memasukkan field baru ke dalam pencarian
        const searchTarget = `${w.nama} ${w.alamat} ${w.pekerjaan} ${w.whatsapp || ''} ${w.email || ''} ${w.referral || ''} ${w.status}`.toLowerCase();
        return searchTarget.includes(searchTerm);
    });

    if (filteredWarga.length === 0) {
        listElement.innerHTML = '<li class="p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md text-gray-500 text-sm italic dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">Tidak ada warga yang cocok.</li>';
        return;
    }

    filteredWarga.forEach(warga => {
        const statusColor = warga.status === 'Aktif' ? 'green' : 'gray';
        const item = document.createElement('li');
        item.className = `warga-item-clickable p-3 flex justify-between items-center bg-white shadow-sm rounded-md border-l-4 border-${statusColor}-500 dark:bg-gray-700 cursor-pointer transition duration-150`;
        item.dataset.id = warga.id;
        // ⭐ PENTING: Memanggil showWargaDetail saat diklik
        item.onclick = () => showWargaDetail(warga.id); 
        item.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800 dark:text-gray-100">${warga.nama}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${warga.alamat} | ${warga.pekerjaan}</p>
            </div>
            <span class="text-xs font-bold text-${statusColor}-600 dark:text-${statusColor}-400">${warga.status}</span>
        `;
        listElement.appendChild(item);
    });
}

/**
 * Menangani penambahan atau pengeditan data warga.
 */
function handleWargaForm(e) {
    e.preventDefault();
    
    const idToEdit = document.getElementById('warga-id-to-edit').value;
    const nama = document.getElementById('warga-nama').value;
    const alamat = document.getElementById('warga-alamat').value;
    const pekerjaan = document.getElementById('warga-pekerjaan').value;
    // ⭐ PENGAMBILAN FIELD BARU
    const whatsapp = document.getElementById('warga-whatsapp').value;
    const email = document.getElementById('warga-email').value;
    const referral = document.getElementById('warga-referral').value;
    const password = document.getElementById('warga-password').value; // Mengambil password
    const status = document.getElementById('warga-status').value;

    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    let message = '';

    if (idToEdit) {
        // Edit Warga
        const index = wargaData.findIndex(w => w.id === parseInt(idToEdit));
        if (index > -1) {
            // Ambil password lama jika password baru kosong
            const currentPassword = wargaData[index].password;
            
            wargaData[index] = {
                id: parseInt(idToEdit),
                nama,
                alamat,
                pekerjaan,
                status,
                // Simpan field baru
                whatsapp, 
                email,
                referral,
                // Jika password di form kosong, pertahankan yang lama
                password: password || currentPassword 
            };
            message = `Data warga ${nama} berhasil diperbarui.`;
        }
    } else {
        // Tambah Warga Baru
        const newId = wargaData.length > 0 ? Math.max(...wargaData.map(w => w.id)) + 1 : 1;
        
        if (!password) {
            alert("Password wajib diisi untuk warga baru.");
            return;
        }
        
        const newWarga = {
            id: newId,
            nama,
            alamat,
            pekerjaan,
            status: 'Aktif', // Default status saat tambah baru
            whatsapp, 
            email,
            referral,
            password // Simpan password baru
        };
        wargaData.push(newWarga);
        message = `Warga baru ${nama} berhasil ditambahkan.`;
    }

    localStorage.setItem('warga', JSON.stringify(wargaData));
    alert(message);

    // Perbarui UI
    hideModal('warga-modal');
    renderDaftarWarga();
    renderWargaOptions('iuran-warga');
    renderWargaOptions('tabungan-warga');
}

// --- LOGIKA TRANSAKSI ---

// --- Transaksi Umum (Beranda) ---
function handleGeneralTransaction(e) {
    e.preventDefault();
    const jenis = document.getElementById('jenis').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const keterangan = document.getElementById('keterangan').value;

    if (isNaN(jumlah) || jumlah <= 0) {
        alert("Jumlah harus berupa angka positif.");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        jenis: jenis,
        kategori: jenis === 'pemasukan' ? 'umum_pemasukan' : 'umum_pengeluaran',
        keterangan: keterangan,
        jumlah: jumlah
    };

    const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
    transaksiUmum.unshift(newTransaction);
    localStorage.setItem('transaksiUmum', JSON.stringify(transaksiUmum));

    alert(`${jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} sebesar ${formatRupiah(jumlah)} berhasil dicatat.`);
    document.getElementById('transaksi-form').reset();

    // Perbarui UI
    updateTotals();
    renderRiwayat('beranda');
}

// --- Transaksi Iuran ---
function handleIuranTransaction(e) {
    e.preventDefault();
    
    const wargaId = document.getElementById('iuran-warga').value;
    const keterangan = document.getElementById('iuran-keterangan').value;
    const jumlah = parseInt(document.getElementById('iuran-jumlah').value);

    if (!wargaId || isNaN(jumlah) || jumlah <= 0) {
        alert("Pilih warga dan masukkan jumlah yang valid.");
        return;
    }
    
    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const selectedWarga = wargaData.find(w => w.id === parseInt(wargaId));

    if (!selectedWarga) {
        alert("Warga tidak ditemukan.");
        return;
    }
    
    const newTransaction = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        jenis: 'pemasukan',
        kategori: 'iuran',
        keterangan: keterangan,
        jumlah: jumlah,
        wargaId: parseInt(wargaId),
        namaWarga: selectedWarga.nama
    };

    // 1. Tambahkan ke Transaksi Iuran
    const transaksiIuran = JSON.parse(localStorage.getItem('transaksiIuran') || '[]');
    transaksiIuran.unshift(newTransaction);
    localStorage.setItem('transaksiIuran', JSON.stringify(transaksiIuran));

    // 2. Tambahkan ke Transaksi Umum (untuk saldo total)
    const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
    const transaksiUmumEntry = {...newTransaction, kategori: 'iuran'}; // Tentukan kategori untuk umum
    transaksiUmum.unshift(transaksiUmumEntry);
    localStorage.setItem('transaksiUmum', JSON.stringify(transaksiUmum));

    alert(`Iuran ${keterangan} dari ${selectedWarga.nama} sebesar ${formatRupiah(jumlah)} berhasil dicatat.`);
    document.getElementById('iuran-form').reset();

    // Perbarui UI
    updateTotals();
    renderRiwayat('iuran');
    renderRiwayat('beranda');
    renderWargaBelumBayar();
}

// --- Transaksi Pengeluaran Kas (Modal) ---
function handlePengeluaranForm(e) {
    e.preventDefault();
    
    const nama = document.getElementById('pengeluaran-nama').value;
    const deskripsi = document.getElementById('pengeluaran-deskripsi').value;
    const jumlah = parseInt(document.getElementById('pengeluaran-jumlah').value);
    
    if (isNaN(jumlah) || jumlah <= 0) {
        alert("Jumlah harus berupa angka positif.");
        return;
    }
    
    const keterangan = `${nama}: ${deskripsi}`;

    const newTransaction = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        jenis: 'pengeluaran',
        kategori: 'iuran_pengeluaran',
        nama: nama,
        keterangan: keterangan,
        jumlah: jumlah
    };

    // 1. Tambahkan ke Transaksi Iuran
    const transaksiIuran = JSON.parse(localStorage.getItem('transaksiIuran') || '[]');
    transaksiIuran.unshift(newTransaction);
    localStorage.setItem('transaksiIuran', JSON.stringify(transaksiIuran));

    // 2. Tambahkan ke Transaksi Umum
    const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
    const transaksiUmumEntry = {...newTransaction, kategori: 'iuran_pengeluaran'};
    transaksiUmum.unshift(transaksiUmumEntry);
    localStorage.setItem('transaksiUmum', JSON.stringify(transaksiUmum));

    alert(`Pengeluaran Kas sebesar ${formatRupiah(jumlah)} untuk ${keterangan} berhasil dicatat.`);
    hideModal('pengeluaran-modal');

    // Perbarui UI
    updateTotals();
    renderRiwayat('iuran');
    renderRiwayat('beranda');
}

// --- Transaksi Tabungan ---
function handleTabunganTransaction(e) {
    e.preventDefault();
    
    const jenis = document.getElementById('tabungan-jenis').value;
    const wargaId = document.getElementById('tabungan-warga').value;
    const jumlah = parseInt(document.getElementById('tabungan-jumlah').value);

    if (!wargaId || isNaN(jumlah) || jumlah <= 0) {
        alert("Pilih warga dan masukkan jumlah yang valid.");
        return;
    }

    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const selectedWarga = wargaData.find(w => w.id === parseInt(wargaId));

    if (!selectedWarga) {
        alert("Warga tidak ditemukan.");
        return;
    }

    const keteranganText = jenis === 'menabung' ? 'Menabung' : 'Pengambilan Tabungan';
    
    // Periksa saldo tabungan sebelum pengambilan
    if (jenis === 'mengambil') {
        const transaksiTabungan = JSON.parse(localStorage.getItem('transaksiTabungan') || '[]');
        let saldoWarga = 0;
        transaksiTabungan.filter(t => t.wargaId === parseInt(wargaId)).forEach(t => {
            if (t.jenis === 'pemasukan') {
                saldoWarga += t.jumlah;
            } else if (t.jenis === 'pengeluaran') {
                saldoWarga -= t.jumlah;
            }
        });
        
        if (jumlah > saldoWarga) {
            alert(`Gagal: Jumlah pengambilan (${formatRupiah(jumlah)}) melebihi saldo tabungan warga (${formatRupiah(saldoWarga)}).`);
            return;
        }
    }

    const newTransaction = {
        id: Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        jenis: jenis === 'menabung' ? 'pemasukan' : 'pengeluaran',
        kategori: jenis,
        keterangan: keteranganText,
        jumlah: jumlah,
        wargaId: parseInt(wargaId),
        namaWarga: selectedWarga.nama
    };

    // 1. Tambahkan ke Transaksi Tabungan
    const transaksiTabungan = JSON.parse(localStorage.getItem('transaksiTabungan') || '[]');
    transaksiTabungan.unshift(newTransaction);
    localStorage.setItem('transaksiTabungan', JSON.stringify(transaksiTabungan));
    
    // 2. Tambahkan ke Transaksi Umum (untuk saldo total)
    // Transaksi tabungan di sini selalu dianggap transaksi "umum" untuk saldo total, 
    // karena memengaruhi kas total
    const transaksiUmum = JSON.parse(localStorage.getItem('transaksiUmum') || '[]');
    const transaksiUmumEntry = {...newTransaction, kategori: `tabungan_${newTransaction.jenis}`};
    transaksiUmum.unshift(transaksiUmumEntry);
    localStorage.setItem('transaksiUmum', JSON.stringify(transaksiUmum));


    alert(`${keteranganText} dari ${selectedWarga.nama} sebesar ${formatRupiah(jumlah)} berhasil dicatat.`);
    document.getElementById('tabungan-form').reset();

    // Perbarui UI
    updateTotals();
    renderRiwayat('tabungan');
    renderRiwayat('beranda');
}

// ====================================================
// FUNGSI UTILITY (MODAL DAN DETAIL)
// ====================================================

/**
 * Menampilkan modal.
 */
function showModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Menyembunyikan modal.
 */
function hideModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Menampilkan modal untuk menambah/mengedit warga.
 */
function showWargaModal(wargaId = null) {
    const modalTitle = document.getElementById('warga-modal-title'); // ✅ Menggunakan ID yang BENAR
    const form = document.getElementById('warga-form');
    form.reset(); 
    document.getElementById('warga-id-to-edit').value = '';
    
    // Aktifkan kembali field status jika edit
    const statusField = document.getElementById('warga-status');
    const passwordField = document.getElementById('warga-password');
    statusField.disabled = false;
    passwordField.placeholder = ''; // Kosongkan placeholder default

    if (wargaId) {
        // Mode Edit
        const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
        const warga = wargaData.find(w => w.id === wargaId);
        
        if (warga) {
            modalTitle.textContent = 'Edit Data Warga';
            document.getElementById('warga-id-to-edit').value = warga.id;
            document.getElementById('warga-nama').value = warga.nama;
            document.getElementById('warga-alamat').value = warga.alamat;
            document.getElementById('warga-pekerjaan').value = warga.pekerjaan;
            statusField.value = warga.status;
            // PENGISIAN FIELD BARU: Mengisi field baru
            document.getElementById('warga-whatsapp').value = warga.whatsapp || '';
            document.getElementById('warga-email').value = warga.email || '';
            document.getElementById('warga-referral').value = warga.referral || '';
            // Kosongkan password saat edit, dan beri placeholder bahwa dia tidak akan diubah jika kosong
            passwordField.value = ''; 
            passwordField.placeholder = 'Biarkan kosong jika tidak ingin mengubah sandi';
        }
    } else {
        // Mode Tambah Baru
        modalTitle.textContent = 'Tambah Warga Baru';
        statusField.disabled = true;
        // PENGISIAN FIELD BARU: Atur placeholder default saat tambah baru
        passwordField.placeholder = 'Wajib diisi untuk warga baru';
    }
    
    showModal('warga-modal');
}

/**
 * Menampilkan modal pengeluaran.
 */
function showPengeluaranModal() {
    document.getElementById('pengeluaran-form').reset();
    showModal('pengeluaran-modal');
}

/**
 * Menampilkan detail lengkap warga (termasuk WhatsApp, Email, dll.) di modal detail.
 */
function showWargaDetail(wargaId) {
    const wargaData = JSON.parse(localStorage.getItem('warga') || '[]');
    const warga = wargaData.find(w => w.id === wargaId);
    if (!warga) return;

    // Hitung Saldo Tabungan Warga
    const transaksiTabungan = JSON.parse(localStorage.getItem('transaksiTabungan') || '[]');
    const riwayatWarga = transaksiTabungan.filter(t => t.wargaId === wargaId);
    let saldoWarga = 0;
    riwayatWarga.forEach(t => {
        if (t.jenis === 'pemasukan') {
            saldoWarga += t.jumlah;
        } else if (t.jenis === 'pengeluaran') {
            saldoWarga -= t.jumlah;
        }
    });

    // Ambil 5 transaksi tabungan terakhir
    const riwayatTerakhir = riwayatWarga.slice(0, 5);
    const riwayatHtml = renderRiwayatTabunganWarga(riwayatTerakhir);


    // Gunakan modal detail yang sama (profil-detail-modal) untuk menampilkan info
    document.getElementById('profil-detail-title').textContent = `Detail Profil: ${warga.nama}`;
    const contentElement = document.getElementById('profil-detail-content');

    // Tentukan warna status
    const statusColor = warga.status === 'Aktif' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';

    // ⭐ Tambahkan field baru dan riwayat tabungan ke konten detail warga
    contentElement.innerHTML = `
        <div class="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
            <p class="text-lg font-bold ${statusColor}">Status: ${warga.status}</p>
            <p class="text-2xl font-extrabold text-blue-600 dark:text-blue-400">Saldo Tabungan: ${formatRupiah(saldoWarga)}</p>
            <hr class="border-gray-300 dark:border-gray-600"/>
            <p><strong>ID Warga:</strong> ${warga.id}</p>
            <p><strong>Alamat:</strong> ${warga.alamat}</p>
            <p><strong>Pekerjaan:</strong> ${warga.pekerjaan}</p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/${warga.whatsapp ? warga.whatsapp.replace(/\D/g, '') : ''}" target="_blank" class="text-blue-500 hover:underline">${warga.whatsapp || '-'}</a></p>
            <p><strong>Email:</strong> ${warga.email || '-'}</p>
            <p><strong>Kode Referral:</strong> ${warga.referral || '-'}</p>
            <p><strong>Password:</strong> <span class="text-red-500">Tersimpan (Tidak Ditampilkan)</span></p>
        </div>
        
        <div class="pt-5">
            <h3 class="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100 border-b border-yellow-500 pb-1">5 Riwayat Tabungan Terakhir</h3>
            <ul class="space-y-2 text-sm">
                ${riwayatHtml}
            </ul>
        </div>

        <div class="flex justify-end pt-4">
            <button class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition duration-150"
                    onclick="hideModal('profil-detail-modal'); showWargaModal(${warga.id})">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline-block -mt-0.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-1.19 1.19l-4.243 4.243-1.414 1.414L3.757 14.5a.75.75 0 00-.064.041L2.121 16.12a.5.5 0 00.707.707l1.586-1.586a.75.75 0 00.041-.064l4.243-4.243 1.414 1.414-4.243 4.243a.75.75 0 000 1.06l1.06 1.06a.75.75 0 001.06 0l4.243-4.243 1.414 1.414 4.243 4.243a.75.75 0 001.06 0l1.06-1.06a.75.75 0 000-1.06l-4.243-4.243-1.414-1.414z"/></svg>
                Edit Warga
            </button>
        </div>
    `;

    showModal('profil-detail-modal');
}

/**
 * FUNGSI BARU: Merender daftar transaksi tabungan untuk warga tertentu.
 */
function renderRiwayatTabunganWarga(riwayat) {
    if (riwayat.length === 0) {
        return `<li class="p-2 text-gray-500 dark:text-gray-400 italic">Belum ada riwayat tabungan untuk warga ini.</li>`;
    }

    let html = '';
    riwayat.forEach(t => {
        const isMenabung = t.jenis === 'pemasukan';
        const color = isMenabung ? 'text-green-600' : 'text-red-600';
        const bgColor = isMenabung ? 'bg-green-50 dark:bg-gray-700/50' : 'bg-red-50 dark:bg-gray-700/50';
        const sign = isMenabung ? '+' : '-';

        html += `
            <li class="p-2 flex justify-between rounded-md ${bgColor}">
                <div>
                    <span class="font-semibold text-gray-800 dark:text-gray-100">${t.keterangan}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">${new Date(t.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <span class="font-bold ${color}">${sign} ${formatRupiah(t.jumlah)}</span>
            </li>
        `;
    });
    return html;
}

/**
 * Menampilkan modal pengeluaran.
 */
function showPengeluaranModal() {
    document.getElementById('pengeluaran-form').reset();
    showModal('pengeluaran-modal');
}

/**
 * Memfilter menu profil berdasarkan input pencarian.
 */
function filterProfilMenu() {
    const searchTerm = document.getElementById('search-profil').value.toLowerCase();
    document.querySelectorAll('#profil-menu-list .menu-item').forEach(item => {
        const keyword = item.dataset.keyword.toLowerCase();
        const title = item.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchTerm) || keyword.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

/**
 * Menampilkan detail konten untuk menu profil (Keamanan & Data, Cara Penggunaan, Tentang).
 */
function showProfilDetail(menuItem) {
    const titleElement = menuItem.querySelector('h3');
    const contentElement = document.getElementById('profil-detail-content');
    
    document.getElementById('profil-detail-title').textContent = titleElement.textContent;
    contentElement.innerHTML = ''; // Kosongkan konten sebelumnya

    if (titleElement.textContent === 'Keamanan & Data') {
        contentElement.innerHTML = `
            <p class="font-semibold text-red-600 dark:text-red-400">⚠️ Semua data disimpan di peramban (Local Storage). Ekspor secara berkala!</p>
            <div class="space-y-2 pt-3">
                <button id="export-btn" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition duration-150">Ekspor Data (JSON)</button>
                <div class="flex items-center space-x-2">
                    <input type="file" id="import-file" accept=".json" class="hidden">
                    <button id="import-btn" class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition duration-150">Impor Data</button>
                </div>
                <button id="reset-btn" class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition duration-150"
                    onclick="if (confirm('⚠️ PERINGATAN KERAS: YAKIN INGIN MENGHAPUS SEMUA DATA? Tindakan ini tidak dapat dibatalkan.')) { localStorage.clear(); location.reload(); }">Reset Data</button>
            </div>
        `;
        // Tambahkan Event Listeners untuk tombol baru
        document.getElementById('export-btn').addEventListener('click', handleExportData);
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                handleImportData(file);
            }
        });
        
    } else if (titleElement.textContent === 'Cara Penggunaan') {
        contentElement.innerHTML = `
            <p>Aplikasi ini didesain untuk mencatat 3 jenis kas utama:</p>
            <ul class="list-disc ml-5 space-y-1">
                <li>**Iuran:** Mencatat pemasukan Iuran wajib dan pengeluaran dari kas iuran.</li>
                <li>**Tabungan:** Mencatat Tabungan Warga (bisa diambil kapan saja).</li>
                <li>**Beranda:** Mencatat pemasukan/pengeluaran kas umum yang tidak termasuk iuran atau tabungan warga (misalnya dana sumbangan non-warga).</li>
            </ul>
            <p class="mt-3 text-sm italic">Selalu periksa daftar **Warga Belum Bayar** di halaman Iuran dan gunakan tombol **Bayar** interaktif untuk pencatatan cepat.</p>
        `;
    } else if (titleElement.textContent === 'Tentang Aplikasi') {
        contentElement.innerHTML = `
            <p><strong>Nama Aplikasi:</strong> Kas Warga RT 01</p>
            <p><strong>Versi:</strong> 1.0.1 (Final)</p>
            <p><strong>Teknologi:</strong> HTML5, Tailwind CSS, Vanilla JavaScript (Local Storage)</p>
            <p class="mt-3 text-sm italic">Aplikasi ini dibuat sebagai simulasi pencatatan kas berbasis web untuk penggunaan lokal/pribadi. Pastikan untuk mengekspor data secara berkala untuk cadangan.</p>
        `;
    }

    showModal('profil-detail-modal');
}


// ====================================================
// FUNGSI CADANGAN DATA (EKSPOR/IMPOR)
// ====================================================

/**
 * Mengunduh semua data LocalStorage (warga, iuran, tabungan, umum) sebagai file JSON.
 */
function handleExportData() {
    const backupData = {};
    const keys = ['warga', 'transaksiIuran', 'transaksiTabungan', 'transaksiUmum'];
    
    keys.forEach(key => {
        backupData[key] = JSON.parse(localStorage.getItem(key) || '[]');
    });

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `kas_warga_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert('✅ Data berhasil diekspor dan diunduh!');
}

/**
 * Memuat dan mengimpor data dari file JSON cadangan.
 * @param {File} file File JSON yang diunggah.
 */
function handleImportData(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            const keys = ['warga', 'transaksiIuran', 'transaksiTabungan', 'transaksiUmum'];
            let successCount = 0;
            
            let importConfirmed = confirm('⚠️ PERINGATAN: Mengimpor data akan menimpa semua data saat ini. Lanjutkan?');
            if (!importConfirmed) return;

            keys.forEach(key => {
                if (importedData[key] && Array.isArray(importedData[key])) {
                    localStorage.setItem(key, JSON.stringify(importedData[key]));
                    successCount++;
                }
            });

            if (successCount > 0) {
                alert(`🎉 Data berhasil diimpor! ${successCount} koleksi data dimuat ulang. Aplikasi akan dimuat ulang.`);
                location.reload();
            } else {
                throw new Error('File cadangan tidak valid atau kosong.');
            }

        } catch (e) {
            console.error('Error importing data:', e);
            alert('❌ Gagal mengimpor data. Pastikan file yang diunggah adalah file JSON cadangan yang valid.');
        }
    };

    reader.readAsText(file);
}
