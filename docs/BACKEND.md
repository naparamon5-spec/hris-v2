# HRIS v2 — Backend Integration Guide (hris_server)

This guide connects the HRIS v2 Nuxt site to the **existing backend in `C:\hris_server`**
(the same API the `hris_mobile` app uses). Every endpoint, request body and response field
below was read from the server source:

- `routes/v1/public/public.routes.js` (public)
- `routes/v1/protected/auth.routes.js` (signed-in, mounted at `/auth`)
- `routes/v1/protected/hris.routes.js` (signed-in, mounted at `/hris`)
- `routes/email-action.js`, `routes/deep-links.js`
- `controllers/v1/*.controller.js`, `utils/tenant.js`, `middlewares/*`

> `hris_server/API.md` is **out of date** (it still mentions a seed store and
> `/approvals/:id/approve`). Trust this file and the controllers, not `API.md`.

Sections:
1. Connection setup · 2. Conventions · 3. Auth · 4. Companies · 5. Profile & security ·
6. Home · 7. Requests · 8. Approvals · 9. Payroll & timesheet · 10. Leave hours ·
11. Who's Out · 12. Directory · 13. Notifications · 14. Endpoints the site does not use ·
15. **Gaps — site features with no server API yet** · 16. Mock-removal checklist · 17. Rollout order

---

## 0. No endpoint / API yet — parked list

Checked against `hris_server` (routes + controllers) and `hris_mobile/lib/data/hris_api.dart`
on 2026-11-24. These are **left as-is for now** (UI stays, no live data). Everything not in this
list has a working endpoint in the sections below.

| # | Feature (site page) | What exists today | Notes |
|---|---|---|---|
| 1 | Sign in with Authentik (`login.vue`) | nothing — not in server or mobile | |
| 2 | Switch company without signing in again (header, `company-select.vue`) | nothing — the token is tied to one company | today: sign out → sign in to the other company |
| 3 | Edit Bio — saving it (`profile.vue`) | mobile has the UI only; text is never sent to the server | no bio field in any profile endpoint |
| 4 | Manager on Profile → Employment (`profile.vue`) | not returned by `/auth/profile` | data exists in `vw_emp_list_with_approver` |
| 5 | Certificate upload (`profile.vue`) | list only (`/auth/profile/certificates`); mobile just picks a file and says HR finalizes on the web portal | |
| 6 | Profile photo upload | mobile crops and keeps it on the phone only (`edit_profile_photo.dart`); no server endpoint | site shows initials |
| 7 | Recent activity feed (Home) | no activity endpoint | can borrow `/auth/notifications` for now |
| 8 | "N pending" counts on Requests tiles (`requests/index.vue`) | no summary endpoint | can count from each `/auth/requests/:type` list |
| 9 | Bulk approve / disapprove (`approvals.vue` select-all bar) | only one-at-a-time `/auth/requests/:type/:id/approve` | can loop per item |
| 10 | Payslip password checked by the server | `/auth/verify-password` exists, but `/auth/payslips/:id` doesn't require it | gate is client-side only (same as mobile) |
| 11 | Timesheet "Late" column (`timesheet.vue`) | `/auth/timesheets/:id` has no late-minutes field | |
| 12 | Directory email & local number (`directory.vue`) | `/auth/directory` returns id, name, role, department, status only | |
| 13 | Support — submit a ticket, contacts, FAQ (`support.vue`) | no API; Support is the v1 web page `https://hris.ardentnetworks.com.ph/support` | link to it for now |
| 14 | Privacy policy content (`privacy-policy.vue`) | no API; v1 web page `https://hris.ardentnetworks.com.ph/privacy-policy` | link to it for now |
| 15 | Header global search (`layouts/default.vue`) | nothing yet | |
| 16 | For examination — applicant exam link (`examination.vue`) | nothing | |
| 17 | Leave-type / request-subtype list for the forms (`RequestFormModal.vue`) | no endpoint; server accepts a fixed list (§7.4) | hard-code the server's list in the site |
| 18 | Real-time notifications on the web | only phone push (FCM); no web push / SSE | poll `/auth/notifications` |
| 19 | Biometric sign-in on the website | phone-only endpoints | not applicable to web |

**Not gaps (already covered, for reference):** payslip PDF and bulk PDF download (built in the
browser from `/auth/payslips/:id`, like mobile — §9.2), 2FA, change/forgot/reset password,
requests CRUD + send/cancel/reverse, approvals + OT hours, Who's Out, directory list,
notifications, leave balance/hours, timesheet, pay calendar.

---

## 0.1 Endpoint map — what the mobile app calls vs what the website needs

Source: every `/public`, `/auth`, `/hris` path in `hris_mobile/lib/**/*.dart`, checked against
`hris_server/routes`. Base: `/api/v1`.

### A. Website NEEDS these (all exist on the server)

| # | Method | Endpoint | Mobile uses it? | Website page |
|---|---|---|---|---|
| 1 | GET | `/public/tenants` | ✅ | login, company select, logos |
| 2 | POST | `/public/login` | ✅ | login (+ OTP re-post) |
| 3 | POST | `/public/refresh` | ✅ | `useApi` silent refresh |
| 4 | POST | `/public/forgot-password` | ✅ | forgot password |
| 5 | POST | `/public/reset-password` | ✅ | reset password |
| 6 | GET | `/auth/me` | ❌ (mobile keeps the login `user`) | session reload after page refresh |
| 7 | POST | `/auth/logout` | ✅ | header menu, Profile → Log out |
| 8 | GET | `/auth/profile` | ✅ | header, Home, Profile, payslip header |
| 9 | GET | `/auth/profile/background` | ✅ | Profile → Personal |
| 10 | PUT | `/auth/profile/background` | ✅ | Profile → edit personal info |
| 11 | GET | `/auth/profile/mdr` | ✅ | Profile (PhilHealth MDR) |
| 12 | GET | `/auth/profile/certificates` | ✅ | Profile → Certificates |
| 13 | POST | `/auth/profile/change-password` | ✅ | change password |
| 14 | POST | `/auth/verify-password` | ✅ | payslip password, bulk download |
| 15 | GET | `/auth/2fa/status` | ✅ | Settings |
| 16 | POST | `/auth/2fa/setup` | ✅ | Settings → turn on 2FA |
| 17 | POST | `/auth/2fa/verify` | ✅ | Settings → confirm code |
| 18 | POST | `/auth/2fa/disable` | ✅ | Settings → turn off 2FA |
| 19 | GET | `/auth/directory?search=&department=` | ✅ | Directory |
| 20 | GET | `/hris/whosout?month=&year=` | ✅ | Who's Out |
| 21 | GET | `/auth/leaves/balance` | ✅ | Home credits |
| 22 | GET | `/auth/leaves/hours` | ✅ | Leave Hours |
| 23 | GET | `/auth/payslips` | ✅ | Payroll list |
| 24 | GET | `/auth/payslips/:id` | ✅ | Payslip detail, PDF, bulk PDF |
| 25 | GET | `/auth/pay-periods?type=timesheet\|payslip` | ✅ | Timesheet periods, payroll years |
| 26 | GET | `/auth/timesheets/:id` | ✅ | Timesheet |
| 27 | GET | `/auth/pay-calendar/next` | ✅ | Home (next payday card, optional) |
| 28 | GET | `/auth/notifications` | ✅ | Notifications, bell count |
| 29 | POST | `/auth/notifications/:id/read` | ✅ | Notifications |
| 30 | POST | `/auth/notifications/read-all` | ✅ | Notifications |
| 31 | GET | `/auth/requests/:type` | ✅ | request lists |
| 32 | GET | `/auth/requests/:type/:id` | ✅ | Edit form |
| 33 | POST | `/auth/requests/:type` | ✅ | Create (draft) |
| 34 | PUT | `/auth/requests/:type/:id` | ✅ | Edit |
| 35 | POST | `/auth/requests/:type/:id/:action` | ✅ | send · resend · cancel · reverse · approve · disapprove |
| 36 | GET | `/auth/approvals/access` | ✅ | Approvals nav, Home card |
| 37 | GET | `/auth/approvals?scope=&module=` | ✅ | Approvals, Approved Records / Requests |
| 38 | POST | `/auth/approvals/overtime/:id/approved-hours` | ✅ | Approvals → OT hours |

