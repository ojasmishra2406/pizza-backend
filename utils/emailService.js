// Email Service — powered by Resend (https://resend.com)
// Replaces Nodemailer/Gmail SMTP which is blocked on Render's free tier.
// Resend uses HTTPS API calls — no SMTP ports, no firewall issues.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Until you verify a custom domain in Resend, the sender must be:
// onboarding@resend.dev  — only sends to your own verified email address.
// After domain verification: 'Slice Lab <noreply@yourdomain.com>'
const FROM = 'Slice Lab <onboarding@resend.dev>';

// ─── Helpers ────────────────────────────────────────────────────────────────

const buildItemsHtml = (items) =>
  items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0">
          ${item.name}${item.selectedSize ? ` <span style="color:#888;font-size:13px">(${item.selectedSize.name})</span>` : ''}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right">₹${Number(item.totalPrice).toFixed(2)}</td>
      </tr>`
    )
    .join('');

const emailWrapper = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff">
    <div style="background:linear-gradient(135deg,#C41E3A,#9B1526);padding:20px 24px;border-radius:8px 8px 0 0;margin-bottom:24px">
      <h1 style="color:white;margin:0;font-size:22px">🍕 Slice Lab</h1>
    </div>
    ${content}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px;text-align:center">
      Thank you for ordering from Slice Lab!
    </div>
  </div>
`;

// ─── sendOrderConfirmationEmail ──────────────────────────────────────────────

export const sendOrderConfirmationEmail = async (order) => {
  console.log('📧 [EMAIL] sendOrderConfirmationEmail — Order ID:', order._id);

  const { userId, items, deliveryLocation, totalAmount, _id } = order;

  if (!userId?.email) {
    console.error('❌ [EMAIL] Missing user email — skipping');
    return { success: false, error: 'Missing user email' };
  }

  const html = emailWrapper(`
    <h2 style="color:#C41E3A;margin:0 0 8px 0">Order Confirmed! 🎉</h2>
    <p style="color:#444;margin:0 0 20px 0">Hi <strong>${userId.name}</strong>, your order has been placed successfully.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#f7f7f7">
          <th style="padding:10px 8px;text-align:left;font-size:13px;color:#555">Item</th>
          <th style="padding:10px 8px;text-align:center;font-size:13px;color:#555">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:13px;color:#555">Price</th>
        </tr>
      </thead>
      <tbody>${buildItemsHtml(items)}</tbody>
    </table>

    <div style="text-align:right;margin-bottom:20px">
      <span style="font-size:18px;font-weight:bold;color:#C41E3A">Total: ₹${Number(totalAmount).toFixed(2)}</span>
    </div>

    <div style="background:#f9f9f9;border-radius:6px;padding:14px;font-size:14px;color:#555">
      <p style="margin:4px 0"><strong>Order ID:</strong> #${_id}</p>
      <p style="margin:4px 0"><strong>Delivery Location:</strong> ${deliveryLocation}</p>
      <p style="margin:4px 0"><strong>Payment Status:</strong> Pending</p>
    </div>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: userId.email,
      subject: `Order Confirmed — #${String(_id).slice(-8)}`,
      html,
    });

    if (error) throw new Error(error.message);

    console.log('✅ [EMAIL] Order confirmation sent | Resend ID:', data.id, '| To:', userId.email);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ [EMAIL] sendOrderConfirmationEmail failed:', err.message);
    throw err;
  }
};

// ─── sendPaymentSuccessEmail ─────────────────────────────────────────────────

