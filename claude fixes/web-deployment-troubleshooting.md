# Cloudflare Pages Deployment Troubleshooting Guide

## Project Info
- **Repository:** `9kkjpgv47s-cpu/css-projects`
- **Live Site:** `https://cssolutions.services`
- **Cloudflare Pages URL:** `https://css-projects.pages.dev`
- **Project Type:** Static HTML/CSS/JS site

---

## The Root Cause of Deployment Issues

### Problem
The Cloudflare project `css-projects` was created as a **Worker** instead of a **Pages** project. This caused:
1. Deployment commands to fail with "Workers-specific command in a Pages project" error
2. Missing configuration errors
3. Need for explicit deploy commands instead of auto-deployment

### Solution
A `wrangler.jsonc` file with `pages_build_output_dir` tells Cloudflare to treat it as a Pages project.

---

## Required Files

### wrangler.jsonc (in repo root)
```json
{
  "name": "css-projects",
  "pages_build_output_dir": "./"
}
```

**IMPORTANT:** This file MUST exist in the repo for deployments to work correctly.

---

## Cloudflare Dashboard Settings

### Location
Cloudflare Dashboard → Workers & Pages → css-projects → Settings → Builds & deployments

### Production Settings
| Field | Value |
|-------|-------|
| Build command | `exit 0` |
| Build output directory | `/` |
| Deploy command | `npx wrangler pages deploy ./ --project-name=css-projects` |

### Non-Production (Preview) Settings
| Field | Value |
|-------|-------|
| Build command | `exit 0` |
| Build output directory | `/` |
| Deploy command | `npx wrangler versions upload` |

---

## Common Errors and Fixes

### Error: "It looks like you've run a Workers-specific command in a Pages project"
**Cause:** Deploy command is `npx wrangler deploy` (Workers) instead of Pages command
**Fix:** Change deploy command to `npx wrangler pages deploy ./ --project-name=css-projects`

### Error: "Must specify a project name"
**Cause:** Deploy command missing `--project-name` flag
**Fix:** Add `--project-name=css-projects` to the deploy command

### Error: "Missing pages_build_output_dir field"
**Cause:** `wrangler.jsonc` file is missing or has wrong format
**Fix:** Create `wrangler.jsonc` in repo root with:
```json
{
  "name": "css-projects",
  "pages_build_output_dir": "./"
}
```

### Error: Deployment not updating / showing old content
**Cause:** Changes not pushed to GitHub, or Cloudflare cache
**Fix:**
1. Verify changes are pushed: `git status` should show "working tree clean"
2. Check git log: `git log --oneline -3` to see recent commits
3. Manually trigger deployment in Cloudflare dashboard
4. Clear browser cache or use incognito mode

### Error: "CLOUDFLARE_API_TOKEN environment variable" required
**Cause:** Running wrangler deploy from Claude Code's shell (not logged in)
**Fix:** Run the command in YOUR PowerShell terminal where you logged in via `npx wrangler login`, OR use the Cloudflare dashboard to trigger deployment

---

## Manual Deployment (from your terminal)

If auto-deployment fails, run this in PowerShell:
```powershell
cd C:\Users\domje\css-projects
npx wrangler pages deploy ./
```

**Note:** You must be logged into wrangler first via `npx wrangler login`

---

## Project Structure

```
css-projects/
├── index.html          # Main website file
├── wrangler.jsonc      # Cloudflare Pages config (REQUIRED)
├── README.md           # Project readme
├── .gitignore          # Git ignore file
└── claude fixes/       # Troubleshooting documentation
    └── web-deployment-troubleshooting.md
```

---

## Static Site vs Worker vs Pages

| Type | Use Case | Needs wrangler.jsonc? | Deploy Command |
|------|----------|----------------------|----------------|
| Static Site on Pages | HTML/CSS/JS only | Yes (with `pages_build_output_dir`) | `npx wrangler pages deploy ./` |
| Pages with Build | React, Next.js, etc. | Optional | Build command like `npm run build` |
| Worker | Serverless functions | Yes (with `main`) | `npx wrangler deploy` |

**This project is a Static Site on Pages** - no build step, just serves files directly.

---

## Quick Fix Checklist

If deployment breaks again:

1. [ ] Check `wrangler.jsonc` exists in repo root
2. [ ] Verify it contains `"pages_build_output_dir": "./"`
3. [ ] Check Cloudflare deploy command is `npx wrangler pages deploy ./ --project-name=css-projects`
4. [ ] Make sure changes are committed and pushed to GitHub
5. [ ] Try manual deployment: `npx wrangler pages deploy ./` in your terminal

---

## Git Commands Reference

```powershell
# Check status
git status

# Add all changes
git add -A

# Commit with message
git commit -m "Your message here"

# Push to GitHub
git push

# View recent commits
git log --oneline -5
```

---

## Contact/Resources

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- GitHub Repo: https://github.com/9kkjpgv47s-cpu/css-projects

---

*Last Updated: December 27, 2025*
*Created after resolving Worker vs Pages deployment confusion*
