# Layaway & Buy Now Pay Later System

This document covers the layaway system implementation, vendor integrations (Affirm, etc.), and admin configuration.

## Table of Contents
1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Database Tables](#database-tables)
4. [API Endpoints](#api-endpoints)
5. [Affirm Integration](#affirm-integration)
6. [Usage Examples](#usage-examples)
7. [Admin Configuration](#admin-configuration)

---

## Overview

The layaway system provides two payment options:

1. **Internal Layaway** - HB Racing managed payment plans
   - Configurable down payment (10-50%)
   - Weekly, bi-weekly, or monthly payments
   - 2-12 installments
   - Late fee and grace period policies

2. **Vendor BNPL (Buy Now, Pay Later)** - Third-party managed
   - Affirm (primary integration)
   - Sezzle (planned)
   - Afterpay (planned)
   - Klarna (planned)
   - PayPal Pay in 4 (planned)

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Affirm Integration
AFFIRM_PUBLIC_KEY=your_affirm_public_key
AFFIRM_PRIVATE_KEY=your_affirm_private_key
AFFIRM_ENVIRONMENT=sandbox  # or 'production'

# For callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Your site URL

# Optional: Other BNPL providers (when implemented)
# SEZZLE_PUBLIC_KEY=...
# SEZZLE_PRIVATE_KEY=...
# AFTERPAY_MERCHANT_ID=...
```

### Getting Affirm Keys

1. Create an Affirm merchant account at [affirm.com/merchants](https://www.affirm.com/merchants)
2. Go to Dashboard → Settings → API Keys
3. Use Sandbox keys for testing, Production keys for live

---

## Database Tables

Run migration: `migrations/034_create_layaway_system.sql`

### `layaway_plans`
Main table storing layaway plan details:
- Customer info & items
- Payment structure (down payment, installments)
- Status tracking (pending → active → completed)
- Vendor integration fields (provider ID, metadata)

### `layaway_payments`
Individual payment records:
- Due dates and amounts
- Payment status (pending, due, paid, overdue)
- Late fees applied
- Transaction references

### `layaway_settings`
Admin-configurable settings:
- Enable/disable layaway
- Min/max order amounts
- Down payment requirements
- Payment frequency options
- Fee policies
- Vendor feature flags

---

## API Endpoints

### Layaway Plans

```
GET  /api/shop/layaway
     ?id=<plan_id>           - Get single plan by ID
     ?plan_number=LAY-...    - Get single plan by number
     ?email=user@email.com   - Get all plans for email
     ?user_id=<uuid>         - Get all plans for user

POST /api/shop/layaway
     Create new layaway plan
     Body: { customer, shipping, items, plan_config }
```

### Layaway Payments

```
GET  /api/shop/layaway/[planId]/payments/[paymentId]
     Get payment details

POST /api/shop/layaway/[planId]/payments/[paymentId]
     Process a payment
     Body: { payment_method, transaction_id }
```

### Settings

```
GET  /api/shop/layaway/settings
     Get current layaway settings

PUT  /api/shop/layaway/settings
     Update settings (admin only)
```

### Affirm

```
POST /api/shop/affirm/checkout
     Create Affirm checkout session
     Body: { customer, shipping, items, shipping_cost, tax_amount }

POST /api/shop/affirm/charge
     Authorize/capture Affirm charge
     Body: { checkout_token, order_id, layaway_plan_id, action }

GET  /api/shop/affirm/charge?charge_id=...
     Check charge status
```

---

## Affirm Integration

### Setup

1. Add Affirm JS SDK to your layout:

```html
<!-- In app/layout.tsx or checkout page -->
<Script
  src="https://cdn1-sandbox.affirm.com/js/v2/affirm.js"
  strategy="lazyOnload"
  onLoad={() => {
    affirm.config = {
      public_api_key: process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY,
      script: "https://cdn1-sandbox.affirm.com/js/v2/affirm.js"
    };
  }}
/>
```

For production, use: `https://cdn1.affirm.com/js/v2/affirm.js`

### Checkout Flow

1. User clicks "Pay with Affirm" in checkout
2. Frontend calls `/api/shop/affirm/checkout` to get checkout data
3. Launch Affirm modal: `affirm.checkout(checkout_data)`
4. User completes Affirm application
5. Affirm redirects to `user_confirmation_url` with `checkout_token`
6. Backend calls `/api/shop/affirm/charge` to authorize
7. Upon ship, call capture endpoint

### Affirm Callbacks

Create these pages:

**`app/shop/checkout/affirm/confirm/page.tsx`**
```tsx
// Handle successful Affirm checkout
// Extract checkout_token from POST body
// Call /api/shop/affirm/charge to authorize
```

**`app/shop/checkout/affirm/cancel/page.tsx`**
```tsx
// Handle cancelled Affirm checkout
// Show message and redirect back to cart
```

---

## Usage Examples

### Create Internal Layaway

```typescript
const response = await fetch("/api/shop/layaway", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "555-1234",
    },
    shipping: {
      address: "123 Main St",
      city: "Miami",
      state: "FL",
      zip: "33101",
    },
    items: [
      { id: "cam-001", name: "Stage 2 Cam", price: 450.00, quantity: 1 }
    ],
    plan_config: {
      down_payment_percent: 25,
      payment_frequency: "biweekly",
      num_payments: 4,
    },
    payment_provider: "internal",
  }),
});

// Response includes plan details and first payment info
```

### Process Payment

```typescript
const response = await fetch(
  `/api/shop/layaway/${planId}/payments/${paymentId}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment_method: "card",
      transaction_id: "ch_xxxxxxxxxxxxx", // From Stripe/PayPal
    }),
  }
);
```

### Lookup Plan

```typescript
// By email
const plans = await fetch("/api/shop/layaway?email=john@example.com");

// By plan number
const plan = await fetch("/api/shop/layaway?plan_number=LAY-20250114-ABC123");
```

---

## Admin Configuration

### Enable Layaway

Update `layaway_settings` in Supabase or via API:

```sql
UPDATE layaway_settings SET
  is_enabled = true,
  min_order_amount = 100.00,
  max_order_amount = 5000.00,
  min_down_payment_percent = 10,
  default_down_payment_percent = 25,
  available_frequencies = ARRAY['weekly', 'biweekly', 'monthly'],
  min_installments = 2,
  max_installments = 12,
  max_plan_duration_days = 90,
  late_fee_amount = 5.00,
  grace_period_days = 7,
  cancellation_fee_percent = 10,
  affirm_enabled = true
WHERE id = '<settings_id>';
```

### Monitor Plans

```sql
-- Active plans needing attention
SELECT * FROM layaway_plans
WHERE status = 'active'
  AND next_payment_due < CURRENT_DATE
ORDER BY next_payment_due;

-- Overdue payments
SELECT lp.plan_number, lpy.* 
FROM layaway_payments lpy
JOIN layaway_plans lp ON lp.id = lpy.plan_id
WHERE lpy.status = 'overdue';

-- Revenue from layaway
SELECT 
  DATE_TRUNC('month', paid_at) as month,
  SUM(total_charged) as revenue,
  COUNT(*) as payment_count
FROM layaway_payments
WHERE status = 'paid'
GROUP BY 1
ORDER BY 1 DESC;
```

---

## Files Created

- `migrations/034_create_layaway_system.sql` - Database schema
- `app/api/shop/layaway/route.ts` - Main layaway API
- `app/api/shop/layaway/[planId]/payments/[paymentId]/route.ts` - Payment processing
- `app/api/shop/layaway/settings/route.ts` - Settings API
- `app/api/shop/affirm/checkout/route.ts` - Affirm checkout creation
- `app/api/shop/affirm/charge/route.ts` - Affirm charge authorization
- `components/LayawayCheckout.tsx` - Checkout UI component
- `app/shop/layaway/page.tsx` - User layaway dashboard

---

## Testing

### Test Layaway Flow

1. Add items to cart (min $100)
2. Go to checkout → Select "Payment Plans"
3. Configure down payment and schedule
4. Submit (creates plan in `pending_down_payment` status)
5. Process down payment (moves to `active`)
6. Process remaining payments on schedule
7. Plan completes when fully paid

### Test Affirm (Sandbox)

Use Affirm's test phone numbers and SSN in sandbox mode. See [Affirm Test Cards](https://docs.affirm.com/affirm-developers/docs/test-cards).

---

## Next Steps

1. **Payment Gateway Integration** - Connect Stripe/PayPal for actual payment processing
2. **Auto-pay** - Implement recurring card charges for installments
3. **Email Notifications** - Payment reminders, receipts, overdue notices
4. **Admin Dashboard** - UI for managing plans, processing refunds
5. **Additional BNPL** - Sezzle, Afterpay, Klarna integrations
