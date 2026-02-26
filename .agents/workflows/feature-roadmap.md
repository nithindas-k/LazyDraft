---
description: LazyDraft Feature Roadmap — Implementation Plan
---

# LazyDraft — Full Feature Implementation Plan

## Stack Reference
- **Backend**: Node.js + Express + TypeScript + MongoDB (Mongoose) + googleapis
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind + Framer Motion + Recharts
- **AI**: Groq SDK (LLaMA 3)
- **Auth**: Google OAuth2 + JWT
- **Email**: Gmail API (googleapis)

---

## Phase 1 — Email Form Upgrades (Week 1)

### 1.1 CC / BCC Support

**Backend changes:**
- `IMailEntity` interface: add `cc?: string` and `bcc?: string` fields
- `MailModel.ts`: add `cc` and `bcc` as optional String fields
- `MailController.sendEmail`: extract `cc`, `bcc` from `req.body`
- `GmailVendor.sendEmail`: add `Cc:` and `Bcc:` headers to the MIME message

**Frontend changes:**
- `MagicFillForm.tsx`: add optional `cc` and `bcc` `FormField` inputs below "To"
- Schema: add `cc: z.string().email().optional()`, `bcc: z.string().email().optional()`
- Collapsed by default — show via a "+ Add CC/BCC" text button (shadcn `Button` variant="ghost")
- Animate in with Framer Motion `AnimatePresence`

**Security:**
- Validate CC/BCC email format on both frontend (Zod) and backend
- Never expose CC/BCC to other recipients in response payload

---

### 1.2 Email Preview

**Frontend only:**
- Add a "Preview" button next to "Send Email" in the draft form
- Opens a shadcn `Sheet` (slide-in panel from the right)
- Inside `Sheet`: render an `iframe` with `srcDoc` set to a formatted HTML email template
- HTML template uses the subject, from, to, cc, body values from the form
- Styled to mimic a Gmail-like layout (white card, sender info header, body text)
- No backend changes needed

**Component:** `EmailPreviewSheet.tsx`
```
<Sheet>
  <SheetTrigger> Preview </SheetTrigger>
  <SheetContent side="right" className="w-full sm:max-w-2xl">
    <iframe srcDoc={emailHtml} ... />
  </SheetContent>
</Sheet>
```

---

### 1.3 Draft Saving (Auto-save)

**Frontend only (localStorage):**
- `useDraftSave` custom hook — debounced `useEffect` watching form values
- Saves to `localStorage` key `lazydraft_draft` every 2 seconds of inactivity
- On mount: if draft exists, show a shadcn `Alert` banner "You have a saved draft — Restore?" with Restore / Dismiss buttons
- On successful send: clear the draft key

**Component additions:**
- `DraftRestoreBanner.tsx` — shadcn `Alert` with `AlertDescription`, restore/dismiss buttons
- `useDraftSave.ts` hook in `src/hooks/`

---

### 1.4 Email Templates

**Backend:**
```
New Model: TemplateModel.ts
  - userId: ObjectId (ref User)
  - name: string (template display name)
  - to: string
  - subject: string
  - body: string
  - createdAt: Date

New routes (prefix /api/v1/templates):
  POST   /templates          → create template
  GET    /templates          → list user's templates
  DELETE /templates/:id      → delete template
```

**Frontend:**
- New page: `src/pages/user/Templates.tsx`
- Sidebar link: "Templates" with `LayoutTemplate` icon
- From `MagicFillForm`: a "Use Template" button opens a shadcn `Dialog` showing a list of the user's templates
- Clicking a template populates the form fields instantly
- Save as Template: a ghost button below the draft form — opens a Dialog to enter template name

**Security:**
- `isAuthenticated` middleware on all template routes
- Repository pattern: `TemplateRepository` + `ITemplateRepository`

---

## Phase 2 — AI Upgrades (Week 2)

### 2.1 Tone Selector

**Frontend:**
- Add a `Select` (shadcn) component to the Magic Fill card
- Options: `Formal` | `Casual` | `Friendly` | `Assertive` | `Apologetic`
- Default: `Formal`
- Passes `tone` to the parse API

