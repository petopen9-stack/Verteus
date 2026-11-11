# Verteus — pitch hackathon

## 30 detik

Verteus adalah marketplace kemampuan AI di NEAR. Agent dapat menemukan skill yang diterbitkan provider, membaca quote lease langsung dari smart contract, lalu menyiapkan pembayaran yang tetap harus disetujui wallet pemilik. Registry dan lease tercatat on-chain; CLI/MCP memungkinkan agent membaca katalog tanpa memegang private key. Ini adalah primitive untuk Agent Economy, bukan klaim bahwa swarm atau eksekusi provider berbayar sudah otomatis.

## 90 detik

**Masalah.** Agent memerlukan kemampuan spesialis dari provider lain, tetapi menemukan layanan, melihat harga yang konsisten, dan membayar penyedia tanpa menyerahkan kontrol ke platform pusat merupakan masalah koordinasi.

**Solusi.** Verteus merepresentasikan skill sebagai aset beralamat di registry NEAR: owner, metadata, endpoint, skema input/output, harga per jam/hari, rarity yang saat ini dilaporkan sendiri oleh provider, dan penghitung penggunaan. Pengguna atau agent dapat menemukan skill lewat web UI, CLI, atau MCP; smart contract menghitung quote lease, menerima deposit tepat, membagi fee, dan mencatat masa akses. Untuk skill rarity ≥80, pemilik juga dapat membuat Dutch auction.

**Kontrol pengguna.** CLI/MCP hanya membaca chain dan menyiapkan parameter transaksi. Tidak ada private key, auto-signing, atau auto-submit. Pemilik menyetujui pembayaran melalui wallet NEAR.

**Mengapa NEAR.** Account dan smart contract NEAR memberi identitas/record pembayaran publik yang dapat dicek agent. Jalur ini sederhana untuk demo testnet dan tidak menuntut layanan server menyimpan dana pengguna.

**Status yang dapat didemokan.** Registry contract (uji host dan build Wasm), frontend Next.js, transaksi wallet, agen CLI/MCP read-only, quote lease, transfer harga lease, lease expiry, dan auction. Provider contoh bersifat lokal/mock; ia belum melakukan inference produksi atau menegakkan akses dengan memverifikasi lease.

## Demo 3 menit — gunakan hanya setelah testnet disiapkan

1. **Masalah:** perlihatkan skill spesialis yang harga dan pemiliknya dapat diverifikasi di chain.
2. **Discover:** buka frontend untuk melihat katalog aktif; sebutkan skor rarity diinput owner dan belum diverifikasi oracle.
3. **Agent path:** jalankan CLI/MCP `search_skills` untuk mendapatkan skill on-chain tanpa kunci.
4. **Quote:** jalankan `prepare_lease`; tunjukkan durasi dan jumlah yoctoNEAR hasil view kontrak.
5. **Consent:** buka web app, sambungkan MyNearWallet, lalu konfirmasi `lease_skill` di wallet testnet.
6. **Verification:** cek `has_valid_lease` dan hitung transaksi pada explorer NEAR.
7. **Close:** jelaskan nilai Agent Economy hari ini dan roadmap terpisah untuk provider berautentikasi, composition, verified reputation, dan settlement lintas layanan.

Jangan mendemokan `call skill endpoint` sebagai hasil lease terjamin: contoh provider belum mengikat request ke identitas/account lessee dan tidak memeriksa lease on-chain. Jangan mengklaim pembayaran melalui NEAR Intents, TEE, atau swarm multi-agent sudah diimplementasikan.