### B. Website does NOT need these

| Method | Endpoint | Why not |
|---|---|---|
| POST | `/public/biometric-login` | fingerprint/Face ID — phone only |
| POST | `/auth/biometric/enroll`, `/auth/biometric/revoke` | phone only |
| POST | `/auth/fcm-token`, `/auth/fcm-token/remove`, `/auth/fcm-token/test` | phone push (FCM) |
| GET | `/public/app-version?platform=` | app-store update prompt |
| POST | `/public/email-action` | the app opening approver email links; the website-side links are handled by the server's own `/email-action` page |
| GET | `/auth/attendance` | mobile clock-in screen — the site has none (optional later) |
| POST | `/auth/attendance/clock-in`, `/clock-out` | exist on the server but the mobile app doesn't call them; site has no clock screen |
| GET | `/auth/directory/whos-out` | old today-only list; replaced by `/hris/whosout` |
| GET | `/auth/leaves?status=` | legacy leave list; the site uses `/auth/requests/loa` |
| PUT | `/auth/profile` | server stub (doesn't save) |
| GET | `/auth/profile/linked-accounts` | server stub (always empty) |

### C. Mobile calls these but they DON'T exist on the server (don't copy)

| Endpoint the mobile calls | Note |
|---|---|
| `POST /auth/approvals/:id/approve`, `/auth/approvals/:id/reject` | old; live path is `/auth/requests/:type/:id/approve\|disapprove` |
| `GET /auth/approvals?status=` | old form; live is `?scope=&module=` |
| `POST /auth/leaves` | exists but returns `501` — file through `/auth/requests/loa` |
| `GET /auth/leaves/:id`, `/auth/loa/:id`, `/hris/loa/:id`, `/hris/leaves/:id`, `/hris/requests/:type/:id`, `/auth/requests/:id`, `/auth/:type/:id` | fallbacks tried in order by `getRequest()`; only `/auth/requests/:type/:id` exists |

**Approvers still get every approval feature on the website** — only through the new addresses.
The old ones above are leftovers in `screens/manager_approvals_screen.dart`, a screen nothing in
the app opens anymore; the live mobile Approvals screen already uses the new ones.

| Approver action | Old address (mobile leftover — doesn't exist) | Website uses (list A) |
|---|---|---|
| See requests to approve | `GET /auth/approvals?status=` | `GET /auth/approvals?scope=pending&module=records\|requests\|witness` (#37) |
| See decided history | — | `GET /auth/approvals?scope=history&module=records\|requests` (#37) |
| Approve | `POST /auth/approvals/:id/approve` | `POST /auth/requests/:type/:id/approve` (#35) |
| Disapprove | `POST /auth/approvals/:id/reject` | `POST /auth/requests/:type/:id/disapprove` (#35) |
| Edit OT approved hours | — | `POST /auth/approvals/overtime/:id/approved-hours` (#38) |
| Is this user an approver / witness? | — | `GET /auth/approvals/access` (#36) |

**About `getRequest()` (opening a request to edit it).** The mobile app keeps a list of 8
addresses and tries them in order until one answers:

1. `/auth/requests/:type/:id` ✅ the real one — always answers, so the rest are never reached
2. `/hris/requests/:type/:id` ❌
3. `/auth/leaves/:id` ❌
4. `/hris/leaves/:id` ❌
5. `/auth/loa/:id` ❌
6. `/hris/loa/:id` ❌
7. `/auth/requests/:id` ❌
8. `/auth/:type/:id` ❌

The website calls only #1 (`GET /auth/requests/:type/:id`, list A #32).

> Side finding: `hris_mobile/lib/data/hris_api.dart` still has `approve(id)` / `reject(id)` calling
> `/auth/approvals/:id/approve|reject`, which **do not exist** on the server. The live approval
> path is `/auth/requests/:type/:id/approve|disapprove`. Don't copy the old calls into the site.

---

## 1. Connection setup

### 1.1 Base URL

| | URL |
|---|---|
| Local server | `http://localhost:3000/api/v1` (`PORT` in `hris_server/.env`, default 3000) |
| Production | `https://<your-api-host>/api/v1` |
| Health check (no `/api`) | `GET /health` → `{ status: "ok", time }` |

Three route groups:

| Prefix | Auth | Contents |
|---|---|---|
| `/api/v1/public/*` | none | login, refresh, tenants, forgot/reset password, email-action |
| `/api/v1/auth/*` | `Authorization: Bearer <accessToken>` | everything else (profile, requests, approvals, payroll…) |
| `/api/v1/hris/*` | `Authorization: Bearer <accessToken>` | `whosout` only |

**The company is inside the token.** There is no `X-Company-Id` header: the server reads
`req.user.user.tenant` from the JWT and opens that company's database (`utils/tenant.js → tenantDb`).

### 1.2 `nuxt.config.js`

```js
runtimeConfig: {
  public: { apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api/v1' }
}
```

`.env` (site):
```
NUXT_PUBLIC_API_BASE=http://localhost:3000/api/v1
```

> Port clash: hris_server and the Nuxt default both use 3000. The site already runs on
> **3460** (`npx nuxi dev --port 3460`); keep it there.

### 1.3 CORS (server side — required)

`hris_server/middlewares/cors.js` allows `CLIENT_URL`, `DEV_URL`, `http://localhost:3000`,
the reset-link origin, and — **only when `ENVIRONMENT=DEVELOPMENT`** — any localhost/LAN origin.

- Local dev: set `ENVIRONMENT=DEVELOPMENT` in `hris_server/.env` (then `http://localhost:3460` works).
- Production: set `CLIENT_URL=https://<hris-v2-domain>` in the server env.
- `credentials: true` is already on (needed for the refresh cookie).

### 1.4 `composables/useApi.js` (new)

```js
// Bearer token on every call; one silent refresh on 401, then back to /login.
export const useApi = () => {
  const { public: { apiBase } } = useRuntimeConfig()
  const access = useCookie('hris_access', { sameSite: 'lax' })
  const refresh = useCookie('hris_refresh', { sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })

  const raw = $fetch.create({ baseURL: apiBase, credentials: 'include' })

  const call = async (url, opts = {}, retried = false) => {
    try {
      return await raw(url, {
        ...opts,
        headers: { ...(opts.headers || {}), ...(access.value ? { Authorization: `Bearer ${access.value}` } : {}) }
      })
    } catch (e) {
      if (e?.response?.status === 401 && !retried && refresh.value) {
        try {
          const r = await raw('/public/refresh', { method: 'POST', body: { refreshToken: refresh.value, rotate: true } })
          access.value = r.accessToken
          if (r.refreshToken) refresh.value = r.refreshToken
          useState('user').value = r.user
          return call(url, opts, true)
        } catch { /* fall through */ }
      }
      if (e?.response?.status === 401) {
        access.value = null; refresh.value = null
        await navigateTo('/login')
      }
      throw e
    }
  }
  return call
}
```

> Why the site keeps `refreshToken` itself: the server's own cookie is `SameSite=Strict` and
> only set when `checked` (Remember me) is true, so it won't reach the API from another domain.
> The server also accepts the token in the body or an `x-refresh-token` header (`AuthController.refresh`).

### 1.5 `composables/useSession.js` (new — replaces mock `user`, `companies`, `useState('company')`)

```js
export const useSession = () => {
  const api = useApi()
  const user = useState('user', () => null)          // token user, see §3.1
  const profile = useState('profile', () => null)    // GET /auth/profile, see §5.1
  const access = useState('approverAccess', () => null) // GET /auth/approvals/access, see §8.1

  const load = async () => {
    const [me, prof, acc] = await Promise.all([
      api('/auth/me'), api('/auth/profile').catch(() => null), api('/auth/approvals/access').catch(() => null)
    ])
    user.value = me; profile.value = prof; access.value = acc
  }
  return { user, profile, access, load }
}
```

### 1.6 `middleware/auth.global.js` (new)

```js
const PUBLIC = ['/login', '/forgot-password', '/reset-password', '/examination']
export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('hris_access')
  if (!token.value) return PUBLIC.includes(to.path) ? undefined : navigateTo('/login')
  if (to.path === '/login') return navigateTo('/')
  const { user, load } = useSession()
  if (!user.value) await load()
})
```

### 1.7 Page pattern

```js
const api = useApi()
const { data, refresh } = await useAsyncData('directory', () => api('/auth/directory'), {
  default: () => [],
  transform: (r) => r.data.map(toDirectoryCard) // adapter, see each section
})
```

**Adapters.** The server returns `snake_case` fields with its own names (`txn_date`,
`from_to_display`, `deduction_items`…). Put one small mapping function per resource in
`utils/adapters.js` (shown in each section) so the page templates keep reading the same
fields they read from the mock today.

---

## 2. Conventions (as the server does them)

### 2.1 Response envelopes

| Kind | Shape |
|---|---|
| Lists | `{ data: [...], total }` (notifications add `unread`) |
| Single object | the object itself (e.g. `/auth/profile`, `/auth/me`) |
| Create | `201 { message: "Request submitted", data: <record> }` |
| Update / action | `{ message, data? }` |
| Error | `{ message }` — login validation: `400 { errors: [...] }`; some add `code` |

Status codes used: `400` validation / filing rule, `401` token missing/expired ("Session expired"),
`403` not allowed (not approver, wrong tenant, inactive company), `404` not found, `409` wrong state,
`422` profile validation, `429` rate limited, `501` not implemented, `503` mail/biometric unavailable.

Show `error.data.message` in the toast — the server's messages are written for users
(e.g. "Insufficient leave hours", "45 days prior to date is acceptable…").

### 2.2 Status labels (all request types)

| Code | Label from API | Meaning |
|---|---|---|
| ATV | `Active` | **Draft** — saved, not sent yet |
| FA | `For Approval` | sent to the department approver |
| FWA | `For Witness Approval` | MAD waiting for its witness |
| WAV | `Witness Approved` | |
| APV | `Approved` | |
| DPV | `Disapproved` | |
| WDV | `Witness Disapproved` | |
| CNL | `Cancelled` | |
| FWD | `Posted` | processed by payroll |
| SVD | `Saved` | |
| ITV | `Inactive` | void |

Update `badge()` in the site: `Active`/`Saved` → navy, `For Approval`/`For Witness Approval` → warn,
`Approved`/`Witness Approved`/`Posted` → ok, `Disapproved`/`Witness Disapproved` → red,
`Cancelled`/`Inactive` → gray. Update the status filter chips in `requests/[type].vue` to
`All · Active · For Approval · Approved · Disapproved · Cancelled · Posted`.

### 2.3 Date formats the server returns

| Field style | Example |
|---|---|
| `longDate` (most `date_applied`, `txn_date`) | `"November 21, 2026"` |
| `legacyDate` (MAD/OT `date_applied`) | legacy web format, display as-is |
| `from_display` / `to_display` | short date-time, display as-is |
| `from_to_display` | one ready-made line "from – to" |
| hours | `"8:00"` (hh:mm strings: `applied_hours`, `approved_hours`) |
| payslip `pay_date` | `"11/30/2026"` (MM/DD/YYYY) |
| ISO | `date_from`, `date_to` on Who's Out, CA rows, pay periods |

All times are Manila wall-clock.

---

## 3. Authentication

### 3.1 Login — `pages/login.vue`

`POST /public/login` (rate-limited)

```json
// body
{ "user_id": "AN-0142", "password": "•••", "tenant": "ardent", "checked": true, "otp": "123456" }
```

- `tenant` = company `id` from `/public/tenants` (§4).
- `checked` = Remember me (also sets the httpOnly refresh cookie, 7 days).
- `otp` only on the second attempt when 2FA is on.

Responses:

| Case | Response |
|---|---|
| OK | `200 { accessToken, refreshToken, user }` |
| 2FA on, no `otp` sent | `200 { twoFactorRequired: true }` → show the OTP step, then **POST the same body again with `otp`** |
| wrong OTP | `401 { twoFactorRequired: true, message: "Invalid authentication code" }` |
| wrong ID/password | `401 { message: "Invalid Employee ID or password" }` |
| resigned/inactive | `401 { message: "This account is no longer active. Please contact HR." }` |
| company disabled | `403 { message: "This company is not available on the app yet." }` |
| missing fields | `400 { errors: [...] }` |

`user` (also what `GET /auth/me` returns):

```json
{
  "user_id": "AN-0142",
  "user_name": "Juan Dela Cruz ( Juan )",
  "privilege": "employee",          // employee | manager | head | executive
  "employee_id": "AN-0142",
  "department": "Technical",
  "position": "Network Engineer",
  "company": "Ardent Networks Inc.",
  "tenant": "anihrs"                // database key, not the tenant id
}
```

Site changes (`login.vue`):
- Keep the password in memory between the two steps (the OTP step re-posts it).
- On success store `accessToken` → cookie `hris_access`, `refreshToken` → `hris_refresh`, then `navigateTo('/')`.
- Remove "(Any code works in this mock.)".
- **"Sign in with Authentik" has no server endpoint** — see §15.

### 3.2 Session

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/auth/me` | — | token `user` (above) |
| POST | `/public/refresh` | `{ refreshToken, rotate: true }` (or cookie / `x-refresh-token`) | `{ accessToken, user, refreshToken? }` (new `refreshToken` when `rotate`) |
| POST | `/auth/logout` | `{ refreshToken }` | `{ message: "Logged out" }` — revokes that session |

Sign out (header menu + Profile → Settings → Log out): `POST /auth/logout` with the stored
refresh token, clear both cookies and `useState('user')`, `navigateTo('/login')`.

### 3.3 Forgot / reset / change password

| Page | Method | Endpoint | Body | Response |
|---|---|---|---|---|
| `forgot-password.vue` | POST | `/public/forgot-password` | `{ identifier, tenant }` — Employee ID **or** email | always `{ message: "If an account matches, reset instructions have been emailed." }`; `503` if mail not configured |
| `reset-password.vue` | POST | `/public/reset-password` | `{ token, tenant, new_password, confirm_password }` | `{ message: "Password updated" }`; `400` invalid/expired link or weak password |
| `change-password.vue` | POST | `/auth/profile/change-password` | `{ current_password, new_password, confirm_password }` | `{ message: "Password updated" }`; `400 "Current password is incorrect"` |

- The email link is `<RESET_LINK_BASE_URL>/reset-password?token=…&tenant=…`. To land on the
  v2 page, set `RESET_LINK_BASE_URL` (in `hris_server/config/reset-link.js` / env) to the v2
  site origin; `reset-password.vue` reads `token` and `tenant` from `route.query`.
- `forgot-password.vue` needs a Company select (the server needs `tenant`) and its field should
  accept "Employee ID or email".
- Password rules come back as the `400` message (`utils/password.js → passwordProblem`).
- Change password ends every other session.

---

## 4. Companies — login dropdown, header switcher, `company-select.vue`, `ArdentLogo.vue`

`GET /public/tenants` →

```json
{ "data": [
  { "id": "ardent", "name": "Ardent Networks Inc.", "subtitle": "Premier ICT Distributor", "color": "#E43834", "logo": null },
  { "id": "versatech", "name": "Versatech International", "subtitle": "AV and ICT Distribution", "color": "#6DCFF6", "logo": null }
], "total": 10 }
```

Active tenant ids: `ardent, versatech, lamco, match, fastronics, diamond_concept, diamond_office,
overland, rmd, test` (`ez_touch` is hidden — `active: false`).

- `logo` is `null` → keep using the site's `/logos/<id>.png`. The ids already match the file
  names (`ardent`, `lamco`, `diamond_concept`, `rmd`…). Map: `logoUrl = t.logo || '/logos/' + t.id + '.png'`.
- `companies` changes from a string list to objects → compare by `id`, show `name`.

**Switching company = signing in to that company.** A token belongs to one tenant and there is
no switch endpoint. `company-select.vue` → Continue should: sign out (`/auth/logout`) and go to
`/login?company=<id>` with the company preselected. (Or add a switch endpoint — §15.)

The current company for the header is `user.company` (name) / `user.tenant` (db key).

---

## 5. Profile & security — `pages/profile.vue`

### 5.1 `GET /auth/profile`

```json
{
  "user_id": "AN-0142",
  "name": "Juan Santos Dela Cruz",
  "role": "Network Engineer",
  "department": "Technical",
  "email": "juan.delacruz@ardentnetworks.com.ph",
  "employee_id": "AN-0142",
  "privilege": "employee",
  "years_of_service": 5,
  "personal_background": {
    "date_of_birth": "1995-04-02", "civil_status": "Single", "contact_number": "0917…",
    "address": "…", "date_hired": "2021-03-15",
    "sss": "…", "philhealth": "…", "tin": "…", "pagibig": "…", "drivers_license": "…"
  }
}
```

Adapter → the fields the site reads:

```js
export const toUser = (p, me) => ({
  name: p.name, id: p.employee_id, role: p.role, department: p.department,
  company: me.company, email: p.email, phone: p.personal_background.contact_number,
  hired: p.personal_background.date_hired,  // format to "Mar 15, 2021"
  initials: p.name.split(' ').filter(Boolean).map(s => s[0]).slice(0, 2).join(''),
  manager: '',  // not returned — see §15
  bio: ''       // not stored — see §15
})
```

### 5.2 Other profile endpoints

| Method | Endpoint | Use | Response / body |
|---|---|---|---|
| GET | `/auth/profile/background` | Personal tab (add sections) | `{ personal_info{ full_name, nickname, gender, civil_status, birth_date, birthplace, religion, mobile, telephone, email, address }, emergency_contact{ name, relationship, phone } , family[{ first_name, middle_name, last_name, relationship, birthdate }], education[{ school, attainment, year_graduated }], previous_employment[{ company, position, date_from, date_to, salary, reason_for_leaving }] }` |
| PUT | `/auth/profile/background` | edit personal info | body any of `nickname, mobile, telephone, email, address, birthplace, civil_status, religion`; changing `email` also needs `current_password` (`400 code PASSWORD_REQUIRED / PASSWORD_INCORRECT`) → `{ message: "Personal information updated" }` |
| GET | `/auth/profile/mdr` | PhilHealth MDR card | `{ status: "ACTIVE", items: { "PhilHealth PIN", "Membership Category", "Sub-category", "Employer", "Declared Dependents" } }` |
| GET | `/auth/profile/certificates` | Certificates tab | `{ levels: [{ level, items: [{ cert_no, name, active, file_name, date_uploaded }] }], total }` — Versatech catalog; empty for other companies |
| GET | `/auth/profile/linked-accounts` | — | `{ data: [], total: 0 }` (stub) |
| PUT | `/auth/profile` | — | stub, does not save — don't use |

Certificates adapter (site card shows name / level / earned / total / status):

```js
export const toCertificates = (r) => r.levels.flatMap(l => l.items.map(c => ({
  name: c.name, level: l.level,
  earned: l.items.filter(x => x.active).length, total: l.items.length,
  status: c.active ? 'Active' : 'Not uploaded'
})))
```

"Upload certificate" — no upload API; mobile tells the user HR finalizes uploads on the web portal (§15 G5).

### 5.3 Security (Settings tab)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/auth/2fa/status` | — | `{ enabled }` |
| POST | `/auth/2fa/setup` | — | `{ secret, otpauth_url, issuer, account }` → show QR of `otpauth_url` (`409` if already on) |
| POST | `/auth/2fa/verify` | `{ code }` | `{ enabled: true, message }` |
| POST | `/auth/2fa/disable` | `{ code }` | `{ enabled: false, message }` |
| POST | `/auth/verify-password` | `{ password }` | `{ valid: true }` / `400 { valid: false, message: "Incorrect password" }` |

Site changes: the 2FA switch becomes a 3-step flow (setup → scan QR → enter code → verify);
turning it off asks for a code. **Biometric** (`/auth/biometric/*`, `/public/biometric-login`) is
phone-only (fingerprint/Face ID) — remove the Biometric switch from the website.

---

## 6. Home — `pages/index.vue`

| Card | Endpoint | Mapping |
|---|---|---|
| Greeting / role / company | `/auth/me` | `user_name`, `position`, `company` |
| Vacation & Sick credits | `GET /auth/leaves/balance` | `buckets.find(b => b.type === 'Vacation Leave').remaining` (days), same for `Sick Leave` |
| Pending approvals hero card | `GET /auth/approvals/access` | `pending + pendingRequests + pendingWitness`; hide when `!isApprover && !isWitness` |
| Next payday (optional) | `GET /auth/pay-calendar/next` | `{ configured, next{ pay_year, pay_period, pay_date, cutoff_from, cutoff_to, days_to_payday }, current{…} }` |
| Recent activity | **no endpoint** | use `/auth/notifications` (first 4) — §13, or add one — §15 |

`/auth/leaves/balance` →
```json
{ "user_id": "…", "year": 2026, "total_remaining_days": 14.5,
  "buckets": [{ "type": "Vacation Leave", "remaining": 8.5 }, { "type": "Sick Leave", "remaining": 6 }],
  "approved_leave_hours": null, "approved_ut_hours": null }
```

---

## 7. Requests — `requests/index.vue`, `requests/[type].vue`, `RequestFormModal.vue`

### 7.1 Type keys — site route ↔ server

| Site route (`requestTypes` key) | Server `:type` | Number shown | Table |
|---|---|---|---|
| `leave-of-absence` | `loa` | `H<head_no>` (old drafts: plain number, negative `id`) | `th_loa_header` / `th_loa_head` |
| `call-approval` | `call-approval` | plain number | `th_ca_head` + details |
| `manual-arrival-departure` | `manual-ad` | plain number | `th_mad_head` |
| `overtime` | `overtime` | plain number | `th_ot_head` + `th_ot_det` |
| `other-requests` | `other` | plain number | `th_request_head` (**Versatech only**) |

Add `apiType` to each entry in `requestTypes` and use it for every call.

### 7.2 Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auth/requests/:type` | my records → `{ data, total }`, newest first |
| GET | `/auth/requests/:type/:id` | one record with full detail (for Edit) |
| POST | `/auth/requests/:type` | create → **saved as draft (`Active`)** → `201 { message, data }` |
| PUT | `/auth/requests/:type/:id` | edit — **only while `Active`** (`400 "Only active status can be modified"`) |
| POST | `/auth/requests/:type/:id/:action` | `send` · `resend` · `cancel` · `reverse` (owner) · `approve` · `disapprove` (approver, §8) |

Action rules (`RequestsController.action`):

| Action | Allowed from | Result |
|---|---|---|
| `send` | Active | For Approval (MAD → For Witness Approval) — emails/pushes the approver |
| `resend` | For Approval (MAD also FWA) | re-notifies, status unchanged |
| `cancel` | Active, Approved | Cancelled |
| `reverse` | Cancelled, Disapproved, Approved | back to Active (draft) |
| `approve` / `disapprove` | For Approval (MAD also FWA) | approver only |

Wrong state → `409 "Cannot <action> a record that is <status>."`

**This changes the site's flow**: Create saves a draft → the row shows `Active` with
**Send for approval**, **Edit**, **Cancel** buttons. `For Approval` rows show **Resend** only
(they can't be edited or cancelled on the server). `Approved` → **Cancel** / **Reverse**;
`Cancelled`/`Disapproved` → **Reverse**. Replace the site's current
Edit/Cancel-on-For-Approval logic with this table. (Optionally call `send` right after create to
keep one-click filing.)

### 7.3 Row shapes from `GET /auth/requests/:type`

Common: `id`, `no`, `date_applied`, `txn_date`, `approved_by`, `approved_date`, `applied_hours`,
`from_display`, `to_display`, `from_to_display`, `reason`, `status`.

| Type | Extra fields |
|---|---|
| `loa` | `leave_type` |
| `call-approval` | `date_from`, `date_to` (ISO), `rows[]` = `{ ca_no, date_from, date_to, time_from, time_to, from, to, no_of_hrs, hrs, customer, purpose }` |
| `manual-ad` | `witnessed_by` |
| `overtime` | `approved_hours` (only when Approved) |
| `other` | `request_type` (`ID`/`COE`/`COL`/`BUP`/`ITR`/`EPP`) — no hours/from/to |

Adapter to the site's table fields:

```js
const OTHER = { ID: 'Company ID', COE: 'Certificate of Employment', EPP: 'Employee Purchase Program',
  COL: 'Company Loan', BUP: 'Benefits Upgrade', ITR: 'Income Tax Return' }
export const toRequestRow = (r) => ({
  id: r.id, no: r.no,
  type: r.leave_type || OTHER[r.request_type] || r.request_type || '',
  dateFiled: r.date_applied, date: r.txn_date || r.date_applied,
  from: r.from_display || '', to: r.to_display || '',
  hours: r.approved_hours && r.approved_hours !== '0:00' ? r.approved_hours : (r.applied_hours || ''),
  approver: r.approved_by || '—', reason: r.reason, status: r.status,
  raw: r // keep for Edit
})
```

Use `id` (not `no`) in URLs — LOA ids can be negative.

### 7.4 Create / edit bodies (the form must send these)

**Leave of Absence (`loa`)**
```json
{ "leave_type": "Vacation Leave", "date_from": "2026-11-28 08:00", "date_to": "2026-11-28 17:00", "reason": "Family trip" }
```
- `leave_type` options (server `LOA_TYPE_CODE`): **Approved Leave, Approved UT (AM/PM), Vacation Leave,
  Sick Leave, Additional VL, Accumulated Leave** — replace the site's subtypes with these.
- Hours are computed by the server. Rules: `date_to ≥ date_from`; no more than **45 days back**;
  reason required; no overlap with any filing that day; enough credits (except Approved Leave).

**Call Approval (`call-approval`)** — one date, one or more time rows
```json
{ "txn_date": "2026-11-28", "rows": [
  { "time_from": "2026-11-28 09:00", "time_to": "2026-11-28 12:00", "customer": "ACME Corp", "purpose": "Site survey" }
] }
```
- No reason field; each row needs `customer` + `purpose` (≤ 200 chars); rows must not overlap;
  edits must be between 7AM and 8PM. **The form needs a repeatable rows section** (the site has a
  single from/to + reason today).

**Manual Arrival/Departure (`manual-ad`)** and **Overtime (`overtime`)**
```json
{ "txn_date": "2026-11-28", "time_from": "08:47", "time_to": "18:00", "reason": "Forgot to tap ID" }
```
- `reason` required, **≤ 75 chars**. MAD hours capped at 9. OT may end at 00:00 (next day).
- No subtype picker for these two (remove Manual Arrival / Regular OT etc. subtypes).

**Other Requests (`other`) — Versatech only** (`403` for other companies → hide the tile)

| `request_type` | Required fields |
|---|---|
| `id` Company ID | `reason` (> 5 chars), `emergency_contact_name`, `relationship`, `contact_number`, `address`, optional `email` |
| `coe` Certificate of Employment | `reason` (> 5 chars), `compensation`: `"With compensation"` / `"Without compensation"` |
| `col` Company Loan | `loan_amount`, `terms` (months, default 5) — response includes the deduction `schedule` |
| `bup` Benefits Upgrade | `month` (e.g. "January"), `plan`, `benefit_upgrade` |
| `itr` Income Tax Return | `reason` |
| `epp` Employee Purchase Program | `epp_type`: `cash` → `items: [{ item, qty, uprice, amt }]`; `charge` → `item`, `amt`, `terms` (3/6/9/12) |

The site's single "Other Requests" form becomes a type picker that shows the fields above.

Create response example: `201 { message: "Request submitted", data: { id, no, date_applied, request_type, reason, approved_by: "", approved_date: "", status: "Active", schedule? } }`

Site changes (`[type].vue`): delete local numbering, the hard-coded `dateFiled: 'Nov 23, 2026'`,
`approver: 'Ramon Napa'`, and `r.status = s`; after every call `refresh()` and toast `message`.

### 7.5 Pending pills on `requests/index.vue`

No summary endpoint. Count from each list: `data.filter(r => r.status === 'For Approval').length`
(5 calls on page load), or add `/auth/requests/summary` (§15).

### 7.6 Approved Records / Approved Requests (tabs on Approvals, not Requests tiles)

In the mobile app these are the **approver's decided history**. On the website they are tabs on
the approver-only Approvals page (§8.2); `/requests/approved` and `/requests/approved-requests`
just redirect there.

| Tile | Endpoint |
|---|---|
| Approved Records (LOA/CA/MAD/OT) | `GET /auth/approvals?scope=history&module=records` |
| Approved Requests (Other Requests) | `GET /auth/approvals?scope=history&module=requests` (HR managers) |

Rows use the approval shape (§8.2) — `category` is already included. Show these tabs only when
`approvals/access.isApprover` (Approved Requests: only for users who approve Other Requests). (If you instead want *my own* approved filings, filter
`/auth/requests/:type` by `status === 'Approved'` for each type.)

---

## 8. Approvals — `pages/approvals.vue`

### 8.1 Access — `GET /auth/approvals/access`

```json
{ "isApprover": true, "pending": 6, "pendingRequests": 2, "isWitness": false, "pendingWitness": 0 }
```

- `pending` = team LOA/CA/MAD/OT waiting (department approver).
- `pendingRequests` = Other Requests waiting (HR managers, whole company).
- `isWitness`/`pendingWitness` = MADs waiting for this user as witness.
- Hide the Approvals nav item when none of `isApprover`, `isWitness` is true (non-approvers get empty lists).

### 8.2 List — `GET /auth/approvals?scope=pending|history&module=records|requests|witness`

The Approvals page (approver-only; nav item hidden otherwise) has three tabs, kept in `?tab=`:

| Tab | Call |
|---|---|
| **Pending** (default) | `scope=pending` for `module=records`, `requests` and `witness` |
| **Approved Records** (`?tab=records`) | `scope=history&module=records` |
| **Approved Requests** (`?tab=requests`) | `scope=history&module=requests` (only for users who approve Other Requests) |

Approving / disapproving on Pending moves the item to the matching history tab. History rows
show an **Employee** column (who filed) — `components/ApprovalHistory.vue`.

Row shape:
```json
{
  "type": "overtime",            // loa | call-approval | manual-ad | overtime | other  → use for the action URL
  "app": "OT",                   // LOA | CA | MAD | OT
  "id": 211, "no": "211",
  "employee": "Maria Santos", "employee_id": "AN-0012",
  "category": "Overtime", "company": "Ardent Networks Inc.", "request_type_name": "",
  "reason": "Network deployment",
  "detail": "Overtime • November 21, 2026",
  "applied_hours": "3:00", "approved_ot_hours": "0:00",
  "date_applied": "November 21, 2026", "date_sent": "November 21, 2026 06:12 PM",
  "txn_date": "November 21, 2026",
  "approved_by": "", "approved_date": "",
  "status": "For Approval"
}
```

Adapter to the card fields the page reads:
```js
export const toApproval = (a) => ({
  id: `${a.type}:${a.id}`, apiType: a.type, apiId: a.id,
  name: a.employee, empId: a.employee_id, app: a.category, no: a.no,
  date: a.txn_date, hours: a.approved_ot_hours !== '0:00' ? a.approved_ot_hours : a.applied_hours,
  detail: a.detail, reason: a.reason, status: a.status
})
```
(`id` must combine type + id: numbers repeat across types.)

### 8.3 Decide

| Method | Endpoint | Body |
|---|---|---|
| POST | `/auth/requests/:type/:id/approve` | — |
| POST | `/auth/requests/:type/:id/disapprove` | — |
| POST | `/auth/approvals/overtime/:id/approved-hours` | `{ hours, minutes }` → `{ message, data: { approved_ot_hours } }` |

- Only the employee's real department head (or the MAD witness for `FWA`) may decide → else `403`.
- OT approved hours: only while For Approval, never more than applied hours. The site's OT edit
  must split into hours + minutes.
- A witness "approve" moves a MAD to For Approval (then the department head decides).
- **No bulk endpoint** — the selection bar loops one request per selected id
  (`Promise.allSettled`), then reports "N approved, M failed" and refreshes.
- Approvers also receive one-click email links handled by `GET/POST /email-action` (server-side; nothing to build).

---

## 9. Payroll & timesheet

### 9.1 Payslip list — `payroll/index.vue`

`GET /auth/payslips` →
```json
{ "data": [
  { "id": "2026-022", "period": "11/01/2026 - 11/15/2026", "net": "₱35,120.00", "status": null,
    "gross": "₱42,500.00", "deductions": "₱7,380.00", "pay_date": "11/15/2026" }
], "total": 24 }
```

- Money is pre-formatted text (`₱…`). **Don't show `net`** in the list (site rule); ignore it.
- Adapter: `period` (site "Period N") = `Number(id.split('-')[1])`; `label` = format `period`
  ("Nov 1 – 15"); `payDate` = format `pay_date` ("Nov 15, 2026"); year = `id.split('-')[0]`;
  cut-off = day of the start date ≤ 15 → 1st half.
- Year filter: distinct years from the list (or `GET /auth/pay-periods?type=payslip`).
- Bulk download: **no endpoint** (§15).

### 9.2 Payslip detail — `payroll/[period].vue`

Route param must become the server id (`/payroll/2026-022`).

1. Password dialog → `POST /auth/verify-password { password }` → `{ valid: true }` / `400 "Incorrect password"`.
   (Rate-limited. Delete the mock "6+ characters" check and the 500 ms fake delay.)
2. Then `GET /auth/payslips/:id` →
```json
{ "id": "2026-022", "period": "11/01/2026 - 11/15/2026", "net": "₱35,120.00", "gross": "₱42,500.00",
  "deductions": "₱7,380.00", "pay_date": "11/15/2026", "status": null,
  "earnings": [{ "label": "Basic Pay", "amount": 37500 }],
  "deduction_items": [{ "label": "SSS", "amount": 1350 }] }
```
- `earnings` / `deduction_items` amounts are numbers → `peso()`. Site reads `deductionItems` → map it.
- Employee name/ID/department come from `/auth/profile`; company from `user.company`.

> The server does not tie `verify-password` to the payslip request — the gate is client-side.
> To enforce it server-side, add a short-lived payslip token (§15).

**PDF download — single and bulk (already supported, same as the mobile app).** The mobile
app does not call a PDF endpoint: `hris_mobile/lib/data/payslip_pdf.dart` builds the PDF on
the device from `GET /auth/payslips/:id` plus the profile (company, ID, name, department,
SSS, TIN, company logo). `bulk_payslip_screen.dart` asks for the password, fetches each
selected id with `GET /auth/payslips/:id`, and joins them into one PDF
(`Payslips_<count>.pdf`). Do the same in the site:

```js
// npm i pdfmake  (or jspdf) — build in the browser, no server change
const slips = await Promise.all(ids.map(id => api(`/auth/payslips/${id}`)))
const pdf = buildPayslipsPdf(slips, profile)   // one page per slip, layout from payslip_pdf.dart
pdf.download(`Payslips_${slips.length}.pdf`)
```

Header fields: `profile.name`, `profile.employee_id`, `profile.department`,
`profile.personal_background.sss`, `.tin`, `user.company`, logo `/logos/<tenant id>.png`.

### 9.3 Timesheet — `pages/timesheet.vue`

| Method | Endpoint | Response |
|---|---|---|
| GET | `/auth/pay-periods?type=timesheet` | `{ data: [{ code: "022", year: "2026", range: "Nov 01 – Nov 15", date_from, date_to }] }` — only periods that have time logs |
| GET | `/auth/timesheets/:year-:code` (e.g. `/auth/timesheets/2026-022`) | `{ data: [Day], totals: { basic, basic_nd, ot, nd_ot, leave, total }, total }` |

```json
// Day
{ "date": "2026-11-16", "day_type": "Regular", "leave_type": "", "time_in": "08:52", "time_out": "18:04",
  "basic_hrs": 8, "basic_nd_hrs": 0, "ot_hrs": 0, "nd_ot_hrs": 0, "leave_hrs": 0, "total_hrs": 8, "remarks": "" }
```

Adapter: `{ date: 'Nov 16', dow: 'Mon', in: time_in || '—', out: time_out || '—', ot: ot_hrs,
totalHrs: total_hrs, remarks: remarks || (day_type !== 'Regular' ? day_type : ''), late: 0 }`.
There is **no late-minutes field** — drop the Late column or show `remarks`. Use `totals.total` for
the footer. Year select = distinct `year` values; period buttons = `range`.

`GET /auth/attendance` (today/week/summary) and `POST /auth/attendance/clock-in|clock-out` exist
but the site has no clock-in screen — optional Home widget.

---

## 10. Leave Hours — `pages/leave-hours.vue`

`GET /auth/leaves/hours` →
```json
{
  "vl_paid": "68:00", "sl_paid": "48:00", "additional_vl": "8:00", "accumulated_leave": "124:00",
  "vl_paid_hours": 68, "sl_paid_hours": 48, "additional_vl_hours": 8, "accumulated_leave_hours": 124,
  "approved_leave_used": "…", "approved_ut_used": "…",
  "approved_leave": null, "approved_ut": null, "approved_leave_hours": null, "approved_ut_hours": null
}
```

Summary cards: `VL Paid ← vl_paid_hours`, `SL Paid ← sl_paid_hours`, `Additional VL ← additional_vl_hours`,
`Accumulated Leave ← accumulated_leave_hours`.

The page shows only these balance cards. The "Approved leave & undertime" table was removed
(no dedicated endpoint). If it comes back, build it from
`GET /auth/requests/loa` filtered by `status in (Approved, Posted)` and
`leave_type === 'Approved UT (AM/PM)'` (UT) vs the rest (leave), using `txn_date`, `leave_type`,
`applied_hours`. (`GET /auth/leaves?status=Approved` also returns `{ id, type, range, days, status, reason }`.)

---

## 11. Who's Out — `pages/whos-out.vue`

`GET /hris/whosout?month=11&year=2026` (month 1–12) →
```json
{ "month": 11, "year": 2026, "total": 9, "data": [
  { "name": "Jose Reyes", "type": "loa", "type_label": "Leave of Absence",
    "date_from": "2026-11-10T00:00:00.000Z", "date_to": "2026-11-11T00:00:00.000Z", "remarks": "Sick Leave" }
] }
```

The site keys people by day — expand each range into the days of the shown month:

```js
export const toWhosOut = (r, year, month) => {
  const byDay = {}
  for (const p of r.data) {
    const from = new Date(p.date_from), to = new Date(p.date_to || p.date_from)
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) continue
      ;(byDay[d.getUTCDate()] ||= []).push({
        name: p.name, type: p.remarks || p.type_label, kind: p.type === 'ca' ? 'call' : 'leave'
      })
    }
  }
  return byDay
}
```

Refetch on every month change; delete the `year === 2026 && month === 10` guard.
(`GET /auth/directory/whos-out` is an older today-only list — not needed.)

---

## 12. Directory — `pages/directory.vue`

`GET /auth/directory?search=&department=` →
```json
{ "data": [{ "id": "AN-0012", "name": "Ramon Napa", "role": "IT Manager", "department": "Technical", "status": "Active" }], "total": 120 }
```

Search and department filter run on the server (debounce the search box 300 ms).
**No email or local number** — remove the contact line from the card or extend the endpoint (§15).

---

## 13. Notifications — `pages/notifications.vue`, header bell

| Method | Endpoint | Response |
|---|---|---|
| GET | `/auth/notifications` | `{ data: [Notification], total, unread }` — `unread` drives the bell badge |
| POST | `/auth/notifications/:id/read` | `{ message, data }` |
| POST | `/auth/notifications/read-all` | `{ message: "All marked as read" }` |

```json
// Notification
{ "id": 1, "title": "Overtime approved", "body": "Your OT 140 was approved.", "time": "2h ago",
  "icon": "notifications", "unread": true, "kind": "decision", "request_type": "overtime", "request_id": "140" }
```

Site reads `when` → map from `time`. Clicking an item: mark read, then go to
`/requests/<site route for request_type>` when `request_type` is set
(`loa → leave-of-absence`, `manual-ad → manual-arrival-departure`, `other → other-requests`).
Poll the bell every 60 s (no push for web; `/auth/fcm-token*` is phones only).

---

## 14. Server endpoints the site does not need

| Endpoint | Why |
|---|---|
| `POST /public/biometric-login`, `/auth/biometric/enroll|revoke` | phone fingerprint/Face ID |
| `/auth/fcm-token`, `/auth/fcm-token/remove`, `/auth/fcm-token/test` | phone push |
| `GET /public/app-version` | mobile update prompt |
| `PUT /auth/profile`, `GET /auth/profile/linked-accounts` | stubs |
| `POST /auth/leaves` | returns 501 — file leave through `/auth/requests/loa` |
| `GET /auth/directory/whos-out` | replaced by `/hris/whosout` |
| `/email-action`, `/.well-known/*`, `/reset-password` (server root) | email links / app links, server-rendered |

---

## 15. Gaps — features checked against hris_server and hris_mobile

The site shows these today with mock data. Choose per row: **remove from the site** or
**add the endpoint to hris_server** (suggested shape given).

| # | Site feature | Status in hris_server | Suggested endpoint (if adding) |
|---|---|---|---|
| G1 | "Sign in with Authentik" | **none** (not in the server or the mobile app) | **Remove the button** from `login.vue` |
| G2 | Company switch without re-login | none (token = one tenant) | `POST /auth/switch-tenant { tenant }` → new tokens if the employee exists there |
| G3 | Edit Bio | **UI only — no server field.** In `hris_mobile/lib/screens/profile_screen.dart` `_editBio` only does `setState(() => _bio = …)`; nothing is saved, so it's blank again after restarting the app | Keep the same UI-only behaviour as mobile, **or** add `PUT /auth/profile/bio { bio }` (≤ 200) + a bio column so it persists for both apps |
| G4 | Manager on profile | not returned | add `manager` (from `vw_emp_list_with_approver.department_approver`) to `GET /auth/profile` |
| G5 | Upload certificate | **No upload API.** Mobile (`profile_screen.dart _upload`) only picks a file and shows "Certificate uploads are finalized by HR on the web portal" | Same as mobile: show that message (or link to the HR portal). An upload API would be `POST /auth/profile/certificates/:cert_no` → `vex_emp_cert` + file share |
| G6 | Recent activity (Home) | none | `GET /auth/activity?limit=5` — or reuse notifications (no backend work) |
| G7 | Pending pills on Requests | none | `GET /auth/requests/summary` → `{ loa: 1, … }` — or count client-side |
| G8 | Bulk approve/disapprove | one-by-one only | `POST /auth/approvals/bulk { items:[{type,id}], action }` — or loop client-side |
| G9 | Payslip PDF download | ✅ **supported** — built client-side from `GET /auth/payslips/:id` (see §9.2) | no server change |
| G10 | Bulk payslip download | ✅ **supported** — password check, then `GET /auth/payslips/:id` per selected id, merged into one PDF (see §9.2) | no server change |
| G11 | Payslip password enforced by server | client-side only | `verify-password` returns a 5-min `payslip_token`; `/auth/payslips/:id` requires it |
| G12 | Timesheet "Late" minutes | not in `ts_timesheet` select | add `late_mins` to `/auth/timesheets/:id` if the table has it |
| G13 | Directory email / local no. | not returned | add `email`, `local` to `/auth/directory` |
| G14 | Support page | ✅ **exists as a web page, not an API.** Mobile opens `https://hris.ardentnetworks.com.ph/support` (`profile_screen.dart _supportUrl`) | Link the sidebar "Support" to that page, or copy its content into `support.vue` as static content. No ticket API exists, so the site's ticket form must go or send by `mailto:` |
| G15 | Privacy policy | ✅ **exists as a web page.** Mobile opens `https://hris.ardentnetworks.com.ph/privacy-policy` | Link to it, or copy the real text into `privacy-policy.vue` |
| G16 | Header global search | **not yet** (no endpoint, not in mobile) | Later: client-side over `/auth/directory?search=` + my requests, or a new `GET /auth/search?q=`. Until then hide the box or make it search the directory |
| G17 | For examination (applicant link) | none | `POST /public/examination/request-link { email }` — or remove the link |
| G18 | Biometric switch on website | phone-only | remove from the site |

---

## 16. Mock-removal checklist (every mock use in the site → real source)

| # | File | Mock today | Replace with |
|---|---|---|---|
| 1 | `layouts/default.vue` | `user`, `companies`, `useState('company')` | `useSession()` → `/auth/me`, `/auth/profile`; company = `user.company` |
| 2 | `layouts/default.vue` | bell count from mock | `/auth/notifications` → `unread` (poll 60 s) |
| 3 | `layouts/default.vue` | Sign out only navigates | `POST /auth/logout` + clear cookies |
| 4 | `layouts/default.vue`, `composables/useApprovals.js` | `approvalAccess` mock | hide Approvals unless `approvals/access` says approver/witness. Nav: Home, Requests, Leave Hours, Who's Out, Approvals, Payroll (Payslips + Timesheet tabs), Directory |
| 5 | `layouts/default.vue` | header search | G16 |
| 6 | `login.vue` | `companies`, fake sign-in, any OTP | `/public/tenants`, `/public/login` (+ `otp` re-post) |
| 7 | `login.vue` | Authentik button | remove (G1) |
| 8 | `forgot-password.vue` | "(Mock — no email is sent.)" | `/public/forgot-password { identifier, tenant }` |
| 9 | `reset-password.vue` | only compares fields | `/public/reset-password { token, tenant, new_password, confirm_password }` |
| 10 | `change-password.vue` | only compares fields | `/auth/profile/change-password` |
| 11 | `examination.vue` | "(Mock — nothing was sent.)" | G17 or remove |
| 12 | `company-select.vue` | `companies`, local state | `/public/tenants`; Continue → logout + `/login?company=` (or G2) |
| 13 | `components/ArdentLogo.vue` | `companies`, `companyLogo()` | tenant `id` → `/logos/<id>.png`; current = `user.company` |
| 14 | `index.vue` | `user`, `leaveCredits` | `/auth/me`, `/auth/leaves/balance` buckets |
| 15 | `index.vue` | `approvals.length` | `/auth/approvals/access` totals |
| 16 | `index.vue` | `recentActivity` | `/auth/notifications` (or G6) |
| 17 | `composables/useMockData.js` → `requestTypes` | subtypes, keys | add `apiType`; LOA types from §7.4; drop MAD/OT subtypes; Other Requests = 6 codes, Versatech only |
| 18 | `requests/index.vue` | pending counts | count per list (or G7); hide Other Requests unless `user.tenant === 'versahrs'` |
| 19 | `requests/[type].vue` | list, create, edit, cancel, reverse, numbering, date, approver | §7.2–7.4 + draft/send flow + new status chips |
| 20 | `components/ApprovalHistory.vue` | Approved Records / Approved Requests tabs | `/auth/approvals?scope=history&module=records|requests` |
| 21 | `components/RequestFormModal.vue` | one generic form | per-type forms of §7.4 (LOA dates, CA rows, MAD/OT times ≤ 75-char reason, Other per code) |
| 22 | `approvals.vue`, `composables/useApprovals.js` | `approvals`, `approvalAccess`, `useState('mock-approvals')`, local decisions, OT hours | `/auth/approvals/access` (nav + tabs), §8.2 pending list, per-item approve/disapprove, OT `{hours, minutes}` |
| 23 | `payroll/index.vue` | `payslips`, year list, "(mock)" bulk download | `/auth/payslips` + adapter; bulk = password → fetch each `/auth/payslips/:id` → one PDF (§9.2) |
| 24 | `payroll/[period].vue` | 6-char password, fake delay, mock slip, "(mock)" download | `/auth/verify-password`, `/auth/payslips/:id`; Download = browser-built PDF (§9.2) |
| 25 | `leave-hours.vue` | `leaveHours` | `/auth/leaves/hours` (balance cards only) |
| 26 | `timesheet.vue` | `timesheet`, generated periods, year options | `/auth/pay-periods?type=timesheet`, `/auth/timesheets/:year-:code` |
| 27 | `whos-out.vue` | `whosOut`, 2026 guard | `/hris/whosout?month&year` + `toWhosOut` |
| 28 | `directory.vue` | `directory` | `/auth/directory?search=` (G13 for contact line) |
| 29 | `notifications.vue` | `useState('mock-notifications')`, local read | `/auth/notifications`, `/:id/read`, `/read-all` |
| 30 | `profile.vue` | `user`, Personal tab | `/auth/profile` (+ `/auth/profile/background`, `/auth/profile/mdr`) |
| 31 | `profile.vue` | `certificates`, "File Selected (mock)" | `/auth/profile/certificates`; upload shows "finalized by HR on the web portal" like mobile (G5) |
| 32 | `profile.vue` | bio | same as mobile: UI-only, starts empty ("No bio yet"); persistent only if G3 endpoint is added |
| 33 | `profile.vue` | 2FA switch, Biometric switch, Log out | `/auth/2fa/*` flow; remove Biometric; `/auth/logout` |
| 34 | `support.vue` | contacts, FAQ, "Ticket submitted (mock)" | link to `https://hris.ardentnetworks.com.ph/support` or its static content; drop the mock ticket submit (G14) |
| 35 | `privacy-policy.vue` | placeholder text | link to `https://hris.ardentnetworks.com.ph/privacy-policy` or copy its text (G15) |
| 36 | `composables/useMockData.js` | everything | delete the file; move `badge` (updated for §2.2), `peso`, and `requestTypes` (title/desc/icon/apiType) to `utils/format.js` |

**Final check** — both should come back empty / `False`:

```powershell
Select-String -Path pages\*.vue,pages\*\*.vue,components\*.vue,layouts\*.vue -Pattern 'useMockData|mock|Mock'
```

```powershell
Test-Path composables\useMockData.js
```

---

## 17. Rollout order

1. Server env: `ENVIRONMENT=DEVELOPMENT` (dev) / `CLIENT_URL` (prod), `RESET_LINK_BASE_URL` → v2 site.
2. Site: `useApi`, `useSession`, auth middleware, adapters file.
3. Login + OTP, tenants, logout, forgot/reset/change password (rows 1, 3, 6, 8–10, 12–13).
4. Profile + 2FA (rows 30–33).
5. Requests with draft → send flow and per-type forms (rows 17–21).
6. Approvals (rows 4, 15, 22).
7. Payroll, timesheet, leave hours (rows 14, 23–26).
8. Who's Out, directory, notifications (rows 2, 16, 27–29).
9. Decide every Gap in §15 (build or remove), support/privacy (rows 5, 7, 11, 34–35).
10. Delete `useMockData.js`, run the final check (row 36).
