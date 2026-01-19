// ============================================
// DISCORD HOLIDAY AI AGENT - RELIABLE MIDNIGHT TRIGGER
// Using:  Nager.Date (free) + Calendarific (fallback) + Google Gemini (optional)
// Improvements: persistent state, dual scheduling (cron + minute-guard), retry logic,
// and re-tries-until-success behavior so the midnight check is never "missed".
// ============================================

const axios = require('axios');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DateTime } = require('luxon');
require('dotenv').config();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Multi-server configuration
  SERVERS: {
    // Default server configuration (will be dynamically populated)
    default: {
      GUILD_ID: process.env.DISCORD_GUILD_ID,
      BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
      name: 'Default Server',
      icon: null,
      webhooks: {
        ANNOUNCEMENTS: process.env.WEBHOOK_ANNOUNCEMENTS,
        UPDATES: process.env.WEBHOOK_UPDATES,
        HOLIDAYS: process.env.WEBHOOK_HOLIDAYS,
        GENERAL: process.env.WEBHOOK_GENERAL
      }
    }
  },
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  CALENDARIFIC_API_KEY: process.env.CALENDARIFIC_API_KEY || 'demo',
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
  SCHEDULE_TIME: process.env.SCHEDULE_TIME || '0 0 * * *',
  DASHBOARD_PORT: process.env.DASHBOARD_PORT ? Number(process.env.DASHBOARD_PORT) : 3000,
  TEST_MODE: process.env.TEST_MODE === 'true' || false,
  RETRY_ATTEMPTS: process.env.RETRY_ATTEMPTS ? Number(process.env.RETRY_ATTEMPTS) : 3,
  STATE_FILE: path.join(__dirname, 'state.json')
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

let state = {
  lastRunDate: null,
  holidaysCache: {},
  lastSuccessfulHolidays: []
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
  everyone: '@everyone',
  'Server Manager': '<@&1427577155537207336>',
  Omnipotent: '<@&1384205587373494282>',
  Labour: '<@&1431013492810321940>'
};

// ============================================
// SERVER MANAGEMENT FUNCTIONS
// ============================================

// Server registry to store multiple server configurations
let serverRegistry = {};

// Function to add a new server to the registry
function addServerToRegistry(serverId, serverConfig) {
  serverRegistry[serverId] = {
    ...serverConfig,
    id: serverId,
    addedAt: new Date().toISOString()
  };
  log(`Server added to registry: ${serverConfig.name} (${serverId})`, 'SUCCESS');
  return serverRegistry[serverId];
}

// Function to get server configuration
function getServerConfig(serverId = 'default') {
  return serverRegistry[serverId] || CONFIG.SERVERS.default;
}

// Function to get all servers
function getAllServers() {
  return { ...CONFIG.SERVERS, ...serverRegistry };
}

