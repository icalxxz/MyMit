# Dokumentasi Proyek MyMit

## 1. Ringkasan

**MyMit** adalah dashboard pemantauan mitigasi bencana yang menyajikan data sensor secara real-time. Aplikasi menggabungkan status utama, aktivitas seismik, ketinggian muka air, serta ringkasan parameter keselamatan dalam satu antarmuka. Dashboard dirancang untuk desktop dan ponsel, dan dapat dikemas sebagai aplikasi Android menggunakan Capacitor.

Dokumen ini dapat digunakan sebagai bahan awal proposal atau laporan. Identitas instansi, lokasi uji, nama sensor final, hasil pengujian lapangan, dan metrik kinerja perlu dilengkapi sesuai pelaksanaan proyek.

## 2. Latar Belakang

Informasi kondisi lingkungan yang tersebar dan terlambat dibaca dapat memperlambat respons terhadap potensi bencana. MyMit menyediakan satu tampilan ringkas untuk memantau pembacaan sensor, melihat apakah kondisi aman, perlu perhatian, atau bahaya, serta menerima peringatan pada perangkat saat kondisi berubah menjadi bahaya.

## 3. Tujuan

- Menampilkan data sensor dan status sistem secara real-time.
- Membantu pengguna mengenali perubahan aktivitas seismik dan muka air.
- Menyediakan indikator keselamatan yang mudah dibaca di ponsel maupun komputer.
- Memberikan peringatan lokal pada perangkat Android ketika aplikasi mendeteksi transisi menuju kondisi bahaya.
- Menyediakan dasar aplikasi yang dapat dikembangkan untuk pemantauan dan mitigasi lebih lanjut.

## 4. Ruang Lingkup dan Batasan

Versi saat ini membaca data dari Firebase Realtime Database pada jalur `sensors/node_01`. Dashboard menampilkan:

- **Status utama** dari master alert lingkungan.
- **Aktivitas seismik darat** dari nilai g-force serta sumbu X, Y, dan Z pada MPU6050.
- **Muka air gabungan** dari JSN-SR04T yang membaca dari atas dan MPU6050 pada pelampung. Kedua bacaan tinggi ditampilkan bersama dengan nilai gabungan.
- **Parameter hujan** dari sensor hujan yang ditampilkan bersama data muka air dan aktivitas seismik di dashboard secara real-time.
- **Parameter keselamatan** untuk status aman, warning, dan bahaya.
- Status koneksi dan waktu sinkronisasi terakhir.

Peringatan lokal dibuat ketika aplikasi sedang berjalan dan data sensor yang diterimanya berubah dari kondisi non-bahaya menjadi bahaya. Implementasi ini **bukan** layanan push yang menjamin pemberitahuan saat aplikasi ditutup, perangkat offline, atau data tidak mencapai Firebase. Peringatan untuk kondisi tersebut memerlukan backend atau Firebase Cloud Messaging, pemrosesan kejadian di server, serta pengujian pengiriman tersendiri. Aplikasi ini juga bukan pengganti sistem alarm bersertifikasi atau prosedur resmi kebencanaan.

## 5. Pengguna dan Manfaat

Pengguna yang dituju meliputi operator pemantauan, petugas lapangan, pengelola lokasi, dan pihak yang memerlukan ringkasan kondisi sensor. Antarmuka responsif memudahkan pemeriksaan melalui komputer maupun ponsel. Indikator status dan notifikasi membantu menarik perhatian pengguna, sedangkan sumber data real-time memudahkan pemantauan perubahan terakhir.

## 6. Arsitektur dan Alur Data

```text
Sensor/perangkat IoT
        │ mengirim pembacaan
        ▼
Firebase Realtime Database
        │ listener real-time: sensors/node_01
        ▼
Dashboard React (web atau Android WebView)
        ├── status utama, seismik, dan muka air
        ├── klasifikasi status aman / warning / bahaya
        └── saat transisi ke bahaya:
              browser Notification API (web)
              atau Capacitor Local Notifications (Android)
```

Frontend menggunakan listener Firebase `onValue`. Aplikasi memperbarui tampilan ketika snapshot baru diterima dan menampilkan status offline atau data kosong ketika diperlukan. Konfigurasi Firebase untuk build Vite diberikan melalui variabel `VITE_FIREBASE_*`.

### Struktur data yang dibaca

Contoh bentuk data konseptual pada `sensors/node_01`:

```json
{
  "masterAlert": { "status": "AMAN", "timestamp": "..." },
  "mpu6050": {
    "status": "AMAN", "gForce": 0.98, "warningThreshold": 1.5,
    "xAxis": 0.01, "yAxis": -0.02, "zAxis": 0.97
  },
  "floatMpu": {
    "status": "AMAN", "gForce": 1.0, "height": 35,
    "xAxis": 0.01, "yAxis": 0.02, "zAxis": 0.98
  },
  "waterLevel": {
    "status": "AMAN", "height": 35, "jsnHeight": 34,
    "deltaRate": 0.2
  },
  "rain": {
    "detected": false, "rate": 0,
    "unit": "mm/jam", "status": "AMAN"
  },
  "deviceInfo": { "deviceId": "node_01", "rssi": -60 }
}
```

