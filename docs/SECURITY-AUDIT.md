# Audit keamanan Verteus — pembaruan setelah remediasi

**Repository:** `petopen9-stack/Verteus`
**Baseline yang diaudit:** commit `dc1925e` pada branch `main` (10 Nov 2026).
**Pembaruan:** 11 Nov 2026.
**Cakupan:** kontrak NEAR, frontend, provider/consumer demo, CLI/MCP, dependency, konfigurasi, dokumentasi, deployment scripts.
**Tipe:** code review statis + build/test lokal; bukan audit keamanan formal atau pemeriksaan kontrak live.

## Ringkasan

Semua temuan High yang ditemukan pada baseline telah ditangani pada patch ini atau diubah menjadi batasan demo yang eksplisit. Kontrak kini membatasi auction per skill, memeriksa owner saat settlement, mengunci pembayaran exact, menghitung lease quote di chain, menyimpan expiry per lessee, mengukur deposit storage, dan mengembalikan storage buffer surplus. Frontend gagal-aman jika quote tak tersedia. Provider demo hanya mengikat ke loopback secara default dan membatasi payload, tetapi tetap **tidak mengautentikasi lease**.

Dependency audit akhir: **0 critical, 0 high, 0 moderate, 15 low** menurut npm audit saat pemeriksaan. Jumlah advisory dapat berubah seiring registry npm.

## Temuan baseline dan status remediasi

| Temuan | Dampak baseline | Status dan remediasi |
|---|---|---|
| Auction stale/ganda dan settlement tanpa validasi seller | Skill berpotensi dijual lebih dari sekali atau ownership ditimpa | **Diperbaiki:** satu auction aktif terindeks per skill; purchase memverifikasi owner tetap seller; indeks dibersihkan saat settlement/cancel. |
| Deposit berlebih / harga lease tidak konsisten | pembayaran berbeda dari quote; overpayment dapat terkunci | **Diperbaiki:** view `quote_lease_cost`, deposit exact, formula harian/jam konsisten, extension expiry, distribusi fee, frontend hanya memakai quote on-chain. |
| Potensi overflow harga auction/fee | auction atau transaksi dapat panic pada harga besar | **Diperbaiki:** interpolasi mul-div overflow-safe dan fee basis-points dihitung tanpa mengalikan nominal penuh. |
| Histori lease tak terbatas dalam lookup | lookup lease makin lambat dan storage tumbuh untuk setiap sewa | **Diperbaiki:** indeks expiry per `(skill_id, account)`; tidak menyimpan Vector history yang tidak digunakan; sewa baru memperpanjang expiry aktif. |
| Metadata tak dibatasi dan tanpa kontribusi storage | spam metadata bisa menghabiskan saldo storage kontrak | **Diperbaiki:** batas panjang/jumlah metadata dan payable storage deposit berdasarkan delta byte aktual; surplus dikembalikan. UI/script memakai buffer 1 NEAR. |
| Demo provider tanpa auth/batas input | endpoint bisa dipakai tanpa lease; body besar bisa menghabiskan memori | **Dimitigasi untuk demo lokal:** default bind `127.0.0.1`, batas body 1 MB dan text 100.000 karakter, validasi input. **Belum layak dipublikasi:** lease/auth tetap belum ditegakkan. |
| Dependency Next/PostCSS rentan dan lockfile tidak ada | versi lama/advisory dan instalasi tidak reproducible | **Diperbaiki:** Next.js 15.5.29, PostCSS 8.5.32 override, lockfile frontend + CLI/MCP, npm audit akhir tanpa moderate/high/critical. |
| Presisi harga frontend / validasi nominal | float dapat menampilkan harga yang keliru; parser menerima format tak sah | **Diperbaiki:** parsing/format fixed-point berbasis integer/BigInt, validasi desimal maks. 24 digit, smoke test nominal 1 yoctoNEAR. |
| Klaim produk melebihi implementasi | dokumen mempresentasikan TEE, Intents, swarm, composition sebagai fitur siap | **Diperbaiki:** README/pitch/hackathon memisahkan fitur yang ada dari roadmap; seed demo memakai nama dan URL placeholder yang jujur. |
| `limit=0` / response listing terlalu besar | hasil tak sesuai limit dan response berlebih | **Diperbaiki:** limit nol kosong, respons daftar dibatasi 100, pagination aman terhadap cast input besar. `get_skills_by_owner` lama tetap tanpa pagination. |

## Pengujian yang lulus

- `npm run build` pada `frontend` — production build Next.js 15.5.29 sukses untuk seluruh route.
- `npm audit --json` pada `frontend` — 15 low, 0 moderate, 0 high, 0 critical.
- `npm run typecheck` pada `agents` — sukses.
- MCP stdio smoke test — initialize, `tools/list`, `ping`, dan penanganan input invalid sukses; tool lease hanya menyiapkan quote/instruksi, tidak menandatangani atau mengirim transaksi.
- Provider lokal — `/health`, request sah, input salah, serta payload di atas batas diuji; body berlebih ditolak HTTP 413.
- Fixed-point amount smoke test — round-trip unit terkecil, format 1 NEAR, dan reject nilai negatif/eksponen/kelebihan presisi.
- `cargo test` — 6 lulus, 0 gagal; mencakup formula lease, batas jam, fee pada `u128::MAX`, storage deposit diterima, dan deposit nol ditolak.
- `cargo build --target wasm32-unknown-unknown --release` — sukses.
- `git diff --check` — sukses.

## Risiko residual / batas cakupan

1. **Provider production belum ada.** Endpoint publik tetap tak aman untuk layanan berbayar karena account lessee dan `has_valid_lease` belum diverifikasi per request. Provider contoh default hanya loopback, jangan pindah ke host publik.
2. **Rarity self-reported.** Owner mengatur skor rarity; belum ada oracle, attestasi, atau reputation independen.
3. **Tidak ada execution/composition runtime.** MCP membaca katalog dan menyusun transaksi lease; ia belum menjalankan provider atau mengorkestrasi skills.
4. **Buy-out belum diterapkan sebagai transaksi.** Field `buy_out` tersimpan sebagai metadata, tetapi tidak ada method pembelian buy-out.
5. **State migration belum tersedia.** Penambahan/penghapusan field contract state tidak kompatibel dengan instance lama. Deploy instance baru; jangan upgrade kode ke akun berstate lama tanpa migrasi yang diuji.
6. `get_skills_by_owner` masih mengembalikan seluruh skill pemilik tanpa pagination; wallet/provider transfer promise juga belum memiliki mekanisme recovery khusus jika payout/refund gagal.
7. Belum dilakukan deploy ke testnet, transaksi browser langsung, fuzzing/property testing, review bytecode, pentest, pengukuran gas, CI, atau audit formal pihak ketiga. Tes unit kontrak saat ini tidak mencakup seluruh perilaku auction/storage/promise.

## Keputusan operasional sebelum submission

Repository dan kontrak belum dipublikasikan/deploy oleh pekerjaan ini. Pemilik perlu membuat akun testnet baru untuk kontrak dengan state layout baru, mengisi `.env.local`, menjalankan seed script, merekam demo X publik, memeriksa explorer serta akun payout, dan mengirim form submission sendiri. Tidak ada transaksi atau post eksternal yang dilakukan selama audit.
