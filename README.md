# Open WebUI Mobile Client

Simple mobile chat interface for Open WebUI. Chat with AI models from your phone!

<p float="left">
  <img src="https://github.com/user-attachments/assets/af51a65c-de6a-4be1-909e-6947074efb4f" width=180" />
  <img src="https://github.com/user-attachments/assets/6a7f843b-28f9-470f-ae25-c936a4f921bf" width="180" /> 
  <img src="https://github.com/user-attachments/assets/6d67f710-44d3-4d21-a6b2-c93f963cfe43" width="180" />
</p>

## What You Need
- Computer with Docker installed
- Phone
- Both devices on same WiFi network

## Quick Start (Computer)

1. **Open Terminal** (Command Prompt on Windows)

2. **Clone Repository**:
```bash
git clone https://github.com/your-repo/open-webui-pwa.git
cd open-webui-pwa
```

3. **Find Your Computer's IP**:
```bash
# On Mac/Linux, type:
ifconfig | grep "inet "

# You'll see something like:
# inet 127.0.0.1 ...
# inet 172.20.10.14 ...
# ⚠️ Use the non-127.0.0.1 IP (in this case 172.20.10.14)

# On Windows, type:
ipconfig | findstr "IPv4"

# You'll see something like:
# IPv4 Address. . . . . . . . . . . : 172.20.10.14
# ⚠️ Copy this IP address
```

4. **Set Up Configuration**:
```bash
# Create and edit .env file
echo "OPENWEBUI_URL=http://YOUR_IP:3000" > .env
echo "PWA_PORT=3001" >> .env
echo "NODE_ENV=production" >> .env
echo "CORS_ENABLED=true" >> .env
echo "CORS_ORIGINS=*" >> .env

# Replace YOUR_IP with the IP you found
# Example: OPENWEBUI_URL=http://172.20.10.14:3000
```

5. **Start Servers**:
```bash
# First, start Open WebUI
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main

# Then start PWA client
docker-compose up -d
```

6. **Get API Key**:
- On your computer, open browser
- Go to `http://YOUR_IP:3000` (example: `http://172.20.10.14:3000`)
- Click Settings in menu
- Click Account
- Copy the API key (it looks like `sk-1234...`)
- Send this key to your phone (via message/email)

## Using on Phone

1. **Connect to Same WiFi**:
   - Make sure your phone is connected to same WiFi as computer

2. **Open Chat**:
   - Open browser on phone
   - Type `http://YOUR_IP:3001` (example: `http://172.20.10.14:3001`)
   - Paste API key you sent to your phone
   - Click Connect
   - Select any model from dropdown
   - Start chatting!

## Common Problems

### Can't Open on Phone?
1. Check WiFi:
   - Is phone on same WiFi as computer?
   - Try turning WiFi off and on

2. Check IP:
   ```bash
   # Run on computer again to verify IP hasn't changed
   ifconfig | grep "inet "  # Mac/Linux
   ipconfig | findstr "IPv4"  # Windows
   ```

3. Check Servers:
   ```bash
   # Check if servers are running
   docker ps
   
   # Should see both:
   # - open-webui
   # - open-webui-pwa
   
   # If not, run:
   docker start open-webui
   docker-compose up -d
   ```

### API Key Not Working?
1. Get new key:
   - Go to `http://YOUR_IP:3000`
   - Settings -> Account
   - Generate new key
   - Copy carefully!

### Need to Restart Everything?
```bash
# Stop everything
docker stop open-webui open-webui-pwa
docker rm open-webui open-webui-pwa

# Start again
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main

docker-compose up -d

# Check if running
docker ps
```

### Check Logs if Something's Wrong:
```bash
# Check Open WebUI logs
docker logs open-webui

# Check PWA client logs
docker-compose logs pwa-client
```

## Important Notes
- Keep your API key secret
- This works only on local network
- Both devices must be on same WiFi
- Use real IP address, not localhost
