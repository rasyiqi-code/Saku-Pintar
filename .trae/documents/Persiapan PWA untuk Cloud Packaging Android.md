# Persiapan Generasi File APK

## Strategi: Cloud APK Generation
Kita akan melengkapi syarat teknis agar kode ini bisa dikonversi menjadi file `.apk` menggunakan layanan generator online (PWABuilder), tanpa perlu menginstal software berat di laptop.

## Langkah Implementasi:
### 1. Standarisasi Aset untuk Icon Launcher Android
APK membutuhkan ikon format **PNG** (bukan SVG) agar bisa tampil di menu HP Android.
- [ ] Update `manifest.json` untuk mendaftarkan ikon `192x192.png` dan `512x512.png`.
- [ ] Menambahkan deskripsi `short_name` yang pas untuk label di bawah ikon aplikasi.

### 2. Konfigurasi Layar & Orientasi
- [ ] Mengunci orientasi aplikasi ke `portrait` di manifest agar APK tidak berantakan saat HP dimiringkan.
- [ ] Memastikan `theme_color` sesuai dengan warna status bar Android.

### 3. Eksekusi & Konversi
- [ ] Saya akan memberikan **instruksi spesifik** cara mengubah file `icon.svg` menjadi PNG (karena saya tidak bisa membuat file gambar binary).
- [ ] Memberikan panduan langkah-demi-langkah: Deploy -> Masukkan Link -> **Download .APK**.