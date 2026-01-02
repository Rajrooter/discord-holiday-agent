# 📖 User Guide

Comprehensive guide for using Discord Holiday AI Agent.

---

## 📑 Table of Contents

1. [Getting Started](#-getting-started)
2. [Dashboard Overview](#-dashboard-overview)
3. [Holiday Automation](#-holiday-automation)
4. [Custom Announcements](#-custom-announcements)
5. [Scheduling](#-scheduling)
6. [AI Features](#-ai-features)
7. [Advanced Usage](#-advanced-usage)
8. [Best Practices](#-best-practices)
9. [Tips & Tricks](#-tips--tricks)

---

## 🚀 Getting Started

### Accessing the Dashboard

1. Ensure the bot is running (`npm start`)
2. Open your web browser
3. Navigate to: `http://localhost:3000`
4. The dashboard should load automatically

### Dashboard Layout

The dashboard has 5 main tabs:
- **📊 Overview**: Status, statistics, upcoming holidays
- **🎊 Holiday Automation**: Automatic holiday announcements
- **📢 Custom Announcements**: Create and send custom messages
- **⏰ Scheduled**: View scheduled announcements
- **📝 Activity Logs**: Monitor bot activity

### Understanding the Status Badge

- **● Running** (Green): Bot is active and operational
- **● Stopped** (Red): Bot is not running or has errors

---

## 📊 Dashboard Overview

### Overview Tab

#### Statistics Cards

**Holiday Announcements**
- Total automatic holiday messages sent
- Increments each time a holiday is announced
- Resets when bot restarts

**Custom Announcements**
- Total manual messages sent
- Includes both immediate and scheduled
- Resets on restart

**Scheduled Items**
- Current number of pending scheduled announcements
- Updates in real-time
- Shows items waiting to be sent

#### Today's Holiday

Displays if today is a holiday:
```
🎉 Republic Day
Wednesday, January 26, 2025
```

If no holiday:
```
No holiday today
```

#### Upcoming Holidays

Shows next 30 days of holidays:
- Holiday name
- Full date
- Day of week
- Scrollable list
- Automatically updates

**Features:**
- Up to 15 holidays shown
- Indian national and regional holidays
- Fetches from multiple reliable sources
- Updates daily at midnight

---

## 🎊 Holiday Automation

### How It Works

The bot automatically:
1. **Checks daily** at midnight (configurable timezone)
2. **Fetches holiday data** from Indian calendar APIs
3. **Generates AI message** if holiday found
4. **Selects appropriate image** from curated pool
5. **Sends to Discord** with @everyone mention
6. **Logs activity** for monitoring

### Holiday Sources

Primary: [Calendar-Bharat](https://github.com/jayantur13/calendar-bharat)
- Indian national holidays
- Regional celebrations
- Observances

Fallback: [Nager.Date API](https://date.nager.at/)
- International coverage
- Reliable backup

### Supported Holidays

**National Holidays:**
- Republic Day (Jan 26)
- Independence Day (Aug 15)
- Gandhi Jayanti (Oct 2)
- And more...

**Religious Celebrations:**
- Diwali
- Holi
- Eid
- Christmas
- And more...

### Manual Holiday Trigger

Use this to test or trigger manually:

1. Go to **Holiday Automation** tab
2. Click **"🚀 Test Holiday Trigger Now"**
3. Bot checks if today is a holiday
4. If yes: Sends announcement immediately
5. If no: Shows "No holiday today"

**Use cases:**
- Testing setup
- Missed automatic announcement
- Manual verification

### Customizing Holiday Messages

Holiday messages are AI-generated with:
- **Holiday name** and significance
- **Warm wishes** for community
- **Celebratory tone**
- **Professional formatting**
- **Relevant emojis**

Example output:
```
🎊 Holiday Announcement 🎊

Republic Day

Today we celebrate Republic Day, commemorating the 
adoption of the Constitution of India. This significant 
day marks our nation's commitment to democracy, justice, 
and equality. Let's honor the values that unite us as a 
diverse and vibrant community.

Wishing the entire Digital Labour community a day filled 
with pride, reflection, and celebration!

— The Digital Labour Team
```

### Holiday Images

Bot automatically selects images based on holiday type:
- **Republic Day**: Indian flag, patriotic themes
- **Diwali**: Lamps, lights, celebrations
- **Holi**: Colors, festivities
- **Christmas**: Trees, decorations
- **And more...**

Images sourced from:
- Unsplash (high-quality, free)
- Curated collection
- Holiday-appropriate

---

## 📢 Custom Announcements

### Creating an Announcement

#### Step 1: Navigate to Tab
Click **"📢 Custom Announcements"** tab

#### Step 2: Fill the Form

**Announcement Title** (Optional)
- Default: "📢 Alert – Important Update"
- Appears as embed title
- Keep it concise
- Examples:
  - "🎮 Game Night Tonight!"
  - "⚠️ Server Maintenance"
  - "🎉 New Feature Launch"

**Message Content** (Required)
- Main announcement text
- Supports Discord markdown
- No character limit (recommended: 500 words max)
- Can include:
  - **Bold**: `**text**`
  - *Italic*: `*text*`
  - Links: `[text](url)`
  - Mentions: `<@USER_ID>`

Example message:
```
Attention everyone! We're hosting a game night tonight 
at 8 PM EST. All members are welcome to join!

Games planned:
• Among Us
• Minecraft
• Jackbox Party Pack

See you there! 🎮
```

#### Step 3: Select Roles to Mention

**Available options:**
- ☑️ **@everyone**: Mentions all server members
- ☑️ **@Server Manager**: Your custom roles
- ☑️ **@Moderators**: (if configured)
- ☑️ **@Members**: (if configured)

**Multiple selection:**
- Check multiple boxes to mention multiple roles
- Separate mentions will be sent
- Use wisely to avoid spam

**Best practices:**
- Use @everyone sparingly
- Target specific roles when possible
- Consider time zones

#### Step 4: AI Enhancement (Optional)

**Options:**
- ○ **Yes, enhance my message**: Gemini AI improves it
- ● **No, use as-is**: Send exactly as written

**What AI does:**
- Improves clarity and grammar
- Makes it more professional
- Adds appropriate emojis (2-3)
- Maintains your original intent
- Keeps it concise

**When to use:**
- ✅ Quick drafts
- ✅ Professional announcements
- ✅ Need polishing
- ❌ Already perfect
- ❌ Very specific wording
- ❌ Near rate limit

#### Step 5: Include Image (Optional)

**Options:**
- ○ **Yes**: Add an image
- ● **No**: Text only

**If Yes selected:**
- Image URL field appears
- Paste direct image URL
- Supported: JPG, PNG, GIF, WEBP
- Recommended size: 800x400px or larger

**Finding image URLs:**
- [Unsplash](https://unsplash.com)
- [Imgur](https://imgur.com)
- Your own hosting
- Discord CDN links

**Example:**
```
https://images.unsplash.com/photo-1234567890
```

**Tips:**
- Use HTTPS URLs
- Test URL in browser first
- Ensure publicly accessible
- Not behind login

#### Step 6: Select Webhook Channel

**Dropdown options:**
- Announcements Channel
- Updates Channel
- Holidays Channel
- General Channel

**Channel usage:**
- **Announcements**: Important server-wide news
- **Updates**: Feature updates, patches
- **Holidays**: Special celebrations (auto-used for holidays)
- **General**: Casual announcements

#### Step 7: Choose Send Time

**Options:**
- ● **Now**: Send immediately
- ○ **Schedule Later**: Send at specific time

**If "Schedule Later":**
- Date/Time picker appears
- Select future date and time
- Uses your local timezone
- Minimum: Current time + 1 minute

### Sending the Announcement

1. Click **"📤 Send Announcement"** button
2. Button changes to "⏳ Processing..."
3. Bot validates and sends
4. Success message appears (green)
5. Check Discord channel to verify

**Success message:**
```
✅ Announcement sent successfully!
```

**Error message examples:**
```
❌ Please enter a message
❌ Discord API error: 404
❌ Webhook not configured
```

### Example Announcements

#### Example 1: Event Announcement
```
Title: 🎮 Game Night This Saturday

Message:
Join us this Saturday at 8 PM EST for our monthly game night! 
We'll be playing Among Us, Minecraft, and more. All skill 
levels welcome!

RSVP in #events channel.

Roles: @everyone
AI: No
Image: Yes (game night image)
Channel: Announcements
Send: Now
```

#### Example 2: Maintenance Warning
```
Title: ⚠️ Server Maintenance Schedule

Message:
The server will undergo maintenance on Sunday, January 5th 
from 2-4 AM EST. Expect possible disconnections during this 
time. We appreciate your patience!

Roles: @everyone
AI: Yes (polish it)
Image: No
Channel: Updates
Send: Schedule (Jan 4, 8 PM)
```

#### Example 3: Feature Launch
```
Title: 🎉 New Bot Commands Available!

Message:
We've just launched 5 new bot commands! Check out /help 
to see what's new. Highlights include music playback, 
polls, and custom reactions.

Try them out and let us know what you think!

Roles: @Members
AI: No
Image: Yes (bot feature graphic)
Channel: Announcements
Send: Now
```

---

## ⏰ Scheduling

### How Scheduling Works

1. Create announcement with "Schedule Later" selected
2. Pick date and time
3. Click Send
4. Bot stores in memory
5. At scheduled time, sends automatically
6. Updates status to "sent"

### Viewing Scheduled Announcements

1. Click **"⏰ Scheduled"** tab
2. See all pending announcements
3. Each shows:
   - Scheduled time
   - Title
   - Status (scheduled/sent/failed)

### Schedule Status Types

**Scheduled** (Blue)
- Waiting to be sent
- Time hasn't arrived yet
- Will send automatically

**Sent** (Green)
- Successfully delivered
- Check Discord to verify
- Status updated automatically

**Failed** (Red)
- Sending failed
- Check logs for reason
- May need to resend manually

### Important Notes

⚠️ **Bot Must Stay Running**
- Scheduled items only send if bot is running
- Restarting bot clears schedule
- Use process manager for 24/7 operation

⚠️ **In-Memory Storage**
- Schedules not persisted to database
- Lost on restart
- Future versions may add persistence

⚠️ **Timezone Awareness**
- Uses your local browser timezone
- Converts to UTC internally
- Server uses configured timezone

### Scheduling Best Practices

✅ **Do:**
- Schedule at least 5 minutes ahead
- Double-check timezone
- Keep bot running continuously
- Verify date/time before sending

❌ **Don't:**
- Schedule too far in advance (< 7 days recommended)
- Schedule during bot restarts
- Rely on it for critical time-sensitive messages
- Forget to keep bot running

---

## 🤖 AI Features

### Google Gemini Integration

The bot uses **Gemini 2.0 Flash** for:
- Holiday message generation
- Custom message enhancement
- Creative, context-aware content

### Holiday Message Generation

**Automatic for holidays:**
- Generates unique message each time
- Considers holiday significance
- Warm, celebratory tone
- Community-focused
- Professional formatting

**Example prompt sent to AI:**
```
Generate a warm, festive announcement for Diwali 
celebration in India.

Context: Festival of Lights

Requirements:
- 100-150 words
- Uplifting and celebratory tone
- Mention significance briefly
- Include well-wishes for Digital Labour community
- Professional yet friendly
```

**AI generates:**
```
Happy Diwali to everyone in the Digital Labour community! 
Today we celebrate the Festival of Lights, symbolizing 
the victory of light over darkness and good over evil. 
This joyous occasion brings families together, lights up 
homes, and spreads happiness across the nation.

May this Diwali illuminate your path with success, fill 
your days with joy, and bring prosperity to you and your 
loved ones. Let's embrace the spirit of togetherness and 
gratitude as we celebrate this beautiful festival.

Wishing you all a very Happy Diwali! 🪔✨
```

### Custom Message Enhancement

**What AI does:**
1. Analyzes your message
2. Improves grammar and clarity
3. Makes tone more professional
4. Adds 2-3 relevant emojis
5. Maintains your core message
6. Keeps it concise

**Before AI:**
```
hey everyone we got new update coming tomorrow at noon. 
its got new features and bug fixes. check it out
```

**After AI:**
```
Hello everyone! 🎉

We're excited to announce a new update launching tomorrow 
at noon. This release includes several new features and 
important bug fixes that will enhance your experience.

Be sure to check it out and let us know what you think! 
We appreciate your continued support. 💪
```

### AI Rate Limits

**Free Tier (Gemini):**
- 60 requests per minute
- Rate limit resets every minute
- Shared across all uses

**If Rate Limited:**
- Error: "Request failed with status code 429"
- Bot falls back to non-AI version
- Wait 1 minute before retry
- Consider upgrading to paid tier

**Avoiding Rate Limits:**
- Use AI selectively
- Don't enhance every message
- Space out requests
- Monitor usage in Google AI Studio

### AI Best Practices

✅ **Good uses:**
- Quick drafts needing polish
- Professional announcements
- Holiday messages (automatic)
- Long-form content
- Non-native English speakers

❌ **Skip AI for:**
- Already perfect messages
- Very specific wording required
- Casual, informal announcements
- When near rate limit
- Personal, emotional messages

---

## 🔧 Advanced Usage

### Multiple Webhook Management

**Setup:**
```env
WEBHOOK_ANNOUNCEMENTS="https://discord.com/api/webhooks/..."
WEBHOOK_UPDATES="https://discord.com/api/webhooks/..."
WEBHOOK_HOLIDAYS="https://discord.com/api/webhooks/..."
WEBHOOK_GENERAL="https://discord.com/api/webhooks/..."
```

**Use cases:**
- **Announcements**: Server-wide important news
- **Updates**: Bot updates, feature launches
- **Holidays**: Automatic holiday messages
- **General**: Casual announcements, reminders

**Benefits:**
- Organized channels
- Targeted messaging
- Reduced channel clutter
- Better user experience

### Custom Role Configuration

**Add roles in `agent.js`:**
```javascript
const ROLES = {
  'everyone': '@everyone',
  'Admins': '<@&123456789012345678>',
  'Moderators': '<@&234567890123456789>',
  'VIP': '<@&345678901234567890>',
  'Members': '<@&456789012345678901>',
  'Bots': '<@&567890123456789012>'
};
```

**Getting Role IDs:**
1. Enable Developer Mode (Discord Settings)
2. Server Settings → Roles
3. Right-click role → Copy ID
4. Format: `<@&ROLE_ID>`

### API Integration

**Direct API calls:**
```bash
# Get status
curl http://localhost:3000/api/status

# Send announcement
curl -X POST http://localhost:3000/api/announcement/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test",
    "message": "Sent via API",
    "roles": ["everyone"],
    "webhookChannel": "ANNOUNCEMENTS"
  }'
```

**Use cases:**
- External automation
- Webhook from other services
- CI/CD notifications
- Custom integrations

### Timezone Configuration

**Change in `agent.js`:**
```javascript
TIMEZONE: 'America/New_York',  // Eastern Time
```

**Common timezones:**
- `America/New_York` - EST/EDT
- `America/Los_Angeles` - PST/PDT
- `America/Chicago` - CST/CDT
- `Europe/London` - GMT/BST
- `Europe/Paris` - CET/CEST
- `Asia/Tokyo` - JST
- `Asia/Kolkata` - IST
- `Australia/Sydney` - AEST/AEDT

### Custom Schedule Times

**Edit cron schedule:**
```javascript
SCHEDULE_TIME: '0 9 * * *',  // 9 AM daily
```

**Cron format:**
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 0 * * *` - Midnight daily
- `0 9 * * *` - 9 AM daily
- `0 12 * * 1` - Noon every Monday
- `0 18 * * 5` - 6 PM every Friday
- `0 0 1 * *` - Midnight on 1st of month
- `*/30 * * * *` - Every 30 minutes

---

## 💡 Best Practices

### Message Writing

**Do:**
- Be clear and concise
- Use proper grammar
- Include relevant details
- Add call-to-action
- Proofread before sending

**Don't:**
- Use all caps (SHOUTING)
- Spam mentions
- Send too frequently
- Include sensitive information
- Use excessive emojis

### Role Mentions

**Guidelines:**
- Use @everyone sparingly (max 1-2 per day)
- Target specific roles when possible
- Consider time zones
- Avoid mentioning during sleep hours
- Provide opt-out instructions

### Scheduling

**Tips:**
- Schedule important announcements ahead
- Send reminders 24h and 1h before events
- Use consistent times for regular updates
- Consider different time zones
- Always have backup plan

### AI Usage

**Optimize:**
- Use for drafts, not every message
- Review AI output before sending
- Keep original copy as backup
- Monitor API usage
- Stay within rate limits

### Image Selection

**Best practices:**
- Use relevant, high-quality images
- Verify images load correctly
- Use consistent aspect ratios
- Compress large images
- Respect copyright

---

## 🎯 Tips & Tricks

### Quick Announcements

Save common message templates:
1. Draft in text editor
2. Copy/paste when needed
3. Minimal editing required
4. Fast deployment

### Testing

Always test new features:
1. Use test webhook if available
2. Send to private channel first
3. Verify formatting
4. Check mentions work
5. Confirm images display

### Monitoring

Regular checks:
- View Activity Logs daily
- Check for ERROR entries
- Monitor API usage
- Verify scheduled items
- Test webhooks monthly

### Backup

Protect your setup:
- Keep `.env` backup secure
- Document custom configurations
- Save important messages
- Export scheduled items list
- Screenshot settings

### Keyboard Shortcuts

Dashboard navigation:
- Click tabs instead of scrolling
- Use browser back/forward
- Cmd/Ctrl + R to refresh
- F12 for developer console
- Cmd/Ctrl + K for quick search (browser)

### Browser Console

Debug issues:
1. Press F12
2. Click "Console" tab
3. Look for errors (red text)
4. Check network requests
5. Copy errors for support

---

## ❓ FAQ

**Q: Can I use multiple languages?**
A: Currently optimized for English. AI may support other languages but not officially tested.

**Q: How do I delete a scheduled announcement?**
A: Currently not possible via dashboard. Restart bot to clear all (not recommended).

**Q: Can I edit sent announcements?**
A: No, Discord webhooks don't support editing. Send correction if needed.

**Q: Why aren't holidays showing?**
A: Check timezone settings and verify holiday APIs are accessible.

**Q: Can I add custom holidays?**
A: Not via dashboard. Edit code to add custom dates.

**Q: How many announcements can I send?**
A: No limit, but Discord has rate limits (30 per 60 seconds per webhook).

**Q: Does this work with Discord bots?**
A: Yes, uses webhooks which work alongside bots.

**Q: Can I use this for multiple servers?**
A: One instance per server. Run multiple instances for multiple servers.

---

## 📞 Getting Help

If you need assistance:

1. **Check logs** in Activity Logs tab
2. **Review documentation** thoroughly  
3. **Search GitHub issues**
4. **Ask in Discord server** (if available)
5. **Create GitHub issue** with details

**When reporting issues, include:**
- Error messages
- Steps to reproduce
- Expected vs actual behavior
- System information
- Logs (sanitize sensitive data!)

---
