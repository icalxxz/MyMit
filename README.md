# PRD Dashboard

Dashboard sensor berbasis React, Vite, Tailwind CSS, dan Firebase Realtime Database.

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru dan npm.

1. Salin template environment:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Isi variabel `VITE_FIREBASE_*` di `.env` dengan konfigurasi Firebase Anda.
3. Instal dependensi dan jalankan aplikasi:

   ```powershell
   npm ci
   npm run dev
   ```

## Pemeriksaan produksi

```powershell
npm run lint
npm run build
```

Hasil build dibuat di folder `dist/`. Folder tersebut, `node_modules/`, dan `.env` sengaja tidak disertakan dalam Git.

## Deploy ke GitHub

Inisialisasi Git telah disiapkan di direktori ini. Setelah membuat repository kosong di GitHub, jalankan (ganti URL-nya):

```powershell
git add .
git commit -m "Initial deployment setup"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
git push -u origin main
```

Pastikan `.env` tidak pernah di-commit. Berkas `.env.example` aman untuk dibagikan karena hanya berisi nama variabel.

## Deploy ke Vercel

1. Di Vercel, pilih **Add New → Project**, lalu impor repository GitHub ini.
2. Vercel akan mendeteksi **Vite** secara otomatis. Gunakan pengaturan berikut bila perlu:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
3. Tambahkan seluruh variabel dari `.env` pada **Project Settings → Environment Variables** untuk lingkungan Production (dan Preview jika diperlukan).
4. Klik **Deploy**.

Setiap push ke branch yang terhubung akan memicu deployment baru. Variabel yang diawali `VITE_` dibundel ke aplikasi klien; gunakan hanya konfigurasi publik Firebase di sana dan jangan simpan secret server di variabel tersebut.