**Backend:**
- `parseText` controller: extract `tone` from `req.body`
- `AIService.parseUnstructuredText(text, fromEmail, tone?)`: inject tone into the Groq prompt
- Prompt addition: `"Write in a ${tone} tone. ..."`

---

### 2.2 Email Length Control

**Frontend:**
- Add a shadcn `Slider` component (1–3 range) with labels: Short / Medium / Detailed
- Maps to word targets: Short=100w, Medium=200w, Detailed=400w
- Passes `length` value to parse API

**Backend:**
- Inject into Groq prompt: `"Keep the email body to approximately ${wordCount} words."`

---

### 2.3 Multi-Language Support

**Frontend:**
- `Select` dropdown below tone selector
- Options: English, Arabic (RTL), French, Hindi, Spanish, German, Tamil
- Default: English
- For Arabic: detect `lang === 'ar'` and add `dir="rtl"` to the body textarea

**Backend:**
- Add `language` to Groq prompt: `"Write the email in ${language}."`

---

### 2.4 Smart Subject Suggestion

**Frontend:**
- After AI generates the email, show 3 subject alternatives in a popover below the Subject field
- User can click one to replace the current subject
- Powered by a second small AI call

**Backend:**
- New endpoint: `POST /api/v1/mail/ai/suggest-subjects`
- Takes `body` text, returns array of 3 subject string options
- Groq prompt: "Generate 3 alternative professional email subject lines for this email body: [body]. Return as JSON array."

**Component:** `SubjectSuggestions.tsx` — shadcn `Popover` with 3 clickable `Badge` options

---

## Phase 3 — Analytics Upgrades (Week 3)

### 3.1 Sent Email Analysis

**No new API needed** — uses existing `GET /mail/history`

**Frontend additions to `GmailAnalytics.tsx`:**
- "Your Sent Emails" section below inbox charts
- Line chart: Sent emails per day (last 30 days from DB history)
- Bar chart: Sent vs Failed ratio
- Stat card: Success rate %

---

### 3.2 Response Rate Tracking

**Backend:**
- New field on `MailModel`: `repliedAt?: Date`
- New endpoint: `GET /api/v1/mail/check-replies`
  - Fetches user's SENT emails from Gmail API matching subjects
  - Uses `gmail.users.threads.list` to find threads with more than 1 message
  - Marks those emails as replied in MongoDB

**Frontend:**
- Response rate stat card in analytics
- History page: show a "Replied ↩" badge on emails that got a reply

---

### 3.3 Best Time to Send

**Frontend only (computed from existing data):**
- Analyse `createdAt` timestamps of SENT emails in history
- Group by hour of day
- Show a heatmap or bar chart: "Most emails sent at X:00"
- Show reply-time data if response rate tracking is enabled

**Component:** `BestTimeSend.tsx` — recharts `BarChart` grouped by hour (0–23)

---

### 3.4 Export Report (PDF / CSV)

**Frontend only:**
- CSV: use native browser `Blob` API — convert analytics data to CSV string and trigger download
- PDF: use `jsPDF` + `html2canvas` — screenshot the analytics section and embed as PDF

**Dependencies to install:**
```bash
npm install jspdf html2canvas
```

**UI:** An "Export" dropdown in the Analytics header:
- shadcn `DropdownMenu` with two options: "Download CSV" and "Download PDF"

---

## Phase 4 — Notifications & Receipts (Week 4)

### 4.1 Email Read Receipt

**Mechanism:**
- Embed a 1×1 transparent tracking pixel in the email HTML body:
  ```html
  <img src="https://your-api.com/api/v1/track/open?id={mailId}" width="1" height="1" />
  ```
- New backend route: `GET /api/v1/track/open?id=:mailId` (public endpoint)
  - Updates `MailModel.openedAt = new Date()` silently
  - Returns a 1×1 GIF response

**Frontend:**
- History page: show "Opened 👁" badge if `openedAt` exists
- Analytics: new "Open Rate" stat card

**Security note:**
- This endpoint must be public (no auth) — it's called by recipient's email client
- Rate-limit it with `express-rate-limit` to avoid abuse
- Do not expose any sensitive data from this endpoint

