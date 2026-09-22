# PANDUAN DEPLOYMENT BIZNET NEO & FORMAT SERVER FFN

Dokumen ini berisi petunjuk lengkap untuk Arthur (Master FFN) dalam mempublikasikan aplikasi **FFN ACCOUNTING** ke server cloud **Biznet Neo** dengan domain resmi **ffoodnusantara.site**.

---

## 1. FORMAT DATA LAMA (CLEAN SLATE SEBELUM LAUNCH)
Jika Anda ingin menghapus seluruh data simulasi/demo lama:
1. Masuk ke aplikasi sebagai **Arthur (Master)**:
   - Username: `arthur`
   - Password: `ffn.arthur.master2026` atau `ffn123`
2. Klik menu **Otoritas Master → Manajemen Pengguna**.
3. Di bagian bawah terdapat panel merah: **"Format Habis Data Transaksi Lama"**.
4. Klik tombol **"Format Habis Data Transaksi"** dan ketik `FORMAT-FFN`.
5. Semua faktur, tagihan tempo, dan mutasi saldo lama akan **dibersihkan total menjadi 0**.
6. Master data penting (4 Rekening Bank Resmi, 6 Rekanan Supplier, 3 Investor, COA, dan Akun Pengguna) **tetap aman**.

---

## 2. DEPLOY OTOMATIS KE SERVER BIZNET NEO (ffoodnusantara.site)

### Langkah A: Akses Terminal VPS Biznet Neo via SSH
Buka terminal di komputer Anda, lalu hubungkan ke IP server Biznet Neo:
```bash
ssh root@IP_SERVER_BIZNET_ANDA
```

### Langkah B: Format Direktori Web Lama di Server
Hapus instalasi lama agar bersih total:
```bash
sudo rm -rf /var/www/ffoodnusantara
sudo mkdir -p /var/www/ffoodnusantara
```

### Langkah C: Upload / Salin Berkas Proyek
Ekspor/unggah berkas kode FFN ke server (misal di folder `/var/www/ffn-app`).

### Langkah D: Jalankan Skrip Deploy Otomatis
Jalankan skrip deployment yang telah kami sediakan:
```bash
bash deploy-biznet.sh
```
Skrip `deploy-biznet.sh` akan otomatis:
1. Menginstal Node.js 20, Nginx, dan Firewall UFW.
2. Membersihkan direktori web server lama di `/var/www/ffoodnusantara`.
3. Membangun (*compile*) aplikasi dengan perintah `npm run build`.
4. Mengonfigurasi virtual host Nginx untuk domain `ffoodnusantara.site` lengkap dengan kompresi Gzip dan *SPA fallback routing*.
5. Me-restart Nginx service.

---

## 3. MENGAKTIFKAN SSL HTTPS GRATIS (LET'S ENCRYPT)
Setelah domain `ffoodnusantara.site` Anda sudah diarahkan (DNS A-Record) ke IP server Biznet Neo, jalankan perintah berikut di terminal server untuk mengaktifkan gembok hijau HTTPS:
```bash
sudo certbot --nginx -d ffoodnusantara.site -d www.ffoodnusantara.site
```
Pilih opsi pengalihan otomatis HTTP ke HTTPS (*Redirect*).

---

## 4. OPSI DEPLOY DENGAN DOCKER (ALTERNATIF)
Jika server Biznet Neo Anda menggunakan Docker:
```bash
# Build image Docker
docker build -t ffn-accounting:latest .

# Jalankan container di Port 80
docker run -d --name ffn-accounting -p 80:80 --restart always ffn-accounting:latest
```
Aplikasi langsung berjalan di `http://ffoodnusantara.site`!
