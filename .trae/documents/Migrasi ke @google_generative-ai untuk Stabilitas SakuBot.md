# Migrasi ke @google/generative-ai (Client-SDK)

## Alasan Tidak Pakai Genkit
Genkit adalah framework backend (Node.js). Karena Saku Pintar adalah aplikasi Client-Side (React+Vite) yang dibungkus Capacitor tanpa backend server sendiri, kita butuh SDK yang bisa jalan langsung di browser/HP. `@google/generative-ai` adalah SDK resmi Google untuk tujuan ini.

## Langkah Implementasi:
1.  **Ganti Dependensi**:
    -   Hapus `@google/genai` (SDK server-side eksperimental yang bermasalah).
    -   Install `@google/generative-ai` (SDK client-side stabil).

2.  **Rewrite `services/geminiService.ts`**:
    -   Inisialisasi `GoogleGenerativeAI` client.
    -   Sesuaikan format `tools` (function declarations) ke format standar.
    -   Perbaiki `sendMessage` agar menerima string biasa (anti-ribet).
    -   Pastikan model tetap `gemini-2.5-flash-lite` (atau fallback ke `gemini-2.0-flash` jika 2.5 belum ada di SDK stabil).

3.  **Tujuan Akhir**:
    -   Menghilangkan error `ContentUnion is required`.
    -   SakuBot bisa chat lancar di Web dan APK.