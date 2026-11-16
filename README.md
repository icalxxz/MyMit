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

Jika konfigurasi Firebase tidak tersedia, dashboard membaca `data.json` lokal. Jika variabel Firebase tersedia, aplikasi memakai Realtime Database pada path `sensors`.

## Pemeriksaan produksi

```powershell
npm run lint
npm run build
```

Hasil build dibuat di folder `dist/`. Folder tersebut, `node_modules/`, dan `.env` sengaja tidak disertakan dalam Git.

## Build aplikasi Android

Prasyarat: Node.js 22 atau lebih baru, Android Studio, Android SDK, dan JDK 21.

1. Instal dependency: `npm ci`.
2. Buka folder proyek ini di Android Studio (atau jalankan `npm run cap:open`).
3. Jalankan sinkronisasi web dan plugin: `npm run cap:sync`.
4. Build APK debug melalui Android Studio, atau jalankan `npm run android:run` dengan perangkat/emulator terhubung.

Setelah perubahan web, jalankan `npm run cap:sync` lagi sebelum membangun APK. Izin notifikasi diminta dari tombol **Aktifkan** dalam aplikasi; APK memakai notifikasi lokal Android, sedangkan versi web memakai browser Notification API. Notifikasi hanya dipicu ketika sensor beralih dari kondisi non-bahaya ke bahaya saat aplikasi berjalan.

Perintah `npm run cap:build` menjalankan build web, sinkronisasi Capacitor, lalu memanggil build Android. Untuk APK debug, gunakan Android Studio atau `npm run android:run` dengan perangkat/emulator terhubung.

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
