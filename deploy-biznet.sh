#!/bin/bash
# ==============================================================================
# FRESH FOOD NUSANTARA (FFN) - BIZNET NEO DEPLOYMENT & SERVER CLEAN SCRIPT
# Domain: ffoodnusantara.site
# Target OS: Ubuntu 22.04 / 24.04 LTS on Biznet Neo Cloud
# ==============================================================================

set -e

echo "=========================================================="
echo "  MEMULAI PROSES DEPLOYMENT FFN ACCOUNTING DI BIZNET NEO  "
echo "  Domain: ffoodnusantara.site                             "
echo "=========================================================="

# 1. Update paket sistem & instal dependensi utama
echo "1. Memperbarui paket sistem Ubuntu..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx

# 2. Instal Node.js 20 LTS jika belum ada
if ! command -v node &> /dev/null; then
    echo "2. Memasang Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "Versi Node: $(node -v)"
echo "Versi NPM: $(npm -v)"

# 3. Format habis direktori web lama di server
echo "3. Menghapus data lama di server (/var/www/ffoodnusantara)..."
sudo rm -rf /var/www/ffoodnusantara
sudo mkdir -p /var/www/ffoodnusantara
sudo chown -R $USER:$USER /var/www/ffoodnusantara

# 4. Build aplikasi untuk produksi
echo "4. Melakukan kompilasi produksi (npm run build)..."
npm install
npm run build

# 5. Salin hasil build ke direktori web publik Nginx
echo "5. Memindahkan berkas 'dist/' ke /var/www/ffoodnusantara..."
cp -r dist/* /var/www/ffoodnusantara/

# 6. Konfigurasi Nginx Web Server untuk ffoodnusantara.site
echo "6. Memasang konfigurasi Nginx..."
sudo tee /etc/nginx/sites-available/ffoodnusantara.site > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ffoodnusantara.site www.ffoodnusantara.site;

    root /var/www/ffoodnusantara;
    index index.html;

    # Gzip Compression untuk performa maksimal
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Single Page Application (SPA) routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache file statis
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Keamanan Header
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Aktifkan site di Nginx
sudo ln -sf /etc/nginx/sites-available/ffoodnusantara.site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Uji konfigurasi & reload Nginx
echo "7. Menguji & Me-reload Nginx..."
sudo nginx -t
sudo systemctl restart nginx

# 8. Konfigurasi Firewall UFW
echo "8. Mengaktifkan Firewall (Port 80, 443, 22)..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "=========================================================="
echo " DEPLOYMENT SELESAI!"
echo " Buka browser Anda: http://ffoodnusantara.site"
echo ""
echo "Untuk mengaktifkan SSL HTTPS gratis (Let's Encrypt), jalankan:"
echo "sudo certbot --nginx -d ffoodnusantara.site -d www.ffoodnusantara.site"
echo "=========================================================="
