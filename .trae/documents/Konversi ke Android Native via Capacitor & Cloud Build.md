# Konversi ke Capacitor (Build Cloud via GitHub Actions)

## Alasan Strategi
Menggunakan Gradle via terminal lokal di Windows membutuhkan setup environment variable (`JAVA_HOME`, `ANDROID_HOME`) dan download SDK bergiga-byte yang rentan error. Jalur **GitHub Actions** adalah cara "Gradle via Terminal" tapi menggunakan terminal milik GitHub yang sudah terkonfigurasi sempurna.

## Langkah Implementasi:
### 1. Instalasi Capacitor Core
Menyiapkan proyek web agar memiliki kemampuan native.
- [ ] Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`.
- [ ] Inisialisasi konfigurasi Capacitor (`capacitor.config.ts`).
- [ ] Menambahkan platform android (`npx cap add android`).

### 2. Konfigurasi Aset Native
Agar APK tidak memakai ikon default Capacitor.
- [ ] Menggunakan `@capacitor/assets` untuk generate ikon launcher Android dari `icons/icon.svg` yang sudah kita buat sebelumnya.

### 3. Otomatisasi Build (GitHub Action)
Membuat instruksi agar GitHub menjalankan Gradle untuk kita.
- [ ] Membuat file `.github/workflows/android-build.yml`.
- [ ] Isi workflow:
    - Install Dependencies (pnpm).
    - Build Web (`pnpm build`).
    - Sync Capacitor (`npx cap sync`).
    - **Run Gradle Build** (membuat APK debug).
    - Upload Artifact (menyimpan APK agar bisa didownload).

### 4. Instruksi Penggunaan
- [ ] Panduan cara push ke GitHub dan cara download APK dari tab "Actions".