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