Struktur dan satuan di atas merupakan gambaran dari field yang dipakai UI; sesuaikan dengan payload perangkat sebenarnya. Field status dipakai untuk menentukan tone status. Sensor harus mengirim nilai yang konsisten dengan ambang dan aturan klasifikasi yang ditetapkan tim proyek.

MPU6050 pada darat dikirim pada `mpu6050`, sedangkan sensor MPU6050 kedua yang dipasang pada pelampung dikirim pada `floatMpu`. Sensor JSN-SR04T dari atas mengirim `waterLevel.jsnHeight`; tinggi pelampung ada di `floatMpu.height`. UI menampilkan kedua tinggi dan rata-rata sebagai tinggi gabungan ketika keduanya tersedia. Tanpa data `floatMpu.height`, nilai JSN tetap ditampilkan sebagai bacaan sementara. Kenaikan JSN saja tidak membuat status waspada; konfirmasi gerakan dari MPU darat (g-force di atas `warningThreshold` atau status sensor watch/danger) yang menaikkan status menjadi waspada. Sensor hujan mengirim `rain.detected`, `rain.rate`, `rain.unit`, dan `rain.status`. Semua klasifikasi operasional harus divalidasi dan dikirim perangkat atau backend; indikator ini bukan penentu resmi tsunami.

## 7. Teknologi

- **React 19** untuk antarmuka dan komponen dashboard.
- **Vite** untuk server pengembangan dan build web.
- **Firebase Realtime Database** untuk distribusi data sensor.
- **Capacitor 8** dan **Android** untuk membungkus aplikasi web menjadi aplikasi Android.
- **Capacitor Local Notifications** untuk notifikasi lokal Android.
- **CSS responsif** dengan gaya visual neumorfik yang dipertahankan.

## 8. Antarmuka dan Pengalaman Pengguna

Dashboard menggunakan kartu dengan warna status yang konsisten, tata letak grid yang berubah mengikuti ukuran layar, dan ruang aman perangkat (safe area) untuk tampilan Android. Pada layar kecil kartu disusun vertikal, kontrol notifikasi dibuat mudah disentuh, dan konten memperhitungkan area status bar serta navigasi sistem. Tampilan desktop tetap memakai susunan multi-kolom.

## 9. Notifikasi

Pada web, notifikasi memakai Notification API dan memerlukan izin browser. Pada APK, notifikasi memakai plugin native Capacitor Local Notifications dan izin Android diminta setelah pengguna menekan tombol **Aktifkan**. Aplikasi menghindari notifikasi berulang hanya karena render React atau ketika halaman pertama kali dibuka dalam keadaan bahaya; pemicu adalah transisi dari status non-bahaya ke bahaya setelah data awal diterima.

Notifikasi lokal ini hanya dapat bereaksi terhadap data yang sudah diterima oleh aplikasi. Android dapat membatasi aktivitas jaringan latar belakang dan Firebase listener ketika aplikasi tidak aktif. Untuk kebutuhan pemantauan kritis, rancangan lanjutan sebaiknya menggunakan pemicu server dan push notification, dengan uji keterlambatan, konektivitas, penghematan baterai, izin, dan perilaku perangkat.

## 10. Keamanan Konfigurasi dan Data

### Apakah `.env` aman ketika dibuat APK?

**Nilai `.env` tidak menjadi rahasia hanya karena disimpan dalam file `.env`.** Pada proyek Vite ini, semua variabel dengan awalan `VITE_` disisipkan ke JavaScript saat build, kemudian file JavaScript itu dimasukkan ke APK. Siapa pun yang memperoleh APK dapat mengekstrak dan membaca konfigurasi tersebut. Karena itu, jangan pernah menaruh password, private key, token admin, atau kredensial server di variabel `VITE_*`.

Konfigurasi Firebase Web seperti `apiKey`, `projectId`, `appId`, dan `databaseURL` lazimnya merupakan identifier konfigurasi klien, bukan otorisasi untuk membaca atau menulis data dengan sendirinya. Meski demikian, konfigurasi tersebut tetap dapat disalin dan dipakai untuk mencoba mengakses proyek. Keamanan data harus ditegakkan di Firebase, bukan dengan menyembunyikan file konfigurasi.

Langkah yang disarankan sebelum distribusi:

