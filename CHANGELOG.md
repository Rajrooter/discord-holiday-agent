# Changelog

All notable changes and improvements to Discord Holiday AI Agent.

---

## [2.0.0] - 2026-01-05

### Major Updates

#### Bug Fixes
- ✅ Added missing `luxon` dependency to package.json
- ✅ Fixed Calendarific API prioritization (now primary source)
- ✅ Improved timezone handling for IST (Asia/Kolkata)
- ✅ Fixed PORT configuration for Railway deployment
- ✅ Enhanced error handling and retry logic
- ✅ Improved state persistence to prevent duplicate announcements

#### New Features

**Calendarific API Integration (Primary)**
- Prioritized Calendarific as primary holiday source
- Most comprehensive Indian holiday data
- Regional festivals and observances included
- Better error handling and fallback logic
- Validates API key before attempting requests

**Railway Deployment Support**
- Added `railway.json` configuration file
- Added `Procfile` for process management
- PORT environment variable support (Railway auto-sets)
- Comprehensive deployment documentation
- Zero-downtime deployment support

**GitHub Actions External Scheduler**
- Daily workflow at midnight IST (18:30 UTC)
- Calls `/api/trigger/holiday` as backup
- Independent of main process
- Guarantees delivery even if agent crashes
- Health check integration
- Manual trigger support

**Enhanced Cyberpunk/Terminal Dashboard**
- Complete UI redesign with cyberpunk aesthetics
- Neon colors: cyan, magenta, orange
- Animated grid background with pulse effects
- Terminal-style scanline animations
- Glassmorphism panels with glow effects
- Better contrast and readability
- Responsive design (mobile, tablet, desktop)
- Real-time terminal monitor
- Improved activity log display
- Better button hover states and animations

#### Improvements

**Holiday Detection**
- Three-tier fallback system:
  1. Calendarific API (primary)
  2. Nager.Date API (fallback)
  3. Hardcoded 2026 holidays (ultimate fallback)
- Better date format handling
- Improved error messages
- Validates holiday data before processing

**Scheduling Redundancy**
- Node-cron (internal scheduler)
- Minute-guard (30-second checks at midnight)
- GitHub Actions (external trigger)
- All timezone-aware for IST
- State-based deduplication

**State Management**
- Persistent `state.json` file
- Tracks last run date in IST timezone
- Prevents duplicate announcements
- Survives restarts and redeployments
- Better error handling

**API Endpoints**
- `/api/health` - Health check for external monitoring
- `/api/trigger/holiday` - Manual/external trigger
- `/api/test/newyear` - Test announcement
- All endpoints return proper JSON
- Better error responses

**Configuration**
- `.env.example` with comprehensive comments
- All environment variables documented
- Railway-specific configurations
- Better validation on startup
- Clearer error messages

#### Documentation

**New Documents**
- `RAILWAY_DEPLOYMENT.md` - Complete Railway deployment guide
- `QUICK_START.md` - 5-minute quick start guide
- `CHANGELOG.md` - This changelog
- Updated `README.md` - Comprehensive overview
- Enhanced `Installation.md` - Step-by-step installation
- Updated `USER_GUIDE.md` - Full user documentation

**Deployment Guide Includes:**
- API key acquisition steps
- Railway deployment process
- GitHub Actions setup
- Environment variable configuration
- Troubleshooting section
- Testing procedures
- Monitoring guidelines
- Security best practices

#### Technical Improvements

**Code Quality**
- Better error handling throughout
- Improved logging with levels
- Retry logic with exponential backoff
- Proper async/await usage
- Better timezone handling with Luxon
- Cleaner code structure

**Performance**
- Optimized API calls
- Better memory management
- Reduced CPU usage during idle
- Faster dashboard loading
- Improved log rotation (300 max entries)

**Security**
- Environment variable validation
- No secrets in code
- Proper webhook URL handling
- API key validation
- Better error messages (no sensitive data exposure)

#### Breaking Changes

None - fully backward compatible with previous configuration.

#### Migration Guide

If upgrading from v1.x:

1. Install new dependencies:
   ```bash
   npm install
   ```

2. Update `.env` file:
   ```env
   # Add Calendarific API key (recommended)
   CALENDARIFIC_API_KEY=your_key_here

   # Ensure timezone is set
   TIMEZONE=Asia/Kolkata
   ```

3. Replace dashboard.html:
   - Move old `dashboard.html` to `public/dashboard.html`
   - Or use the new enhanced version

4. Add GitHub Actions (optional):
   - Copy `.github/workflows/daily-scheduler.yml`
   - Add `AGENT_URL` secret to GitHub

5. Test deployment:
   ```bash
   npm start
   # Access http://localhost:3000
   # Click "Test Holiday Check"
   ```

---

## [1.0.0] - Initial Release

- Basic holiday detection
- Google Gemini AI integration
- Discord webhook support
- Simple dashboard
- Nager.Date API integration
- Basic scheduling with node-cron

---

## Roadmap

### v2.1 (Planned)
- [ ] Database integration (Supabase/PostgreSQL)
- [ ] Multi-server support
- [ ] Custom holiday templates
- [ ] Webhook health monitoring
- [ ] Enhanced analytics dashboard
- [ ] Mobile app

### v2.2 (Future)
- [ ] Discord.js bot integration
- [ ] Slash commands
- [ ] Interactive embeds
- [ ] User preferences
- [ ] Multi-language support

### v3.0 (Vision)
- [ ] Voice announcements
- [ ] AI conversation mode
- [ ] Advanced analytics
- [ ] Machine learning for message optimization
- [ ] Multi-platform support (Slack, Teams, etc.)

---

## Contributors

- **Raj Aryan** - Initial development and v2.0 enhancements

## License

MIT License - see [LICENSE](LICENSE) file

---

**Version 2.0.0 represents a major overhaul with focus on reliability, deployment ease, and user experience.**
