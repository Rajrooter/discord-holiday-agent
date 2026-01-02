# 📥 Installation Guide

Complete step-by-step installation guide for Discord Holiday AI Agent.

---

## 📋 Table of Contents

1. [System Requirements](#-system-requirements)
2. [Pre-Installation Setup](#-pre-installation-setup)
3. [Installation Steps](#-installation-steps)
4. [Configuration](#-configuration)
5. [First Run](#-first-run)
6. [Verification](#-verification)
7. [Common Issues](#-common-issues)

---

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14+, Linux (Ubuntu 18.04+)
- **Node.js**: 14.0.0 or higher
- **RAM**: 512 MB
- **Disk Space**: 100 MB
- **Network**: Internet connection required

### Recommended Requirements
- **OS**: Latest stable version
- **Node.js**: 18.0.0 or higher
- **RAM**: 1 GB
- **Disk Space**: 500 MB
- **Network**: Stable broadband connection

### Software Dependencies
- Git (for cloning repository)
- Text editor (VS Code, Sublime Text, etc.)
- Modern web browser (Chrome, Firefox, Edge)

---

## 🔧 Pre-Installation Setup

### Step 1: Install Node.js

#### Windows
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer (.msi file)
3. Follow the installation wizard
4. Restart your computer
5. Verify installation:
```cmd
node --version
npm --version
```

#### macOS
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
# Verify
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 2: Install Git

#### Windows
1. Download from [git-scm.com](https://git-scm.com/)
2. Run installer
3. Use default settings
4. Verify: `git --version`

#### macOS
```bash
# Using Homebrew
brew install git

# Verify
git --version
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install git

# Verify
git --version
```

### Step 3: Get Discord Webhook URL

1. **Open Discord** and navigate to your server
2. **Server Settings** → Click gear icon next to server name
3. **Integrations** → Select from left sidebar
4. **Webhooks** → Click "Webhooks" or "View Webhooks"
5. **Create Webhook**:
   - Click "New Webhook" or "Create Webhook"
   - Name: `Holiday Bot` (or any name)
   - Channel: Select your announcement channel
   - Copy Webhook URL (important!)
6. **Save Changes**

Example Webhook URL:
```
https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890
```

**Important**: Keep this URL secret! Anyone with it can post to your channel.

**Optional**: Create additional webhooks for different channels:
- Announcements channel
- Updates channel
- Holiday celebrations channel
- General channel

### Step 4: Get Google AI API Key

1. **Visit** [Google AI Studio](https://aistudio.google.com/)
2. **Sign in** with your Google account
3. **Get API Key**:
   - Click "Get API key" button
   - Or click your profile → "Get API key"
4. **Create new key**:
   - Click "Create API key"
   - Select or create a project
   - Copy the API key
5. **Save the key** securely

Example API key:
```
AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567
```

**Note**: Free tier limits:
- 60 requests per minute
- Keep track of your usage

---

## 🚀 Installation Steps

### Step 1: Clone Repository

#### Option A: Using Git (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/discord-holiday-agent.git

# Navigate to directory
cd discord-holiday-agent
```

#### Option B: Download ZIP
1. Go to repository page
2. Click green "Code" button
3. Select "Download ZIP"
4. Extract to desired location
5. Open terminal in that directory

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# This installs:
# - axios (HTTP requests)
# - node-cron (Scheduling)
# - dotenv (Environment variables)
# - express (Web server)
# - cors (Cross-origin support)
```

**Expected Output:**
```
added 50 packages, and audited 51 packages in 3s
found 0 vulnerabilities
```

### Step 3: Create Directory Structure

```bash
# Create public directory for dashboard
mkdir -p public

# Verify structure
ls -la
```

**Expected structure:**
```
discord-holiday-agent/
├── agent.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── public/
    └── dashboard.html
```

### Step 4: Move Dashboard File

```bash
# If dashboard.html is in root, move it
mv dashboard.html public/

# Or if you're creating from scratch, place it in public/
```

---

## ⚙️ Configuration

### Step 1: Create Environment File

```bash
# Copy example file
cp .env.example .env

# Or create new file
touch .env
```

### Step 2: Edit Environment Variables

Open `.env` in your text editor and configure:

```env
# ============================================
# DISCORD WEBHOOK URLS
# ============================================
# Get these from: Discord Server → Channel Settings → Integrations → Webhooks

# Required: Main announcements channel
WEBHOOK_ANNOUNCEMENTS="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"

# Optional: Additional channels
WEBHOOK_UPDATES="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"
WEBHOOK_HOLIDAYS="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"
WEBHOOK_GENERAL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"

# ============================================
# GOOGLE GEMINI AI API KEY
# ============================================
# Get from: https://aistudio.google.com/
GOOGLE_AI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ============================================
# OPTIONAL SETTINGS
# ============================================
# Dashboard port (default: 3000)
# PORT=3000

# Timezone (default: Asia/Kolkata)
# TIMEZONE=America/New_York

# Test mode (true/false)
# TEST_MODE=false
```

**Important**: Replace `YOUR_WEBHOOK_ID`, `YOUR_TOKEN`, and the API key with your actual values!

### Step 3: Configure Custom Roles (Optional)

Edit `agent.js` to add your server's roles:

```javascript
// Find this section in agent.js (around line 65)
const ROLES = {
  'everyone': '@everyone',
  'Server Manager': '<@&YOUR_ROLE_ID>',
  'Moderators': '<@&YOUR_ROLE_ID>',
  'VIP Members': '<@&YOUR_ROLE_ID>',
  'Members': '<@&YOUR_ROLE_ID>'
};
```

**How to get Role IDs:**

1. Enable Developer Mode:
   - Discord Settings → Advanced → Developer Mode → ON
2. Go to Server Settings → Roles
3. Right-click on role → Copy ID
4. Format as `<@&ROLE_ID>`

Example:
```javascript
'Moderators': '<@&123456789012345678>'
```

### Step 4: Verify Configuration

```bash
# Check if .env file exists
ls -la .env

# View contents (careful not to share!)
cat .env

# Verify no syntax errors in agent.js
node -c agent.js
```

---

## 🎬 First Run

### Step 1: Start the Agent

```bash
# Start in normal mode
npm start

# Or use node directly
node agent.js
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🤖 ENHANCED DISCORD HOLIDAY AI AGENT 🤖                  ║
║                                                              ║
║  Features: Holiday Automation + Custom Announcements        ║
║  Powered by: Google Gemini + Calendar-Bharat                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

[2025-01-02T...] [SUCCESS] Configuration validated successfully
[2025-01-02T...] [SUCCESS] Dashboard: http://localhost:3000
[2025-01-02T...] [SUCCESS] 🌐 Dashboard: http://localhost:3000
[2025-01-02T...] [INFO] ✅ Agent running in PRODUCTION mode
[2025-01-02T...] [INFO] Scheduled: Midnight daily holiday checks
```

### Step 2: Access Dashboard

1. Open web browser
2. Navigate to: `http://localhost:3000`
3. You should see the dashboard

**If dashboard doesn't load:**
- Check bot is still running
- Verify port 3000 isn't in use
- Check firewall settings
- Try `http://127.0.0.1:3000`

### Step 3: Test Functionality

#### Test 1: Check Status
- Dashboard should show "● Running" badge
- Stats should display (0 announcements initially)

#### Test 2: View Holidays
- Click "Overview" tab
- Check "Today's Holiday" section
- Scroll to "Upcoming Holidays"

#### Test 3: Send Test Announcement
1. Click "Custom Announcements" tab
2. Enter test message: "This is a test announcement"
3. Leave "No, use as-is" selected (no AI)
4. Keep @everyone selected
5. Select your webhook channel
6. Click "Send Announcement"
7. Check your Discord channel for the message

#### Test 4: Check Logs
1. Click "Activity Logs" tab
2. You should see recent activity
3. Look for any ERROR entries (red)

---

## ✅ Verification

### Checklist

- [ ] Bot starts without errors
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Status shows "Running"
- [ ] Holidays load in Overview tab
- [ ] Test announcement sent successfully
- [ ] Test announcement appears in Discord
- [ ] Logs show activity
- [ ] No ERROR messages in terminal
- [ ] Webhook URL is correct
- [ ] API key is valid

### Verification Commands

```bash
# Check if bot is running
ps aux | grep node

# Check if port 3000 is listening
lsof -i :3000        # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test from curl"}'

# Check Node.js version
node --version

# Check npm packages
npm list --depth=0
```

---

## 🔧 Common Issues

### Issue 1: "Cannot find module 'dotenv'"

**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

### Issue 2: "EADDRINUSE: port 3000 already in use"

**Problem**: Another service using port 3000

**Solutions**:

Option A - Kill existing process:
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

Option B - Use different port:
Edit `agent.js`:
```javascript
DASHBOARD_PORT: 3001,  // Change to 3001
```

 Issue 3: "Configuration errors: WEBHOOK_ANNOUNCEMENTS is not set"

Problem: Environment variables not loaded

Solutions:
1. Check `.env` file exists
2. Verify variable names match exactly
3. No spaces around `=`
4. Webhook URLs in quotes
5. Restart bot after changing `.env`

 Issue 4: "Request failed with status code 404"

Problem: Invalid webhook URL
Solutions:
1. Verify webhook URL is complete
2. Check webhook still exists in Discord
3. Regenerate webhook if needed
4. Test with curl command

 Issue 5: "Request failed with status code 429"

Problem: Google AI API rate limit

Solutions:
1. Wait 1 minute
2. Don't use AI enhancement temporarily
3. Check quota in Google AI Studio
4. Upgrade to paid tier if needed

 Issue 6: Dashboard shows blank page

Problem: dashboard.html not found

Solutions:
1. Verify `public/dashboard.html` exists
2. Check file path is correct
3. Look for syntax errors in HTML
4. Check browser console (F12) for errors

 Issue 7: "ENOENT: no such file or directory, open '.env'"

Problem: `.env` file missing

Solution:
```bash
 Create .env file
touch .env

 Add your configuration
 See Configuration section above
```

---

 🔄 Next Steps

After successful installation:

1. Read the User Guide (`USER_GUIDE.md`)
2. Configure custom roles for your server
3. Set up multiple webhooks for different channels
4. Test scheduling feature
5. Enable AI enhancement once comfortable
6. Set up automatic startup (optional):

### Auto-start on Linux/macOS

Create systemd service:
```bash
sudo nano /etc/systemd/system/discord-bot.service
```

Add:
```ini
[Unit]
Description=Discord Holiday AI Agent
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/discord-holiday-agent
ExecStart=/usr/bin/node agent.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
```

### Auto-start on Windows

1. Create `start-bot.bat`:
```batch
@echo off
cd C:\path\to\discord-holiday-agent
node agent.js
```

2. Add to Windows Startup folder:
   - Press `Win+R`
   - Type `shell:startup`
   - Copy `start-bot.bat` there

---

 📞 Support

If you encounter issues:

1. Check Troubleshooting section in README.md
2. Review logs** in Activity Logs tab
3. Search existing issues on GitHub
4. Create new issue with:
   - Error message
   - Steps to reproduce
   - System information
   - Logs (remove sensitive data!)

---

 ✅ Installation Complete!

Your Discord Holiday AI Agent is now ready to use. Enjoy automated holiday announcements and custom notifications!

Next: Read [USER_GUIDE.md](USER_GUIDE.md) for detailed usage instructions.
