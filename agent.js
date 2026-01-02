// ============================================
// DISCORD HOLIDAY AI AGENT - FIXED VERSION
// Using: Calendarific API (Free) + Google Gemini (Free)
// ============================================

const axios = require('axios');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  WEBHOOKS: {
    ANNOUNCEMENTS: process.env.WEBHOOK_ANNOUNCEMENTS,
    UPDATES: process.env.WEBHOOK_UPDATES,
    HOLIDAYS: process.env.WEBHOOK_HOLIDAYS,
    GENERAL: process.env.WEBHOOK_GENERAL
  },
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  CALENDARIFIC_API_KEY: process.env.CALENDARIFIC_API_KEY || 'demo', // Free tier: 1000 calls/month
  TIMEZONE: 'Asia/Kolkata',
  SCHEDULE_TIME: '0 0 * * *',
  DASHBOARD_PORT: 3000,
  TEST_MODE: false
};

const activityLog = [];
const scheduledAnnouncements = [];
let botStatus = {
  running: false,
  lastCheck: null,
  nextScheduledCheck: null,
  totalHolidayAnnouncements: 0,
  totalCustomAnnouncements: 0,
  errors: []
};

const HOLIDAY_IMAGES = {
  'New Year': 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
  'Republic Day': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
  'Independence Day': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
  'Diwali': 'https://images.unsplash.com/photo-1578608712688-36b5be8823dc?w=800',
  'Holi': 'https://images.unsplash.com/photo-1583221264828-8ff9f3a04925?w=800',
  'Christmas': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800',
  'default': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
};

const ROLES = {
  'everyone': '@everyone',
  'Server Manager': '<@&1427577155537207336>',
  'Omnipotent': '<@&1384205587373494282>',
  'Labour': '<@&1431013492810321940>'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  
  console.log(`[${timestamp}] [${type}] ${message}`);
  
  activityLog.unshift(logEntry);
  if (activityLog.length > 200) activityLog.pop();
  
  if (type === 'ERROR') {
    botStatus.errors.push(logEntry);
    if (botStatus.errors.length > 20) botStatus.errors.shift();
  }
}

function getHolidayImage(holidayName) {
  for (const [key, image] of Object.entries(HOLIDAY_IMAGES)) {
    if (holidayName.toLowerCase().includes(key.toLowerCase())) {
      return image;
    }
  }
  return HOLIDAY_IMAGES.default;
}

function getHolidayColor(holidayName) {
  const colorMap = {
    'republic': 0xFF9933,
    'independence': 0xFF9933,
    'diwali': 0xFFD700,
    'holi': 0xFF6347,
    'christmas': 0xFF0000,
    'eid': 0x00CED1,
    'new year': 0x00FF00,
    'default': 0x7B68EE
  };
  
  for (const [key, color] of Object.entries(colorMap)) {
    if (holidayName.toLowerCase().includes(key)) return color;
  }
  return colorMap.default;
}

// ============================================
// HARDCODED HOLIDAYS (ULTIMATE FALLBACK)
// ============================================

function getHardcodedHolidays2026() {
  return [
    { date: '2026-01-01', name: "New Year's Day", type: 'Public Holiday', description: 'New Year 2026' },
    { date: '2026-01-26', name: 'Republic Day', type: 'National Holiday', description: 'Republic Day of India' },
    { date: '2026-03-14', name: 'Holi', type: 'Festival', description: 'Festival of Colors' },
    { date: '2026-04-02', name: 'Good Friday', type: 'Public Holiday', description: 'Good Friday' },
    { date: '2026-08-15', name: 'Independence Day', type: 'National Holiday', description: 'Independence Day of India' },
    { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'National Holiday', description: 'Birth of Mahatma Gandhi' },
    { date: '2026-10-24', name: 'Dussehra', type: 'Festival', description: 'Victory of Good over Evil' },
    { date: '2026-11-13', name: 'Diwali', type: 'Festival', description: 'Festival of Lights' },
    { date: '2026-12-25', name: 'Christmas', type: 'Public Holiday', description: 'Christmas Day' }
  ];
}

// ============================================
// CALENDAR API - USING CALENDARIFIC (FREE)
// Sign up: https://calendarific.com/ (1000 calls/month free)
// ============================================

