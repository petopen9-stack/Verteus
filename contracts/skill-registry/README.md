# Skill Registry Contract

Kontrak NEAR yang menyimpan metadata skill dan mengatur lease serta Dutch auction Verteus.

## Method utama

- `register_skill` — mendaftarkan skill; metadata, rarity, dan success rate input pemilik dibatasi 0–100. Harga harian dihitung deterministik dari 55% success rate + 45% rarity dan dibatasi 0,5–9 NEAR. Membutuhkan storage deposit berdasarkan pertumbuhan byte aktual; surplus dikembalikan.
- `recommended_daily_price(success_rate, rarity_score)` — mengembalikan harga harian yang harus dipakai saat registrasi atau pembaruan skill.
- `update_skill` — pemilik mengubah harga, rarity, endpoint, atau status aktif.
- `quote_lease_cost(skill_id, hours)` — view quote biaya dalam yoctoNEAR. Setiap 24 jam penuh menggunakan `lease_per_day`; jam sisa menggunakan `lease_per_hour`. Jika daily rate tidak diisi, 24 jam dihargai sebagai 24 kali hourly rate.
- `lease_skill(skill_id, hours)` — menerima **deposit tepat sebesar quote**, membuat/menambah masa lease akun, mentransfer bagian provider, fee platform ke owner kontrak, dan menambah usage counter.
- `has_valid_lease(skill_id, account)` — memeriksa status lease menggunakan indeks expiry, bukan scan seluruh riwayat.
- `start_auction`, `buy_auction`, `cancel_auction` — Dutch auction untuk skill rarity ≥80; hanya satu lelang aktif per skill dan penjualan memeriksa ownership saat settlement.
- `get_skill`, `get_skills_by_rarity`, `get_all_skills`, `get_active_auctions`, `get_skills_by_owner`, `skill_count`, `get_auction`, `get_auction_price` — views. Beberapa daftar membatasi hasil hingga 100 item.

Rarity saat ini **self-reported**, bukan verifikasi oracle/attestation. Hanya akun pemilik yang dapat mengubah skill atau memulai/membatalkan lelangnya.

## Build

Perlu Rust toolchain, `cargo-near`, dan target Wasm yang didukung NEAR.

```bash
cd contracts/skill-registry
cargo near build
```

## Deploy baru ke testnet

```bash
near contract deploy <account>.testnet use-file ./target/near/skill_registry.wasm \
  with-init-call new \
  json-args '{"owner":"<account>.testnet","platform_fee_bps":250}' \
  prepaid-gas '100.0 Tgas' \
  attached-deposit '0 NEAR' \
  network-config testnet \
  sign-with-keychain \
  send
```

## Registrasi contoh

Registrasi menerima buffer storage **1 NEAR**. Kontrak mengukur pertumbuhan storage aktual, menyimpan hanya biaya yang dibutuhkan, dan mengembalikan surplus kepada pendaftar. Jika batas ukuran metadata atau harga storage berubah sehingga biaya melampaui buffer, transaksi akan gagal dengan biaya minimum yang dibutuhkan; pengguna dapat mengirim buffer lebih besar.

```bash
near contract call-function as-transaction <contract> register_skill \
  json-args '{
    "name":"Indonesian Legal Clause Extractor",
    "description":"Extracts Indonesian legal clauses",
    "tags":["legal","indonesia","near"],
    "input_schema":"{\"type\":\"object\"}",
    "output_schema":"{\"type\":\"object\"}",
    "pricing":{
      "lease_per_hour":"1000000000000000000000000",
      "lease_per_day":"20000000000000000000000000",
      "buy_out":"0"
    },
    "rarity_score":87,
    "success_rate":92,
    "endpoint":"https://my-agent.example.com/skill"
  }' \
  prepaid-gas '30.0 Tgas' \
  attached-deposit '1 NEAR' \
  network-config testnet \
  sign-with-keychain \
  send
```

## Upgrade dan state

Versi hackathon ini menambahkan indeks lease aktif dan auction aktif pada state kontrak. Karena layout serialized state berubah, **deploy instance baru untuk kode ini**. Upgrade kontrak yang sudah berisi state lama belum kompatibel tanpa migrasi eksplisit dan pengujian backfill. Jangan mengarahkan aplikasi ke kontrak lama seolah-olah kompatibel.