// Function to fetch server information from Discord API
async function fetchServerInfo(guildId, botToken) {
  try {
    const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      icon: response.data.icon,
      iconUrl: response.data.icon ? `https://cdn.discordapp.com/icons/${guildId}/${response.data.icon}.png` : null
    };
  } catch (error) {
    log(`Failed to fetch server info for ${guildId}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Function to create webhook with server-specific settings
async function createServerWebhook(channelId, serverInfo, botToken) {
  try {
    const webhookData = {
      name: serverInfo.name,
      avatar: serverInfo.iconUrl // Will be set as base64 if needed
    };

    const response = await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/webhooks`,
      webhookData,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    log(`Created webhook for server ${serverInfo.name} in channel ${channelId}`, 'SUCCESS');
    return response.data;
  } catch (error) {
    log(`Failed to create webhook for ${serverInfo.name}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

process.on('unhandledRejection', (err) => {
  try { log(`Unhandled Rejection: ${err?.stack || err}`, 'ERROR'); } catch (_) {}
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  try { log(`Uncaught Exception: ${err?.stack || err}`, 'ERROR'); } catch (_) {}
  process.exit(1);
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  console.log(`[${timestamp}] [${type}] ${message}`);
  activityLog.unshift(logEntry);
  if (activityLog.length > 300) activityLog.pop();
  if (type === 'ERROR') {
    botStatus.errors.push(logEntry);
    if (botStatus.errors.length > 50) botStatus.errors.shift();
  }
}

function getHolidayImage(holidayName) {
  for (const [key, image] of Object.entries(HOLIDAY_IMAGES)) {
    if (holidayName.toLowerCase().includes(key.toLowerCase())) return image;
  }
  return HOLIDAY_IMAGES.default;
}

function getHolidayColor(holidayName) {
  const colorMap = {
    republic: 0xff9933,
    independence: 0xff9933,
    diwali: 0xffd700,
    holi: 0xff6347,
    christmas: 0xff0000,
    eid: 0x00ced1,
    'new year': 0x00ff00,
    default: 0x7b68ee
  };
  for (const [key, color] of Object.entries(colorMap)) {
    if (holidayName.toLowerCase().includes(key)) return color;
  }
  return colorMap.default;
}

// ============================================
// STATE PERSISTENCE
// ============================================

function loadState() {
  try {
    if (fs.existsSync(CONFIG.STATE_FILE)) {
      const raw = fs.readFileSync(CONFIG.STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      log(`Loaded state: ${JSON.stringify(parsed)}`, 'INFO');
    } else {
      saveState();
    }
  } catch (err) {
    log(`Failed to load state: ${err.message}`, 'WARNING');
  }
}

function saveState() {
  try {
    fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    log(`State saved: ${JSON.stringify(state)}`, 'INFO');
  } catch (err) {
    log(`Failed to save state: ${err.message}`, 'ERROR');
  }
}

// ============================================
// HARDCODED HOLIDAYS
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
// HOLIDAY FETCH: Nager.Date -> Calendarific -> AbstractAPI -> Hardcoded
// ============================================

async function fetchIndianHolidays(year) {
  try {
    log(`Trying Nager.Date for ${year}...`);
    const resp = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, { timeout: 10000 });
    if (Array.isArray(resp.data) && resp.data.length > 0) {
      const holidays = resp.data.map((h) => ({
        date: h.date,
        name: h.localName || h.name,
        type: h.types ? h.types[0] : 'Holiday',
        description: h.name || h.localName
      }));
      log(`Nager.Date returned ${holidays.length} holidays`, 'SUCCESS');
      return holidays;
    }
  } catch (err) {
    log(`Nager.Date failed: ${err.message}`, 'WARNING');
  }

  try {
    log(`Fetching holidays for ${year} from Calendarific...`);
    const response = await axios.get(
      `https://calendarific.com/api/v2/holidays?api_key=${CONFIG.CALENDARIFIC_API_KEY}&country=IN&year=${year}`,
      { timeout: 10000 }
    );
    if (response.data?.response?.holidays) {
      const holidays = response.data.response.holidays
        .map((h) => {
          let isoDate = '';
          if (h.date) {
            if (typeof h.date.iso === 'string') isoDate = h.date.iso.split('T')[0];
            else if (typeof h.date === 'string') isoDate = h.date.split('T')[0];
            else if (h.date?.datetime) {
              isoDate = `${h.date.datetime.year}-${String(h.date.datetime.month).padStart(2, '0')}-${String(
                h.date.datetime.day
              ).padStart(2, '0')}`;
            }
          }
          return {
            date: isoDate,
            name: h.name,
            type: Array.isArray(h.type) ? h.type[0] : h.type || 'Holiday',
            description: h.description || h.name
          };
        })
        .filter((h) => h.date);
      log(`Calendarific returned ${holidays.length} holidays`, 'SUCCESS');
      return holidays;
    }
    throw new Error('Invalid response from Calendarific');
  } catch (err) {
    log(`Calendarific failed: ${err.message}`, 'WARNING');
  }

  try {
    log('Trying AbstractAPI as fallback...');
    const fallbackResponse = await axios.get(
      `https://holidays.abstractapi.com/v1/?api_key=demo&country=IN&year=${year}`,
      { timeout: 10000 }
    );
    if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length > 0) {
      const holidays = fallbackResponse.data.map((h) => ({
        date: h.date,
        name: h.name,
        type: h.type || 'Holiday',
        description: h.description || h.name
      }));
      log(`AbstractAPI returned ${holidays.length} holidays`, 'SUCCESS');
      return holidays;
    }
  } catch (err) {
    log(`AbstractAPI failed: ${err.message}`, 'WARNING');
  }

  log('Using hardcoded holidays as final fallback', 'WARNING');
  return getHardcodedHolidays2026();
}

// ============================================
// HELPERS: today's date in configured timezone
// ============================================

function nowInZone() {
  return DateTime.now().setZone(CONFIG.TIMEZONE);
}

function todayDateString() {
  return nowInZone().toISODate();
}

// ============================================
// AI MESSAGE GENERATION (Gemini) - fallback template if no key
// ============================================

