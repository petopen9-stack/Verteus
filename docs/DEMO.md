# Demo Verteus untuk NEAR HACKATHON

**Track utama:** Agent Economy (`agents`). Ini bukan demo swarm multi-agent. Prototype menggunakan kontrak NEAR sendiri; NEAR Intents tidak diintegrasikan dan bukan syarat wajib untuk submission.

## Pesan satu kalimat

Verteus memberi agent cara menemukan kemampuan spesialis, memperoleh quote sewa on-chain, dan menyiapkan pembayaran NEAR yang tetap memerlukan persetujuan wallet pemilik.

## Urutan demo: lakukan X → lihat Y

1. Jalankan kontrak testnet yang sudah berisi skill demo, lalu buka frontend dengan `NEXT_PUBLIC_CONTRACT_ID` dan `NEXT_PUBLIC_NETWORK=testnet`. **Lihat:** data skill berasal dari kontrak, bukan daftar mock.
2. Hubungkan MyNearWallet. **Lihat:** aplikasi hanya meminta transaksi wallet; private key tidak dikirim ke aplikasi.
3. Jalankan `cd agents && npm install`, lalu `VERTEUS_NETWORK=testnet VERTEUS_CONTRACT_ID=<contract.testnet> npm run cli -- search_skills 80 10`. **Lihat:** CLI membaca skill aktif melalui NEAR RPC.
4. Jalankan `npm run cli -- prepare_lease <skill_id> 24`. **Lihat:** server mengambil `quote_lease_cost` dari kontrak dan mengembalikan jumlah yoctoNEAR tepat serta method/arguments untuk `lease_skill`. Tidak ada transaksi yang ditandatangani/dikirim oleh CLI atau MCP.
5. Minta agent yang terhubung ke MCP menggunakan `search_skills`, `get_skill`, dan `prepare_lease`. **Lihat:** agent dapat membaca katalog dan menyusun permintaan transaksi tanpa memiliki private key.
6. Kembali ke web app dan setujui lease melalui wallet. **Lihat:** lease tersimpan di chain, owner dan platform menerima bagian harga, `usage_count` bertambah, serta tool `has_valid_lease` mengembalikan status lease.
7. Opsional, jalankan contoh provider/consumer lokal. **Lihat:** provider contoh mengembalikan hasil JSON statis untuk input demonstrasi; ini bukan backend produksi dan tidak boleh diekspos ke internet.

### Jalankan MCP

```bash
cd agents
npm install
VERTEUS_NETWORK=testnet VERTEUS_CONTRACT_ID=<contract.testnet> npm run mcp
```

Atur client MCP desktop sesuai contoh di [`agents/README.md`](../agents/README.md). Gunakan deployment testnet milik tim, bukan account default contoh jika kontrak itu tidak ada.

## Pengelolaan kunci dan batas transaksi

Wallet tetap milik pengguna. Web app meminta persetujuan wallet untuk method kontrak. CLI dan MCP hanya membaca state/quote dan menghasilkan informasi transaksi untuk diperiksa manusia. Tidak ada autonomous signing, pemegang kunci server, atau transaksi mainnet otomatis. Periksa network, contract ID, skill ID, durasi, dan deposit sebelum menandatangani.

## Batas yang harus disampaikan secara jujur

- Rarity adalah skor yang dimasukkan pemilik, bukan attestation atau oracle.
- Contoh provider belum memverifikasi lease/pemanggil dan hanya untuk lokal.
- Contoh consumer masih demo; jangan menyebutnya agent komersial end-to-end.
- Belum ada pembayaran NEAR Intents, NEAR AI Cloud/TEE, maupun simulasi swarm.
- Kontrak dengan perubahan layout state harus dideploy sebagai instance baru; state lama tidak dimigrasikan.

## Draf post X — tim yang membangun harus memposting sendiri

> AI agents need specialist skills, but finding a provider and knowing the exact price should not require trusting a central broker. Verteus lets agents discover skills and prepare a lease quote directly from a NEAR contract, while the owner keeps control of the wallet approval. Built for NEAR HACKATHON. Demo: [link] · Code: https://github.com/petopen9-stack/Verteus @NEARProtocol #NEARHackathon

Lampirkan video singkat yang memperlihatkan satu alur lengkap: agent MCP mencari skill → mengambil quote → pemilik menyetujui lease di wallet → lease muncul/terverifikasi on-chain. Jangan unggah draf sebelum video dan repository publik siap.

## Sumber dan referensi

- Panduan hackathon: <https://nearhackathon.com/HACKATHON.md>
- Panduan ekosistem NEAR: <https://nearbuilders.org/build>
- Prompt track Agent Economy: <https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/07-agents.md>
