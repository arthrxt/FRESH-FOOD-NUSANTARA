#!/bin/bash
# ==============================================================================
# FRESH FOOD NUSANTARA (FFN) - BIZNET NEO DEPLOYMENT & PRODUCTION SCRIPT
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
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx postgresql postgresql-contrib

# 2. Pastikan PostgreSQL Aktif
echo "2. Memverifikasi PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Buat database & user ffn jika belum ada
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'ffn_accounting'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE ffn_accounting;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'ffn_postgres_secure2026';" 2>/dev/null || true

# 3. Instal Node.js 20 LTS jika belum ada
if ! command -v node &> /dev/null; then
    echo "3. Memasang Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 4. Instal PM2 untuk Process Management Backend Node.js
if ! command -v pm2 &> /dev/null; then
    echo "4. Memasang PM2 Process Manager..."
    sudo npm install -g pm2
fi

echo "Versi Node: $(node -v)"
echo "Versi NPM: $(npm -v)"

# 5. Instal dependensi dan kompilasi build frontend
echo "5. Instal dependensi & build aplikasi..."
npm install --legacy-peer-deps
npm run build

# 6. Salin build ke direktori web Nginx
echo "6. Menyebarkan build frontend ke /var/www/ffoodnusantara..."
sudo mkdir -p /var/www/ffoodnusantara
sudo cp -r dist/* /var/www/ffoodnusantara/
sudo chown -R www-data:www-data /var/www/ffoodnusantara
sudo chmod -R 755 /var/www/ffoodnusantara

# 7. Jalankan backend server menggunakan PM2
echo "7. Menjalankan core backend server FFN dengan PM2..."
pm2 delete ffn-api 2>/dev/null || true
DATABASE_URL="postgresql://postgres:ffn_postgres_secure2026@127.0.0.1:5432/ffn_accounting" \
pm2 start server.ts --name "ffn-api" --interpreter npx --interpreter-args tsx
pm2 save

# 8. Konfigurasi Nginx Reverse Proxy
echo "8. Memasang konfigurasi Reverse Proxy Nginx..."
sudo tee /etc/nginx/sites-available/ffoodnusantara.site > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ffoodnusantara.site www.ffoodnusantara.site;

    root /var/www/ffoodnusantara;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend Single Page App Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy ke PM2 Backend (Port 3000)
    location /api/ {
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
}
EOF

# Aktifkan site di Nginx
sudo ln -sf /etc/nginx/sites-available/ffoodnusantara.site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 9. Uji konfigurasi & restart Nginx
echo "9. Memeriksa sintaks Nginx dan me-restart service..."
sudo nginx -t
sudo systemctl restart nginx

# 10. Firewall UFW
echo "10. Mengaktifkan firewall port 80, 443, 22..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "=========================================================="
echo " DEPLOYMENT CORE FFN SUKSES!"
echo " Web Frontend: /var/www/ffoodnusantara"
echo " Backend API : Port 3000 (PM2 Process: ffn-api)"
echo " Database    : PostgreSQL ffn_accounting"
echo " Domain live : http://ffoodnusantara.site"
echo "=========================================================="
