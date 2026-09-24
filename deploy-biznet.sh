#!/bin/bash
# ==============================================================================
# FRESH FOOD NUSANTARA (FFN) - BIZNET NEO DEPLOYMENT SCRIPT (FULL-STACK OS)
# Domain: ffoodnusantara.site
# Target OS: Ubuntu 22.04 / 24.04 LTS on Biznet Neo Cloud
# ==============================================================================

set -e

echo "=========================================================="
echo "  MEMULAI DEPLOYMENT FFN ACCOUNTING (CORE FULL-STACK)     "
echo "  Domain: ffoodnusantara.site                             "
echo "=========================================================="

# 1. Update paket sistem & instal dependensi
echo "1. Memperbarui paket sistem Ubuntu..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx

# 2. Instal Node.js 20 LTS jika belum ada
if ! command -v node &> /dev/null; then
    echo "2. Memasang Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Instal PM2 untuk Process Management Backend Node.js
if ! command -v pm2 &> /dev/null; then
    echo "3. Memasang PM2 Process Manager..."
    sudo npm install -g pm2
fi

echo "Versi Node: $(node -v)"
echo "Versi NPM: $(npm -v)"

# 4. Instal dependensi dan kompilasi build frontend
echo "4. Instal dependensi & build aplikasi..."
npm install
npm run build

# 5. Jalankan backend server menggunakan PM2
echo "5. Menjalankan core backend server FFN dengan PM2..."
pm2 delete ffn-core-server 2>/dev/null || true
pm2 start server.ts --name "ffn-core-server" --interpreter ./node_modules/.bin/tsx -- --port 3000
pm2 save

# 6. Konfigurasi Nginx Reverse Proxy
echo "6. Memasang konfigurasi Reverse Proxy Nginx..."
sudo tee /etc/nginx/sites-available/ffoodnusantara.site > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ffoodnusantara.site www.ffoodnusantara.site;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Reverse proxy ke Core Backend Server FFN (Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Aktifkan site di Nginx
sudo ln -sf /etc/nginx/sites-available/ffoodnusantara.site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 7. Uji konfigurasi & restart Nginx
echo "7. Memeriksa sintaks Nginx dan me-restart service..."
sudo nginx -t
sudo systemctl restart nginx

# 8. Firewall UFW
echo "8. Mengaktifkan firewall port 80, 443, 22..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "=========================================================="
echo " DEPLOYMENT CORE FFN SUKSES!"
echo " Server Node.js & Database tersimpan aktif di PM2."
echo " Domain live: http://ffoodnusantara.site"
echo ""
echo "Untuk mengaktifkan SSL HTTPS gratis (Let's Encrypt), jalankan:"
echo "sudo certbot --nginx -d ffoodnusantara.site -d www.ffoodnusantara.site"
echo "=========================================================="
