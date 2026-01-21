/**
 * Email notification service for HB Racing
 * Uses Resend API for reliable email delivery
 * 
 * Notifications are sent TO: hbracing77@yahoo.com
 * 
 * Setup:
 * 1. Create account at https://resend.com (free: 3,000 emails/month)
 * 2. Get API key from https://resend.com/api-keys
 * 3. Add RESEND_API_KEY to Vercel environment variables
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const COMPANY_EMAIL = "hbracing77@yahoo.com";

// Uses verified hbracing7.com domain
const FROM_EMAIL = "HB Racing Orders <orders@hbracing7.com>";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - email not sent:", payload.subject);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Email send failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// ============================================
// Order Notifications
// ============================================

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentMethod: "paypal" | "card";
}

export async function notifyNewOrder(data: OrderNotificationData): Promise<boolean> {
  const itemsHtml = data.items
    .map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #333;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00f5ff, #ff3bd4); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">🎉 New Order Received!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: #00f5ff; margin-top: 0;">Order #${data.orderNumber}</h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Customer Info</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${data.customerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #00f5ff;">${data.customerEmail}</a></p>
          <p style="margin: 4px 0;"><strong>Payment:</strong> ${data.paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Shipping Address</h3>
          <p style="margin: 4px 0;">${data.shippingAddress.address}</p>
          <p style="margin: 4px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
            <thead>
              <tr style="background: #1e1e3f;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <span>$${data.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Shipping:</span>
            <span>$${data.shipping.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tax:</span>
            <span>$${data.tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #22c55e; border-top: 1px solid #444; padding-top: 10px; margin-top: 10px;">
            <span>TOTAL:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          View and manage orders in the <a href="https://hbracing7.com/admin" style="color: #00f5ff;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `🛒 New Order #${data.orderNumber} - $${data.total.toFixed(2)}`,
    html,
    replyTo: data.customerEmail,
  });
}

// ============================================
// Layaway Payment Notifications
// ============================================

interface LayawayPaymentNotificationData {
  planNumber: string;
  customerName: string;
  customerEmail: string;
  paymentAmount: number;
  paymentNumber: number;
  totalPayments: number;
  remainingBalance: number;
  totalPlanValue: number;
  isDownPayment: boolean;
  isFinalPayment: boolean;
}

export async function notifyLayawayPayment(data: LayawayPaymentNotificationData): Promise<boolean> {
  const paymentType = data.isDownPayment 
    ? "Down Payment" 
    : data.isFinalPayment 
      ? "Final Payment" 
      : `Payment ${data.paymentNumber} of ${data.totalPayments}`;

  const statusColor = data.isFinalPayment ? "#22c55e" : "#00f5ff";
  const emoji = data.isFinalPayment ? "🎉" : "💰";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${statusColor}, #ff3bd4); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">${emoji} Layaway Payment Received!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: ${statusColor}; margin-top: 0;">Plan #${data.planNumber}</h2>
        
        <div style="background: #1e1e3f; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 14px; color: #94a3b8; margin-bottom: 4px;">${paymentType}</div>
            <div style="font-size: 36px; font-weight: bold; color: #22c55e;">$${data.paymentAmount.toFixed(2)}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Plan Total</div>
              <div style="font-size: 18px;">$${data.totalPlanValue.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Remaining</div>
              <div style="font-size: 18px; color: ${data.remainingBalance <= 0 ? '#22c55e' : '#fbbf24'};">
                ${data.remainingBalance <= 0 ? 'PAID IN FULL' : '$' + data.remainingBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Customer</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${data.customerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #00f5ff;">${data.customerEmail}</a></p>
        </div>
        
        ${data.isFinalPayment ? `
          <div style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
            <div style="color: #22c55e; font-weight: bold;">Plan Complete - Ready to Ship!</div>
          </div>
        ` : ''}
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          View layaway plans in the <a href="https://hbracing7.com/admin" style="color: #00f5ff;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `;

  const subject = data.isFinalPayment
    ? `🎉 Layaway COMPLETE! #${data.planNumber} - Ready to Ship`
    : `💰 Layaway Payment: #${data.planNumber} - $${data.paymentAmount.toFixed(2)}`;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject,
    html,
    replyTo: data.customerEmail,
  });
}

// ============================================
// New Layaway Plan Notification
// ============================================

interface NewLayawayNotificationData {
  planNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalValue: number;
  downPayment: number;
  numPayments: number;
  paymentAmount: number;
  frequency: string;
}

export async function notifyNewLayawayPlan(data: NewLayawayNotificationData): Promise<boolean> {
  const itemsHtml = data.items
    .map(item => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #fbbf24, #ff3bd4); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">📋 New Layaway Plan Created!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: #fbbf24; margin-top: 0;">Plan #${data.planNumber}</h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Customer</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${data.customerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #00f5ff;">${data.customerEmail}</a></p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin-bottom: 8px;">Items</h3>
          <ul style="margin: 0; padding-left: 20px;">${itemsHtml}</ul>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Total Value</div>
              <div style="font-size: 18px; font-weight: bold;">$${data.totalValue.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Down Payment</div>
              <div style="font-size: 18px; font-weight: bold; color: #fbbf24;">$${data.downPayment.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Payment Plan</div>
              <div style="font-size: 14px;">${data.numPayments} payments of $${data.paymentAmount.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #94a3b8;">Frequency</div>
              <div style="font-size: 14px;">${data.frequency}</div>
            </div>
          </div>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          ⚠️ Awaiting down payment before plan is active.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `📋 New Layaway Plan #${data.planNumber} - $${data.totalValue.toFixed(2)}`,
    html,
    replyTo: data.customerEmail,
  });
}

// ============================================
// Submission Notifications (Cams, Heads, Dynos)
// ============================================

interface CamSubmissionNotificationData {
  submissionId: string;
  brand: string;
  camName: string;
  partNumber: string;
  engineMake: string;
  engineFamily: string;
  durationInt?: number;
  durationExh?: number;
  liftInt?: number;
  liftExh?: number;
  lsa?: number;
  userEmail?: string;
}

export async function notifyCamSubmission(data: CamSubmissionNotificationData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00f5ff, #0088ff); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">🎯 New Camshaft Submission!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: #00f5ff; margin-top: 0;">${data.brand} ${data.camName}</h2>
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Part Number:</strong> ${data.partNumber}</p>
          <p style="margin: 4px 0;"><strong>Engine:</strong> ${data.engineMake} ${data.engineFamily}</p>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin: 0 0 10px 0;">Specs</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Duration @ .050 (Int/Exh):</td>
              <td style="text-align: right;">${data.durationInt || 'N/A'}° / ${data.durationExh || 'N/A'}°</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Lift (Int/Exh):</td>
              <td style="text-align: right;">${data.liftInt || 'N/A'}" / ${data.liftExh || 'N/A'}"</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">LSA:</td>
              <td style="text-align: right;">${data.lsa || 'N/A'}°</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #fbbf24;">
          ⚠️ Requires admin approval before going live.
        </p>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          Review in the <a href="https://hbracing7.com/admin-cam-review" style="color: #00f5ff;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `🎯 New Cam Submission: ${data.brand} ${data.camName}`,
    html,
    replyTo: data.userEmail,
  });
}

interface HeadSubmissionNotificationData {
  submissionId: string;
  brand: string;
  partNumber: string;
  partName?: string;
  engineMake: string;
  engineFamily: string;
  intakeRunnerCC?: number;
  chamberCC?: number;
  intakeValveSize?: number;
  exhaustValveSize?: number;
  userEmail?: string;
}

export async function notifyHeadSubmission(data: HeadSubmissionNotificationData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff3bd4, #9932ff); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">🔧 New Cylinder Head Submission!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: #ff3bd4; margin-top: 0;">${data.brand} ${data.partNumber}</h2>
        ${data.partName ? `<p style="margin: 0 0 15px 0; color: #94a3b8;">${data.partName}</p>` : ''}
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Engine:</strong> ${data.engineMake} ${data.engineFamily}</p>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin: 0 0 10px 0;">Specs</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Intake Runner:</td>
              <td style="text-align: right;">${data.intakeRunnerCC || 'N/A'} cc</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Chamber:</td>
              <td style="text-align: right;">${data.chamberCC || 'N/A'} cc</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Valves (Int/Exh):</td>
              <td style="text-align: right;">${data.intakeValveSize || 'N/A'}" / ${data.exhaustValveSize || 'N/A'}"</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #fbbf24;">
          ⚠️ Requires admin approval before going live.
        </p>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          Review in the <a href="https://hbracing7.com/admin-cylinder-head-review" style="color: #00f5ff;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `🔧 New Head Submission: ${data.brand} ${data.partNumber}`,
    html,
    replyTo: data.userEmail,
  });
}

interface DynoSubmissionNotificationData {
  submissionId: string;
  engineName: string;
  engineMake: string;
  engineFamily: string;
  horsepower: number;
  torque?: number;
  userEmail?: string;
  userId?: string;
}

export async function notifyDynoSubmission(data: DynoSubmissionNotificationData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">📊 New Dyno Submission!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <h2 style="color: #22c55e; margin-top: 0;">${data.engineName}</h2>
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Engine:</strong> ${data.engineMake} ${data.engineFamily}</p>
          ${data.userId ? `<p style="margin: 4px 0;"><strong>User ID:</strong> ${data.userId}</p>` : ''}
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #94a3b8; margin: 0 0 10px 0;">Power Numbers</h3>
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${data.horsepower}</div>
              <div style="font-size: 12px; color: #94a3b8;">HP</div>
            </div>
            ${data.torque ? `
            <div>
              <div style="font-size: 32px; font-weight: bold; color: #fbbf24;">${data.torque}</div>
              <div style="font-size: 12px; color: #94a3b8;">TQ</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <p style="font-size: 14px; color: #fbbf24;">
          ⚠️ Requires admin approval before going live.
        </p>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          Review in the <a href="https://hbracing7.com/admin" style="color: #00f5ff;">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `📊 New Dyno Submission: ${data.engineName} - ${data.horsepower} HP`,
    html,
    replyTo: data.userEmail,
  });
}

// ============================================
// Contact Form Notifications
// ============================================

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function notifyContactForm(data: ContactFormData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff3bd4, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">📬 New Contact Form Message</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0;"><strong style="color: #00f5ff;">From:</strong> ${data.name}</p>
          <p style="margin: 0 0 8px 0;"><strong style="color: #00f5ff;">Email:</strong> <a href="mailto:${data.email}" style="color: #ff3bd4;">${data.email}</a></p>
          <p style="margin: 0;"><strong style="color: #00f5ff;">Subject:</strong> ${data.subject}</p>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Message:</p>
          <p style="margin: 0; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          Reply directly to this email to respond to ${data.name}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `📬 [Contact] ${data.subject} - from ${data.name}`,
    html,
    replyTo: data.email,
  });
}

// ============================================
// Forum Reply Notifications
// ============================================

interface ForumReplyNotificationData {
  recipientEmail: string;
  recipientName: string;
  replierName: string;
  threadTitle: string;
  threadId: string;
  replyPreview: string;
  isThreadOwner: boolean;  // true if recipient started the thread
}

// Use the same verified sender domain - can use forum@ or orders@
const FORUM_FROM_EMAIL = "HB Racing Forum <forum@hbracing7.com>";

export async function notifyForumReply(data: ForumReplyNotificationData): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hbracing7.com";
  const threadUrl = `${siteUrl}/forum/thread/${data.threadId}`;
  const unsubscribeUrl = `${siteUrl}/profile?tab=notifications`;
  
  const notificationType = data.isThreadOwner 
    ? "replied to your thread" 
    : "replied to a thread you're following";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7dd3fc, #00f5ff); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">💬 New Forum Reply</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          <strong style="color: #00f5ff;">${data.replierName}</strong> ${notificationType}:
        </p>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #00f5ff;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #7dd3fc;">📌 ${data.threadTitle}</p>
          <p style="margin: 0; color: #94a3b8; font-style: italic; line-height: 1.5;">"${data.replyPreview}..."</p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${threadUrl}" style="display: inline-block; background: linear-gradient(135deg, #00f5ff, #0088ff); color: #0a0a1e; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            View Thread →
          </a>
        </div>
        
        <div style="border-top: 1px solid #333; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">
            HB Racing Forum | <a href="${siteUrl}" style="color: #00f5ff;">hbracing7.com</a>
          </p>
          <p style="margin: 10px 0 0 0; color: #4a5568; font-size: 12px;">
            <a href="${unsubscribeUrl}" style="color: #64748b;">Manage email preferences</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Use forum-specific from email if available
  const fromEmail = FORUM_FROM_EMAIL;
  
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - forum email not sent:", data.threadTitle);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: data.recipientEmail,
        subject: `💬 ${data.replierName} replied to "${data.threadTitle}"`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Forum notification email send failed:", error);
      return false;
    }

    console.log(`Forum reply notification sent to ${data.recipientEmail} for thread ${data.threadId}`);
    return true;
  } catch (error) {
    console.error("Forum notification email error:", error);
    return false;
  }
}

// Send notifications to all thread participants except the replier
export async function notifyForumThreadParticipants(params: {
  threadId: string;
  threadTitle: string;
  threadOwnerId: string;
  replierId: string;
  replierName: string;
  replyBody: string;
  supabase: any;  // Pass the supabase client from the API route
}): Promise<{ sent: number; failed: number }> {
  const { threadId, threadTitle, threadOwnerId, replierId, replierName, replyBody, supabase } = params;
  
  let sent = 0;
  let failed = 0;
  
  // Get preview of reply (first 150 chars)
  const replyPreview = replyBody.length > 150 
    ? replyBody.substring(0, 150).trim() 
    : replyBody.trim();

  try {
    // Get all unique participants in this thread (thread owner + all posters)
    const { data: posts, error: postsError } = await supabase
      .from("forum_posts")
      .select("user_id")
      .eq("thread_id", threadId);

    if (postsError) {
      console.error("Error fetching thread participants:", postsError);
      return { sent, failed };
    }

    // Collect unique user IDs (include thread owner)
    const participantIds = new Set<string>();
    participantIds.add(threadOwnerId);
    posts?.forEach((post: { user_id: string }) => participantIds.add(post.user_id));
    
    // Remove the replier from the list
    participantIds.delete(replierId);

    if (participantIds.size === 0) {
      console.log("No participants to notify for thread:", threadId);
      return { sent, failed };
    }

    // Get notification preferences and emails for participants
    const userIds = Array.from(participantIds);
    
    // Get user emails from auth.users (requires service role)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users for email notifications:", usersError);
      return { sent, failed };
    }

    // Get notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from("forum_notification_preferences")
      .select("*")
      .in("user_id", userIds);

    // Get user profiles for display names
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, forum_handle")
      .in("id", userIds);

    // Build a map of user preferences (default to true if no preference set)
    const prefsMap = new Map<string, { notify_on_thread_reply: boolean; notify_on_post_reply: boolean }>();
    preferences?.forEach((pref: any) => {
      prefsMap.set(pref.user_id, pref);
    });

    // Build a map of user profiles
    const profilesMap = new Map<string, string>();
    profiles?.forEach((profile: any) => {
      profilesMap.set(profile.id, profile.forum_handle || "Member");
    });

    // Build a map of user emails
    const emailsMap = new Map<string, string>();
    users?.users?.forEach((user: any) => {
      if (userIds.includes(user.id) && user.email) {
        emailsMap.set(user.id, user.email);
      }
    });

    // Send notifications
    for (const userId of userIds) {
      const email = emailsMap.get(userId);
      if (!email) {
        console.log(`No email found for user ${userId}, skipping notification`);
        continue;
      }

      const prefs = prefsMap.get(userId);
      const isThreadOwner = userId === threadOwnerId;
      
      // Check preferences (default to true if not set)
      const shouldNotify = isThreadOwner 
        ? (prefs?.notify_on_thread_reply !== false)
        : (prefs?.notify_on_post_reply !== false);

      if (!shouldNotify) {
        console.log(`User ${userId} has disabled forum notifications, skipping`);
        continue;
      }

      const recipientName = profilesMap.get(userId) || "Member";

      const success = await notifyForumReply({
        recipientEmail: email,
        recipientName,
        replierName,
        threadTitle,
        threadId,
        replyPreview,
        isThreadOwner,
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`Forum notifications: ${sent} sent, ${failed} failed for thread ${threadId}`);
  } catch (error) {
    console.error("Error sending forum notifications:", error);
  }

  return { sent, failed };
}

// ============================================
// Consulting Booking Notifications
// ============================================

interface ConsultingBookingData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  servicePrice: number;
  engineMake: string;
  engineFamily: string;
  description: string;
  paymentMethod: "stripe" | "paypal";
  paymentId?: string;
}

export async function notifyConsultingBooking(data: ConsultingBookingData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00ff88, #00c9ff); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">⚡ New Consulting Booking!</h1>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <div style="background: linear-gradient(135deg, #22c55e22, #16a34a22); border: 1px solid #22c55e44; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 14px; color: #94a3b8; margin-bottom: 4px;">PAID</div>
          <div style="font-size: 32px; font-weight: bold; color: #22c55e;">$${data.servicePrice.toFixed(2)}</div>
          <div style="font-size: 14px; color: #00ff88; margin-top: 4px;">${data.serviceName}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #00f5ff; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">Customer Information</h3>
          <p style="margin: 4px 0;"><strong style="color: #94a3b8;">Name:</strong> ${data.customerName}</p>
          <p style="margin: 4px 0;"><strong style="color: #94a3b8;">Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #00f5ff;">${data.customerEmail}</a></p>
          ${data.customerPhone ? `<p style="margin: 4px 0;"><strong style="color: #94a3b8;">Phone:</strong> <a href="tel:${data.customerPhone}" style="color: #00f5ff;">${data.customerPhone}</a></p>` : ''}
          <p style="margin: 4px 0;"><strong style="color: #94a3b8;">Payment:</strong> ${data.paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #00f5ff; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">Engine Details</h3>
          <div style="background: #1e1e3f; padding: 12px; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong style="color: #94a3b8;">Make:</strong> <span style="color: #e2e8f0;">${data.engineMake}</span></p>
            <p style="margin: 4px 0;"><strong style="color: #94a3b8;">Engine Family:</strong> <span style="color: #e2e8f0;">${data.engineFamily}</span></p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #00f5ff; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">Project Description</h3>
          <div style="background: #1e1e3f; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${data.description}</p>
          </div>
        </div>
        
        <div style="background: #fbbf2422; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #fbbf24; font-weight: bold;">
            ⏰ ACTION REQUIRED: Contact the customer within 48 hours to schedule their consultation.
          </p>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
          Reply directly to this email to contact ${data.customerName}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: COMPANY_EMAIL,
    subject: `⚡ New Consulting Booking: ${data.serviceName} - $${data.servicePrice.toFixed(2)}`,
    html,
    replyTo: data.customerEmail,
  });
}

export async function sendConsultingReceipt(data: ConsultingBookingData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e2e8f0; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00ff88, #00c9ff); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #0a0a1e; font-size: 24px;">✅ Booking Confirmed!</h1>
        <p style="margin: 8px 0 0 0; color: #0a0a1e; font-size: 14px;">HB Racing Performance Build Advisory</p>
      </div>
      
      <div style="padding: 20px; background: #0a0a1e; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for booking a consulting session with HB Racing! Your payment has been received and your session is confirmed.
        </p>
        
        <div style="background: linear-gradient(135deg, #22c55e22, #16a34a22); border: 1px solid #22c55e44; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #22c55e; margin: 0 0 15px 0;">Your Booking Details</h3>
          <table style="width: 100%; color: #e2e8f0;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Service:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Engine:</td>
              <td style="padding: 6px 0; text-align: right;">${data.engineMake} - ${data.engineFamily}</td>
            </tr>
            <tr style="border-top: 1px solid #333;">
              <td style="padding: 12px 0 6px 0; color: #94a3b8;">Amount Paid:</td>
              <td style="padding: 12px 0 6px 0; text-align: right; font-size: 20px; font-weight: bold; color: #22c55e;">$${data.servicePrice.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #00f5ff22; border: 1px solid #00f5ff44; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #00f5ff; margin: 0 0 10px 0;">📞 What Happens Next?</h3>
          <p style="margin: 0; color: #e2e8f0; line-height: 1.6;">
            <strong>Expect a call or email within the next 48 hours</strong> to schedule your consultation session. We'll work with your schedule to find a convenient time.
          </p>
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 14px;">
            Consultations can be done via phone, Zoom, or Discord — your choice!
          </p>
        </div>
        
        <div style="background: #1e1e3f; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">Your Project Notes:</p>
          <p style="margin: 0; color: #e2e8f0; font-style: italic; line-height: 1.5;">"${data.description}"</p>
        </div>
        
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          If you have any questions before your session, feel free to reply to this email.
        </p>
        
        <div style="border-top: 1px solid #333; margin-top: 20px; padding-top: 20px; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">
            HB Racing | Performance Build Advisory<br>
            <a href="https://hbracing7.com" style="color: #00f5ff;">hbracing7.com</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `✅ Booking Confirmed: ${data.serviceName} - HB Racing`,
    html,
    replyTo: COMPANY_EMAIL,
  });
}
