# 🌐 UAT Deployment Guide: SRS-Seva

This document provides step-by-step instructions for deploying and running the **SRS-Seva** application for User Acceptance Testing (UAT) and production environments.

---

## Option 1: Local Cloud Tunnel (Recommended & Super Fast)

This method runs the application on your local development machine and exposes it securely to the internet. Because Vite is already configured to proxy `/api` and `/uploads` requests directly to your backend on port 8001, **we only need to tunnel the frontend port (5173)**. Both frontend pages, backend operations, and uploaded inventory images will work flawlessly.

### How to Run:
1. Open your terminal in the `SRS-Seva` directory.
2. Run the script:
   ```bash
   ./start_tunnel.sh
   ```
3. **What the script does**:
   * Detects if `cloudflared` (Cloudflare Tunnel CLI) is installed. If not, it downloads the correct binary into a local `bin/` directory.
   * Verifies if Vite is running on port `5173`. If not, it starts both servers using `./start.sh` automatically in the background.
   * Exposes `http://localhost:5173` to the public internet using a secure `trycloudflare.com` URL.
   * Prints the public UAT URL for you to copy and share immediately with your testers!

---

## Option 2: 24/7 Cloud Deployment (Oracle Cloud "Always Free" VPS)

If you need the application to be online 24/7 even when your local machine is shut down, you can set it up on an **Oracle Cloud Infrastructure (OCI) Always Free Ubuntu Instance**.

### Step 1: Launch your Free Instance on OCI
1. Sign up for an [Oracle Cloud Free Tier account](https://www.oracle.com/cloud/free/).
2. Navigate to **Compute > Instances > Create Instance**.
3. Choose **Ubuntu 22.04 LTS** (or 24.04) as your Operating System Image.
4. Select the shape **VM.Standard.A1.Flex** (Ampere ARM processor, up to 4 OCPUs and 24 GB RAM) or **VM.Standard.E2.1.Micro** (AMD processor, 1 OCPU and 1 GB RAM). Both qualify for the "Always Free" tier.
5. Download your private and public SSH key files.
6. Click **Create** and wait for the instance to be provisioned.

### Step 2: Install System Dependencies
Once your instance is up and running, connect to it via SSH:
```bash
ssh -i /path/to/your-private-key.key ubuntu@<YOUR_VPS_PUBLIC_IP>
```

Update packages and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git python3 python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx lsof curl
```

### Step 3: Clone the Repository & Setup Backend
1. Clone the project repository to the user's home folder:
   ```bash
   git clone https://github.com/mohanakrishna-bg/SRS-Seva.git
   cd SRS-Seva
   ```
2. Navigate to the backend directory and set up a Python virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install backend python packages:
   ```bash
   pip install --upgrade pip
   pip install uvicorn fastapi sqlite3 pydantic requests python-multipart
   # Or run pip install -r requirements.txt if present
   ```
4. Verify sqlite database tables are set up:
   ```bash
   # Schema can be populated via:
   sqlite3 app/seva.db < schema.sql
   ```
5. Deactivate virtual environment:
   ```bash
   deactivate
   ```

### Step 4: Build and Setup Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a production build of the Vite app:
   ```bash
   npm run build
   ```
   This will generate a highly optimized bundle inside the `frontend/dist` directory.
4. Move the built assets to Nginx's web root:
   ```bash
   sudo mkdir -p /var/www/srs-seva
   sudo cp -r dist/* /var/www/srs-seva/
   sudo chown -R www-data:www-data /var/www/srs-seva
   ```

### Step 5: Configure Nginx as a Reverse Proxy
Nginx will serve the compiled static frontend files and proxy API requests directly to the FastAPI backend running on port 8001.

1. Create a new Nginx block configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/srs-seva
   ```
2. Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name _; # Replace with your domain name if you have one

       # Serve Static Frontend Files
       location / {
           root /var/www/srs-seva;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API Proxy
       location /api {
           proxy_pass http://127.0.0.1:8001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Uploads Folder Proxy
       location /uploads {
           proxy_pass http://127.0.0.1:8001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```
3. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/srs-seva /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 6: Keep the Backend Running 24/7 (Systemd)
To ensure the backend runs persistently in the background and restarts if the server crashes or reboots, create a systemd service.

1. Create the service file:
   ```bash
   sudo nano /etc/systemd/system/seva-backend.service
   ```
2. Paste the configuration:
   ```ini
   [Unit]
   Description=Seva FastAPI Backend Service
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/SRS-Seva/backend
   ExecStart=/home/ubuntu/SRS-Seva/backend/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
3. Start and enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable seva-backend
   sudo systemctl start seva-backend
   ```

### Step 7: (Optional) Secure with Free SSL
If you mapped a domain name to your public VPS IP address, you can configure SSL (HTTPS) with a single command:
```bash
sudo certbot --nginx -d your-domain.com
```
Certbot will obtain and configure the Let's Encrypt certificates automatically!

---

### Summary of What Was Done
- **Created a `start_tunnel.sh` script** that automatically pulls down `cloudflared` and sets up a local UAT tunnel to port `5173`.
- **Organized a complete guide** on using local tunnels for immediate UAT, and a comprehensive checklist for production deployment on Oracle Cloud's "Always Free" VPS.