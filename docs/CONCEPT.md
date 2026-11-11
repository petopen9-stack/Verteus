# Verteus — konsep dan batas implementasi

## Masalah

Provider memiliki kemampuan spesialis, sementara agent lain perlu menemukannya, memahami harga, dan membayar provider tanpa sebuah broker pusat mengontrol seluruh transaksi. Pasar pekerjaan satu kali tidak selalu memodelkan akses berulang ke kemampuan yang sama.

## Unit produk: skill

Kontrak menyimpan skill dengan ID, nama/deskripsi, owner NEAR, tags, skema input/output, pricing, rarity score (0–100), endpoint, usage counter, waktu pembuatan, dan status aktif. Endpoint, nama, deskripsi, tags, dan schema memiliki batas panjang.

Catatan penting: struct konsep ini tidak berarti seluruh kemungkinan field sudah ada. Field `proof`, test-case hash, dan TEE attestation **belum** disediakan kontrak. Rarity score saat ini diisi sendiri oleh owner—bukan reputasi terverifikasi.

## Implementasi sekarang

- Registry dan katalog skill on-chain.
- Lease 1–720 jam; harga total dikutip oleh `quote_lease_cost`; kontrak menerima deposit tepat, membagi pembayaran, memperpanjang expiry, dan memungkinkan view `has_valid_lease`.
- Dutch auction per skill ber-rarity ≥80.
- Web app Next.js dengan koneksi wallet NEAR.
- CLI dan MCP tools untuk baca registry/auction/lease dan menyiapkan parameter transaksi tanpa signing.

## Arah scoring rarity (belum diterapkan)

Rarity terverifikasi kelak bisa mempertimbangkan uniqueness, demand/supply, hasil pengujian yang dapat direproduksi, dan kesulitan domain. Sampai oracle/review independen tersedia, skor tidak boleh ditafsirkan sebagai bukti kualitas atau kelangkaan objektif.

## Arah komposisi (belum diterapkan)

Dalam visi masa depan, agent komposit dapat menggabungkan beberapa skill dan memetakan keluaran satu skill menjadi input skill berikutnya. Repo saat ini tidak memiliki graph/manifest komposisi, orchestrator, settlement bertingkat, maupun runtime yang menerapkan akses lease pada endpoint. MCP registry memungkinkan discover/quote, bukan eksekusi komposisi.

## Arah provider berbayar (belum diterapkan)

Target desain adalah memverifikasi status lease di setiap pemanggilan provider. Contoh provider saat ini hanya mock HTTP lokal; ia tidak memverifikasi account atau masa lease. Tidak boleh digunakan sebagai server publik/produksi.

## Pembayaran dan kebijakan transaksi

Prototype memakai NEAR-native deposit + transfer kontrak dan meminta wallet pengguna menandatangani. NEAR Intents atau escrow lintas chain adalah kemungkinan roadmap, bukan integrasi saat ini. MCP/CLI tidak menerima private key dan tidak mengirim transaksi.

## Posisi pasar

Verteus mengeksplorasi skill berulang yang disewa dan direkam on-chain; perbandingan menyeluruh dengan marketplace lain memerlukan riset produk terpisah. Jangan menggambarkan diferensiasi konseptual seperti composition atau graph sebagai fitur produksi.
