# Cloudflare Pages Deployment Troubleshooting Guide

## Project Info
- **Repository:** `9kkjpgv47s-cpu/css-projects`
- **Live Site:** `https://cssolutions.services`
- **Cloudflare Pages URL:** `https://cssolutions.pages.dev`
- **Cloudflare Project Name:** `cssolutions` (NOT css-projects!)
- **Project Type:** Static HTML/CSS/JS site

---

## CRITICAL: Project Name Mismatch Issue (December 28, 2025)

### The Problem
The GitHub repository is named `css-projects` but the Cloudflare Pages project is named `cssolutions`. This mismatch caused deployment failures for hours.

### What Was Wrong
1. `wrangler.jsonc` had `"name": "css-projects"` (wrong)
2. Cloudflare deploy command used `--project-name=css-projects` (wrong)
3. These referenced a project that doesn't exist

### The Fix
1. Changed `wrangler.jsonc` to `"name": "cssolutions"`
2. Changed Cloudflare deploy command to `--project-name=cssolutions`
3. Added `Cloudflare Pages: Edit` permission to API token

---

## Required Files

### wrangler.jsonc (in repo root)
```json
{
  "name": "cssolutions",
  "pages_build_output_dir": "./"
}
```

**CRITICAL:** The `name` field MUST match your Cloudflare Pages project name exactly!

---

## Cloudflare Dashboard Settings

### Location
Cloudflare Dashboard → Workers & Pages → **cssolutions** → Settings → Builds & deployments

### Production Settings (CORRECT)
| Field | Value |
|-------|-------|
| Build command | `exit 0` |
| Build output directory | `/` |
| Deploy command | `npx wrangler pages deploy ./ --project-name=cssolutions` |

### Non-Production (Preview) Settings
| Field | Value |
|-------|-------|
| Build command | `exit 0` |
| Build output directory | `/` |
| Deploy command | `npx wrangler versions upload` |

---

## December 28, 2025 - Full Troubleshooting Journey

### Symptoms
- Changes pushed to GitHub weren't appearing on `cssolutions.services`
- `cssolutions.pages.dev` sometimes showed updates, custom domain didn't
- Cloudflare builds were failing silently or doing nothing

### Investigation Steps Taken

#### Step 1: Verified Local Code
```powershell
cd C:\Users\domje\css-projects
git status  # Clean, up to date
git log --oneline -5  # Showed v2.2 commits
```
**Result:** Local code was correct (v2.2)

#### Step 2: Verified GitHub
Checked `https://raw.githubusercontent.com/9kkjpgv47s-cpu/css-projects/main/index.html`
**Result:** GitHub had v2.2 correctly

#### Step 3: Compared Live Sites
- `cssolutions.pages.dev` - Had some updates
- `cssolutions.services` - Serving OLD content
- Different ETags confirmed different files being served

**Result:** Custom domain zone has separate cache from Pages project

#### Step 4: Checked Deploy Command
Found the deploy command in Cloudflare was set to just `true` (does nothing!)

#### Step 5: Discovered Project Name Mismatch
- `wrangler.jsonc` said `"name": "css-projects"`
- Cloudflare project is actually named `cssolutions`
- Deploy command used `--project-name=css-projects`
- This project doesn't exist!

### What DIDN'T Work (Attempted Fixes That Failed)

#### 1. Purging Cloudflare Cache
- Used "Purge All" in Cloudflare dashboard
- **Why it failed:** The problem wasn't caching - deployments weren't happening at all

#### 2. Cache-Buster URLs
- Added `?v=timestamp` to URLs
- **Why it failed:** Only showed that Pages URL had updates but custom domain didn't

#### 3. Browser Cache Clearing
- Cleared phone browser history, used incognito
- **Why it failed:** The server was literally serving old files

#### 4. Setting Deploy Command to `npx wrangler deploy`
- This is the WORKERS command, not Pages!
- **Error:** "It looks like you've run a Workers-specific command in a Pages project"

#### 5. Using Wrong Project Name
- Deploy command: `npx wrangler pages deploy ./ --project-name=css-projects`
- **Error:** "Project not found. The specified project name does not match any of your existing projects. [code: 8000007]"