async function generateHolidayMessage(holidayName, holidayDescription = '', serverInfo = null) {
  if (!CONFIG.GOOGLE_AI_API_KEY || CONFIG.GOOGLE_AI_API_KEY === 'your_api_key_here') {
    log('No AI API key configured, using template message', 'WARNING');
    return `Happy ${holidayName}! 🎉

Wishing the entire Digital Labour community a joyful and memorable celebration.  May this special day bring happiness, peace, and prosperity to you and your loved ones.  Let us take a moment to appreciate the significance of this day and celebrate together.

Enjoy the festivities! 🌟`;
  }

  try {
    log(`Generating AI message for: ${holidayName}`);
    // Fetch server info if not provided
    let serverDetails = serverInfo;
    if (!serverDetails && CONFIG.SERVERS.default.GUILD_ID && CONFIG.SERVERS.default.BOT_TOKEN) {
      try {
        serverDetails = await fetchServerInfo(CONFIG.SERVERS.default.GUILD_ID, CONFIG.SERVERS.default.BOT_TOKEN);
      } catch (e) {
        log('Could not fetch server info for AI prompt', 'WARNING');
      }
    }
    // Get channels and roles
    let channelCount = 0;
    let roleCount = 0;
    if (serverDetails) {
      try {
        const channels = await axios.get(`https://discord.com/api/v10/guilds/${serverDetails.id}/channels`, {
          headers: { Authorization: `Bot ${CONFIG.SERVERS.default.BOT_TOKEN}` }, timeout: 5000
        });
        channelCount = channels.data.filter(ch => ch.type === 0 || ch.type === 5).length;
      } catch (e) {}
      try {
        const roles = await axios.get(`https://discord.com/api/v10/guilds/${serverDetails.id}/roles`, {
          headers: { Authorization: `Bot ${CONFIG.SERVERS.default.BOT_TOKEN}` }, timeout: 5000
        });
        roleCount = roles.data.filter(r => !r.managed && r.name !== '@everyone').length;
      } catch (e) {}
    }
    const prompt = `Generate a warm, festive announcement for ${holidayName} celebration in India on the server "${serverDetails?.name || 'Digital Labour'}" with ${channelCount} text/announcement channels and ${roleCount} custom roles.

${holidayDescription ? `Context: ${holidayDescription}` : ''}

Requirements:
- 80-140 words
- Uplifting and celebratory tone
- Mention the significance briefly
- Include well-wishes for the community
- Professional yet friendly
- No greetings like "Dear team" or signatures

Return ONLY the message text.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 250, topP: 0.95 }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const messageText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!messageText) throw new Error('Empty AI response');
    log('AI message generated successfully', 'SUCCESS');
    return messageText;
  } catch (err) {
    log(`AI generation failed: ${err.message}`, 'ERROR');
    return `Happy ${holidayName}! 🎉

Wishing the entire Digital Labour community a joyful and memorable celebration. May this special day bring happiness, peace, and prosperity to you and your loved ones. Let us take a moment to appreciate the significance of this day and celebrate together.

Enjoy the festivities! 🌟`;
  }
}

async function enhanceCustomMessage(messageContent) {
  if (!CONFIG.GOOGLE_AI_API_KEY || CONFIG.GOOGLE_AI_API_KEY === 'your_api_key_here') return messageContent;
  try {
    const prompt = `Enhance this announcement for a Discord community: 

${messageContent}

Make it professional, add 2-3 emojis, improve clarity.  Keep it under 150 words. 

Return ONLY the enhanced message. `;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || messageContent;
  } catch (err) {
    log(`AI enhancement failed: ${err.message}`, 'ERROR');
    return messageContent;
  }
}

// ============================================
// DISCORD WEBHOOK (with retries)
// ============================================

async function postWebhookWithRetry(webhookUrl, payload) {
  let attempt = 0;
  while (attempt < CONFIG.RETRY_ATTEMPTS) {
    try {
      await axios.post(webhookUrl, payload, { timeout: 10000 });
      return true;
    } catch (err) {
      attempt++;
      log(`Webhook post attempt ${attempt} failed: ${err.message}`, 'WARNING');
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  return false;
}

async function sendHolidayAnnouncement(holiday, message, imageUrl, webhookUrl, roles = ['everyone'], serverInfo = null) {
  try {
    log('Sending holiday announcement to Discord...');
    const roleMentions =
      roles && roles.length > 0
        ? roles.map((roleId) => (roleId === 'everyone' ? '@everyone' : `<@&${roleId}>`)).join(' ')
        : '@everyone';

    // Use server-specific branding if available
    const serverName = serverInfo ? serverInfo.name : 'Digital Labour';
    const serverIconUrl = serverInfo ? serverInfo.iconUrl : 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png';
    
    const embed = {
      title: `🎊 Holiday Announcement 🎊`,
      description: `**${holiday.name}**\n\n${message}\n\n— *The ${serverName} Team*`,
      color: getHolidayColor(holiday.name),
      image: { url: imageUrl },
      footer: {
        text: serverName,
        icon_url: serverIconUrl
      },
      timestamp: new Date().toISOString()
    };
    
    const payload = {
      content: roleMentions,
      username: serverName, // Use server name as webhook username
      avatar_url: serverIconUrl, // Use server icon as webhook avatar
      embeds: [embed]
    };
    
    const ok = await postWebhookWithRetry(webhookUrl, payload);
    if (!ok) {
      log('Holiday announcement failed after retries', 'ERROR');
      return false;
    }
    log('Holiday announcement sent successfully!', 'SUCCESS');
    botStatus.totalHolidayAnnouncements++;
    return true;
  } catch (err) {
    log(`Holiday announcement failed: ${err.message}`, 'ERROR');
    return false;
  }
}

async function sendCustomAnnouncement(data) {
  try {
    const { title, message, roles, imageUrl, webhookChannel, useAI, serverInfo } = data;
    const channelKey = webhookChannel || 'ANNOUNCEMENTS';
    
    // Get server-specific webhook or fallback to default
    let webhookUrl;
    if (serverInfo && serverInfo.webhooks && serverInfo.webhooks[channelKey]) {
      webhookUrl = serverInfo.webhooks[channelKey];
    } else {
      webhookUrl = CONFIG.SERVERS.default.webhooks[channelKey] || CONFIG.SERVERS.default.webhooks.ANNOUNCEMENTS || CONFIG.SERVERS.default.webhooks.HOLIDAYS;
    }
    
    if (!webhookUrl) return { success: false, error: 'Webhook not configured' };

    // Validate channel for announcements (only general channels allowed)
    const allowedChannels = ['general', 'announcements', 'announcement', 'general-chat', 'main', 'lounge'];
    const channelName = webhookChannel?.toLowerCase() || 'announcements';
    if (!allowedChannels.some(ch => channelName.includes(ch))) {
      return { success: false, error: 'Announcements are only allowed in general/standard channels' };
    }

    let finalMessage = message;
    if (useAI) finalMessage = await enhanceCustomMessage(message);

    const roleMentions =
      roles && roles.length > 0
        ? roles
            .map((roleId) => {
              if (roleId === 'everyone') return '@everyone';
              if (ROLES[roleId]) return ROLES[roleId];
              return `<@&${roleId}>`;
            })
            .join(' ')
        : null;

    // Use server-specific branding if available
    const serverName = serverInfo ? serverInfo.name : 'Digital Labour';
    const serverIconUrl = serverInfo ? serverInfo.iconUrl : 'https://i.ibb.co/H5pcw68/Chat-GPT-Image-Dec-27-2025-01-47-14-AM.png';

    const embed = {
      title: title || '📢 Alert — Important Update',
      description: `${finalMessage}\n\n— *The ${serverName} Team*`,
      color: 0xff6b35,
      footer: {
        text: serverName,
        icon_url: serverIconUrl
      },
      timestamp: new Date().toISOString()
    };
    // Validate image URL
    if (imageUrl) {
      if (imageUrl.startsWith('data:image') || !imageUrl.startsWith('https://')) {
        return { success: false, error: 'Invalid image URL. Only public HTTPS URLs are supported.' };
      }
      embed.image = { url: imageUrl };
    }
    
    const payload = {
      content: roleMentions,
      username: serverName, // Use server name as webhook username
      avatar_url: serverIconUrl, // Use server icon as webhook avatar
      embeds: [embed]
    };
    
    const ok = await postWebhookWithRetry(webhookUrl, payload);
    if (!ok) {
      log('Custom announcement failed after retries', 'ERROR');
      return { success: false, error: 'Webhook failed after retries' };
    }
    log('Custom announcement sent!', 'SUCCESS');
    botStatus.totalCustomAnnouncements++;
    return { success: true };
  } catch (err) {
    log(`Custom announcement failed: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

// ============================================
// SCHEDULING
// ============================================

function scheduleAnnouncement(data) {
  const { scheduleTime, ...announcementData } = data;
  const scheduleDate = new Date(scheduleTime);
  if (scheduleDate <= new Date()) return { success: false, error: 'Schedule time must be in the future' };
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
// CACHED HOLIDAY FETCH
// ============================================

let holidayFetchLock = false;

async function fetchIndianHolidaysCached(year) {
  if (holidayFetchLock) await new Promise((r) => setTimeout(r, 200));

  if (state.holidaysCache[year]?.holidays?.length) {
    log(`Using cached holidays for ${year}`, 'INFO');
    return state.holidaysCache[year].holidays;
  }

  holidayFetchLock = true;
  try {
    const holidays = await fetchIndianHolidays(year);

    if (holidays && holidays.length) {
      state.holidaysCache[year] = { holidays, fetchedAt: new Date().toISOString() };
      state.lastSuccessfulHolidays = holidays;
      saveState();
      return holidays;
    }

    if (state.lastSuccessfulHolidays?.length) {
      log('Using last successful holidays as fallback cache', 'WARNING');
      return state.lastSuccessfulHolidays;
    }

    const hardcoded = getHardcodedHolidays2026();
    state.lastSuccessfulHolidays = hardcoded;
    saveState();
    return hardcoded;
  } finally {
    holidayFetchLock = false;
  }
}

// ============================================
// MAIN EXECUTION: executeHolidayCheck
// ============================================

async function executeHolidayCheck(manualTrigger = false, rolesOverride = null) {
  log('========================================');
  log(manualTrigger ? 'Manual check' : 'Auto check');

  const today = todayDateString();
  botStatus.lastCheck = new Date().toISOString();

  if (!manualTrigger && state.lastRunDate === today) {
    log(`Already checked for ${today} in timezone ${CONFIG.TIMEZONE}. Skipping.`, 'INFO');
    log('========================================');
    return { success: true, message: 'Already checked today' };
  }

  try {
    const holiday = await (async () => {
      try {
        return await getTodaysHoliday();
      } catch (e) {
        log(`getTodaysHoliday error: ${e.message}`, 'ERROR');
        throw e;
      }
    })();

    if (holiday === undefined) {
      log('Holiday fetch failed; will retry later (state unchanged).', 'WARNING');
      return { success: false, message: 'Holiday fetch failed' };
    }

    if (!holiday) {
      state.lastRunDate = today;
      saveState();
      log(`No holiday today (${today}). Marked as checked.`, 'INFO');
      log('========================================');
      return { success: true, message: 'No holiday today' };
    }

    log(`🎉 Holiday: ${holiday.name}`, 'SUCCESS');

    const aiMessage = await generateHolidayMessage(holiday.name, holiday.description);
    const imageUrl = getHolidayImage(holiday.name);
    
    // Get webhook URL and server info for multi-server support
    let webhookUrl;
    let serverInfo = null;
    
    // Check if we have multiple servers configured
    const allServers = getAllServers();
    const serverIds = Object.keys(allServers);
    
    if (serverIds.length > 1) {
      // For multi-server setup, send to all configured servers
      for (const serverId of serverIds) {
        if (serverId === 'default') continue; // Skip default in multi-server mode
        const server = allServers[serverId];
        const serverWebhookUrl = server.webhooks?.HOLIDAYS || server.webhooks?.ANNOUNCEMENTS;
        if (serverWebhookUrl) {
          try {
            // Fetch server info if not already available
            const serverDetails = await fetchServerInfo(server.GUILD_ID, server.BOT_TOKEN);
            await sendHolidayAnnouncement(holiday, aiMessage, imageUrl, serverWebhookUrl, rolesToUse, serverDetails);
          } catch (error) {
            log(`Failed to send to server ${server.name}: ${error.message}`, 'ERROR');
          }
        }
      }
      return { success: true, message: `Sent to multiple servers: ${holiday.name}`, holiday, aiMessage };
    } else {
      // Single server mode (default behavior)
      webhookUrl = CONFIG.SERVERS.default.webhooks.HOLIDAYS || CONFIG.SERVERS.default.webhooks.ANNOUNCEMENTS;
      try {
        const defaultServer = await fetchServerInfo(CONFIG.SERVERS.default.GUILD_ID, CONFIG.SERVERS.default.BOT_TOKEN);
        serverInfo = defaultServer;
      } catch (error) {
        log('Could not fetch server info, using defaults', 'WARNING');
      }
    }

    const rolesToUse = rolesOverride || ['everyone'];
    const success = await sendHolidayAnnouncement(holiday, aiMessage, imageUrl, webhookUrl, rolesToUse, serverInfo);

    if (success) {
      state.lastRunDate = today;
      saveState();
    } else {
      log(`Failed to send announcement for ${today}; state not updated to allow retries.`, 'WARNING');
    }

    log(success ? '✅ Sent!' : '❌ Failed', success ? 'SUCCESS' : 'ERROR');
    log('========================================');

    return { success, message: success ? `Sent: ${holiday.name}` : 'Failed', holiday, aiMessage };
  } catch (err) {
    log(`Error during holiday check: ${err.message}`, 'ERROR');
    log('========================================');
    return { success: false, message: err.message };
  }
}

async function getTodaysHoliday() {
  const now = nowInZone();
  const year = now.year;
  const today = todayDateString();
  log(`Checking if ${today} is a holiday (timezone ${CONFIG.TIMEZONE})...`);

  const holidays = await fetchIndianHolidaysCached(year);
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    log('Could not fetch holiday data (empty)', 'ERROR');
    return undefined;
  }

  log(`Searching ${holidays.length} holidays for ${today}`);
  const holiday = holidays.find((h) => h.date === today);
  if (holiday) log(`✅ Holiday found: ${holiday.name}`, 'SUCCESS');
  else log(`No holiday found for ${today}`, 'INFO');
  return holiday || null;
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
    state,
    config: {
      timezone: CONFIG.TIMEZONE,
      webhooksConfigured: Object.keys(CONFIG.WEBHOOKS).filter((k) => CONFIG.WEBHOOKS[k]).length
    }
  });
});

