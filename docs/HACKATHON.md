# Verteus × NEAR HACKATHON

## Track

**Primary: Agent Economy.** Produk memusatkan proses penemuan, quoting, dan lease berbayar skill antar akun/agent melalui kontrak NEAR, dengan persetujuan wallet pengguna.

Tidak mengklaim track AI Swarms: belum ada coordinator atau eksekusi multi-agent yang terukur.

## Pitch satu kalimat

Verteus memberi agent cara menemukan kemampuan spesialis, memperoleh quote lease dari smart contract NEAR, dan menyiapkan pembayaran yang tetap disetujui pemilik wallet.

## Checklist submission

- [x] Repository publik dan berisi instruksi menjalankan frontend, kontrak, dan agent tools.
- [ ] Demo post X publik dengan video/screenshot; sebut NEAR HACKATHON, tag `@NEARProtocol`, dan `#NEARHackathon`.
- [ ] Kontrak testnet dan akun demo dapat diakses serta saldo gas cukup.
- [ ] Form submission diisi sendiri oleh tim, termasuk informasi akun NEAR yang diminta penyelenggara.
- [x] Lisensi repository ditetapkan oleh pemilik: MIT (`LICENSE`).

Batas posting yang dicantumkan panduan resmi: **14 November 2026, 23:59 UTC**. Periksa kembali panduan dan form sebelum mengirim.

## Demo script: lakukan X → lihat Y

1. Jalankan web app pada kontrak testnet baru yang berisi skill contoh → katalog dan pemilik berasal dari chain.
2. Sambungkan MyNearWallet → transaksi meminta persetujuan pengguna.
3. Gunakan CLI atau MCP `search_skills` → agent menemukan skill melalui NEAR RPC read-only.
4. Gunakan `prepare_lease(skill_id, hours)` → jumlah yoctoNEAR dikutip oleh kontrak dan ditampilkan bersama parameter transaksi; agent tidak menandatangani.
5. Setujui lease di wallet web → contract memeriksa deposit tepat, mencatat expiry, serta mengirim pembayaran ke owner/platform.
6. Gunakan `has_valid_lease(skill_id, account)` → baca status lease yang tersimpan.
7. Tunjukkan auction secara opsional, jika ada lelang testnet aktif.

Jangan melanjutkan klaim provider/consumer end-to-end: provider saat ini hanya mock lokal dan tidak mengautentikasi lease request. Jangan menampilkan rarity sebagai verifikasi independen.

## Yang siap vs roadmap

**Ada di prototipe:** contract registry, lease, fee split, lease quote/expiry, auction Dutch, UI Discover/List/Auctions/Dashboard, CLI/MCP read-only, dan wallet consent.

**Belum ada:** skill execution yang gate-nya diverifikasi on-chain, pembayaran NEAR Intents, TEE/AI Cloud, oracle rarity, buy-out execution, composition runtime, swarm orchestration, deployment testnet publik yang dikelola proyek.

## Referensi

- Checklist dan aturan resmi: <https://nearhackathon.com/HACKATHON.md>
- Panduan NEAR Builders: <https://nearbuilders.org/build>
- Track Agent Economy: <https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/07-agents.md>
