## ▶️ Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan **Frontend (Next.js)**:

### 1️⃣ Clone Repository

```bash
git clone https://github.com/uhuy-cuy/hr_tahir.git
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Jalankan Development Server

```bash
npm run dev
```

Setelah server berjalan, buka browser dan akses:

```
http://localhost:3000
```

---

## ⚠️ Penting

Aplikasi ini membutuhkan **API Backend Laravel** agar semua fitur dapat berjalan dengan baik.

Pastikan **API sudah dijalankan terlebih dahulu** :

```
https://github.com/uhuy-cuy/api_hr_tahir
```

Jika API belum dijalankan, beberapa fitur seperti:

- Login (Admin HR, Karyawan)
- Manajemen Karyawan: Tambah data karyawan, Lihat daftar karyawan, Edit data karyawan, Hapus data karyawan
- Data Jabatan & Departemen: Kelola jabatan, Kelola departemen
- Absensi: Input absensi karyawan, Lihat riwayat absensi
- Cuti: Pengajuan cuti karyawan, Persetujuan cuti oleh HR
- Dashboard: Total karyawan, Jumlah karyawan aktif, Rekap absensi / cuti

tidak akan berfungsi.

Silakan jalankan API terlebih dahulu sebelum menggunakan aplikasi frontend.
