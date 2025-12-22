# Safe Email Verification Debugging Guide

## Method 1: Check Supabase Logs (Read-Only, Safe)

**In Supabase Dashboard:**
1. **Logs** (left sidebar)
2. Filter by these queries:

```sql
-- See all auth events (no write access)
SELECT * FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 50;
```

**Look for:**
- ✅ `action = 'user_signedup'` → User account created
- ✅ `action = 'user_confirmation_requested'` → Email sent to user
- ❌ Missing `user_confirmation_requested` → Email provider problem
- ❌ `raw_error_attributes` not NULL → Error occurred

## Method 2: Enable Debug Logging in App

**Option A: Use the DEBUG version I created**

1. Copy `app/api/auth/signup/route.DEBUG.ts` content
2. Replace content in `app/api/auth/signup/route.ts` temporarily
3. Run `npm run dev`
4. Test signup
5. Check terminal output for detailed logs

**What you'll see:**
```
[EMAIL_DEBUG] Signup attempt for: user@example.com
[EMAIL_DEBUG] Config check:
  - Supabase URL: ✅ SET
  - Anon Key: ✅ SET
[EMAIL_DEBUG] Email config:
  - Email: user@example.com
  - Origin: http://localhost:3000
  - Redirect URL: http://localhost:3000/auth/callback
[EMAIL_DEBUG] Calling supabase.auth.signUp()...
[EMAIL_DEBUG] Signup success:
  userId: 123...
  emailConfirmed: false
```

**Option B: Add temporary console.log to existing code**

Replace the current signup route with:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  console.log("[SIGNUP] Email:", email);
  console.log("[SIGNUP] Password length:", password.length);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  console.log("[SIGNUP] Has Supabase URL:", !!supabaseUrl);
  console.log("[SIGNUP] Has Anon Key:", !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ok: false, message: "Server misconfigured" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    console.log("[SIGNUP] Redirect URL:", `${origin}/auth/callback`);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[SIGNUP] ERROR:", error.message);
      console.error("[SIGNUP] Error code:", (error as any).code);
      console.error("[SIGNUP] Error status:", (error as any).status);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      );
    }

    console.log("[SIGNUP] ✅ Success - User ID:", data.user?.id);
    console.log("[SIGNUP] Email confirmed:", !!data.user?.email_confirmed_at);

    return NextResponse.json(
      {
        ok: true,
        message: "Signup successful! Please check your email to confirm your account.",
        user: data.user?.id,
        requiresConfirmation: !data.user?.email_confirmed_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[SIGNUP] EXCEPTION:", err);
    return NextResponse.json(
      { ok: false, message: "Signup failed" },
      { status: 500 }
    );
  }
}
```

## Method 3: Use Diagnostic Endpoint (Already Created)

```bash
# Get detailed diagnostic info
curl http://localhost:3000/api/auth/diagnose

# Test email sending (creates test account)
curl -X POST http://localhost:3000/api/auth/diagnose \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@gmail.com"}'
```

This will tell you:
- ✅ Supabase connection working
- ✅ Email provider configured
- ❌ What's broken (if anything)

## Method 4: Monitor Supabase in Real-Time

**In Supabase Dashboard:**

1. Open **Logs** tab
2. In real-time:
   - Use your app to sign up
   - Watch logs update live
   - See exact error messages

**SQL to paste in:**
```sql
SELECT 
  created_at,
  action,
  user_id,
  raw_error_attributes
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

Refresh every 10 seconds to see new events.

## What Each Sign of Breakdown Means

| What You See | Problem | Solution |
|---|---|---|
| `user_signedup` ✅ + `user_confirmation_requested` ✅ + email arrives ✅ | **All working** | Keep going |
| `user_signedup` ✅ + NO `user_confirmation_requested` | Email provider disabled | Check Supabase Email Provider settings |
| `user_signedup` ✅ + `user_confirmation_requested` ✅ + NO email | Email provider broke | Regenerate API key (SendGrid/Mailgun) |
| Error: "invalid_redirect_url" | Wrong callback URL | Add http://localhost:3000/auth/callback in URL Configuration |
| Error: "email_provider_error" | SMTP/SendGrid issue | Check API key, billing, quota |

## Step-by-Step Debug Process

### Step 1: User tries to sign up
```
Expected: See "[SIGNUP]" logs in terminal
If missing: Check if route is being called
```

### Step 2: Check Supabase logs
```
Expected: user_signedup action appears
If missing: Signup request never hit Supabase
```

### Step 3: Check for confirmation request
```
Expected: user_confirmation_requested action appears
If missing: Email provider not configured
```

### Step 4: Check for errors
```
Expected: No raw_error_attributes
If present: Note the error message, look up solution
```

### Step 5: Check user email
```
Expected: Verification email arrives in spam/inbox
If missing: Email provider quota exceeded or API key bad
```

### Step 6: Click email link
```
Expected: Redirected to http://localhost:3000/auth/callback?code=...
Then: Logged in
If broken: Callback URL mismatch
```

## Temporary Debug Script

Create `scripts/test-email-flow.js`:

```javascript
#!/usr/bin/env node

const fetch = require('node-fetch');

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = "TestPassword123!";

console.log("🧪 Testing email verification flow...\n");
console.log(`Email: ${testEmail}`);
console.log(`Password: ${testPassword}\n`);

fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: testEmail, password: testPassword })
})
  .then(r => r.json())
  .then(data => {
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.ok) {
      console.log("\n✅ User created!");
      console.log(`Check Supabase logs for signup events...`);
      console.log(`Check email inbox for verification link...`);
    } else {
      console.log("\n❌ Signup failed");
    }
  })
  .catch(err => console.error("Request failed:", err));
```

Run with:
```bash
node scripts/test-email-flow.js
```

## What NOT to Do

❌ Don't modify auth.users table
❌ Don't delete test signups
❌ Don't regenerate service keys
❌ Don't change email templates

Just read logs and add console.log statements.

## When to Check These Things

| Problem | Check This First |
|---|---|
| "No email arrives" | Supabase > Authentication > Email Provider (is it configured?) |
| "Email arrives but can't click link" | Supabase > Authentication > URL Configuration (does it have your URL?) |
| "User created but can't login" | Supabase > Authentication > Users (is email_confirmed_at NULL?) |
| "App crashes on signup" | Terminal logs (what error appears?) |
| "Signup says "already exists"" | That email already has an account |

## Clean Up Debug Code

When done debugging:
1. Remove all `console.log` statements from signup route
2. Restore original route
3. Restart app
4. Verify production signup works
