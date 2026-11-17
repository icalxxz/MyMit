# PRD Dashboard

Dashboard sensor berbasis React, Vite, Tailwind CSS, dan Firebase Realtime Database.

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru dan npm.

1. Salin template environment:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Isi variabel `VITE_FIREBASE_*` di `.env` dengan konfigurasi aplikasi Web dari **Firebase Console > Project settings > Your apps**. Gunakan URL dari **Realtime Database**, misalnya `https://NAMA-PROYEK-default-rtdb.asia-southeast1.firebasedatabase.app`, untuk `VITE_FIREBASE_DATABASE_URL`.
3. Kosongkan `VITE_FIREBASE_RTDB_PATH` bila isi `data.json` diunggah langsung ke root RTDB. Isi variabel ini bila data berada dalam subpath, misalnya `sensors` untuk `/sensors/node_01` atau `monitoring/sensors` untuk `/monitoring/sensors/node_01`.
4. Restart `npm run dev` setiap kali `.env` diubah; Vite hanya membaca environment saat mulai berjalan.
5. Instal dependensi dan jalankan aplikasi:

   ```powershell
   npm ci
   npm run dev
   ```

Jika konfigurasi Firebase belum lengkap, dashboard membaca `data.json` lokal. Jika RTDB terhubung, data RTDB otomatis menggantikan data lokal dan diperbarui secara real-time.

### Struktur data RTDB

Jika JSON diunggah persis seperti `data.json`, biarkan `VITE_FIREBASE_RTDB_PATH` kosong dan unggah di root RTDB. Struktur yang dibaca adalah:

```json
{
  "node_01": {
    "deviceInfo": { "deviceId": "ESP32-NODE-01", "rssi": -36 },
    "masterAlert": { "status": "AMAN", "timestamp": "2026-11-16T19:48:18+0700" },
    "sw420": { "vibrationDetected": false, "status": "Normal" },
    "waterLevel": { "jsnDistance": 41.79, "deltaRateCmPerMin": 0, "valid": true },
    "floatMpu": { "available": true, "gForceDeviation": 0.01, "status": "Normal" },
    "rain": { "detected": false, "rawAdc": 1409, "status": "Tidak Hujan" }
  }
}
```

Dashboard memilih node bernomor paling baru (`node_02` di atas `node_01`). Ia juga mendukung data bertingkat seperti `node_01/data_01`, struktur `/sensors/node_01`, dan path langsung ke satu node, misalnya `VITE_FIREBASE_RTDB_PATH=sensors/node_01`.

### Perataan data RTDB

Setiap pembaruan RTDB yang berbeda disimpan pada buffer berjalan berisi paling banyak 10 sampel per node. Nilai numerik (misalnya jarak air, ADC hujan, sumbu MPU, dan RSSI) yang ditampilkan adalah rata-rata seluruh sampel dalam buffer tersebut. Nilai nonnumerik seperti status, waktu, dan boolean selalu diambil dari sampel paling baru agar peringatan tidak tertunda. Saat node berganti, buffer dikosongkan supaya pembacaan antarperangkat tidak tercampur. Header menampilkan jumlah sampel aktif (`Rata-rata n/10 sampel`).

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
