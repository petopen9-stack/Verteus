# Verteus

**Marketplace kemampuan AI yang dapat disewa agent melalui NEAR.** Verteus membantu agent menemukan layanan spesialis, membaca harga lease yang dihitung kontrak, lalu menyiapkan pembayaran NEAR yang harus disetujui pemilik wallet.

## Masalah dan solusi

Agent sering memerlukan kemampuan yang tidak dimiliki sendiri—misalnya ekstraksi klausul hukum atau analisis risiko—tetapi belum ada jalur sederhana untuk menemukannya, memahami harganya, dan membayar pemilik layanan dengan bukti transaksi on-chain. Verteus memodelkan kemampuan sebagai skill dengan pemilik, metadata, harga, masa lease, dan (untuk skill ber-rarity tinggi) Dutch auction di kontrak NEAR.

Proyek ini berfokus pada track **Agent Economy (`agents`)**. Integrasi nyata saat ini adalah smart contract NEAR, MyNearWallet di web app, serta antarmuka CLI dan MCP read-only untuk agent. Kami **tidak** mengklaim telah mengintegrasikan NEAR Intents, NEAR AI Cloud, verifikasi rarity oracle, atau swarm multi-agent; semuanya berada di luar prototipe ini.

## Fitur

- **Kontrak NEAR:** pendaftaran skill, harga sewa, quote on-chain, lease dengan pembagian biaya, pemeriksaan lease, Dutch auction, dan kontrol ownership.
- **Web app Next.js:** temukan skill, daftar skill, lease dengan persetujuan wallet, lihat auction, dan dashboard pemilik.
- **CLI + MCP stdio:** agent dapat mencari skill, membaca detail, melihat auction, mengecek lease, dan menyiapkan instruksi lease berdasarkan quote kontrak.
- **Contoh provider/consumer:** demonstrasi lokal sederhana untuk keluaran skill terstruktur.

## Cara mencoba

### 1. Jalankan frontend demo

```bash
cd frontend
npm ci
cp .env.example .env.local
# Isi NEXT_PUBLIC_CONTRACT_ID dengan akun kontrak pada jaringan yang sesuai.
npm run dev
```

Tanpa kontrak, halaman Discover menampilkan data contoh. Transaksi lease dan listing memerlukan kontrak yang sudah di-deploy dan wallet NEAR.

### 2. Gunakan CLI atau MCP untuk agent

```bash
cd agents
npm install
VERTEUS_NETWORK=testnet VERTEUS_CONTRACT_ID=<contract.testnet> npm run cli -- search_skills 80 10
VERTEUS_NETWORK=testnet VERTEUS_CONTRACT_ID=<contract.testnet> npm run cli -- prepare_lease 1 24
```

MCP server stdio:

```bash
cd agents
VERTEUS_NETWORK=testnet VERTEUS_CONTRACT_ID=<contract.testnet> npm run mcp
```

MCP menyediakan `search_skills`, `get_skill`, `list_active_auctions`, `get_auction_price`, `has_valid_lease`, dan `prepare_lease`. Contoh konfigurasi Claude Desktop dan Codex, schema tool, serta batas keamanan ada di [`agents/README.md`](agents/README.md). Tools MCP/CLI saat ini **read-only** kecuali quote lease: `prepare_lease` hanya mengembalikan instruksi transaksi; tidak mengakses private key, menandatangani, atau mengirim transaksi. Pengguna harus memeriksa dan menyetujui transaksi melalui wallet sendiri.

### 3. Deploy kontrak demo ke testnet

Persyaratan: Rust/Cargo, `cargo-near`, `near` CLI, akun testnet berisi NEAR. Jangan gunakan akun/kunci mainnet untuk demo.

```bash
chmod +x scripts/*.sh
./scripts/deploy.sh <your-account.testnet>
./scripts/register-demo-skills.sh <contract.testnet> <signer.testnet>
```

Seed script mengirim buffer storage 1 NEAR per skill; kontrak menahan biaya storage aktual dan mengembalikan surplus. Lalu atur `NEXT_PUBLIC_CONTRACT_ID=<contract.testnet>` dan `NEXT_PUBLIC_NETWORK=testnet` di `frontend/.env.local`. Lihat [`contracts/skill-registry/README.md`](contracts/skill-registry/README.md) untuk kontrak. **Perubahan state layout kontrak memerlukan deployment instance baru**; jangan upgrade kontrak lama tanpa strategi migrasi yang telah diuji.

## Demo juri: lakukan X → lihat Y

1. Jalankan frontend dengan `NEXT_PUBLIC_CONTRACT_ID` mengarah ke kontrak testnet berisi demo skill. **Lihat:** skill on-chain terurut berdasarkan rarity.
2. Jalankan `npm run cli -- search_skills 80 10` atau hubungkan MCP ke agent. **Lihat:** agent membaca daftar kemampuan aktif melalui NEAR RPC.
3. Panggil `prepare_lease <skill_id> 24`. **Lihat:** quote yoctoNEAR dari kontrak beserta parameter `lease_skill` yang perlu ditinjau.
4. Buka frontend, hubungkan MyNearWallet, lalu setujui lease. **Lihat:** transaksi tercatat on-chain dan masa lease dapat diperiksa dengan `has_valid_lease`.
5. Opsional: jalankan provider dan consumer lokal sesuai [`agents/README.md`](agents/README.md). Ini hanya mock demonstrasi; jangan mengekspos provider contoh ke publik karena belum mengautentikasi pemanggil berdasarkan lease.

Skrip demo rinci dan draf post X ada di [`docs/DEMO.md`](docs/DEMO.md).

## Pengamanan dan batasan yang diketahui

Private key tetap di wallet pengguna. Frontend meminta wallet menandatangani transaksi; CLI dan MCP tidak memiliki fungsi penandatangan/pengiriman transaksi. Nilai rarity merupakan input pemilik skill (belum diverifikasi oracle). Provider contoh hanya untuk lokal dan saat ini tidak menegakkan lease. Gunakan nilai kecil di testnet serta periksa account kontrak, network, method, arguments, dan deposit sebelum menandatangani.

Rincian temuan yang ditutup, hasil pengujian, dan batas audit ada di [`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md).

Kontrak yang dimodifikasi menambah indeks state untuk lease aktif dan auction. **Deploy instance baru untuk perubahan ini**; migrasi state dari instance lama belum disediakan atau diuji. Integrasi pembayaran cross-chain, AI inference, akses provider berautentikasi, dan worker multi-agent belum termasuk.

## Struktur repository

```text
contracts/skill-registry/   Kontrak registry, leasing, dan auction NEAR
frontend/                   Next.js web app + NEAR Wallet Selector
agents/                     Contoh provider/consumer, CLI, dan MCP server stdio
scripts/                    Deploy dan seed demo testnet
docs/                       Konsep, pitch, hackathon, dan demo
```

Hackathon mengharuskan repository publik dan demo post X publik sebelum **14 November 2026, 23:59 UTC**. Post demo harus menyebut NEAR HACKATHON, menandai `@NEARProtocol` dan `#NEARHackathon`, serta menyertakan video/screenshot. Tim harus mengirim form submission sendiri setelah memeriksa semua data.

Repository dirilis di bawah [MIT License](LICENSE).