1. Terapkan **Firebase Realtime Database Security Rules** dengan akses minimum. Untuk dashboard yang hanya membaca, batasi path `sensors/node_01` menjadi read-only bagi pengguna yang berwenang. Jangan gunakan rule publik seperti `.read: true` atau `.write: true` untuk data produksi.
2. Jika data harus privat, gunakan Firebase Authentication dan rules yang memeriksa identitas/role. Jangan mengandalkan nama node yang sulit ditebak sebagai satu-satunya perlindungan.
3. Amankan kredensial perangkat pengirim di sisi perangkat/server dan pisahkan hak tulis perangkat dari hak baca dashboard bila memungkinkan.
4. Batasi penggunaan API key Firebase melalui pengaturan yang sesuai dan pantau kuota serta aktivitas proyek. Pembatasan key membantu mengurangi penyalahgunaan, tetapi tidak menggantikan rules.
5. Jangan commit `.env` atau memasukkan secret ke repository, APK, atau log. `.gitignore` proyek mengecualikan `.env`; `.env.example` hanya untuk dokumentasi variabel dan bukan tempat menyimpan secret.
6. Saat ini `useSensorData` hanya memasang listener baca. Namun siapa pun yang dapat membuat klien Firebase tetap harus ditolak oleh rules jika tidak memiliki hak yang tepat.

**Kesimpulan keamanan:** konfigurasi Firebase Web yang sekarang akan terlihat di APK dan harus diperlakukan sebagai informasi publik. APK dapat tetap aman untuk membaca data apabila Firebase Rules, autentikasi, dan hak akses dikonfigurasi dengan benar. Keamanan aktual belum dapat dipastikan hanya dari source code; rules pada Firebase Console dan konfigurasi autentikasi perlu diaudit terpisah.

## 11. Menjalankan Proyek

### Prasyarat

- Node.js 22 atau lebih baru untuk Capacitor CLI yang digunakan.
- npm.
- Android Studio, Android SDK, dan JDK 21 untuk build Android.
- Proyek Firebase dengan Realtime Database dan rules yang sesuai.

### Menyiapkan web

1. Instal dependency: `npm ci`.
2. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi Firebase yang sesuai.
3. Jalankan pengembangan: `npm run dev`.
4. Periksa kualitas dan build: `npm run lint` lalu `npm run build`.

### Menyiapkan Android

1. Pastikan Android Studio, SDK, dan JDK tersedia.
2. Jalankan `npm run cap:sync` untuk build web dan menyalin aset/plugin ke proyek Android.
3. Buka proyek native menggunakan `npm run cap:open`, kemudian build APK dari Android Studio; atau jalankan `npm run android:run` dengan emulator/perangkat yang siap.
4. Setelah perubahan web atau plugin, ulangi `npm run cap:sync` sebelum membuat APK baru.

Identitas native saat ini menggunakan application ID `id.mymit.dashboard`. Ganti ID tersebut sebelum rilis jika diperlukan dan pastikan konsisten dengan kebijakan paket distribusi.

## 12. Pemeriksaan yang Telah Dilakukan

Pada workspace proyek, pemeriksaan berikut berhasil:

- `npm run lint`
- `npm run build`
- `npm run cap:sync` — aset web tersalin dan Capacitor menemukan plugin `@capacitor/local-notifications`.

Build dan uji APK pada perangkat Android fisik belum tercatat dalam dokumentasi ini. Sebelum laporan akhir atau rilis, lakukan uji izin notifikasi pada versi Android sasaran, kondisi sensor aman ke bahaya, koneksi terputus/tersambung, ukuran layar, serta aturan akses Firebase.

## 13. Risiko dan Pengembangan Lanjutan

- **Notifikasi saat aplikasi tertutup:** tambahkan backend event dan push notification agar tidak bergantung pada listener foreground.
- **Keamanan data:** verifikasi rules produksi, autentikasi pengguna, dan kredensial perangkat.
- **Keandalan sensor:** dokumentasikan kalibrasi, ambang status, satuan, serta pemeriksaan sensor gagal.
- **Keandalan jaringan:** uji kehilangan koneksi, data terlambat, timestamp, dan pemulihan koneksi.
- **Kesiapan operasional:** tambahkan prosedur respons, pemilik sistem, monitoring backend, backup, dan rencana pemeliharaan.
- **Validasi lapangan:** bandingkan pembacaan dengan instrumen rujukan dan skenario yang disetujui pihak berwenang.

## 14. Isian untuk Proposal atau Laporan

Lengkapi bagian berikut dengan data faktual proyek:

- Nama tim/instansi: **[isi]**
- Lokasi penerapan: **[isi]**
- Perangkat keras dan mikrokontroler: **[isi]**
- Ambang aman, warning, dan bahaya: **[isi berdasarkan validasi]**
- Sumber daya dan metode pengiriman data sensor: **[isi]**
- Hasil uji fungsional dan uji lapangan: **[isi hasil]**
- Pengguna dan pihak penanggung jawab: **[isi]**
- Rencana pemeliharaan dan respons insiden: **[isi]**