---

### 4.2 In-App Notifications (Toast Alerts)

**Frontend:**
- shadcn `Sonner` toast (already available in shadcn) — or `useToast` hook
- Toast on email send success: "✅ Email sent to [recipient]!"
- Toast on email send failure: "❌ Failed to send. Try again."
- Toast on Magic Fill complete: "✨ AI draft ready!"
- Toast on template saved: "💾 Template saved."

**Global setup:**
- Add `<Toaster />` to `App.tsx` once
- Call `toast.success(...)` / `toast.error(...)` from service handlers

---

## Database Schemas Summary

```typescript
// TemplateModel.ts
{
  userId:    ObjectId  // ref: User (indexed)
  name:      String    // "Leave Request Template"
  to:        String
  subject:   String
  body:      String
  createdAt: Date
}

// MailModel.ts (additions)
{
  cc:        String?   // optional CC email
  bcc:       String?   // optional BCC email
  openedAt:  Date?     // set when tracking pixel loaded
  repliedAt: Date?     // set when reply detected
  scheduledAt: Date?   // for future scheduled send feature
  tone:      String?   // tone used for AI generation
  language:  String?   // language used for AI generation
}
```

---

## API Routes Summary

```
# Existing + New

POST   /api/v1/mail/ai/parse              ← add tone, language, length params
POST   /api/v1/mail/ai/suggest-subjects   ← NEW: returns 3 subject suggestions
POST   /api/v1/mail/send                  ← add cc, bcc params
GET    /api/v1/mail/history               ← unchanged
GET    /api/v1/mail/gmail/analytics       ← existing (Phase 1)
GET    /api/v1/mail/check-replies         ← NEW: update repliedAt fields

POST   /api/v1/templates                  ← NEW: create template
GET    /api/v1/templates                  ← NEW: list user templates
DELETE /api/v1/templates/:id              ← NEW: delete template

GET    /api/v1/track/open?id=:mailId      ← NEW: tracking pixel (public)
```

---

## UI Components To Build

| Component | shadcn Used | Page |
|-----------|-------------|------|
| `CcBccFields.tsx` | `FormField`, `Input`, `Button ghost` | MagicFillForm |
| `EmailPreviewSheet.tsx` | `Sheet`, `SheetContent`, iframe | MagicFillForm |
| `DraftRestoreBanner.tsx` | `Alert`, `AlertDescription` | MagicFillForm |
| `TemplateDialog.tsx` | `Dialog`, `DialogContent`, `ScrollArea` | MagicFillForm |
| `Templates.tsx` | `Card`, `Table`, `Badge`, `Button` | New Page |
| `ToneSelector.tsx` | `Select`, `SelectItem` | MagicFillForm |
| `LengthSlider.tsx` | `Slider`, `Label` | MagicFillForm |
| `LanguageSelect.tsx` | `Select` | MagicFillForm |
| `SubjectSuggestions.tsx` | `Popover`, `Badge` | MagicFillForm |
| `BestTimeSend.tsx` | Recharts `BarChart` | GmailAnalytics |
| `ExportDropdown.tsx` | `DropdownMenu` | GmailAnalytics |
| `NotificationToaster.tsx` | `Toaster` from shadcn/sonner | App.tsx |

---

## Security Checklist

- [ ] All protected routes use `isAuthenticated` middleware
- [ ] Template endpoints validate `userId` ownership before delete
- [ ] Tracking pixel endpoint: rate-limited, returns only a 1×1 GIF
- [ ] CC/BCC: validated with Zod on frontend + express-validator on backend
- [ ] No raw email bodies stored — only metadata
- [ ] Gmail tokens stored encrypted in MongoDB (future: add bcrypt or vault)
- [ ] All API inputs sanitised to prevent injection
- [ ] CORS locked to frontend origin only

---

## Build Order (Recommended)

```
Week 1: CC/BCC → Email Preview → Draft Saving → Templates
Week 2: Tone → Length → Language → Subject Suggestions
Week 3: Sent Analysis → Response Rate → Best Time → Export
Week 4: Read Receipt → Toast Notifications → Polish
```

Say "build [feature name]" to start implementing any phase!