async function fetchIndianHolidays(year) {
  try {
    // Try Calendarific API first (Best free API for holidays)
    log(`Fetching holidays for ${year} from Calendarific...`);
    
    const response = await axios.get(
      `https://calendarific.com/api/v2/holidays?api_key=${CONFIG.CALENDARIFIC_API_KEY}&country=IN&year=${year}`,
      { timeout: 10000 }
    );
    
    if (response.data && response.data.response && response.data.response.holidays) {
      const holidays = response.data.response.holidays.map(h => ({
        date: h.date.iso.split('T')[0], // Format: YYYY-MM-DD
        name: h.name,
        type: h.type?.[0] || 'Holiday',
        description: h.description || h.name
      }));
      
      log(`Successfully fetched ${holidays.length} holidays from Calendarific`, 'SUCCESS');
      return holidays;
    }
    
    throw new Error('Invalid response from Calendarific');
    
  } catch (error) {
    log(`Calendarific failed: ${error.message}`, 'WARNING');
    
    // Fallback 1: Try AbstractAPI (also free)
    try {
      log('Trying AbstractAPI as fallback...');
      const fallbackResponse = await axios.get(
        `https://holidays.abstractapi.com/v1/?api_key=demo&country=IN&year=${year}`,
        { timeout: 10000 }
      );
      
      if (Array.isArray(fallbackResponse.data)) {
        const holidays = fallbackResponse.data.map(h => ({
          date: h.date,
          name: h.name,
          type: h.type || 'Holiday',
          description: h.description || h.name
        }));
        log(`AbstractAPI fallback successful: ${holidays.length} holidays`, 'SUCCESS');
        return holidays;
      }
    } catch (fallbackError) {
      log(`AbstractAPI fallback failed: ${fallbackError.message}`, 'WARNING');
    }
    
    // Fallback 2: Use hardcoded holidays
    log('Using hardcoded holidays as final fallback', 'WARNING');
    return getHardcodedHolidays2026();
  }
}

async function getTodaysHoliday() {
  const now = new Date();
  const year = now.getFullYear();
  
  // Get today's date in YYYY-MM-DD format
  const today = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  log(`Checking if ${today} is a holiday...`);
  
  const holidays = await fetchIndianHolidays(year);
  
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    log('Could not fetch holiday data', 'ERROR');
    return null;
  }
  
  log(`Searching ${holidays.length} holidays for ${today}`);
  
  const holiday = holidays.find(h => h.date === today);
  
  if (holiday) {
    log(`✅ Holiday found: ${holiday.name}`, 'SUCCESS');
  } else {
    log(`No holiday found for ${today}`);
  }
  
  return holiday;
}

async function getUpcomingHolidays() {
  const now = new Date();
  const year = now.getFullYear();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const holidays = await fetchIndianHolidays(year);
  if (!holidays || !Array.isArray(holidays)) return [];
  
  return holidays.filter(h => {
    const holidayDate = new Date(h.date);
    return holidayDate >= now && holidayDate <= thirtyDaysLater;
  }).slice(0, 15);
}

// ============================================
// AI MESSAGE GENERATION - GOOGLE GEMINI (FREE)
// Alternative: OpenAI (paid), Cohere (free tier)
// ============================================

async function generateHolidayMessage(holidayName, holidayDescription = '') {
  // If no API key, use fallback
  if (!CONFIG.GOOGLE_AI_API_KEY || CONFIG.GOOGLE_AI_API_KEY === 'your_api_key_here') {
    log('No AI API key configured, using template message', 'WARNING');
    return `Happy ${holidayName}! 🎉\n\nWishing the entire Digital Labour community a wonderful celebration filled with joy, prosperity, and memorable moments. May this special day bring you happiness and renewed energy for the days ahead.\n\nLet's celebrate together! 🎊`;
  }

  try {
    log(`Generating AI message for: ${holidayName}`);
    
    const prompt = `Generate a warm, festive announcement for ${holidayName} celebration in India.

${holidayDescription ? `Context: ${holidayDescription}` : ''}

Requirements:
- 100-150 words
- Uplifting and celebratory tone
- Mention the significance briefly
- Include well-wishes for the Digital Labour community
- Professional yet friendly
- No greetings like "Dear team" or signatures

Return ONLY the message text.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 250,
          topP: 0.95
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const messageText = response.data.candidates[0].content.parts[0].text.trim();
    log('AI message generated successfully', 'SUCCESS');
    return messageText;

  } catch (error) {
    log(`AI generation failed: ${error.message}`, 'ERROR');
    return `Happy ${holidayName}! 🎉\n\nWishing the entire Digital Labour community a wonderful celebration filled with joy, prosperity, and memorable moments. May this special day bring you happiness and renewed energy for the days ahead.\n\nLet's celebrate together! 🎊`;
  }
}