app.get('/api/logs', (req, res) => res.json(activityLog);

app.get('/api/holidays/upcoming', async (req, res) => {
  try {
    const holidays = await (async () => {
      const now = nowInZone();
      return await fetchIndianHolidaysCached(now.year);
    })();
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
    const { roles } = req.body || {};
    const result = await executeHolidayCheck(true, roles);
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

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    state,
    zoneNow: nowInZone().toISO(),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MULTI-SERVER MANAGEMENT ENDPOINTS
// ============================================

// Add a new server to the registry
app.post('/api/servers/add', async (req, res) => {
  try {
    const { guildId, botToken, name } = req.body;
    
    if (!guildId || !botToken) {
      return res.json({ success: false, error: 'Guild ID and Bot Token are required' });
    }

    // Fetch server information from Discord API
    const serverInfo = await fetchServerInfo(guildId, botToken);
    
    // Create server configuration
    const serverConfig = {
      GUILD_ID: guildId,
      BOT_TOKEN: botToken,
      name: name || serverInfo.name,
      icon: serverInfo.icon,
      iconUrl: serverInfo.iconUrl,
      webhooks: {}
    };

    // Add to registry
    const addedServer = addServerToRegistry(guildId, serverConfig);
    
    res.json({ 
      success: true, 
      server: addedServer,
      message: `Server "${serverConfig.name}" added successfully`
    });
  } catch (error) {
    log(`Failed to add server: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

// Get all registered servers
app.get('/api/servers', (req, res) => {
  try {
    const servers = getAllServers();
    res.json({ 
      success: true, 
      servers,
      totalServers: Object.keys(servers).length
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Get channels for a specific server
app.get('/api/servers/:serverId/channels', async (req, res) => {
  try {
    const { serverId } = req.params;
    const serverConfig = getServerConfig(serverId);
    
    if (!serverConfig.GUILD_ID || !serverConfig.BOT_TOKEN) {
      return res.json({
        success: false,
        error: 'Server not found or incomplete configuration'
      });
    }

    const channelsResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${serverConfig.GUILD_ID}/channels`,
      {
        headers: {
          Authorization: `Bot ${serverConfig.BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const textChannels = channelsResponse.data
      .filter((ch) => ch.type === 0 || ch.type === 5)
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type === 5 ? 'announcement' : 'text',
        position: ch.position,
        category: ch.parent_id,
        nsfw: ch.nsfw || false
      }))
      .sort((a, b) => a.position - b.position);

    const categories = channelsResponse.data
      .filter((ch) => ch.type === 4)
      .reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {});

    const channelsWithCategories = textChannels.map((ch) => ({
      ...ch,
      categoryName: ch.category ? categories[ch.category] : null
    }));

    res.json({
      success: true,
      channels: channelsWithCategories,
      serverName: serverConfig.name,
      totalChannels: textChannels.length
    });
  } catch (error) {
    log(`Failed to fetch channels for server ${req.params.serverId}: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

// Get roles for a specific server
app.get('/api/servers/:serverId/roles', async (req, res) => {
  try {
    const { serverId } = req.params;
    const serverConfig = getServerConfig(serverId);
    
    if (!serverConfig.GUILD_ID || !serverConfig.BOT_TOKEN) {
      return res.json({
        success: false,
        error: 'Server not found or incomplete configuration'
      });
    }

    const rolesResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${serverConfig.GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${serverConfig.BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const roles = rolesResponse.data
      .filter((role) => !role.managed && role.name !== '@everyone')
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        mentionable: role.mentionable
      }))
      .sort((a, b) => b.position - a.position);

    res.json({
      success: true,
      roles,
      totalRoles: roles.length,
      serverName: serverConfig.name
    });
  } catch (error) {
    log(`Failed to fetch roles for server ${req.params.serverId}: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

// Create webhook for a specific server and channel
app.post('/api/servers/:serverId/webhooks/create', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channelId, webhookType } = req.body;
    
    if (!channelId || !webhookType) {
      return res.json({ success: false, error: 'Channel ID and webhook type are required' });
    }

    const serverConfig = getServerConfig(serverId);
    if (!serverConfig.GUILD_ID || !serverConfig.BOT_TOKEN) {
      return res.json({ success: false, error: 'Server not found or incomplete configuration' });
    }

    // Fetch current server info
    const serverInfo = await fetchServerInfo(serverConfig.GUILD_ID, serverConfig.BOT_TOKEN);
    
    // Create webhook
    const webhook = await createServerWebhook(channelId, serverInfo, serverConfig.BOT_TOKEN);
    
    // Store webhook URL in server configuration
    if (!serverConfig.webhooks) serverConfig.webhooks = {};
    serverConfig.webhooks[webhookType.toUpperCase()] = webhook.url;
    
    // Update server registry
    addServerToRegistry(serverId, serverConfig);
    
    res.json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        type: webhookType.toUpperCase(),
        serverName: serverInfo.name
      },
      message: `Webhook "${serverInfo.name}" created successfully for ${webhookType}`
    });
  } catch (error) {
    log(`Failed to create webhook for server ${req.params.serverId}: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

// Send custom announcement to specific server
app.post('/api/servers/:serverId/announcement/send', async (req, res) => {
  try {
    const { serverId } = req.params;
    const serverConfig = getServerConfig(serverId);
    
    if (!serverConfig.GUILD_ID || !serverConfig.BOT_TOKEN) {
      return res.json({ success: false, error: 'Server not found or incomplete configuration' });
    }

    // Fetch server info for branding
    const serverInfo = await fetchServerInfo(serverConfig.GUILD_ID, serverConfig.BOT_TOKEN);
    
    // Add server info to the request data
    const announcementData = {
      ...req.body,
      serverInfo: {
        name: serverInfo.name,
        iconUrl: serverInfo.iconUrl,
        webhooks: serverConfig.webhooks
      }
    };
    
    const result = await sendCustomAnnouncement(announcementData);
    res.json(result);
  } catch (error) {
    log(`Failed to send announcement to server ${req.params.serverId}: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

// ============================================
// DISCORD BOT INTEGRATION - Fetch Channels (Legacy - for backward compatibility)
// ============================================

app.get('/api/discord/channels', async (req, res) => {
  try {
    const defaultServer = CONFIG.SERVERS.default;
    const DISCORD_BOT_TOKEN = defaultServer.BOT_TOKEN;
    const DISCORD_GUILD_ID = defaultServer.GUILD_ID;

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      log('Discord bot credentials not configured', 'WARNING');
      return res.json({
        success: false,
        error: 'Discord bot not configured. Add DISCORD_BOT_TOKEN and DISCORD_GUILD_ID to .env',
        useDefault: true
      });
    }

    log('Fetching Discord channels from server...', 'INFO');

    const guildResponse = await axios.get(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const channelsResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const textChannels = channelsResponse.data
      .filter((ch) => ch.type === 0 || ch.type === 5)
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type === 5 ? 'announcement' : 'text',
        position: ch.position,
        category: ch.parent_id,
        nsfw: ch.nsfw || false
      }))
      .sort((a, b) => a.position - b.position);

    const categories = channelsResponse.data
      .filter((ch) => ch.type === 4)
      .reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {});

    const channelsWithCategories = textChannels.map((ch) => ({
      ...ch,
      categoryName: ch.category ? categories[ch.category] : null
    }));

    log(`Successfully fetched ${textChannels.length} channels from Discord`, 'SUCCESS');

    res.json({
      success: true,
      channels: channelsWithCategories,
      serverName: guildResponse.data.name,
      serverIcon: guildResponse.data.icon,
      totalChannels: textChannels.length,
      botConnected: true
    });
  } catch (error) {
    log(`Failed to fetch Discord channels: ${error.message}`, 'ERROR');

    if (error.response?.status === 401) {
      log('Invalid Discord bot token', 'ERROR');
      return res.json({
        success: false,
        error: 'Invalid bot token. Please check DISCORD_BOT_TOKEN in .env',
        useDefault: true
      });
    }

    if (error.response?.status === 403) {
      log('Bot lacks permissions', 'ERROR');
      return res.json({
        success: false,
        error: 'Bot lacks permissions. Ensure bot has "View Channels" permission',
        useDefault: true
      });
    }

    if (error.response?.status === 404) {
      log('Guild not found', 'ERROR');
      return res.json({
        success: false,
        error: 'Server not found. Check DISCORD_GUILD_ID in .env',
        useDefault: true
      });
    }

    res.json({
      success: false,
      error: error.message,
      useDefault: true
    });
  }
});

// ============================================
// DISCORD BOT INTEGRATION - Fetch Roles
// ============================================

app.get('/api/discord/roles', async (req, res) => {
  try {
    const defaultServer = CONFIG.SERVERS.default;
    const DISCORD_BOT_TOKEN = defaultServer.BOT_TOKEN;
    const DISCORD_GUILD_ID = defaultServer.GUILD_ID;

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      log('Discord bot credentials not configured', 'WARNING');
      return res.json({
        success: false,
        error: 'Discord bot not configured',
        useDefault: true
      });
    }

    log('Fetching Discord roles from guild...', 'INFO');

    const rolesResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const roles = rolesResponse.data
      .filter((role) => !role.managed && role.name !== '@everyone')
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        mentionable: role.mentionable
      }))
      .sort((a, b) => b.position - a.position);

    log(`Successfully fetched ${roles.length} roles from Discord`, 'SUCCESS');

    res.json({
      success: true,
      roles,
      totalRoles: roles.length
    });
  } catch (error) {
    log(`Failed to fetch Discord roles: ${error.message}`, 'ERROR');

    if (error.response?.status === 401) {
      return res.json({
        success: false,
        error: 'Invalid bot token',
        useDefault: true
      });
    }

    if (error.response?.status === 403) {
      return res.json({
        success: false,
        error: 'Bot lacks permissions to view roles',
        useDefault: true
      });
    }

    res.json({
      success: false,
      error: error.message,
      useDefault: true
    });
  }
});

// ============================================
// IMAGE GENERATION ENDPOINT (Using Unsplash)
// ============================================

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size } = req.body;

    if (!prompt) {
      return res.json({ success: false, error: 'Prompt is required' });
    }

    log(`Image generation requested: "${prompt.substring(0, 50)}..." (${size})`, 'INFO');

    try {
      const keywords = prompt
        .split(' ')
        .filter((w) => w.length > 3)
        .slice(0, 3)
        .join(',');
      const [width, height] = (size || '1024x1024').split('x');
      const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keywords)}`;

      log(`Using Unsplash image for: ${keywords}`, 'SUCCESS');
      return res.json({ success: true, imageUrl: unsplashUrl });
    } catch (err) {
      log(`Unsplash failed: ${err.message}`, 'WARNING');
    }

    const [width, height] = (size || '1024x1024').split('x');
    const placeholderUrl = `https://placehold.co/${width}x${height}/1a1447/00d4ff?text=${encodeURIComponent(
      'Generated+Image'
    )}`;

    log('Using placeholder fallback', 'INFO');
    res.json({ success: true, imageUrl: placeholderUrl });
  } catch (error) {
    log(`Image generation failed: ${error.message}`, 'ERROR');
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/test/newyear', async (req, res) => {
  try {
    const { roles, serverId } = req.body || {};
    const holiday = { date: '2026-01-01', name: "New Year's Day", description: 'New Year 2026' };
    const aiMessage = await generateHolidayMessage(holiday.name, holiday.description);
    const imageUrl = getHolidayImage(holiday.name);
    
    let webhookUrl;
    let serverInfo = null;
    
    if (serverId) {
      // Test for specific server
      const serverConfig = getServerConfig(serverId);
      webhookUrl = serverConfig.webhooks?.HOLIDAYS || serverConfig.webhooks?.ANNOUNCEMENTS;
      try {
        serverInfo = await fetchServerInfo(serverConfig.GUILD_ID, serverConfig.BOT_TOKEN);
      } catch (error) {
        log('Could not fetch server info for test, using defaults', 'WARNING');
      }
    } else {
      // Default server test
      webhookUrl = CONFIG.SERVERS.default.webhooks.HOLIDAYS || CONFIG.SERVERS.default.webhooks.ANNOUNCEMENTS;
      try {
        serverInfo = await fetchServerInfo(CONFIG.SERVERS.default.GUILD_ID, CONFIG.SERVERS.default.BOT_TOKEN);
      } catch (error) {
        log('Could not fetch server info for test, using defaults', 'WARNING');
      }
    }
    
    const rolesToUse = roles && roles.length > 0 ? roles : ['everyone'];
    const success = await sendHolidayAnnouncement(holiday, aiMessage, imageUrl, webhookUrl, rolesToUse, serverInfo);
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
  const defaultServer = CONFIG.SERVERS.default;
  if (!defaultServer.webhooks.ANNOUNCEMENTS && !defaultServer.webhooks.HOLIDAYS) {
    log('ERROR: No webhook configured!', 'ERROR');
    log('Add to .env: WEBHOOK_ANNOUNCEMENTS=your_webhook_url', 'INFO');
    return false;
  }
  return true;
}

let lastMinuteGuardKey = null;

async function startAgent() {
  console.log(`
╔══════════════════════════════════════════╗
║   🤖 DISCORD HOLIDAY AI AGENT 🤖        ║
║   Using:  Nager.Date + Calendarific + Google Gemini   ║
╚══════════════════════════════════════════╝
  `);

  if (!validateConfig()) process.exit(1);

  loadState();
  log('✅ Config validated');

  app.listen(CONFIG.DASHBOARD_PORT, () => {
    log(`🌐 Dashboard: http://localhost:${CONFIG.DASHBOARD_PORT}`, 'SUCCESS');
  });

  botStatus.running = true;
  botStatus.nextScheduledCheck = `Daily at 00:00 (${CONFIG.TIMEZONE})`;

  try {
    const today = todayDateString();
    if (CONFIG.TEST_MODE) {
      log('TEST_MODE enabled: performing an immediate manual check');
      await executeHolidayCheck(true);
    } else if (state.lastRunDate !== today) {
      log(`Startup check: lastRunDate=${state.lastRunDate}, today=${today}. Performing immediate check.`);
      await executeHolidayCheck(false);
    } else {
      log(`Startup: already checked for ${today} (state). No immediate check needed.`, 'INFO');
    }
  } catch (err) {
    log(`Startup check failed: ${err.message}`, 'WARNING');
  }

  log(`✅ Scheduling daily checks at "${CONFIG.SCHEDULE_TIME}" (${CONFIG.TIMEZONE})`);
  cron.schedule(
    CONFIG.SCHEDULE_TIME,
    async () => {
      try {
        await executeHolidayCheck(false);
      } catch (err) {
        log(`Cron scheduled check error: ${err.message}`, 'ERROR');
      }
    },
    { timezone: CONFIG.TIMEZONE }
  );

  setInterval(async () => {
    try {
      const znow = nowInZone();
      const hhmm = znow.toFormat('HH:mm');
      const minuteKey = `${znow.toISODate()}-${hhmm}`;
      if (hhmm === '00:00' && minuteKey !== lastMinuteGuardKey) {
        lastMinuteGuardKey = minuteKey;
        if (state.lastRunDate !== znow.toISODate()) {
          log(
            `Minute-guard detected midnight (${minuteKey}) and state indicates not yet checked. Triggering check.`,
            'INFO'
          );
          await executeHolidayCheck(false);
        } else {
          log(`Minute-guard: already checked for ${znow.toISODate()}`, 'INFO');
        }
      }
    } catch (err) {
      log(`Minute-guard error: ${err.message}`, 'WARNING');
    }
  }, 30 * 1000);

  process.on('SIGINT', () => {
    log('🛑 Shutting down...', 'WARNING');
    process.exit(0);
  });
}

startAgent();