export const sendPaymentSuccessEmail = async (order) => {
  console.log('📧 [EMAIL] sendPaymentSuccessEmail — Order ID:', order._id);

  const { userId, items, deliveryLocation, totalAmount, _id, orderStatus } = order;

  if (!userId?.email) {
    console.error('❌ [EMAIL] Missing user email — skipping');
    return { success: false, error: 'Missing user email' };
  }

  const html = emailWrapper(`
    <h2 style="color:#28a745;margin:0 0 8px 0">Payment Successful! ✅</h2>
    <p style="color:#444;margin:0 0 20px 0">Hi <strong>${userId.name}</strong>, your payment has been confirmed.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#f7f7f7">
          <th style="padding:10px 8px;text-align:left;font-size:13px;color:#555">Item</th>
          <th style="padding:10px 8px;text-align:center;font-size:13px;color:#555">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:13px;color:#555">Price</th>
        </tr>
      </thead>
      <tbody>${buildItemsHtml(items)}</tbody>
    </table>

    <div style="text-align:right;margin-bottom:20px">
      <span style="font-size:18px;font-weight:bold;color:#28a745">Total Paid: ₹${Number(totalAmount).toFixed(2)}</span>
    </div>

    <div style="background:#f9f9f9;border-radius:6px;padding:14px;font-size:14px;color:#555">
      <p style="margin:4px 0"><strong>Order ID:</strong> #${_id}</p>
      <p style="margin:4px 0"><strong>Delivery Location:</strong> ${deliveryLocation}</p>
      <p style="margin:4px 0"><strong>Payment Status:</strong> <span style="color:#28a745;font-weight:bold">Paid ✓</span></p>
      <p style="margin:4px 0"><strong>Order Status:</strong> ${orderStatus}</p>
    </div>

    <p style="margin-top:16px;font-size:14px;color:#666">Track your order in the <strong>Orders</strong> section of the app.</p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: userId.email,
      subject: `Payment Confirmed — Order #${String(_id).slice(-8)}`,
      html,
    });

    if (error) throw new Error(error.message);

    console.log('✅ [EMAIL] Payment confirmation sent | Resend ID:', data.id, '| To:', userId.email);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ [EMAIL] sendPaymentSuccessEmail failed:', err.message);
    throw err;
  }
};

// ─── sendOrderStatusEmail ────────────────────────────────────────────────────

export const sendOrderStatusEmail = async (order, newStatus) => {
  console.log('📧 [EMAIL] sendOrderStatusEmail — Order ID:', order._id, '| Status:', newStatus);

  const { userId, _id } = order;

  if (!userId?.email) {
    console.error('❌ [EMAIL] Missing user email — skipping');
    return { success: false, error: 'Missing user email' };
  }

  const statusConfig = {
    placed:     { label: 'Order Placed',     color: '#007bff', icon: '📋' },
    preparing:  { label: 'Being Prepared',   color: '#fd7e14', icon: '👨‍🍳' },
    dispatched: { label: 'Out for Delivery', color: '#17a2b8', icon: '🛵' },
    delivered:  { label: 'Delivered',        color: '#28a745', icon: '✅' },
  };

  const { label, color, icon } = statusConfig[newStatus] || { label: newStatus, color: '#555', icon: '📦' };

  const html = emailWrapper(`
    <h2 style="color:${color};margin:0 0 8px 0">${icon} ${label}</h2>
    <p style="color:#444;margin:0 0 20px 0">Hi <strong>${userId.name}</strong>, your order status has been updated.</p>

    <div style="background:#f9f9f9;border-radius:6px;padding:14px;font-size:14px;color:#555">
      <p style="margin:4px 0"><strong>Order ID:</strong> #${_id}</p>
      <p style="margin:4px 0"><strong>Status:</strong> <span style="color:${color};font-weight:bold">${label}</span></p>
    </div>

    <p style="margin-top:16px;font-size:14px;color:#666">Track your order in the <strong>Orders</strong> section of the app.</p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: userId.email,
      subject: `${icon} Order Update — ${label} | #${String(_id).slice(-8)}`,
      html,
    });

    if (error) throw new Error(error.message);

    console.log('✅ [EMAIL] Status update sent | Resend ID:', data.id, '| To:', userId.email, '| Status:', newStatus);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ [EMAIL] sendOrderStatusEmail failed:', err.message);
    throw err;
  }
};