async function enhanceCustomMessage(messageContent) {
  if (!CONFIG.GOOGLE_AI_API_KEY || CONFIG.GOOGLE_AI_API_KEY === 'your_api_key_here') {
    return messageContent;
  }

  try {
    const prompt = `Enhance this announcement for a Discord community:

${messageContent}

Make it professional, add 2-3 emojis, improve clarity. Keep it under 150 words.

Return ONLY the enhanced message.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    log(`AI enhancement failed: ${error.message}`, 'ERROR');
    return messageContent;
  }
}

// ============================================
// DISCORD WEBHOOK
// ============================================

async function sendHolidayAnnouncement(holiday, message, imageUrl, webhookUrl) {
  try {
    log('Sending holiday announcement to Discord...');

    const embed = {
      title: `🎊 **Holiday Announcement** 🎊`,
      description: `**${holiday.name}**\n\n${message}\n\n— *The Digital Labour Team*`,
      color: getHolidayColor(holiday.name),
      image: { url: imageUrl },
      footer: {
        text: 'Digital Labour Bot',
        icon_url: 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png'
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      content: '@everyone',
      username: 'Holiday Bot',
      avatar_url: 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png',
      embeds: [embed]
    };

    await axios.post(webhookUrl, payload, { timeout: 10000 });
    
    log('Holiday announcement sent successfully!', 'SUCCESS');
    botStatus.totalHolidayAnnouncements++;
    return true;

  } catch (error) {
    log(`Holiday announcement failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function sendCustomAnnouncement(data) {
  try {
    const { title, message, roles, imageUrl, webhookChannel, useAI } = data;
    
    const webhookUrl = CONFIG.WEBHOOKS[webhookChannel] || CONFIG.WEBHOOKS.ANNOUNCEMENTS;
    
    if (!webhookUrl) {
      return { success: false, error: 'Webhook not configured' };
    }
    
    let finalMessage = message;
    if (useAI) {
      finalMessage = await enhanceCustomMessage(message);
    }

    const roleMentions = roles && roles.length > 0 
      ? roles.map(role => ROLES[role] || role).join(' ')
      : null;

    const embed = {
      title: title || '📢 **Alert — Important Update**',
      description: `${finalMessage}\n\n— *The Digital Labour Team*`,
      color: 0xFF6B35,
      footer: {
        text: 'Digital Labour Bot',
        icon_url: 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png'
      },
      timestamp: new Date().toISOString()
    };

    if (imageUrl) embed.image = { url: imageUrl };

    const payload = {
      content: roleMentions,
      username: 'Announcement Bot',
      avatar_url: 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png',
      embeds: [embed]
    };

    await axios.post(webhookUrl, payload, { timeout: 10000 });
    
    log('Custom announcement sent!', 'SUCCESS');
    botStatus.totalCustomAnnouncements++;
    return { success: true };

  } catch (error) {
    log(`Custom announcement failed: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

// ============================================
// SCHEDULING
// ============================================

function scheduleAnnouncement(data) {
  const { scheduleTime, ...announcementData } = data;
  const scheduleDate = new Date(scheduleTime);
  
  if (scheduleDate <= new Date()) {
    return { success: false, error: 'Schedule time must be in the future' };
  }

  const scheduledItem = {
    id: Date.now().toString(),
    scheduleTime: scheduleDate.toISOString(),
    data: announcementData,
    status: 'scheduled'
  };

  scheduledAnnouncements.push(scheduledItem);
  log(`Announcement scheduled for ${scheduleDate.toLocaleString()}`, 'SUCCESS');

  setTimeout(async () => {
    const result = await sendCustomAnnouncement(announcementData);
    scheduledItem.status = result.success ? 'sent' : 'failed';
  }, scheduleDate.getTime() - Date.now());

  return { success: true, scheduledItem };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function executeHolidayCheck(manualTrigger = false) {
  log('========================================');
  log(manualTrigger ? 'Manual check' : 'Auto check');
  
  botStatus.lastCheck = new Date().toISOString();
  
  try {
    const holiday = await getTodaysHoliday();
    
    if (!holiday) {
      log('No holiday today');
      log('========================================');
      return { success: true, message: 'No holiday today' };
    }

    log(`🎉 Holiday: ${holiday.name}`, 'SUCCESS');

    const aiMessage = await generateHolidayMessage(holiday.name, holiday.description);
    const imageUrl = getHolidayImage(holiday.name);
    const webhookUrl = CONFIG.WEBHOOKS.HOLIDAYS || CONFIG.WEBHOOKS.ANNOUNCEMENTS;
    
    const success = await sendHolidayAnnouncement(holiday, aiMessage, imageUrl, webhookUrl);

    log(success ? '✅ Sent!' : '❌ Failed', success ? 'SUCCESS' : 'ERROR');
    log('========================================');
    
    return { 
      success, 
      message: success ? `Sent: ${holiday.name}` : 'Failed',
      holiday,
      aiMessage
    };

  } catch (error) {
    log(`Error: ${error.message}`, 'ERROR');
    log('========================================');
    return { success: false, message: error.message };
  }
}

// ============================================
// WEB API
// ============================================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/status', (req, res) => {
  res.json({
    ...botStatus,
    config: {
      timezone: CONFIG.TIMEZONE,
      webhooksConfigured: Object.keys(CONFIG.WEBHOOKS).filter(k => CONFIG.WEBHOOKS[k]).length
    }
  });
});

app.get('/api/logs', (req, res) => res.json(activityLog));

app.get('/api/holidays/upcoming', async (req, res) => {
  try {
    const holidays = await getUpcomingHolidays();
    res.json({ success: true, holidays });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/holidays/today', async (req, res) => {
  try {
    const holiday = await getTodaysHoliday();
    res.json({ success: true, holiday });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/trigger/holiday', async (req, res) => {
  try {
    const result = await executeHolidayCheck(true);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/announcement/send', async (req, res) => {
  try {
    const result = await sendCustomAnnouncement(req.body);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/announcement/schedule', async (req, res) => {
  try {
    const result = scheduleAnnouncement(req.body);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/announcements/scheduled', (req, res) => {
  res.json({ success: true, scheduled: scheduledAnnouncements });
});

// Force New Year test
app.post('/api/test/newyear', async (req, res) => {
  try {
    const holiday = {
      date: '2026-01-01',
      name: "New Year's Day",
      description: 'New Year 2026'
    };
    
    const aiMessage = await generateHolidayMessage(holiday.name, holiday.description);
    const imageUrl = getHolidayImage(holiday.name);
    const webhookUrl = CONFIG.WEBHOOKS.HOLIDAYS || CONFIG.WEBHOOKS.ANNOUNCEMENTS;
    
    const success = await sendHolidayAnnouncement(holiday, aiMessage, imageUrl, webhookUrl);
    
    res.json({ success, message: success ? 'Sent!' : 'Failed' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============================================
// STARTUP
// ============================================

function validateConfig() {
  if (!CONFIG.WEBHOOKS.ANNOUNCEMENTS && !CONFIG.WEBHOOKS.HOLIDAYS) {
    log('ERROR: No webhook configured!', 'ERROR');
    log('Add to .env: WEBHOOK_ANNOUNCEMENTS=your_webhook_url', 'INFO');
    return false;
  }
  return true;
}

async function startAgent() {
  console.log(`
╔══════════════════════════════════════════╗
║   🤖 DISCORD HOLIDAY AI AGENT 🤖        ║
║   Using: Calendarific + Google Gemini   ║
╚══════════════════════════════════════════╝
  `);

  if (!validateConfig()) process.exit(1);
  
  log('✅ Config validated');

  app.listen(CONFIG.DASHBOARD_PORT, () => {
    log(`🌐 Dashboard: http://localhost:${CONFIG.DASHBOARD_PORT}`, 'SUCCESS');
  });

  botStatus.running = true;

  if (CONFIG.TEST_MODE) {
    await executeHolidayCheck(true);
    return;
  }

  log('✅ Production mode - Daily checks at midnight');

  cron.schedule(CONFIG.SCHEDULE_TIME, async () => {
    await executeHolidayCheck(false);
  }, { timezone: CONFIG.TIMEZONE });

  process.on('SIGINT', () => {
    log('🛑 Shutting down...', 'WARNING');
    process.exit(0);
  });
}

startAgent();