### What FINALLY Worked

#### Fix 1: Correct the wrangler.jsonc
Changed from:
```json
{
  "name": "css-projects",
  "pages_build_output_dir": "./"
}
```

To:
```json
{
  "name": "cssolutions",
  "pages_build_output_dir": "./"
}
```

#### Fix 2: Correct the Deploy Command
Changed from:
```
npx wrangler pages deploy ./ --project-name=css-projects
```

To:
```
npx wrangler pages deploy ./ --project-name=cssolutions
```

#### Fix 3: API Token Permissions
Added `Cloudflare Pages: Edit` permission to the API token in Cloudflare dashboard.

**Build succeeded after all three fixes!**

---

## Common Errors and Fixes

### Error: "Project not found" [code: 8000007]
**Cause:** `--project-name` doesn't match your actual Cloudflare Pages project
**Fix:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Find the EXACT name of your project (it's `cssolutions`, not `css-projects`)
3. Update both `wrangler.jsonc` and deploy command to use correct name

### Error: "It looks like you've run a Workers-specific command in a Pages project"
**Cause:** Using `npx wrangler deploy` (Workers) instead of Pages command
**Fix:** Change to `npx wrangler pages deploy ./ --project-name=cssolutions`

### Error: "Missing pages_build_output_dir field"
**Cause:** `wrangler.jsonc` file is missing or malformed
**Fix:** Create `wrangler.jsonc` in repo root with correct content (see above)

### Error: Deployment not updating / showing old content
**Cause:** Multiple possible causes - investigate in order:
1. Check if builds are actually running (Cloudflare Dashboard → Deployments)
2. Check if builds are succeeding or failing
3. Check deploy command is correct
4. Check project name matches
5. Check API token has Pages permissions
6. THEN try cache purge

### Error: "CLOUDFLARE_API_TOKEN environment variable" required
**Cause:** Running wrangler from Claude Code's shell (not logged in)
**Fix:** Run in YOUR PowerShell where you logged in via `npx wrangler login`

### Error: API token lacks permissions
**Cause:** Token was created for Workers, not Pages
**Fix:** In Cloudflare Dashboard → My Profile → API Tokens, edit the token and add:
- `Cloudflare Pages: Edit` permission

---

## Manual Deployment (Emergency Fix)

If auto-deployment fails, run this in YOUR PowerShell:
```powershell
cd C:\Users\domje\css-projects
npx wrangler pages deploy ./
```

**Note:** You must be logged into wrangler first via `npx wrangler login`

This bypasses Cloudflare's build system and deploys directly from your local files.

---

## Debugging Checklist

When deployment breaks, check these IN ORDER:

1. [ ] **Are builds running?** Check Cloudflare Dashboard → Deployments
2. [ ] **Are builds succeeding?** Look for green checkmarks or red X
3. [ ] **Is wrangler.jsonc correct?** Must have `"name": "cssolutions"`
4. [ ] **Is deploy command correct?** Must be `npx wrangler pages deploy ./ --project-name=cssolutions`
5. [ ] **Does API token have Pages permission?** Check token settings
6. [ ] **Are changes pushed to GitHub?** Run `git status` - should be clean
7. [ ] **Is the correct branch deploying?** Should be `main`
8. [ ] **THEN try cache purge** Only after confirming deployment succeeded

---

## Key Differences: Workers vs Pages

| Aspect | Workers | Pages |
|--------|---------|-------|
| Deploy command | `npx wrangler deploy` | `npx wrangler pages deploy ./` |
| Config field | `main: "src/index.js"` | `pages_build_output_dir: "./"` |
| Use case | Serverless functions | Static sites |
| Project URL | `project.workers.dev` | `project.pages.dev` |

**This project is PAGES, not Workers!**

---

## Project Structure

```
css-projects/                    # GitHub repo name
├── index.html                   # Main website file (single file with CSS/JS)
├── wrangler.jsonc               # Cloudflare config (name: "cssolutions")
├── README.md                    # Project readme
├── .gitignore                   # Git ignore file
└── claude fixes/                # Troubleshooting documentation
    └── web-deployment-troubleshooting.md
```

**Important:** The GitHub repo is `css-projects` but the Cloudflare project is `cssolutions`. Don't confuse them!

---

## Git Commands Reference

```powershell
# Check status
git status

# Add all changes
git add -A

# Commit with message
git commit -m "Your message here"

# Push to GitHub (triggers auto-deploy)
git push

# View recent commits
git log --oneline -5

# Check remote URL
git remote -v
```

---

## Useful URLs

| Resource | URL |
|----------|-----|
| Live Site | https://cssolutions.services |
| Pages URL | https://cssolutions.pages.dev |
| GitHub Repo | https://github.com/9kkjpgv47s-cpu/css-projects |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Cloudflare Pages Docs | https://developers.cloudflare.com/pages/ |
| Wrangler Docs | https://developers.cloudflare.com/workers/wrangler/ |

---

## THE REAL ROOT CAUSE (December 28, 2025 - Final Discovery)

### The Ultimate Problem
The custom domain `cssolutions.services` was attached to the **WRONG Cloudflare project**!

- Custom domain was on: `css-projects` (a Worker)
- Deployments were going to: `cssolutions` (the Pages project)

This meant ALL deployments to the Pages project were invisible on the custom domain because the domain was looking at a completely different project!

### How This Happened
1. There were TWO projects with similar names: `css-projects` (Worker) and `cssolutions` (Pages)
2. The custom domain got attached to the Worker instead of the Pages project
3. Every deployment to Pages worked fine (`cssolutions.pages.dev` showed updates)
4. But `cssolutions.services` never updated because it was pointing elsewhere

### Symptoms That Should Have Been a Clue
- `cssolutions.pages.dev` showed v2.4 ✅
- `cssolutions.services` showed ancient content ❌
- Cache purges had no effect (because we were purging the wrong thing)
- `CF-Cache-Status: HIT` with `cfOrigin;dur=0` (never hitting origin)

### The Fix
1. **Removed** custom domain from `css-projects` Worker
2. **Deleted** any DNS records in the zone
3. **Re-added** custom domain to `cssolutions` Pages project
4. Cloudflare auto-configured: `@ CNAME → cssolutions.pages.dev`

### How to Verify Custom Domain is on Correct Project
```
Cloudflare Dashboard → Workers & Pages → [project name] → Custom domains tab
```
Make sure your domain is listed under the CORRECT project!

### After the Fix
| Header | Before | After |
|--------|--------|-------|
| CF-Cache-Status | HIT (stale) | DYNAMIC (fresh) |
| cfOrigin;dur | 0 (never hit) | 146+ (hitting origin) |

---

## Lessons Learned

1. **Project names matter** - The Cloudflare project name must match exactly in wrangler.jsonc and deploy commands
2. **Don't assume caching** - When deployments don't appear, check if deployments are actually happening first
3. **Workers vs Pages** - Using the wrong command type causes confusing errors
4. **Check the basics first** - Build logs in Cloudflare dashboard show exactly what's failing
5. **API tokens need correct permissions** - Pages needs `Pages: Edit`, not just `Workers: Edit`
6. **VERIFY CUSTOM DOMAIN ATTACHMENT** - If pages.dev works but custom domain doesn't, the domain might be attached to the WRONG project! Always verify in Workers & Pages → [project] → Custom domains
7. **Multiple similar projects are dangerous** - Having `css-projects` and `cssolutions` caused confusion. Consider consolidating or using distinct names.

---

## Quick Diagnostic Checklist

If custom domain shows old content but pages.dev shows new content:

1. [ ] **Check which project the custom domain is attached to**
   - Go to Workers & Pages → each project → Custom domains
   - Verify domain is on the CORRECT project
2. [ ] Check deploy command has correct `--project-name`
3. [ ] Check `wrangler.jsonc` has correct `name`
4. [ ] Check HTTP headers: `cfOrigin;dur=0` means origin is never contacted
5. [ ] Try the full reset: remove domain, delete DNS, re-add through Pages

---

*Last Updated: December 28, 2025*
*Updated after discovering custom domain was attached to wrong project (css-projects Worker vs cssolutions Pages)*
