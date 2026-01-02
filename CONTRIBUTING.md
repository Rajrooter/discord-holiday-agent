# Contributing to Discord Holiday AI Agent

First off, thank you for considering contributing to Discord Holiday AI Agent! It's people like you that make this tool better for everyone.

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. Be respectful, inclusive, and considerate in all interactions.

## 🐛 Found a Bug?

If you find a bug in the source code, you can help by submitting an issue to our GitHub Repository. Even better, you can submit a Pull Request with a fix.

### Before Submitting a Bug Report

- **Check the documentation** - Make sure you've read the README and guides
- **Search existing issues** - Your bug might already be reported
- **Update to latest version** - Bug might be already fixed
- **Isolate the problem** - Create a minimal test case

### How to Submit a Bug Report

1. **Use GitHub Issues**
2. **Provide a clear title** - "Custom announcement fails with 404 error"
3. **Describe the issue**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
4. **Environment details**:
   - OS and version
   - Node.js version
   - Bot version
5. **Logs** (sanitize sensitive data!):
   - Terminal output
   - Browser console errors
   - Activity log entries

**Example:**
```markdown
### Bug: Webhook returns 404 error

**Steps to reproduce:**
1. Configure WEBHOOK_ANNOUNCEMENTS in .env
2. Start bot with `npm start`
3. Send custom announcement
4. Error appears: "Request failed with status code 404"

**Expected:** Announcement sent to Discord
**Actual:** 404 error

**Environment:**
- OS: Ubuntu 20.04
- Node: v18.12.0
- Bot: v2.0.0

**Logs:**
[2025-01-02T...] [ERROR] Custom announcement failed: Request failed with status code 404
```

## 💡 Have a Feature Request?

We love feature ideas! Here's how to suggest one:

1. **Search existing issues** - Someone might have suggested it
2. **Create a new issue** with label "enhancement"
3. **Describe the feature**:
   - What problem does it solve?
   - How should it work?
   - Any implementation ideas?
4. **Provide examples** if possible

## 🔧 Want to Contribute Code?

### Setup Development Environment

1. **Fork the repository**
```bash
# Click "Fork" button on GitHub
```

2. **Clone your fork**
```bash
git clone https://github.com/YOUR-USERNAME/discord-holiday-agent.git
cd discord-holiday-agent
```

3. **Create a branch**
```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

4. **Install dependencies**
```bash
npm install
```

5. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your test credentials
```

6. **Make your changes**
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Test thoroughly

7. **Test your changes**
```bash
npm start
# Test all affected features
```

### Code Style Guidelines

**JavaScript:**
- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Descriptive variable names
- Comments for non-obvious code

**Example:**
```javascript
// Good
async function sendAnnouncement(data) {
  const { title, message } = data;
  
  // Validate required fields
  if (!message) {
    return { success: false, error: 'Message required' };
  }
  
  // Send to webhook
  const result = await sendToWebhook(message);
  return result;
}

// Avoid
async function send(d) {
  if(!d.message) return {success:false,error:'Message required'}
  return await sendToWebhook(d.message)
}
```

**HTML/CSS:**
- Semantic HTML5
- BEM or similar methodology for CSS
- Mobile-responsive
- Accessible (ARIA labels, etc.)

### Commit Message Guidelines

Use clear, descriptive commit messages:

**Format:**
```
type: short description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add support for custom holiday dates

Users can now define custom holidays in addition to
automatic holiday detection.

Closes #45
```

```
fix: handle rate limit errors gracefully

Previously, rate limit errors would crash the bot.
Now falls back to original message without AI.

Fixes #78
```

### Pull Request Process

1. **Update documentation** if needed
2. **Test thoroughly**:
   - Manual testing
   - All features still work
   - No new errors
3. **Create Pull Request**:
   - Clear title
   - Detailed description
   - Link related issues
   - Screenshots/GIFs if UI changes
4. **Respond to reviews**:
   - Address feedback promptly
   - Ask questions if unclear
   - Make requested changes
5. **Wait for approval** from maintainers

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step one
2. Step two
3. Expected result

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tested locally
- [ ] No breaking changes (or documented)

## Related Issues
Fixes #123
```

## 📚 Documentation Contributions

Documentation is just as important as code!

**How to help:**
- Fix typos and grammar
- Add examples
- Clarify confusing sections
- Translate to other languages
- Create video tutorials
- Write blog posts

## 🎨 Design Contributions

Help improve the UI/UX:
- Dashboard redesigns
- Icon suggestions
- Color scheme improvements
- Mobile responsiveness
- Accessibility enhancements

## 🧪 Testing Help

- Test on different OS/platforms
- Report bugs you find
- Verify bug fixes
- Test new features
- Performance testing

## 💬 Community Support

- Answer questions in Issues
- Help others in Discussions
- Share usage tips
- Write tutorials
- Spread the word!


```

### Key Components

**agent.js:**
- Configuration setup
- Holiday API integration
- Google Gemini AI integration
- Discord webhook handling
- Cron scheduling
- Express API server

**dashboard.html:**
- Web UI
- API client
- Real-time updates
- Form handling

## 🔍 Development Tips

### Testing Webhooks
```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}'
```

### Debugging
```javascript
// Add debug logging
console.log('[DEBUG]', variable);

// Or use the built-in logger
log('Debug message', 'INFO');
```

### Testing AI
```javascript
// Test AI without sending to Discord
const enhanced = await enhanceCustomMessage("Test message");
console.log(enhanced);
```

## 📝 Changelog

When contributing, update CHANGELOG.md:

```markdown
## [Unreleased]
### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Modified behavior description
```

## 🎯 Good First Issues

New contributors should look for:
- Documentation improvements
- UI/UX enhancements
- Adding error messages
- Code comments
- Example additions
- Test coverage

Label: `good-first-issue`

## 💡 Project Ideas

Want to make a bigger contribution? Consider:

### High Priority
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Multi-server support
- [ ] Announcement templates
- [ ] Recurring schedules
- [ ] Better error handling

### Medium Priority
- [ ] Discord.js bot integration
- [ ] Custom holiday creation
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Docker support

### Nice to Have
- [ ] Multi-language support
- [ ] More holiday sources
- [ ] Announcement history
- [ ] User permissions
- [ ] Webhook health checks

## 🤔 Questions?

- Open a Discussion on GitHub
- Check existing documentation
- Ask in Issues (with question label)
- Reach out to maintainers

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in documentation
- Appreciated by the community!

---

**Thank you for contributing! 🎉**
