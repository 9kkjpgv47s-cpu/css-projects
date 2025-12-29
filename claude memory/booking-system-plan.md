# Booking System Plan - Catalyst Strategy Solutions

*Created: December 28, 2025*

---

## Overview

Custom booking system for cssolutions.services that replaces Calendly. Goal is to keep visitors on-site with a professional, branded experience while capturing contact info for sales pipeline.

---

## System Type

**Request-Based Booking**
- Visitor submits a meeting request
- Dominic reviews and approves (plans to approve all)
- Approval step ensures contact info is captured for future sales
- Upon approval: calendar event created + confirmation email sent to visitor

---

## Form Fields (What Visitors Provide)

1. **Name**
2. **Business name**
3. **Email** (for confirmation)
4. **Preferred date** (calendar picker)
5. **Preferred time** (time slot selection)
6. **Duration** (dropdown)
7. **Reason for reaching out** (text or dropdown)

---

## Booking Parameters

| Setting | Value |
|---------|-------|
| Duration options | 15 / 30 / 45 / 60 minutes |
| Available hours | Anytime (no restrictions) |
| Buffer between meetings | None |
| Booking window | 1 month out from today |
| Calendar conflict checking | None - show all times |

---

## Approval Method

**Still to decide:**
- Option A: Email with Approve button
- Option B: Dashboard page on site
- Option C: Both

---

## Technical Architecture

### Frontend (on website)
- Custom-designed booking section matching site aesthetic
- Calendar date picker
- Time slot selector
- Duration dropdown
- Contact form fields
- Styled to match dark theme of cssolutions.services

### Backend (Cloudflare Worker)
- Receives form submissions
- Stores pending requests (Cloudflare KV or D1)
- Sends notification email to Dominic
- Handles approval action
- Creates calendar event via Microsoft Graph API
- Sends confirmation email to visitor

### Microsoft Integration
- Azure AD app registration required
- Microsoft Graph API for calendar access
- OAuth tokens stored securely
- Read/write calendar permissions

---

## User Flows

### Visitor Flow
1. Lands on booking section
2. Selects date from calendar (up to 1 month out)
3. Picks time slot
4. Chooses duration (15/30/45/60 min)
5. Fills in: Name, Business, Email, Reason
6. Submits request
7. Sees confirmation: "Request submitted - you'll receive a confirmation email when approved"
8. Receives confirmation email once Dominic approves

### Dominic's Flow
1. Receives notification of new request (email or dashboard)
2. Sees all contact details + requested time
3. Clicks Approve
4. System creates Outlook calendar event
5. System sends confirmation to visitor
6. Contact info saved for sales pipeline

---

## Microsoft 365 Setup Required

1. Log into Azure Portal (portal.azure.com)
2. Register a new application in Azure AD
3. Grant permissions: Calendars.ReadWrite, Mail.Send
4. Generate client secret
5. Store credentials in Cloudflare Worker secrets

*Claude will walk through this step-by-step when ready to implement*

---

## Files to Create/Modify

- `index.html` - Add booking section (or create separate booking.html)
- Cloudflare Worker - Backend API for handling requests
- Cloudflare KV/D1 - Store pending requests
- Azure AD App - Microsoft integration

---

## Design Notes

- Match existing dark theme (--bg-primary: #1f1f2e, etc.)
- Use existing accent blue (#3b82f6)
- Geometric shapes behind booking section (like rest of site)
- Mobile responsive
- Professional, clean aesthetic

---

## Status

**Planning phase** - All specifications gathered, ready to implement when Dominic gives the go-ahead.

---

## Next Steps

1. Decide on approval method (email buttons vs dashboard vs both)
2. Set up Azure AD app for Microsoft integration
3. Build the frontend booking UI
4. Create Cloudflare Worker backend
5. Test end-to-end flow
6. Deploy and remove Calendly links
