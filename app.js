// app.js - Controller logic for the Movana Transportation Marketplace

(function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn("Movana app.js loaded in a non-browser environment. Skipping execution.");
    return;
  }
  if (!window.Store) {
    console.error("Store is not defined when app.js executed! Please load store.js before app.js.");
    return;
  }
  const Store = window.Store;


  // ==========================================
  // EMAIL TEMPLATE ENGINE & DELIVERY SERVICE
  // ==========================================

  const EmailTemplates = {
    wrap: (title, bodyHtml) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
      .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
      .header { background-color: #0f172a; padding: 24px; text-align: center; }
      .logo { height: 35px; width: auto; vertical-align: middle; }
      .content { padding: 32px 24px; line-height: 1.6; }
      .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
      .btn { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; font-size: 14px; text-align: center; }
      .otp-box { font-size: 32px; font-weight: 800; color: #0f172a; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; letter-spacing: 4px; margin: 24px 0; font-family: monospace; border: 1px solid #e2e8f0; }
      .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <img class="logo" src="https://movana.vercel.app/logo.svg" alt="Movana Logo" style="height: 35px; width: auto;">
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Movana Marketplace. All rights reserved.<br>
          100 Main St, Chicago, IL 60601
        </div>
      </div>
    </div>
  </body>
  </html>
  `,

    emailVerificationOtp: (username, otp) => {
      const html = EmailTemplates.wrap("Verify your Movana Account", `
        <h1 class="title">Verify Your Email Address</h1>
        <p>Hello ${username},</p>
        <p>Thank you for registering with Movana. Please use the verification code below to activate your account:</p>
        <div class="otp-box">${otp}</div>
        <p>This code is valid for 5 minutes. If you did not request this email, please ignore it.</p>
      `);
      const text = `Hello ${username},\n\nThank you for registering with Movana. Your email verification code is: ${otp}\n\nThis code is valid for 5 minutes.`;
      return { subject: "Verify your Movana Account", html, text };
    },

    passwordResetOtp: (username, otp) => {
      const html = EmailTemplates.wrap("Reset your Movana Password", `
        <h1 class="title">Reset Your Password</h1>
        <p>Hello ${username},</p>
        <p>We received a request to change your password. Use the verification code below to authorize this change:</p>
        <div class="otp-box">${otp}</div>
        <p>This code is valid for 5 minutes. If you did not request this, please verify your account security.</p>
      `);
      const text = `Hello ${username},\n\nWe received a request to change your password. Your authorization verification code is: ${otp}\n\nThis code is valid for 5 minutes.`;
      return { subject: "Reset your Movana Password", html, text };
    },

    emailChangeOtp: (username, otp) => {
      const html = EmailTemplates.wrap("Confirm Email Address Change", `
        <h1 class="title">Confirm Email Address Change</h1>
        <p>Hello ${username},</p>
        <p>We received a request to change your email address. Enter this verification code to confirm the change:</p>
        <div class="otp-box">${otp}</div>
        <p>This code is sent to your current verified address. If you did not initiate this request, please contact support immediately.</p>
      `);
      const text = `Hello ${username},\n\nWe received a request to change your email address. Confirm with verification code: ${otp}\n\nIf you did not initiate this, contact support.`;
      return { subject: "Confirm Email Address Change", html, text };
    },

    phoneChangeOtp: (username, otp) => {
      const html = EmailTemplates.wrap("Confirm Phone Number Change", `
        <h1 class="title">Confirm Phone Number Change</h1>
        <p>Hello ${username},</p>
        <p>We received a request to update your mobile phone number. Enter this verification code to authorize the change:</p>
        <div class="otp-box">${otp}</div>
        <p>This code is valid for 5 minutes.</p>
      `);
      const text = `Hello ${username},\n\nConfirm phone number change with verification code: ${otp}\n\nThis code is valid for 5 minutes.`;
      return { subject: "Confirm Phone Number Change", html, text };
    },

    welcomeEmail: (username) => {
      const html = EmailTemplates.wrap("Welcome to Movana!", `
        <h1 class="title">Welcome to the Movana Marketplace</h1>
        <p>Hello ${username},</p>
        <p>Your account is now fully verified and ready. Log in to start listing shipments or bidding on loads today!</p>
        <a class="btn" href="https://movana.vercel.app/auth" style="color: #ffffff;">Get Started</a>
      `);
      const text = `Hello ${username},\n\nWelcome to the Movana Marketplace! Your account is verified. Visit https://movana.vercel.app/auth to get started.`;
      return { subject: "Welcome to Movana!", html, text };
    },

    accountActivated: (username) => {
      const html = EmailTemplates.wrap("Movana Account Activated", `
        <h1 class="title">Account Activated Successfully</h1>
        <p>Hello ${username},</p>
        <p>Your email verification is complete, and your profile is now active on the Movana platform.</p>
      `);
      const text = `Hello ${username},\n\nYour email verification is complete, and your Movana profile is now active.`;
      return { subject: "Movana Account Activated", html, text };
    },

    shipmentPosted: (username, cargoType, origin, destination) => {
      const html = EmailTemplates.wrap("Your Shipment is Live on Movana", `
        <h1 class="title">Your Shipment is Live</h1>
        <p>Hello ${username},</p>
        <p>Your shipment listing for <strong>${cargoType}</strong> from <strong>${origin}</strong> to <strong>${destination}</strong> has been successfully posted to the Load Board.</p>
        <p>We will notify you as soon as carriers submit bids.</p>
      `);
      const text = `Hello ${username},\n\nYour shipment listing for ${cargoType} from ${origin} to ${destination} is now live on the Load Board.`;
      return { subject: "Your Shipment is Live on Movana", html, text };
    },

    newBidReceived: (username, cargoType, carrierName, amount) => {
      const html = EmailTemplates.wrap("New Bid Received on your Shipment", `
        <h1 class="title">New Bid Received</h1>
        <p>Hello ${username},</p>
        <p>You have received a new bid of <strong>$${amount}</strong> from carrier <strong>${carrierName}</strong> for your shipment: <strong>${cargoType}</strong>.</p>
        <a class="btn" href="https://movana.vercel.app/inbox" style="color: #ffffff;">Review Bid</a>
      `);
      const text = `Hello ${username},\n\nYou have received a new bid of $${amount} from carrier ${carrierName} for shipment: ${cargoType}. Review bid at https://movana.vercel.app/inbox`;
      return { subject: "New Bid Received on your Shipment", html, text };
    },

    bidAccepted: (username, cargoType, amount) => {
      const html = EmailTemplates.wrap("Your Bid was Accepted!", `
        <h1 class="title">Bid Accepted!</h1>
        <p>Hello ${username},</p>
        <p>Congratulations! Your bid of <strong>$${amount}</strong> for shipment <strong>${cargoType}</strong> has been accepted by the shipper.</p>
        <p>Please check your inbox to view delivery coordinates and coordinate pickup.</p>
        <a class="btn" href="https://movana.vercel.app/inbox" style="color: #ffffff;">View Details</a>
      `);
      const text = `Hello ${username},\n\nCongratulations! Your bid of $${amount} for shipment ${cargoType} has been accepted. View details at https://movana.vercel.app/inbox`;
      return { subject: "Your Bid was Accepted!", html, text };
    },

    shipmentDelivered: (username, cargoType) => {
      const html = EmailTemplates.wrap("Shipment Marked as Delivered", `
        <h1 class="title">Shipment Delivered</h1>
        <p>Hello ${username},</p>
        <p>Your shipment of <strong>${cargoType}</strong> has been marked as delivered by the carrier.</p>
        <p>Please review and release the payment from your dashboard.</p>
      `);
      const text = `Hello ${username},\n\nYour shipment of ${cargoType} has been marked as delivered. Please review and release payment.`;
      return { subject: "Shipment Marked as Delivered", html, text };
    },

    newMessageNotification: (username, senderName, messageSnippet) => {
      const html = EmailTemplates.wrap(`New Message from ${senderName}`, `
        <h1 class="title">New Message Received</h1>
        <p>Hello ${username},</p>
        <p>You have received a new message from <strong>${senderName}</strong> regarding your negotiation:</p>
        <blockquote style="border-left: 4px solid #cbd5e1; padding-left: 16px; margin: 20px 0; color: #475569; font-style: italic;">
          "${messageSnippet}"
        </blockquote>
        <a class="btn" href="https://movana.vercel.app/inbox" style="color: #ffffff;">Reply in Inbox</a>
      `);
      const text = `Hello ${username},\n\nYou have received a new message from ${senderName}: "${messageSnippet}"\n\nReply at https://movana.vercel.app/inbox`;
      return { subject: `New Message from ${senderName}`, html, text };
    }
  };

  async function sendEmail(to, subject, html, text, templateName) {
    const emailLog = {
      recipient: to,
      template: templateName,
      timestamp: new Date().toISOString(),
      status: 'pending',
      response: '',
      error: ''
    };

    const logEmailInStore = (log) => {
      try {
        const logs = JSON.parse(localStorage.getItem('movana_email_logs') || '[]');
        logs.push(log);
        localStorage.setItem('movana_email_logs', JSON.stringify(logs));
      } catch (e) {
        console.error("Failed to write email logs:", e);
      }
    };

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';

    if (isLocal) {
      console.log(`\n===== DEVELOPMENT EMAIL (Simulated) =====`);
      console.log(`Recipient: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: ${templateName}`);
      if (html.includes("class=\"otp-box\"") || html.includes("class='otp-box'") || html.includes("otp-box")) {
        const otpMatch = html.match(/otp-box">(\d{6})<\/div>/) || html.match(/>(\d{6})<\/div>/);
        const otp = otpMatch ? otpMatch[1] : 'UNKNOWN';
        console.log(`===== DEVELOPMENT OTP: ${otp} =====`);
      } else {
        console.log(`Plain Text Fallback:\n${text}`);
      }
      console.log(`=========================================\n`);

      emailLog.status = 'delivered';
      emailLog.response = 'Simulated Delivery (Local Development)';
      logEmailInStore(emailLog);
      return true;
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text })
      });

      const result = await res.json();
      if (res.ok) {
        emailLog.status = 'delivered';
        emailLog.response = JSON.stringify(result);
        logEmailInStore(emailLog);
        return true;
      } else {
        emailLog.status = 'failed';
        emailLog.error = result.error || 'Unknown server error';
        logEmailInStore(emailLog);
        throw new Error(result.error || 'Serverless mail API error');
      }
    } catch (err) {
      console.error("Email delivery failed:", err);
      emailLog.status = 'failed';
      emailLog.error = err.message;
      logEmailInStore(emailLog);
      throw err;
    }
  }

  // Monkey-patch Store.createShipment to persist equipmentRequired without modifying store.js
  (function() {
    const originalCreateShipment = Store.createShipment;
    Store.createShipment = function(shipperId, shipperName, shipmentData) {
      console.log("=== DEBUG: Store.createShipment CALLED ===");
      console.log("Form value received (equipmentRequired):", shipmentData.equipmentRequired);
      console.log("Shipment object before save:", JSON.stringify(shipmentData, null, 2));

      // Call the original createShipment to perform standard storage
      const result = originalCreateShipment.call(this, shipperId, shipperName, shipmentData);

      // Persist equipmentRequired by writing directly to localStorage
      const stored = localStorage.getItem('movana_store_data');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const found = data.shipments.find(s => s.id === result.id);
          if (found) {
            found.equipmentRequired = shipmentData.equipmentRequired || 'Dry Van';
            localStorage.setItem('movana_store_data', JSON.stringify(data));
          }
        } catch (e) {
          console.error('Error in monkey-patched createShipment', e);
        }
      }

      // Add property to returned result clone
      result.equipmentRequired = shipmentData.equipmentRequired || 'Dry Van';
      
      console.log("Shipment object after save:", JSON.stringify(result, null, 2));
      console.log("==========================================");

      return result;
    };
  })();

  // Monkey-patch Store.createBid to persist earliestPickupDate without modifying store.js
  (function() {
    const originalCreateBid = Store.createBid;
    Store.createBid = function(carrierId, carrierName, shipmentId, bidData) {
      const result = originalCreateBid.call(this, carrierId, carrierName, shipmentId, bidData);
      
      const stored = localStorage.getItem('movana_store_data');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const found = data.bids.find(b => b.id === result.id);
          if (found) {
            found.earliestPickupDate = bidData.earliestPickupDate || result.deliveryDate;
            localStorage.setItem('movana_store_data', JSON.stringify(data));
          }
        } catch (e) {
          console.error('Error in monkey-patched createBid', e);
        }
      }
      
      result.earliestPickupDate = bidData.earliestPickupDate || result.deliveryDate;
      return result;
    };
  })();

  // Chronological timeline activity event logger
  function logShipmentEvent(shipmentId, eventType, label, desc, additional = {}) {
    const stored = localStorage.getItem('movana_store_data');
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      const shipment = data.shipments.find(s => s.id === shipmentId);
      if (shipment) {
        if (!shipment.history) {
          shipment.history = [
            {
              event: 'created',
              label: 'Shipment Created',
              desc: `Shipment listed on the marketplace with a budget of $${shipment.budget.toLocaleString()}.`,
              timestamp: shipment.createdAt || new Date().toISOString()
            }
          ];
        }
        
        // Prevent duplicate events for unique status transitions
        if (['picked up', 'in transit', 'delivered', 'completed', 'awarded'].includes(eventType)) {
          const exists = shipment.history.some(h => h.event === eventType);
          if (exists) return;
        }
        
        shipment.history.push({
          event: eventType,
          label,
          desc,
          timestamp: new Date().toISOString(),
          ...additional
        });
        
        localStorage.setItem('movana_store_data', JSON.stringify(data));
        console.log(`[ACTIVITY LOG] Logged event '${eventType}' for Shipment ${shipmentId}`);
      }
    } catch (e) {
      console.error('Error logging shipment event', e);
    }
  }

  // Monkey-patch Store.addNegotiationMessage to support system flags, custom fields, attachments, and email notifications
  (function() {
    const originalAddNegMsg = Store.addNegotiationMessage;
    Store.addNegotiationMessage = function(bidId, senderId, senderName, message, amount = null, isSystem = false, additionalFields = null) {
      const result = originalAddNegMsg.call(this, bidId, senderId, senderName, message, amount);
      
      const stored = localStorage.getItem('movana_store_data');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const neg = data.negotiations.find(n => n.bidId === bidId);
          if (neg && neg.messages.length > 0) {
            const latestMsg = neg.messages[neg.messages.length - 1];
            if (isSystem) {
              latestMsg.isSystem = true;
            }
            if (additionalFields) {
              latestMsg.pickupDate = additionalFields.pickupDate || null;
              latestMsg.deliveryDate = additionalFields.deliveryDate || null;
              latestMsg.trailerType = additionalFields.trailerType || null;
              latestMsg.notes = additionalFields.notes || null;
              latestMsg.imageAttachment = additionalFields.imageAttachment || null;
            }
            localStorage.setItem('movana_store_data', JSON.stringify(data));
          }

          // CENTRALIZED NEGOTIATION CHAT EMAIL TRIGGERS
          if (!isSystem && message) {
            const bid = data.bids.find(b => b.id === bidId);
            if (bid) {
              const shipment = data.shipments.find(s => s.id === bid.shipmentId);
              if (shipment) {
                const senderUser = data.users.find(u => u.id === senderId);
                const senderDisplayName = senderUser ? (senderUser.companyName || senderUser.username) : senderName;
                
                const recipientId = senderId === shipment.shipperId ? bid.carrierId : shipment.shipperId;
                const recipientUser = data.users.find(u => u.id === recipientId);
                
                if (recipientUser && recipientUser.email) {
                  const snippet = message.length > 120 ? message.substring(0, 120) + '...' : message;
                  const emailTemplate = EmailTemplates.newMessageNotification(recipientUser.username, senderDisplayName, snippet);
                  sendEmail(recipientUser.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text, "newMessageNotification").catch(e => {
                    console.error("Failed to send message email:", e);
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error('Error in monkey-patched addNegotiationMessage', e);
        }
      }
      
      if (result && result.messages.length > 0) {
        const latestMsg = result.messages[result.messages.length - 1];
        if (isSystem) {
          latestMsg.isSystem = true;
        }
        if (additionalFields) {
          latestMsg.pickupDate = additionalFields.pickupDate || null;
          latestMsg.deliveryDate = additionalFields.deliveryDate || null;
          latestMsg.trailerType = additionalFields.trailerType || null;
          latestMsg.notes = additionalFields.notes || null;
          latestMsg.imageAttachment = additionalFields.imageAttachment || null;
        }
      }
      return result;
    };
  })();



// --- NOTIFICATIONS MANAGEMENT SYSTEM ---
function getNotificationsForUser(userId) {
  const stored = localStorage.getItem(`movana_notifications_${userId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveNotificationsForUser(userId, notifications) {
  localStorage.setItem(`movana_notifications_${userId}`, JSON.stringify(notifications));
}

function addNotification(userId, title, type, shipmentId) {
  const notifications = getNotificationsForUser(userId);
  const newNotif = {
    id: `notif_${Math.random().toString(36).substr(2, 9)}`,
    title,
    type,
    shipmentId,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(newNotif);
  saveNotificationsForUser(userId, notifications);
  
  const currentUser = Store.getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    showToast(`🔔 ${title}`);
  }
  updateNotificationCenterUI();
}

function markAllNotificationsRead(userId) {
  const notifications = getNotificationsForUser(userId);
  notifications.forEach(n => n.read = true);
  saveNotificationsForUser(userId, notifications);
  updateNotificationCenterUI();
}

// --- CARRIER DETAILED METADATA GENERATOR ---
function getCarrierMetadata(carrierId) {
  let hash = 0;
  for (let i = 0; i < carrierId.length; i++) {
    hash = (hash << 5) - hash + carrierId.charCodeAt(i);
    hash |= 0;
  }
  
  const ratingVal = (4.5 + (Math.abs(hash % 6) * 0.1)).toFixed(1);
  const jobsCount = Math.abs(hash % 90) + 15;
  const responseTimeVal = (Math.abs(hash % 3) === 0) ? "Under 1 hour" : (Math.abs(hash % 3) === 1 ? "Under 2 hours" : "Under 3 hours");
  const memberSinceYear = 2022 + (Math.abs(hash % 3));
  
  let stars = '';
  const numStars = Math.round(parseFloat(ratingVal));
  for (let s = 0; s < 5; s++) {
    stars += s < numStars ? '★' : '☆';
  }
  
  return {
    rating: ratingVal,
    stars: stars,
    jobsCompleted: jobsCount,
    responseTime: responseTimeVal,
    memberSince: memberSinceYear,
    verified: true
  };
}

// --- MESSAGE PRIVACY FILTER ---
function containsProhibitedInfo(text) {
  const t = text.toLowerCase();
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(t)) return true;
  
  const phoneRegex = /(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}/g;
  if (phoneRegex.test(t)) return true;
  
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b/g;
  if (urlRegex.test(t)) return true;
  
  if (/\bdot\b\s*#?\s*\d+/i.test(t) || /\bdot\d+/i.test(t)) return true;
  if (/\bmc\b\s*#?\s*\d+/i.test(t) || /\bmc\d+/i.test(t)) return true;
  if (/\busdot\b\s*#?\s*\d+/i.test(t)) return true;
  
  const gpsRegex = /-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/g;
  if (gpsRegex.test(t)) return true;
  
  const platforms = ['whatsapp', 'telegram', 'facebook', 'instagram', 'insta', 'fb', 'tg', 'wa.me', 't.me'];
  for (const plat of platforms) {
    if (t.includes(plat)) return true;
  }
  
  const stored = localStorage.getItem('movana_store_data');
  if (stored) {
    try {
      const db = JSON.parse(stored);
      for (const u of db.users) {
        if (u.companyName && u.companyName.length > 3) {
          const comp = u.companyName.toLowerCase();
          const cleanComp = comp.replace(/\b(inc|llc|corp|co|and|logistics|transport|trucking)\b/g, '').trim();
          if (cleanComp.length > 2 && t.includes(cleanComp)) {
            return true;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  if (/\b(?:street|st|ave|rd|road|zip|zipcode|address)\b/i.test(t) && /\d+/.test(t)) return true;
  
  return false;
}

// --- PERMANENT BID HISTORY LOGGER ---
function saveBidHistoryLog(shipmentId, awardDetails) {
  const bids = Store.getBidsForShipment(shipmentId);
  const shipment = Store.getShipment(shipmentId);
  const negotiations = bids.map(b => {
    const neg = Store.getNegotiationForBid(b.id);
    return {
      bidId: b.id,
      carrierId: b.carrierId,
      carrierName: b.carrierName,
      amount: b.amount,
      createdAt: b.createdAt,
      messages: neg ? neg.messages : []
    };
  });
  
  const historyLog = {
    shipmentId: shipmentId,
    origin: shipment.origin,
    destination: shipment.destination,
    budget: shipment.budget,
    bids: bids,
    negotiations: negotiations,
    awardDetails: awardDetails,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem(`movana_bid_history_${shipmentId}`, JSON.stringify(historyLog));
}

function getBidHistoryLog(shipmentId) {
  const stored = localStorage.getItem(`movana_bid_history_${shipmentId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// --- STATUS STYLE INJECTOR ---
function injectStatusStyles() {
  const style = document.createElement('style');
  style.id = 'dynamic-status-styles';
  style.innerHTML = `
    .status-badge.open {
      background-color: rgba(24, 160, 240, 0.15) !important;
      color: var(--color-open) !important;
      border: 1px solid rgba(24, 160, 240, 0.3) !important;
    }
    .status-badge.bidding, .status-badge.receiving-bids {
      background-color: rgba(99, 102, 241, 0.15) !important;
      color: #6366f1 !important;
      border: 1px solid rgba(99, 102, 241, 0.3) !important;
    }
    .status-badge.negotiating {
      background-color: rgba(245, 158, 11, 0.15) !important;
      color: #d97706 !important;
      border: 1px solid rgba(245, 158, 11, 0.3) !important;
    }
    .status-badge.awarded {
      background-color: rgba(13, 148, 136, 0.15) !important;
      color: #0d9488 !important;
      border: 1px solid rgba(13, 148, 136, 0.3) !important;
    }
    .status-badge.picked-up, .status-badge.picked_up, .status-badge.picked\\ up {
      background-color: rgba(147, 51, 234, 0.15) !important;
      color: #9333ea !important;
      border: 1px solid rgba(147, 51, 234, 0.3) !important;
    }
    .status-badge.in-transit, .status-badge.in_transit, .status-badge.in\\ transit {
      background-color: rgba(168, 85, 247, 0.15) !important;
      color: var(--color-transit) !important;
      border: 1px solid rgba(168, 85, 247, 0.3) !important;
    }
    .status-badge.delivered {
      background-color: rgba(34, 197, 94, 0.15) !important;
      color: var(--color-delivered) !important;
      border: 1px solid rgba(34, 197, 94, 0.3) !important;
    }
    .status-badge.completed {
      background-color: rgba(100, 116, 139, 0.15) !important;
      color: #64748b !important;
      border: 1px solid rgba(100, 116, 139, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
}

// --- DYNAMIC CARRIER BID FORM RESTRUCTURE ---
function setupBidModalForm() {
  const bidForm = document.getElementById('bid-form');
  if (!bidForm) return;
  
  bidForm.innerHTML = `
    <input type="hidden" id="bid-shipment-id">
    
    <div id="bid-carrier-stats" class="mb-16" style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: var(--radius-md); padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="form-group">
        <label for="bid-amount">Bid Amount ($)</label>
        <input type="number" id="bid-amount" class="form-control" placeholder="e.g. 3900" min="1" required>
      </div>

      <div class="form-group">
        <label for="bid-delivery-date">Estimated Delivery Date</label>
        <input type="date" id="bid-delivery-date" class="form-control" required>
      </div>
    </div>

    <div class="form-group">
      <label for="bid-pickup-date">Earliest Pickup Date</label>
      <input type="date" id="bid-pickup-date" class="form-control" required>
    </div>

    <div class="form-group">
      <label for="bid-message">Message to Shipper (Optional)</label>
      <textarea id="bid-message" class="form-control" placeholder="Explain your capabilities, trailer type, tracking service or references..." rows="3"></textarea>
    </div>

    <div class="form-group" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px;">
      <input type="checkbox" id="bid-acknowledgement-checkbox" style="margin-top: 4px;" required>
      <label for="bid-acknowledgement-checkbox" style="font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color);">
        I have reviewed this shipment and can complete it as requested.
      </label>
    </div>

    <div id="bid-error" style="color: var(--color-rejected); font-size: 14px; margin-bottom: 16px;" class="d-none"></div>

    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
      <button type="button" class="btn btn-outline" id="cancel-bid-submit">Cancel</button>
      <button type="submit" class="btn btn-secondary">Submit Offer</button>
    </div>
  `;
  
  elements.bidAmount = document.getElementById('bid-amount');
  elements.bidDeliveryDate = document.getElementById('bid-delivery-date');
  elements.bidMessage = document.getElementById('bid-message');
  elements.bidError = document.getElementById('bid-error');
  elements.cancelBidSubmit = document.getElementById('cancel-bid-submit');
  elements.bidShipmentId = document.getElementById('bid-shipment-id');
  
  elements.cancelBidSubmit.addEventListener('click', () => elements.bidModal.classList.remove('active'));
}

// --- DYNAMIC NOTIFICATIONS CENTER PANEL ---
function updateNotificationCenterUI() {
  const user = Store.getCurrentUser();
  if (!user) return;
  
  const container = document.getElementById('nav-notif-container');
  if (!container) return;
  
  const notifs = getNotificationsForUser(user.id);
  const unreadCount = notifs.filter(n => !n.read).length;
  
  let badge = container.querySelector('.notif-badge');
  if (unreadCount > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notif-badge';
      badge.style.cssText = 'position: absolute; top: -6px; right: -6px; background: red; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;';
      container.appendChild(badge);
    }
    badge.textContent = unreadCount;
  } else if (badge) {
    badge.remove();
  }
  
  const panel = document.getElementById('notif-overlay-panel');
  if (panel) {
    renderNotifListInPanel(panel, notifs);
  }
}

function toggleNotifOverlayPanel(e) {
  e.stopPropagation();
  const user = Store.getCurrentUser();
  if (!user) return;
  
  let panel = document.getElementById('notif-overlay-panel');
  if (panel) {
    panel.remove();
    return;
  }
  
  panel = document.createElement('div');
  panel.id = 'notif-overlay-panel';
  panel.style.cssText = `
    position: absolute;
    top: 50px;
    right: 0;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
  `;
  
  const notifContainer = document.getElementById('nav-notif-container');
  notifContainer.appendChild(panel);
  
  const notifs = getNotificationsForUser(user.id);
  renderNotifListInPanel(panel, notifs);
  markAllNotificationsRead(user.id);
  
  const closeHandler = (event) => {
    if (!panel.contains(event.target) && !notifContainer.contains(event.target)) {
      panel.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  document.addEventListener('click', closeHandler);
}

function renderNotifListInPanel(panel, notifs) {
  panel.innerHTML = `
    <div style="font-weight: 700; font-size: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; color: var(--text-main);">
      <span>Notifications</span>
      <span style="font-size: 11px; color: var(--accent-shipper); cursor: pointer;" id="btn-clear-notifs">Clear All</span>
    </div>
  `;
  
  if (notifs.length === 0) {
    panel.innerHTML += `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin: 20px 0;">No notifications.</p>`;
    return;
  }
  
  const listDiv = document.createElement('div');
  listDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
  
  notifs.forEach(n => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: ${n.read ? 'white' : 'rgba(24, 160, 240, 0.05)'};
      border: 1px solid ${n.read ? 'var(--border-color)' : 'rgba(24, 160, 240, 0.15)'};
      font-size: 12px;
      cursor: pointer;
      transition: var(--transition-smooth);
      max-width: 100%;
      overflow: hidden;
    `;
    item.innerHTML = `
      <div style="font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(n.title)}">${escapeHtml(n.title)}</div>
      <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    item.addEventListener('click', () => {
      const currentUser = Store.getCurrentUser();
      if (!currentUser) return;
      
      // Mark as read
      n.read = true;
      saveNotificationsForUser(currentUser.id, notifs);
      updateNotificationCenterUI();
      
      panel.remove();
      
      const targetId = n.shipmentId; // could be bidId or shipmentId
      let bid = null;
      let shipment = null;
      
      if (targetId && targetId.startsWith('bid_')) {
        bid = Store.getBids().find(b => b.id === targetId);
        if (bid) shipment = Store.getShipment(bid.shipmentId);
      } else if (targetId && targetId.startsWith('ship_')) {
        shipment = Store.getShipment(targetId);
        const bids = Store.getBidsForShipment(targetId);
        if (currentUser.role === 'shipper') {
          if (shipment.carrierId) {
            bid = bids.find(b => b.carrierId === shipment.carrierId);
          } else {
            bid = bids.sort((a, b) => {
              const negA = Store.getNegotiationForBid(a.id);
              const negB = Store.getNegotiationForBid(b.id);
              const timeA = negA && negA.messages && negA.messages.length > 0 ? negA.messages[negA.messages.length - 1].createdAt : a.createdAt;
              const timeB = negB && negB.messages && negB.messages.length > 0 ? negB.messages[negB.messages.length - 1].createdAt : b.createdAt;
              return new Date(timeB) - new Date(timeA);
            })[0];
          }
        } else {
          bid = bids.find(b => b.carrierId === currentUser.id);
        }
      }
      
      if (bid) {
        switchView('inbox');
        selectInboxConversation(bid.id);
      } else if (shipment) {
        showDetailsModal(shipment);
      }
    });
    listDiv.appendChild(item);
  });
  
  panel.appendChild(listDiv);
  
  panel.querySelector('#btn-clear-notifs').onclick = (e) => {
    e.stopPropagation();
    const user = Store.getCurrentUser();
    saveNotificationsForUser(user.id, []);
    updateNotificationCenterUI();
  };
}

// --- ESCAPE HTML ---
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// --- DYNAMIC INCOMING OFFERS & CHAT ACTIONS ---
function formatStatusText(status) {
  if (status === 'bidding') return 'Receiving Bids';
  return status.replace('-', ' ').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

let activeChatBidId = null;

function openNegotiationChat(bidId, showCounterPanel = false) {
  switchView('inbox');
  selectInboxConversation(bidId);
  if (showCounterPanel) {
    const counterPanel = document.getElementById('inbox-counter-offer-panel');
    if (counterPanel) counterPanel.classList.remove('d-none');
  }
}

function renderChatBubbles(bidId) {
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  const shipment = Store.getShipment(bid.shipmentId);
  const neg = Store.getNegotiationForBid(bidId);
  const chatHistory = document.getElementById('neg-chat-history');
  chatHistory.innerHTML = '';
  
  let lastCounterMsgIndex = -1;
  for (let i = neg.messages.length - 1; i >= 0; i--) {
    if (neg.messages[i].amount !== null) {
      lastCounterMsgIndex = i;
      break;
    }
  }
  
  neg.messages.forEach((msg, index) => {
    const isMe = msg.senderId === currentUser.id;
    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (msg.amount !== null) {
      const isLastCounter = index === lastCounterMsgIndex;
      const isPending = isLastCounter && (shipment.status === 'open' || shipment.status === 'bidding' || shipment.status === 'negotiating');
      const showButtons = isPending && !isMe;
      
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `
        align-self: center;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: var(--radius-md);
        padding: 12px 16px;
        width: 80%;
        max-width: 320px;
        box-shadow: var(--shadow-sm);
        text-align: center;
        margin: 8px 0;
      `;
      
      cardDiv.innerHTML = `
        <div style="font-size: 11px; text-transform: uppercase; color: #16a34a; font-weight: 700; letter-spacing: 0.5px;">Counter Offer Proposed</div>
        <div style="font-size: 24px; font-weight: 800; color: #15803d; margin: 8px 0;">$${msg.amount.toLocaleString()}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">By ${isMe ? 'You' : (currentUser.role === 'shipper' ? 'Carrier' : 'Shipper')} • ${timeStr}</div>
        
        ${showButtons ? `
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-danger btn-sm btn-counter-decline" style="padding: 4px 12px; font-size: 12px;">Decline</button>
            <button class="btn btn-secondary btn-sm btn-counter-accept" style="padding: 4px 12px; font-size: 12px; background: #22c55e; border-color: #22c55e;">Accept</button>
          </div>
        ` : `
          <div style="font-size: 12px; font-weight: 600; color: ${isPending ? '#d97706' : (bid.amount === msg.amount && shipment.carrierId === bid.carrierId ? '#16a34a' : '#94a3b8')};">
            ${isPending ? 'Awaiting Response' : (bid.amount === msg.amount && shipment.carrierId === bid.carrierId ? '✓ Accepted' : '❌ Superseded / Declined')}
          </div>
        `}
      `;
      
      if (showButtons) {
        cardDiv.querySelector('.btn-counter-accept').addEventListener('click', () => {
          acceptCounterOffer(bidId, msg.amount);
        });
        cardDiv.querySelector('.btn-counter-decline').addEventListener('click', () => {
          declineCounterOffer(bidId, msg.amount);
        });
      }
      
      chatHistory.appendChild(cardDiv);
    } else if (msg.isSystem) {
      const sysDiv = document.createElement('div');
      sysDiv.style.cssText = `
        align-self: center;
        background: #f1f5f9;
        border-radius: var(--radius-sm);
        padding: 4px 10px;
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 500;
        text-align: center;
        max-width: 90%;
      `;
      sysDiv.textContent = `${sysDiv.textContent || ''}${msg.message} • ${timeStr}`;
      chatHistory.appendChild(sysDiv);
    } else {
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        align-self: ${isMe ? 'flex-end' : 'flex-start'};
        background: ${isMe ? 'var(--accent-shipper)' : '#e2e8f0'};
        color: ${isMe ? 'white' : 'var(--text-main)'};
        padding: 8px 12px;
        border-radius: ${isMe ? '12px 12px 0 12px' : '12px 12px 12px 0'};
        max-width: 75%;
        box-shadow: var(--shadow-sm);
        position: relative;
        text-align: left;
      `;
      
      bubble.innerHTML = `
        <div style="font-size: 13px; line-height: 1.4; word-break: break-word;">${escapeHtml(msg.message)}</div>
        <div style="font-size: 9px; text-align: right; margin-top: 4px; color: ${isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'}; font-weight: 500;">${timeStr}</div>
      `;
      chatHistory.appendChild(bubble);
    }
  });
  
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function acceptCounterOffer(bidId, amount) {
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  bid.amount = amount;
  confirmAcceptBid(bidId);
}

function declineCounterOffer(bidId, amount) {
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  
  try {
    Store.addNegotiationMessage(bidId, currentUser.id, currentUser.companyName, `${currentUser.companyName} declined the counter offer of $${amount}`, null, true);
    const shipment = Store.getShipment(bid.shipmentId);
    const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
    addNotification(partnerId, `${currentUser.companyName} declined your counter offer of $${amount}`, 'counter_offer_declined', bid.shipmentId);
    renderChatBubbles(bidId);
    showToast('Counter offer declined.');
  } catch (err) {
    alert(err.message);
  }
}

function openCounterOfferModal(bidId) {
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  const shipment = Store.getShipment(bid.shipmentId);
  if (!shipment) return;

  const neg = Store.getNegotiationForBid(bidId);
  let initialPrice = bid.amount;
  let initialPickupDate = shipment.pickupDate || "";
  let initialDeliveryDate = shipment.deliveryDate || "";
  let initialTrailerType = shipment.equipmentRequired || "Dry Van";
  
  if (neg && neg.messages) {
    const counterMsgs = neg.messages.filter(m => m.amount !== null && !m.isSystem);
    if (counterMsgs.length > 0) {
      const latestCounter = counterMsgs[counterMsgs.length - 1];
      initialPrice = latestCounter.amount;
      if (latestCounter.pickupDate) initialPickupDate = latestCounter.pickupDate;
      if (latestCounter.deliveryDate) initialDeliveryDate = latestCounter.deliveryDate;
      if (latestCounter.trailerType) initialTrailerType = latestCounter.trailerType;
    }
  }

  const formatYYYYMMDD = (dStr) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    } catch (e) {
      return "";
    }
  };

  const formattedPickup = formatYYYYMMDD(initialPickupDate);
  const formattedDelivery = formatYYYYMMDD(initialDeliveryDate);

  const modalHtml = `
    <div id="counter-offer-modal" class="modal-backdrop active" style="z-index: 10000; display: flex; justify-content: center; align-items: center; background: rgba(15,23,42,0.6);">
      <div class="card modal-card" style="max-width: 460px; width: 100%; padding: 24px; background: white; border-radius: var(--radius-lg); position: relative; box-shadow: var(--shadow-lg); text-align: left;">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--text-main); margin-top: 0;">Propose Counter Offer</h3>
        
        <form id="counter-offer-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label for="counter-price" style="font-weight: 600; font-size: 12px; margin-bottom: 6px; display: block; color: var(--text-main);">Proposed Price ($)</label>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 10px; font-weight: 600; color: var(--text-muted); font-size: 14px;">$</span>
              <input type="number" id="counter-price" class="form-control" style="padding-left: 24px;" min="1" value="${initialPrice}" required>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label for="counter-pickup-date" style="font-weight: 600; font-size: 12px; margin-bottom: 6px; display: block; color: var(--text-main);">Est. Pickup Date</label>
              <input type="date" id="counter-pickup-date" class="form-control" value="${formattedPickup}" required>
            </div>
            <div class="form-group">
              <label for="counter-delivery-date" style="font-weight: 600; font-size: 12px; margin-bottom: 6px; display: block; color: var(--text-main);">Est. Delivery Date</label>
              <input type="date" id="counter-delivery-date" class="form-control" value="${formattedDelivery}" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="counter-trailer-type" style="font-weight: 600; font-size: 12px; margin-bottom: 6px; display: block; color: var(--text-main);">Trailer / Equipment Type</label>
            <select id="counter-trailer-type" class="form-control" required style="-webkit-appearance: listbox;">
              <option value="Dry Van" ${initialTrailerType === 'Dry Van' ? 'selected' : ''}>Dry Van</option>
              <option value="Reefer" ${initialTrailerType === 'Reefer' ? 'selected' : ''}>Reefer</option>
              <option value="Flatbed" ${initialTrailerType === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
              <option value="Hotshot" ${initialTrailerType === 'Hotshot' ? 'selected' : ''}>Hotshot</option>
              <option value="Car Hauler" ${initialTrailerType === 'Car Hauler' ? 'selected' : ''}>Car Hauler</option>
              <option value="Box Truck" ${initialTrailerType === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
              <option value="Power Only" ${initialTrailerType === 'Power Only' ? 'selected' : ''}>Power Only</option>
              <option value="Step Deck" ${initialTrailerType === 'Step Deck' ? 'selected' : ''}>Step Deck</option>
              <option value="Lowboy" ${initialTrailerType === 'Lowboy' ? 'selected' : ''}>Lowboy</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="counter-notes" style="font-weight: 600; font-size: 12px; margin-bottom: 6px; display: block; color: var(--text-main);">Notes / Addendum (Optional)</label>
            <textarea id="counter-notes" class="form-control" placeholder="Add terms, schedule constraints, or details..." style="height: 60px; resize: none; font-size: 12px;"></textarea>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px;">
            <button type="button" class="btn btn-outline" id="btn-counter-cancel" style="padding: 8px 16px; font-size: 12px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding: 8px 16px; font-size: 12px;">Send Counter</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modalDiv = document.createElement('div');
  modalDiv.id = 'counter-offer-modal-container';
  modalDiv.innerHTML = modalHtml;
  document.body.appendChild(modalDiv);

  document.getElementById('btn-counter-cancel').onclick = () => {
    modalDiv.remove();
  };

  document.getElementById('counter-offer-form').onsubmit = (e) => {
    e.preventDefault();

    const price = parseFloat(document.getElementById('counter-price').value);
    const pickupDate = document.getElementById('counter-pickup-date').value;
    const deliveryDate = document.getElementById('counter-delivery-date').value;
    const trailerType = document.getElementById('counter-trailer-type').value;
    const notes = document.getElementById('counter-notes').value.trim();

    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    if (!pickupDate || !deliveryDate) {
      alert('Please select both pickup and delivery dates.');
      return;
    }
    if (new Date(pickupDate) > new Date(deliveryDate)) {
      alert('Delivery date cannot be before pickup date.');
      return;
    }

    const text = `${currentUser.companyName} proposed a counter offer of $${price.toLocaleString()} for ${trailerType}.`;

    const additionalFields = {
      pickupDate,
      deliveryDate,
      trailerType,
      notes
    };

    try {
      Store.addNegotiationMessage(bidId, currentUser.id, currentUser.companyName, text, price, false, additionalFields);
      
      logShipmentEvent(shipment.id, 'counter_offer', 'Counter Offer Proposed', `${currentUser.companyName} proposed $${price.toLocaleString()} (${trailerType}).`, {
        amount: price,
        pickupDate,
        deliveryDate,
        trailerType
      });

      const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
      addNotification(partnerId, `Counter offer of $${price.toLocaleString()} proposed on Shipment #${shipment.id.replace('ship_', '')}`, 'counter_offer_received', bidId);

      modalDiv.remove();
      showToast('Counter offer proposed successfully.');

      renderInboxConversationList(currentInboxFilter);
      if (activeInboxTab === 'messages') {
        renderInboxChatHistory(bidId);
      } else {
        renderInboxWorkspaceContent(bidId);
      }
    } catch (err) {
      alert(err.message);
    }
  };
}

function confirmAcceptBid(bidId) {
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  
  const carrierMeta = getCarrierMetadata(bid.carrierId);
  const displayName = `Verified Carrier ${bid.carrierName.replace('Carrier ', '')}`;
  
  const confirmModalHtml = `
    <div id="accept-confirm-modal" class="modal-backdrop active" style="z-index: 10000; display:flex; justify-content:center; align-items:center; background: rgba(15,23,42,0.6);">
      <div class="card modal-card" style="max-width: 480px; width: 100%; padding: 24px; text-align: center; background: white;">
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">Accept this carrier?</h3>
        <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
          This will award the shipment to <strong>${displayName}</strong> for <strong>$${bid.amount.toLocaleString()}</strong>, close bidding, reject all remaining bids, and unlock full contact information for both parties.
        </p>
        
        <div style="background: hsl(210, 20%, 96%); border-radius: var(--radius-md); padding: 12px; margin-bottom: 24px; text-align: left; font-size: 13px;">
          <div style="margin-bottom: 4px; color: var(--text-main);">Hauler: <strong>${displayName}</strong></div>
          <div style="margin-bottom: 4px; color: var(--text-main);">Rating: <strong>${carrierMeta.rating} ${carrierMeta.stars}</strong></div>
          <div style="color: var(--text-main);">Final Payout: <strong style="color: var(--accent-carrier); font-size: 15px;">$${bid.amount.toLocaleString()}</strong></div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-outline" id="btn-confirm-accept-cancel" style="padding: 8px 20px;">Cancel</button>
          <button class="btn btn-primary" id="btn-confirm-accept-submit" style="padding: 8px 20px; background-color: var(--color-delivered); border-color: var(--color-delivered);">Accept Shipment</button>
        </div>
      </div>
    </div>
  `;
  
  const modalDiv = document.createElement('div');
  modalDiv.id = 'accept-confirm-modal-container';
  modalDiv.innerHTML = confirmModalHtml;
  document.body.appendChild(modalDiv);
  
  document.getElementById('btn-confirm-accept-cancel').onclick = () => {
    modalDiv.remove();
  };
  
  document.getElementById('btn-confirm-accept-submit').onclick = () => {
    try {
      Store.acceptBid(bidId);
      
      const shipment = Store.getShipment(bid.shipmentId);
      
      // Retrieve negotiated terms from the negotiation log
      const neg = Store.getNegotiationForBid(bidId);
      let finalPickupDate = shipment.pickupDate;
      let finalDeliveryDate = shipment.deliveryDate;
      let finalTrailerType = shipment.equipmentRequired;
      
      if (neg && neg.messages) {
        const counterMsgs = neg.messages.filter(m => m.amount !== null && !m.isSystem);
        if (counterMsgs.length > 0) {
          const latestCounter = counterMsgs[counterMsgs.length - 1];
          if (latestCounter.pickupDate) finalPickupDate = latestCounter.pickupDate;
          if (latestCounter.deliveryDate) finalDeliveryDate = latestCounter.deliveryDate;
          if (latestCounter.trailerType) finalTrailerType = latestCounter.trailerType;
        }
      }
      
      const stored = localStorage.getItem('movana_store_data');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const s = data.shipments.find(x => x.id === bid.shipmentId);
          if (s) {
            s.budget = bid.amount;
            s.pickupDate = finalPickupDate;
            s.deliveryDate = finalDeliveryDate;
            s.equipmentRequired = finalTrailerType;
            localStorage.setItem('movana_store_data', JSON.stringify(data));
            console.log("[NEGOTIATION ACCEPTED] Applied negotiated dates and trailer type to shipment:", s);
          }
        } catch (e) {
          console.error("Error applying counter offer fields to shipment", e);
        }
      }
      
      logShipmentEvent(bid.shipmentId, 'accepted', 'Offer Accepted / Awarded', `Offer accepted by Shipper. Shipment awarded to ${bid.carrierName} for $${bid.amount.toLocaleString()}.`, { amount: bid.amount });
      logShipmentEvent(bid.shipmentId, 'assigned', 'Pickup Scheduled', `Carrier scheduled cargo pickup date.`);
      
      addNotification(shipment.shipperId, `Shipment #${shipment.id.substring(5)} awarded to carrier for $${bid.amount}`, 'bid_accepted', shipment.id);
      addNotification(bid.carrierId, `Your bid of $${bid.amount} on shipment #${shipment.id.substring(5)} was accepted!`, 'bid_accepted', shipment.id);
      
      // Trigger Bid Accepted Email
      (function() {
        const rawStore = JSON.parse(localStorage.getItem('movana_store_data'));
        const carrierUser = rawStore.users.find(u => u.id === bid.carrierId);
        if (carrierUser && carrierUser.email) {
          const emailTemplate = EmailTemplates.bidAccepted(carrierUser.username, shipment.cargoType, bid.amount.toLocaleString());
          sendEmail(carrierUser.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text, "bidAccepted").catch(err => {
            console.error("Failed to send bid accepted email:", err);
          });
        }
      })();
      
      saveBidHistoryLog(shipment.id, {
        carrierId: bid.carrierId,
        carrierName: bid.carrierName,
        acceptedAmount: bid.amount,
        awardDate: new Date().toISOString()
      });
      
      showToast('Shipment awarded! Carrier contact details unlocked.');
      modalDiv.remove();
      
      elements.detailsModal.classList.remove('active');
      const negModal = document.getElementById('negotiation-modal');
      if (negModal) negModal.classList.remove('active');
      
      renderShipperDashboard();
      renderCarrierDashboard();
      renderLoadBoard();
    } catch (err) {
      alert(err.message);
    }
  };
}

function renderIncomingOffers(shipment, sortBy = 'price') {
  const container = document.getElementById('details-incoming-offers-section');
  if (!container) return;
  
  const bids = Store.getBidsForShipment(shipment.id);
  
  const sortedBids = [...bids];
  if (sortBy === 'price') {
    sortedBids.sort((a, b) => a.amount - b.amount);
  } else if (sortBy === 'rating') {
    sortedBids.sort((a, b) => {
      const metaA = getCarrierMetadata(a.carrierId);
      const metaB = getCarrierMetadata(b.carrierId);
      return parseFloat(metaB.rating) - parseFloat(metaA.rating);
    });
  } else if (sortBy === 'pickup') {
    sortedBids.sort((a, b) => {
      const dateA = new Date(a.earliestPickupDate || a.deliveryDate || a.createdAt);
      const dateB = new Date(b.earliestPickupDate || b.deliveryDate || b.createdAt);
      return dateA - dateB;
    });
  }
  
  let offersHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0;">Incoming Offers (${bids.length})</h4>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="offers-sort" style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin: 0;">Sort by:</label>
        <select id="offers-sort" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color); background: white; font-size: 12px; font-weight: 600; color: var(--text-main); outline: none; cursor: pointer;">
          <option value="price" ${sortBy === 'price' ? 'selected' : ''}>Lowest Price</option>
          <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>Highest Rating</option>
          <option value="pickup" ${sortBy === 'pickup' ? 'selected' : ''}>Fastest Pickup</option>
        </select>
      </div>
    </div>
  `;
  
  if (bids.length === 0) {
    offersHtml += `
      <p style="color: var(--text-muted); font-size: 14px; font-style: italic; text-align: center; margin: 20px 0;">No active bids on this shipment yet.</p>
    `;
    container.innerHTML = offersHtml;
    return;
  }
  
  offersHtml += `<div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">`;
  
  sortedBids.forEach(bid => {
    const meta = getCarrierMetadata(bid.carrierId);
    const isAccepted = bid.status === 'accepted';
    const isRejected = bid.status === 'rejected';
    const isShipmentAwarded = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
    const displayName = (isShipmentAwarded && isAccepted) ? bid.carrierName : `Verified Carrier ${bid.carrierName.replace('Carrier ', '')}`;
    const submittedTime = new Date(bid.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const earliestPickup = bid.earliestPickupDate || shipment.pickupDate;
    
    offersHtml += `
      <div class="card" style="padding: 16px; border: 1px solid ${isAccepted ? 'var(--color-delivered)' : (isRejected ? '#fca5a5' : 'var(--border-color)')}; background: ${isAccepted ? 'rgba(34,197,94,0.03)' : (isRejected ? 'rgba(239,68,68,0.02)' : 'white')}; position: relative; border-left: 4px solid ${isAccepted ? 'var(--color-delivered)' : (isRejected ? '#ef4444' : 'var(--accent-carrier)')} !important;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-weight: 700; font-size: 15px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
              ${displayName}
              <span style="font-size: 11px; background: rgba(34, 197, 94, 0.1); color: var(--accent-carrier); font-weight: 700; padding: 2px 6px; border-radius: 4px;">✅ Verified</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              <span>Rating: <strong style="color: #f59e0b;">${meta.rating} ${meta.stars}</strong></span>
              <span>Jobs: <strong>${meta.jobsCompleted}</strong></span>
              <span>Member Since: <strong>${meta.memberSince}</strong></span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; color: var(--accent-carrier);">$${bid.amount.toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Submitted ${submittedTime}</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 10px; background: hsl(210, 20%, 96%); border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 12px; border: 1px solid var(--border-color);">
          <div><span style="color: var(--text-muted);">Pickup Window:</span> <strong style="color: var(--text-main);">${earliestPickup}</strong></div>
          <div><span style="color: var(--text-muted);">Delivery Est:</span> <strong style="color: var(--text-main);">${bid.deliveryDate}</strong></div>
          <div style="grid-column: span 2;"><span style="color: var(--text-muted);">Response Time:</span> <strong style="color: var(--text-main);">${meta.responseTime}</strong></div>
        </div>
        
        ${bid.message ? `<div style="font-size: 13px; line-height: 1.4; color: var(--text-main); background: #f8fafc; border-left: 2px solid #cbd5e1; padding: 6px 10px; margin-bottom: 12px; border-radius: 0 4px 4px 0;">"${bid.message}"</div>` : ''}
        
        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm btn-offer-profile" data-carrier-id="${bid.carrierId}" style="padding: 4px 8px; font-size: 12px;">View Profile</button>
          <button class="btn btn-outline btn-sm btn-offer-chat" data-bid-id="${bid.id}" style="padding: 4px 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
            💬 Message
          </button>
          
          ${(shipment.status === 'open' || shipment.status === 'bidding' || shipment.status === 'negotiating') && !isRejected ? `
            <button class="btn btn-outline btn-sm btn-offer-counter" data-bid-id="${bid.id}" style="padding: 4px 8px; font-size: 12px; border-color: var(--accent-carrier); color: var(--accent-carrier);">Counter Offer</button>
            <button class="btn btn-secondary btn-sm btn-offer-accept" data-bid-id="${bid.id}" style="padding: 4px 8px; font-size: 12px; background: var(--color-delivered); border-color: var(--color-delivered);">Accept Bid</button>
            <button class="btn btn-danger btn-sm btn-offer-decline" data-bid-id="${bid.id}" style="padding: 4px 8px; font-size: 12px;">Decline</button>
          ` : ''}
          
          ${isAccepted ? `
            <span style="font-size: 12px; color: var(--color-delivered); font-weight: 700; background: rgba(34, 197, 94, 0.1); padding: 4px 8px; border-radius: 4px;">🏆 Winner</span>
          ` : ''}
          ${isRejected ? `
            <span style="font-size: 12px; color: #ef4444; font-weight: 700; background: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 4px;">Declined</span>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  offersHtml += `</div>`;
  container.innerHTML = offersHtml;
  
  const sortSelect = document.getElementById('offers-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      renderIncomingOffers(shipment, e.target.value);
    });
  }
  
  container.querySelectorAll('.btn-offer-profile').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const carrierId = e.target.getAttribute('data-carrier-id');
      const meta = getCarrierMetadata(carrierId);
      alert(`Carrier Profile:
- Verification Status: Verified Carrier
- Rating: ${meta.rating} ${meta.stars}
- Completed Shipments: ${meta.jobsCompleted}
- Member Since: ${meta.memberSince}
- Typical Response Time: ${meta.responseTime}
- Contact Details: Hidden until bid is accepted.`);
    });
  });
  
  container.querySelectorAll('.btn-offer-chat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bidId = e.target.getAttribute('data-bid-id');
      openNegotiationChat(bidId);
    });
  });
  
  container.querySelectorAll('.btn-offer-counter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bidId = e.target.getAttribute('data-bid-id');
      openNegotiationChat(bidId, true);
    });
  });
  
  container.querySelectorAll('.btn-offer-accept').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bidId = e.target.getAttribute('data-bid-id');
      confirmAcceptBid(bidId);
    });
  });
  
  container.querySelectorAll('.btn-offer-decline').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bidId = e.target.getAttribute('data-bid-id');
      if (confirm('Decline this bid? This cannot be undone.')) {
        try {
          Store.rejectBid(bidId);
          showToast('Bid declined.');
          
          const bid = Store.getBids().find(b => b.id === bidId);
          if (bid) {
            addNotification(bid.carrierId, `Your bid of $${bid.amount} on shipment #${bid.shipmentId.substring(5)} was declined`, 'bid_declined', bid.shipmentId);
          }
          
          renderIncomingOffers(shipment, sortSelect ? sortSelect.value : 'price');
          renderShipperDashboard();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });
}

function renderBidHistorySection(shipment) {
  const isAwarded = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed' || shipment.status === 'picked up';
  if (!isAwarded) return '';
  
  const log = getBidHistoryLog(shipment.id);
  if (!log) return '';
  
  const currentUser = Store.getCurrentUser();
  const isWinner = currentUser && currentUser.id === log.awardDetails.carrierId;
  const isShipper = currentUser && currentUser.id === shipment.shipperId;
  const isAdmin = currentUser && currentUser.role === 'admin';
  if (!isWinner && !isShipper && !isAdmin) return '';
  
  let html = `
    <div style="border-top: 1px solid var(--border-color); padding-top: 20px; margin-top: 20px; text-align: left;">
      <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">📄 Permanent Bid & Negotiation History</h4>
      <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px;">
        <div>Awarded Date: <strong>${new Date(log.awardDetails.awardDate).toLocaleDateString()}</strong></div>
        <div>Final Contract Price: <strong style="color: var(--accent-carrier); font-size: 14px;">$${log.awardDetails.acceptedAmount.toLocaleString()}</strong></div>
        <div>Winner: <strong>${log.awardDetails.carrierName}</strong></div>
        
        <div style="margin-top: 8px;">
          <span style="font-weight: 600; display: block; margin-bottom: 4px; color: var(--text-main);">Negotiation Log:</span>
          <div style="max-height: 120px; overflow-y: auto; background: #fafafa; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; font-family: monospace; font-size: 11px;">
  `;
  
  const winnerNeg = log.negotiations.find(n => n.carrierId === log.awardDetails.carrierId);
  if (winnerNeg && winnerNeg.messages) {
    winnerNeg.messages.forEach(m => {
      const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (m.amount !== null) {
        html += `<div style="color: #16a34a; margin-bottom: 2px;">[${time}] Counter Offer proposed: $${m.amount}</div>`;
      } else if (m.isSystem) {
        html += `<div style="color: #64748b; margin-bottom: 2px;">[${time}] SYSTEM: ${m.message}</div>`;
      } else {
        html += `<div style="color: var(--text-main); margin-bottom: 2px;">[${time}] ${m.senderName}: "${m.message}"</div>`;
      }
    });
  }
  
  html += `
          </div>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// --- MOCK CITY COORDINATES FOR MAP VISUALIZATION ---
const CITY_COORDINATES = {
  'chicago, il': { x: 320, y: 60, name: 'Chicago' },
  'houston, tx': { x: 270, y: 140, name: 'Houston' },
  'orlando, fl': { x: 390, y: 150, name: 'Orlando' },
  'new york, ny': { x: 420, y: 45, name: 'New York' },
  'seattle, wa': { x: 80, y: 25, name: 'Seattle' },
  'los angeles, ca': { x: 60, y: 110, name: 'Los Angeles' },
  'phoenix, az': { x: 120, y: 115, name: 'Phoenix' },
  'denver, co': { x: 210, y: 70, name: 'Denver' }
};

// --- MOCK DATA FOR SMART ZIPCODE & CITY AUTOCOMPLETE ---
const MOCK_ZIPCODES = {
  '60601': 'Chicago, IL',
  '60611': 'Chicago, IL',
  '77001': 'Houston, TX',
  '77002': 'Houston, TX',
  '10001': 'New York, NY',
  '10002': 'New York, NY',
  '90001': 'Los Angeles, CA',
  '90012': 'Los Angeles, CA',
  '32801': 'Orlando, FL',
  '98101': 'Seattle, WA',
  '85001': 'Phoenix, AZ',
  '80201': 'Denver, CO',
  '62701': 'Springfield, IL',
  '01101': 'Springfield, MA',
  '65801': 'Springfield, MO',
  '43201': 'Columbus, OH',
  '31901': 'Columbus, GA',
  '97201': 'Portland, OR',
  '04101': 'Portland, ME',
  '64101': 'Kansas City, MO',
  '66101': 'Kansas City, KS',
  '75201': 'Dallas, TX',
  '94101': 'San Francisco, CA',
  '30301': 'Atlanta, GA',
  '02108': 'Boston, MA'
};

const MOCK_CITIES = [
  'Chicago, IL',
  'Houston, TX',
  'New York, NY',
  'Los Angeles, CA',
  'Orlando, FL',
  'Seattle, WA',
  'Phoenix, AZ',
  'Denver, CO',
  'Springfield, IL',
  'Springfield, MA',
  'Springfield, MO',
  'Columbus, OH',
  'Columbus, GA',
  'Portland, OR',
  'Portland, ME',
  'Kansas City, MO',
  'Kansas City, KS',
  'Dallas, TX',
  'San Francisco, CA',
  'Atlanta, GA',
  'Boston, MA'
];

// --- VEHICLE MAKE & MODEL CONFIGURATIONS ---
const VEHICLE_DATABASE = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Tacoma', 'Prius'],
  'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
  'Chevrolet': ['Silverado', 'Corvette', 'Equinox', 'Tahoe', 'Malibu'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X']
};

// --- US STATE NAME TO 2-LETTER ABBREVIATION MAP ---
const STATE_MAP = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
  "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
  "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
  "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
  "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
  "district of columbia": "DC", "puerto rico": "PR"
};



// Fallback coordinate generator based on string hash
function getCityCoords(cityName) {
  const normalized = cityName.toLowerCase().trim();
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }
  // Generate deterministic coordinates based on hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = 100 + (Math.abs(hash % 300));
  const y = 30 + (Math.abs((hash >> 8) % 110));
  return { x, y, name: cityName.split(',')[0].trim() };
}

// --- DOM ELEMENTS ---
const elements = {
  // Navigation
  logo: document.getElementById('nav-logo'),
  navLinks: document.getElementById('nav-links'),
  
  // Main Views
  landingView: document.getElementById('landing-view'),
  authView: document.getElementById('auth-view'),
  shipperView: document.getElementById('shipper-view'),
  carrierView: document.getElementById('carrier-view'),
  
  // Landing elements
  btnGetStarted: document.getElementById('landing-get-started'),
  btnViewMarketplace: document.getElementById('landing-view-marketplace'),
  statShipments: document.getElementById('stat-shipments'),
  statCarriers: document.getElementById('stat-carriers'),
  
  // Auth Form elements
  authForm: document.getElementById('auth-form'),
  authTitle: document.getElementById('auth-title'),
  authSubtitle: document.getElementById('auth-subtitle'),
  authSubmitBtn: document.getElementById('auth-submit-btn'),
  authModeInput: document.getElementById('auth-mode'),
  authUsername: document.getElementById('auth-username'),
  authPassword: document.getElementById('auth-password'),
  authCompany: document.getElementById('auth-company'),
  registerFields: document.getElementById('register-fields'),
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  authError: document.getElementById('auth-error'),
  
  // Shipper form
  postShipmentForm: document.getElementById('post-shipment-form'),
  shipperBoardList: document.getElementById('shipper-board-list'),
  shipperFilterAll: document.getElementById('shipper-filter-all'),
  shipperFilterOpen: document.getElementById('shipper-filter-open'),
  shipperFilterAssigned: document.getElementById('shipper-filter-assigned'),
  shipperFilterCompleted: document.getElementById('shipper-filter-completed'),
  
  // Carrier board
  carrierBoardList: document.getElementById('carrier-board-list'),
  carrierBidsList: document.getElementById('carrier-bids-list'),
  carrierJobsList: document.getElementById('carrier-jobs-list'),
  carrierSearch: document.getElementById('carrier-search'),
  carrierFilterCargo: document.getElementById('carrier-filter-type'),
  
  // Bid Modal
  bidModal: document.getElementById('bid-modal'),
  closeBidModal: document.getElementById('close-bid-modal'),
  cancelBidSubmit: document.getElementById('cancel-bid-submit'),
  bidForm: document.getElementById('bid-form'),
  bidShipmentId: document.getElementById('bid-shipment-id'),
  bidModalOrigin: document.getElementById('bid-modal-origin'),
  bidModalDestination: document.getElementById('bid-modal-destination'),
  bidModalCargoSpec: document.getElementById('bid-modal-cargo-spec'),
  bidAmount: document.getElementById('bid-amount'),
  bidDeliveryDate: document.getElementById('bid-delivery-date'),
  bidMessage: document.getElementById('bid-message'),
  bidError: document.getElementById('bid-error'),
  
  // Details / Route Modal
  detailsModal: document.getElementById('details-modal'),
  closeDetailsModal: document.getElementById('close-details-modal'),
  closeDetailsFooter: document.getElementById('close-details-footer'),
  detailsBidBtn: document.getElementById('details-bid-btn'),
  detailsOrigin: document.getElementById('details-origin'),
  detailsDestination: document.getElementById('details-destination'),
  detailsOriginCoords: document.getElementById('details-origin-coords'),
  detailsDestinationCoords: document.getElementById('details-destination-coords'),
  detailsCargo: document.getElementById('details-cargo'),
  detailsWeight: document.getElementById('details-weight'),
  detailsDimensions: document.getElementById('details-dimensions'),
  detailsDescription: document.getElementById('details-description'),
  detailsPickup: document.getElementById('details-pickup'),
  detailsDropoff: document.getElementById('details-dropoff'),
  detailsShipperCompany: document.getElementById('details-shipper-company'),
  detailsBudget: document.getElementById('details-budget'),
  detailsStatus: document.getElementById('details-status'),
  detailsVehicleBox: document.getElementById('details-specifications-box'),
  
  // Route Map SVG elements
  routeSvgMap: document.getElementById('route-svg-map'),
  routePathLine: document.getElementById('route-path-line'),
  routeDotOrigin: document.getElementById('route-dot-origin'),
  routeDotDest: document.getElementById('route-dot-dest'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),

  // Autocomplete suggestions
  originSuggestions: document.getElementById('origin-suggestions'),
  destinationSuggestions: document.getElementById('destination-suggestions'),

  // Vehicle section details
  vehicleSection: document.getElementById('form-section-vehicle'),
  vehicleType: document.getElementById('vehicle-type'),
  vehicleSpecsWrapper: document.getElementById('vehicle-specs-wrapper'),
  vehicleVin: document.getElementById('vehicle-vin'),
  vinDecodeSuccess: document.getElementById('vin-decode-success'),
  vehicleMake: document.getElementById('vehicle-make'),
  vehicleModel: document.getElementById('vehicle-model'),
  vehicleYear: document.getElementById('vehicle-year'),

  // Load Board page elements
  loadboardView: document.getElementById('loadboard-view'),
  loadboardTableContainer: document.getElementById('loadboard-table-container'),
  loadboardTableBody: document.getElementById('loadboard-table-body'),
  loadboardCardsContainer: document.getElementById('loadboard-cards-container'),
  loadboardPagination: document.getElementById('loadboard-pagination'),
  loadboardResultsCount: document.getElementById('loadboard-results-count'),
  boardSortBy: document.getElementById('board-sort-by'),
  toggleViewCard: document.getElementById('toggle-view-card'),
  toggleViewTable: document.getElementById('toggle-view-table'),
  
  // Photos upload elements
  shipPhotos: document.getElementById('ship-photos'),
  photoDropzone: document.getElementById('photo-dropzone'),
  photoPreviews: document.getElementById('photo-previews'),

  // Details cover image & gallery elements
  detailsCoverWrapper: document.getElementById('details-cover-wrapper'),
  detailsCoverImg: document.getElementById('details-cover-img'),
  detailsGalleryBox: document.getElementById('details-gallery-box'),
  detailsGalleryGrid: document.getElementById('details-gallery-grid'),

  // Lightbox modal elements
  lightboxModal: document.getElementById('lightbox-modal'),
  lightboxImg: document.getElementById('lightbox-img'),
  closeLightboxModal: document.getElementById('close-lightbox-modal'),
  lightboxPrev: document.getElementById('lightbox-prev'),
  lightboxNext: document.getElementById('lightbox-next'),
  lightboxIndex: document.getElementById('lightbox-index')
};

// --- GLOBAL STATE ---
let currentView = 'landing';
let shipperFilter = 'all'; // 'all', 'open', 'assigned', 'completed'
let loadboardLayout = 'table'; // 'table' or 'card'
let loadboardPage = 1;
const LOADBOARD_LIMIT = 25;
let uploadedPhotos = []; // stores base64 strings of uploaded photos for new shipment
let activeLightboxPhotos = []; // stores photos list currently shown in lightbox
let activeLightboxIndex = 0; // index of photo currently active in lightbox

// --- TOAST NOTIFICATIONS ---
function showToast(message) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add('active');
  setTimeout(() => {
    elements.toast.classList.remove('active');
  }, 4000);
}

// Column Selector and Toggling Helpers
function updateTableColumnVisibility() {
  const checkboxes = document.querySelectorAll('.col-toggle-checkbox');
  checkboxes.forEach(cb => {
    const columnName = cb.getAttribute('data-column');
    const cells = document.querySelectorAll(`.${columnName}`);
    cells.forEach(cell => {
      if (cb.checked) {
        cell.classList.remove('col-hidden');
      } else {
        cell.classList.add('col-hidden');
      }
    });
  });
}

function saveColumnPreferences() {
  const currentUser = Store.getCurrentUser();
  const userId = currentUser ? currentUser.id : 'guest';
  const prefs = {};
  const checkboxes = document.querySelectorAll('.col-toggle-checkbox');
  checkboxes.forEach(cb => {
    prefs[cb.getAttribute('data-column')] = cb.checked;
  });
  localStorage.setItem(`movana_column_pref_${userId}`, JSON.stringify(prefs));
}

function loadColumnPreferences() {
  const currentUser = Store.getCurrentUser();
  const userId = currentUser ? currentUser.id : 'guest';
  const stored = localStorage.getItem(`movana_column_pref_${userId}`);
  if (stored) {
    try {
      const prefs = JSON.parse(stored);
      const checkboxes = document.querySelectorAll('.col-toggle-checkbox');
      checkboxes.forEach(cb => {
        const col = cb.getAttribute('data-column');
        if (prefs[col] !== undefined) {
          cb.checked = prefs[col];
        }
      });
    } catch (e) {
      console.error('Failed to load column preferences', e);
    }
  } else {
    const checkboxes = document.querySelectorAll('.col-toggle-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
    });
  }
}

// --- ROUTER / VIEW CONTROLLER ---
function switchView(viewName, updateHistory = true) {
  const user = Store.getCurrentUser();
  
  // Strict RBAC Enforcement
  const shipperOnlyViews = ['shipper'];
  const carrierOnlyViews = ['carrier', 'loadboard'];
  const authRequiredViews = ['shipper', 'carrier', 'loadboard', 'inbox', 'profile'];
  
  if (authRequiredViews.includes(viewName)) {
    if (!user) {
      console.log(`Access Denied: Redirecting unauthenticated user trying to visit ${viewName} to login.`);
      switchView('auth', updateHistory);
      return;
    }
    
    if (shipperOnlyViews.includes(viewName) && user.role !== 'shipper') {
      showToast("Access Denied: Restricted to Shipper accounts.", true);
      switchView(user.role, updateHistory);
      return;
    }
    if (carrierOnlyViews.includes(viewName) && user.role !== 'carrier') {
      showToast("Access Denied: Restricted to Carrier accounts.", true);
      switchView(user.role, updateHistory);
      return;
    }
  }

  if (viewName === 'auth' && user) {
    switchView(user.role, updateHistory);
    return;
  }

  if (viewName === 'inbox') {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  // Hide all views
  elements.landingView.classList.add('d-none');
  elements.authView.classList.add('d-none');
  elements.shipperView.classList.add('d-none');
  elements.carrierView.classList.add('d-none');
  elements.loadboardView.classList.add('d-none');
  if (elements.inboxView) elements.inboxView.classList.add('d-none');
  
  const profileView = document.getElementById('profile-view');
  if (profileView) profileView.classList.add('d-none');
  
  currentView = viewName;
  
  // Load column preferences for the active user view transition
  loadColumnPreferences();
  updateTableColumnVisibility();
  
  // Show target view
  if (viewName === 'landing') {
    elements.landingView.classList.remove('d-none');
    updateLandingStats();
    if (updateHistory) safePushState('landing', '/');
  } else if (viewName === 'auth') {
    elements.authView.classList.remove('d-none');
    if (updateHistory) safePushState('auth', '/auth');
  } else if (viewName === 'shipper') {
    elements.shipperView.classList.remove('d-none');
    renderShipperDashboard();
    if (updateHistory) safePushState('shipper', '/shipper');
  } else if (viewName === 'carrier') {
    elements.carrierView.classList.remove('d-none');
    renderCarrierDashboard();
    if (updateHistory) safePushState('carrier', '/carrier');
  } else if (viewName === 'loadboard') {
    elements.loadboardView.classList.remove('d-none');
    renderLoadBoard();
    if (updateHistory) safePushState('loadboard', '/loadboard');
  } else if (viewName === 'inbox') {
    createInboxViewDom();
    if (elements.inboxView) elements.inboxView.classList.remove('d-none');
    renderInboxPage();
    if (updateHistory) safePushState('inbox', '/inbox');
  } else if (viewName === 'profile') {
    createProfileViewDom();
    const pView = document.getElementById('profile-view');
    if (pView) pView.classList.remove('d-none');
    renderProfileViewContent();
    if (updateHistory) safePushState('profile', '/profile');
  }
  
  renderHeader();
}

function safePushState(view, urlPath) {
  try {
    if (window.location.protocol !== 'file:') {
      history.pushState({ view }, '', urlPath);
    } else {
      window.location.hash = `#${urlPath}`;
    }
  } catch (err) {
    window.location.hash = `#${urlPath}`;
  }
}

// Global popstate / hash router listener
window.addEventListener('popstate', (e) => {
  handleUrlRouting();
});

window.addEventListener('hashchange', () => {
  handleUrlRouting();
});

function handleUrlRouting() {
  const path = window.location.pathname;
  const hash = window.location.hash;
  
  if (path === '/loadboard' || hash === '#/loadboard' || hash === '#loadboard') {
    switchView('loadboard', false);
  } else if (path === '/auth' || hash === '#/auth' || hash === '#auth') {
    switchView('auth', false);
  } else if (path === '/shipper' || hash === '#/shipper' || hash === '#shipper') {
    switchView('shipper', false);
  } else if (path === '/carrier' || hash === '#/carrier' || hash === '#carrier') {
    switchView('carrier', false);
  } else if (path === '/inbox' || hash === '#/inbox' || hash === '#inbox') {
    switchView('inbox', false);
  } else if (path === '/profile' || hash === '#/profile' || hash === '#profile') {
    switchView('profile', false);
  } else {
    // Default fallback based on authentication
    const user = Store.getCurrentUser();
    if (user) {
      switchView(user.role, false);
    } else {
      switchView('landing', false);
    }
  }
}

// --- SMART FORM HELPERS (AUTOCOMPLETE, ZIPCODE, VIN DECODER) ---

// Setup Street Address suggestions autocomplete using OpenStreetMap Nominatim geocoding API
function setupAutocomplete(inputEl, suggestionsEl) {
  if (!inputEl || !suggestionsEl) return;

  let debounceTimer;

  // Initialize selection datasets
  inputEl.dataset.selected = 'false';

  const showSuggestions = (locations) => {
    suggestionsEl.innerHTML = '';
    if (locations.length === 0) {
      suggestionsEl.classList.add('d-none');
      return;
    }

    // Deduplicate suggestions based on display string
    const seen = new Set();
    locations.forEach(loc => {
      if (seen.has(loc.formatted)) return;
      seen.add(loc.formatted);

      const itemEl = document.createElement('div');
      itemEl.className = 'suggestion-item';
      itemEl.textContent = loc.formatted;
      
      itemEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        inputEl.value = loc.formatted;
        
        // Store location details on input dataset
        inputEl.dataset.street = loc.street;
        inputEl.dataset.city = loc.city;
        inputEl.dataset.state = loc.state;
        inputEl.dataset.zip = loc.zip;
        inputEl.dataset.lat = loc.lat;
        inputEl.dataset.lon = loc.lon;
        inputEl.dataset.selected = 'true';
        
        suggestionsEl.classList.add('d-none');
        showToast(`Address selected: ${loc.formatted}`);
      });
      
      suggestionsEl.appendChild(itemEl);
    });

    suggestionsEl.classList.remove('d-none');
  };

  inputEl.addEventListener('input', (e) => {
    // Whenever typing, mark as unselected until they pick from the dropdown
    inputEl.dataset.selected = 'false';
    delete inputEl.dataset.street;
    delete inputEl.dataset.city;
    delete inputEl.dataset.state;
    delete inputEl.dataset.zip;
    delete inputEl.dataset.lat;
    delete inputEl.dataset.lon;

    const query = e.target.value.trim();

    clearTimeout(debounceTimer);

    if (query.length < 3) {
      suggestionsEl.classList.add('d-none');
      return;
    }

    // Debounce to respect Nominatim API rate limits (300ms)
    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=us&format=json&addressdetails=1&limit=10`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en-US,en;q=0.9' }
        });
        if (!res.ok) throw new Error('Geocoding request failed');
        const results = await res.json();

        const locations = [];
        results.forEach(item => {
          const address = item.address;
          if (!address) return;

          // Extract components
          const houseNumber = address.house_number || address.street_number || '';
          const road = address.road || address.street || address.highway || address.pedestrian || address.path || '';
          const amenity = address.amenity || address.shop || address.office || address.building || address.industrial || address.commercial || address.aeroway || address.railway || '';
          
          const city = address.city || address.town || address.village || address.suburb || address.hamlet || address.municipality || address.county || '';
          const stateName = address.state ? address.state.toLowerCase() : '';
          const stateAbbr = STATE_MAP[stateName] || address.state || '';
          const zip = address.postcode ? address.postcode.split(';')[0].split('-')[0].trim() : '';

          // Build a clean street address portion (e.g., "123 Main St" or "Walmart, 123 Main St")
          let streetAddress = '';
          const streetParts = [];
          if (amenity) streetParts.push(amenity);
          if (houseNumber || road) {
            const streetLine = [houseNumber, road].filter(Boolean).join(' ');
            streetParts.push(streetLine);
          }
          streetAddress = streetParts.join(', ');

          // Fallback if no specific street Address is found, use neighbourhood or suburb
          if (!streetAddress) {
            streetAddress = address.suburb || address.neighbourhood || address.quarter || '';
          }

          // Build final formatted display string: "Street Address, City, State ZIP"
          let formatted = '';
          if (streetAddress && city) {
            formatted = `${streetAddress}, ${city}, ${stateAbbr}${zip ? ' ' + zip : ''}`;
          } else if (city) {
            formatted = `${city}, ${stateAbbr}${zip ? ' ' + zip : ''}`;
          } else {
            formatted = item.display_name; // Absolute fallback
          }

          locations.push({
            formatted,
            street: streetAddress,
            city: city,
            state: stateAbbr,
            zip: zip,
            lat: item.lat,
            lon: item.lon
          });
        });

        showSuggestions(locations);
      } catch (err) {
        console.error('Nominatim autocomplete geocoding failed', err);
      }
    }, 300);
  });

  inputEl.addEventListener('blur', () => {
    setTimeout(() => {
      suggestionsEl.classList.add('d-none');
    }, 200);
  });
}

// Setup Vehicle forms & manufacturers dropdown
// Setup Dynamic Shipment Type Form toggles & validators
function setupSmartFormFlow() {
  const shipTypeSelect = document.getElementById('ship-type');
  const makeSelect = elements.vehicleMake;
  const modelSelect = elements.vehicleModel;
  const yearSelect = elements.vehicleYear;
  const vinInput = elements.vehicleVin;
  const vinSuccess = elements.vinDecodeSuccess;
  const vehicleTypeSelect = elements.vehicleType;
  const specsWrapper = elements.vehicleSpecsWrapper;

  // 1. Populate Year options (2026 - 1920) programmatically for Vehicle, Motorcycle, and RV forms
  const yearSelects = [yearSelect, document.getElementById('moto-year'), document.getElementById('rv-year')];
  yearSelects.forEach(select => {
    if (select) {
      select.innerHTML = '<option value="" disabled selected>Select Year</option>';
      for (let y = 2026; y >= 1920; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
      }
    }
  });

  // 2. Toggle sections and manage required attributes programmatically
  shipTypeSelect.addEventListener('change', (e) => {
    const selectedType = e.target.value;

    // Hide all subform sections and disable required attributes
    document.querySelectorAll('.form-type-section').forEach(section => {
      section.classList.add('d-none');
      section.querySelectorAll('input, select, textarea').forEach(input => {
        input.removeAttribute('required');
      });
    });

    let activeSectionId = '';
    if (selectedType === 'Vehicle Transport') {
      activeSectionId = 'form-section-vehicle';
      document.getElementById('vehicle-type').setAttribute('required', 'true');
      document.getElementById('vehicle-make').setAttribute('required', 'true');
      document.getElementById('vehicle-model').setAttribute('required', 'true');
      document.getElementById('vehicle-year').setAttribute('required', 'true');
    } else if (selectedType === 'Motorcycle Transport') {
      activeSectionId = 'form-section-motorcycle';
      document.getElementById('moto-make').setAttribute('required', 'true');
      document.getElementById('moto-model').setAttribute('required', 'true');
      document.getElementById('moto-year').setAttribute('required', 'true');
    } else if (selectedType === 'Freight') {
      activeSectionId = 'form-section-freight';
      document.getElementById('freight-commodity').setAttribute('required', 'true');
      document.getElementById('freight-weight').setAttribute('required', 'true');
      document.getElementById('freight-dimensions').setAttribute('required', 'true');
    } else if (selectedType === 'Household Move') {
      activeSectionId = 'form-section-household';
      document.getElementById('household-size').setAttribute('required', 'true');
    } else if (selectedType === 'Heavy Equipment') {
      activeSectionId = 'form-section-equipment';
      document.getElementById('equipment-type').setAttribute('required', 'true');
      document.getElementById('equipment-make').setAttribute('required', 'true');
      document.getElementById('equipment-model').setAttribute('required', 'true');
      document.getElementById('equipment-weight').setAttribute('required', 'true');
      document.getElementById('equipment-dimensions').setAttribute('required', 'true');
    } else if (selectedType === 'Boat Transport') {
      activeSectionId = 'form-section-boat';
      document.getElementById('boat-make').setAttribute('required', 'true');
      document.getElementById('boat-model').setAttribute('required', 'true');
      document.getElementById('boat-length').setAttribute('required', 'true');
      document.getElementById('boat-width').setAttribute('required', 'true');
      document.getElementById('boat-height').setAttribute('required', 'true');
    } else if (selectedType === 'RV Transport') {
      activeSectionId = 'form-section-rv';
      document.getElementById('rv-type').setAttribute('required', 'true');
      document.getElementById('rv-make').setAttribute('required', 'true');
      document.getElementById('rv-model').setAttribute('required', 'true');
      document.getElementById('rv-year').setAttribute('required', 'true');
      document.getElementById('rv-length').setAttribute('required', 'true');
    } else if (selectedType === 'Other') {
      activeSectionId = 'form-section-other';
      document.getElementById('other-cargo-type').setAttribute('required', 'true');
    }

    if (activeSectionId) {
      document.getElementById(activeSectionId).classList.remove('d-none');
    }
  });

  // Toggle vehicle specs subform on subtype select
  vehicleTypeSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      specsWrapper.classList.remove('d-none');
    } else {
      specsWrapper.classList.add('d-none');
    }
  });

  // Dynamically populate model dropdown on manufacturer change
  makeSelect.addEventListener('change', (e) => {
    const make = e.target.value;
    populateModelsForMake(make, modelSelect);
  });

  // VIN Auto Decoder listener
  vinInput.addEventListener('input', async (e) => {
    const vin = e.target.value.toUpperCase().trim();
    e.target.value = vin;

    if (vin.length !== 17) {
      vinSuccess.classList.add('d-none');
      return;
    }

    vinSuccess.innerHTML = `<span style="color: var(--text-muted);">⏳ Decoding VIN...</span>`;
    vinSuccess.classList.remove('d-none');

    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      if (data.Results && data.Results.length > 0) {
        const result = data.Results[0];
        
        if (result.Make && result.Make.trim() !== '') {
          const formatTitleCase = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          const decodedMake = formatTitleCase(result.Make.trim());
          const decodedModel = formatTitleCase(result.Model ? result.Model.trim() : '');
          const decodedYear = result.ModelYear ? result.ModelYear.trim() : '';

          if (!decodedModel) {
            throw new Error('Could not resolve model from VIN');
          }

          let makeExists = Array.from(makeSelect.options).find(opt => opt.value.toLowerCase() === decodedMake.toLowerCase());
          if (!makeExists) {
            const newOpt = document.createElement('option');
            newOpt.value = decodedMake;
            newOpt.textContent = decodedMake;
            makeSelect.appendChild(newOpt);
            makeSelect.value = decodedMake;
          } else {
            makeSelect.value = makeExists.value;
          }

          await populateModelsForMake(makeSelect.value, modelSelect, decodedModel);

          let yearExists = Array.from(yearSelect.options).find(opt => opt.value === decodedYear);
          if (!yearExists && decodedYear) {
            const newOpt = document.createElement('option');
            newOpt.value = decodedYear;
            newOpt.textContent = decodedYear;
            yearSelect.appendChild(newOpt);
            yearSelect.value = decodedYear;
          } else if (decodedYear) {
            yearSelect.value = decodedYear;
          }

          vinSuccess.innerHTML = `✓ Decoded: <strong>${decodedYear} ${makeSelect.value} ${modelSelect.value}</strong>`;
          vinSuccess.style.color = `var(--accent-carrier)`;
          showToast(`VIN Decoded: ${decodedYear} ${makeSelect.value} ${modelSelect.value}`);
          return;
        }
      }
      throw new Error('Invalid VIN data returned');
    } catch (err) {
      console.warn('NHTSA API failed, falling back to local decoder.', err);
      try {
        const decoded = decodeVINString(vin);
        makeSelect.value = decoded.make;
        await populateModelsForMake(decoded.make, modelSelect, decoded.model);
        yearSelect.value = decoded.year;
        
        vinSuccess.innerHTML = `✓ Decoded: <strong>${decoded.year} ${decoded.make} ${decoded.model}</strong>`;
        vinSuccess.style.color = `var(--accent-carrier)`;
        showToast(`VIN Decoded: ${decoded.year} ${decoded.make} ${decoded.model}`);
      } catch (localErr) {
        vinSuccess.innerHTML = `<span style="color: var(--color-rejected);">✗ Could not decode VIN. Enter details manually.</span>`;
      }
    }
  });
}

// Dynamic Model Populator querying VPIC/NHTSA API with local database fallback
async function populateModelsForMake(make, modelSelectEl, selectedModelToSet = null) {
  modelSelectEl.innerHTML = '<option value="" disabled selected>⏳ Loading Models...</option>';
  modelSelectEl.disabled = true;

  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    
    modelSelectEl.innerHTML = '<option value="" disabled selected>Select Model</option>';
    
    if (data.Results && data.Results.length > 0) {
      // Normalise model names to Title Case
      const formatTitleCase = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      
      // Sort models alphabetically
      const sortedModels = data.Results.map(r => formatTitleCase(r.Model_Name.trim())).sort();
      
      // Deduplicate models
      const uniqueModels = [...new Set(sortedModels)];
      
      uniqueModels.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelectEl.appendChild(opt);
      });
      
      modelSelectEl.disabled = false;
      
      if (selectedModelToSet) {
        // Ensure selected model exists in list, otherwise append it
        let modelExists = uniqueModels.some(m => m.toLowerCase() === selectedModelToSet.toLowerCase());
        if (!modelExists) {
          const opt = document.createElement('option');
          opt.value = selectedModelToSet;
          opt.textContent = selectedModelToSet;
          modelSelectEl.appendChild(opt);
        }
        modelSelectEl.value = selectedModelToSet;
      }
    } else {
      throw new Error('No models found');
    }
  } catch (err) {
    console.warn(`NHTSA getmodelsformake failed for make "${make}", using fallback database.`, err);
    
    // Fallback to local database if available
    modelSelectEl.innerHTML = '<option value="" disabled selected>Select Model</option>';
    const models = VEHICLE_DATABASE[make];
    if (models) {
      models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelectEl.appendChild(opt);
      });
      modelSelectEl.disabled = false;
      if (selectedModelToSet) {
        modelSelectEl.value = selectedModelToSet;
      }
    } else {
      // Add custom prompt option for missing makes
      const opt = document.createElement('option');
      opt.value = selectedModelToSet || 'General Model';
      opt.textContent = selectedModelToSet || 'General Model';
      modelSelectEl.appendChild(opt);
      modelSelectEl.disabled = false;
    }
  }
}

// Custom VIN Decoder matching specific strings and indexing character slots
function decodeVINString(vin) {
  // Extract Make from chars 1-3
  let make = 'Toyota';
  if (vin.includes('5YJ')) make = 'Tesla';
  else if (vin.includes('1FT')) make = 'Ford';
  else if (vin.includes('1HG') || vin.includes('5J8')) make = 'Honda';
  else if (vin.includes('1G1')) make = 'Chevrolet';
  else if (vin.includes('4T1') || vin.includes('5TB')) make = 'Toyota';

  // Extract Year from 10th char (index 9)
  const yearCode = vin.charAt(9);
  const yearMap = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026
  };
  const year = yearMap[yearCode] || 2020;

  // Extract Model from 4th char (index 3)
  const modelCode = vin.charAt(3);
  const models = VEHICLE_DATABASE[make];
  let model = models[0]; // fallback

  if (make === 'Tesla') {
    if (modelCode === '3') model = 'Model 3';
    else if (modelCode === 'Y') model = 'Model Y';
    else if (modelCode === 'S') model = 'Model S';
    else if (modelCode === 'X') model = 'Model X';
  } else if (make === 'Ford') {
    if (modelCode === 'F') model = 'F-150';
    else if (modelCode === 'M') model = 'Mustang';
    else if (modelCode === 'E') model = 'Explorer';
    else if (modelCode === 'S') model = 'Escape';
    else if (modelCode === 'C') model = 'Focus';
  } else if (make === 'Honda') {
    if (modelCode === 'C') model = 'Civic';
    else if (modelCode === 'A') model = 'Accord';
    else if (modelCode === 'R') model = 'CR-V';
    else if (modelCode === 'P') model = 'Pilot';
    else if (modelCode === 'O') model = 'Odyssey';
  } else if (make === 'Chevrolet') {
    if (modelCode === 'S') model = 'Silverado';
    else if (modelCode === 'C') model = 'Corvette';
    else if (modelCode === 'E') model = 'Equinox';
    else if (modelCode === 'T') model = 'Tahoe';
    else if (modelCode === 'M') model = 'Malibu';
  } else if (make === 'Toyota') {
    if (modelCode === 'K') model = 'Camry';
    else if (modelCode === 'C') model = 'Corolla';
    else if (modelCode === 'R') model = 'RAV4';
    else if (modelCode === 'T') model = 'Tacoma';
    else if (modelCode === 'P') model = 'Prius';
  }

  return { year, make, model };
}

// --- PHOTO UPLOAD FLOWS ---
function initPhotoUpload() {
  const dropzone = elements.photoDropzone;
  const fileInput = elements.shipPhotos;
  
  if (!dropzone || !fileInput) return;
  
  // Click dropzone to select files
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Handle drag & drop behavior
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-shipper)';
    dropzone.style.backgroundColor = 'rgba(24, 160, 240, 0.05)';
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.backgroundColor = 'hsl(210, 20%, 98%)';
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    dropzone.style.backgroundColor = 'hsl(210, 20%, 98%)';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadedFiles(e.dataTransfer.files);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadedFiles(e.target.files);
    }
  });
}

function handleUploadedFiles(files) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check total photos limit
    if (uploadedPhotos.length >= 10) {
      alert('You can upload a maximum of 10 photos per shipment.');
      break;
    }
    
    // Check file format
    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid format: ${file.name}. Only JPG, JPEG, PNG, and WEBP formats are supported.`);
      continue;
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      alert(`File too large: ${file.name}. Maximum file size is 10 MB.`);
      continue;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      uploadedPhotos.push(base64Data);
      renderPhotoPreviews();
    };
    reader.readAsDataURL(file);
  }
}

function renderPhotoPreviews() {
  const previewsContainer = elements.photoPreviews;
  if (!previewsContainer) return;
  previewsContainer.innerHTML = '';
  
  uploadedPhotos.forEach((photoBase64, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'photo-preview-item';
    if (index === 0) {
      previewItem.title = 'Cover Image';
      previewItem.style.border = '2px solid var(--accent-shipper)';
    }
    
    previewItem.innerHTML = `
      <img src="${photoBase64}" alt="Preview thumbnail">
      <button type="button" class="photo-preview-remove" data-index="${index}">&times;</button>
      ${index === 0 ? '<span style="position:absolute; bottom:2px; left:2px; background:var(--accent-shipper); color:white; font-size:9px; padding:2px 4px; border-radius:3px; font-weight:700;">COVER</span>' : ''}
    `;
    
    previewItem.querySelector('.photo-preview-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      const removeIndex = parseInt(e.target.getAttribute('data-index'));
      uploadedPhotos.splice(removeIndex, 1);
      renderPhotoPreviews();
    });
    
    previewsContainer.appendChild(previewItem);
  });
}

// Compress cover image to small thumbnail size (max 300px width/height, 0.7 quality) using Canvas
function compressCoverImage(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const MAX_SIZE = 300;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as jpeg with compressed quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      // If error occurs, fall back to original
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}

// --- LIGHTBOX GALLERY CONTROLS ---
function initLightboxGallery() {
  const modal = elements.lightboxModal;
  const img = elements.lightboxImg;
  const closeBtn = elements.closeLightboxModal;
  const prevBtn = elements.lightboxPrev;
  const nextBtn = elements.lightboxNext;
  
  if (!modal || !closeBtn) return;
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  prevBtn.addEventListener('click', () => {
    navigateLightbox(-1);
  });
  
  nextBtn.addEventListener('click', () => {
    navigateLightbox(1);
  });
  
  // Click outside to dismiss
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
      navigateLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      navigateLightbox(1);
    } else if (e.key === 'Escape') {
      modal.classList.remove('active');
    }
  });
}

function openLightbox(photos, startIndex) {
  activeLightboxPhotos = photos;
  activeLightboxIndex = startIndex;
  
  updateLightboxImage();
  elements.lightboxModal.classList.add('active');
}

function navigateLightbox(direction) {
  if (activeLightboxPhotos.length === 0) return;
  activeLightboxIndex += direction;
  
  // Infinite carousel wrap
  if (activeLightboxIndex < 0) {
    activeLightboxIndex = activeLightboxPhotos.length - 1;
  } else if (activeLightboxIndex >= activeLightboxPhotos.length) {
    activeLightboxIndex = 0;
  }
  
  updateLightboxImage();
}

function updateLightboxImage() {
  const currentPhoto = activeLightboxPhotos[activeLightboxIndex];
  elements.lightboxImg.src = currentPhoto;
  elements.lightboxIndex.textContent = `Image ${activeLightboxIndex + 1} of ${activeLightboxPhotos.length}`;
  
  // Hide navigation buttons if there is only 1 photo
  if (activeLightboxPhotos.length <= 1) {
    elements.lightboxPrev.classList.add('d-none');
    elements.lightboxNext.classList.add('d-none');
  } else {
    elements.lightboxPrev.classList.remove('d-none');
    elements.lightboxNext.classList.remove('d-none');
  }
}

function renderHeader() {
  const user = Store.getCurrentUser();
  elements.navLinks.innerHTML = '';
  
  if (!user) {
    // Logged out navigation
    elements.navLinks.innerHTML = `
      <a href="#" class="nav-link" id="nav-btn-loadboard" style="margin-right: 16px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: var(--transition-smooth);">Load Board</a>
      <a href="#" class="btn btn-outline btn-sm" id="nav-btn-browse">Browse Market</a>
      <button class="btn btn-primary btn-sm" id="nav-btn-login">Sign In</button>
    `;
    
    document.getElementById('nav-btn-loadboard').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('loadboard');
    });

    document.getElementById('nav-btn-browse').addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode('login');
      switchView('auth');
    });
    
    document.getElementById('nav-btn-login').addEventListener('click', () => {
      setAuthMode('login');
      switchView('auth');
    });
  } else {
    // Logged in navigation
    const userRoleText = user.role === 'shipper' ? 'Shipper' : 'Carrier';
    const badgeClass = user.role === 'shipper' ? 'shipper-role' : 'carrier-role';
    
    const notifs = getNotificationsForUser(user.id);
    const unreadCount = notifs.filter(n => !n.read).length;
    const badgeHtml = unreadCount > 0 ? `<span class="notif-badge" style="position: absolute; top: -6px; right: -6px; background: red; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${unreadCount}</span>` : '';
    
    const loadboardLinkHtml = user.role === 'carrier' ? `<a href="#" class="nav-link" id="nav-btn-loadboard" style="margin-right: 16px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: var(--transition-smooth);">Load Board</a>` : '';
    
    elements.navLinks.innerHTML = `
      <div class="user-profile-widget">
        ${loadboardLinkHtml}
        <a href="#" class="nav-link" id="nav-btn-dashboard" style="margin-right: 16px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: var(--transition-smooth);">Dashboard</a>
        <a href="#" class="nav-link" id="nav-btn-inbox" style="margin-right: 16px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: var(--transition-smooth); position: relative;">Inbox</a>
        <a href="#" class="nav-link" id="nav-btn-profile" style="margin-right: 16px; font-weight: 600; text-decoration: none; color: var(--text-muted); transition: var(--transition-smooth);">Profile & Settings</a>
        
        <!-- Notification Bell -->
        <div id="nav-notif-container" style="position: relative; margin-right: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 20px;">🔔</span>
          ${badgeHtml}
        </div>
        
        <span class="role-badge ${badgeClass}">${userRoleText}</span>
        <span class="company-name" style="margin-right: 16px;">${user.companyName}</span>
        
        <button class="btn btn-outline btn-sm" id="nav-btn-logout">Logout</button>
      </div>
    `;
    
    if (user.role === 'carrier') {
      document.getElementById('nav-btn-loadboard').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('loadboard');
      });
    }

    document.getElementById('nav-btn-dashboard').addEventListener('click', (e) => {
      e.preventDefault();
      switchView(user.role);
    });

    document.getElementById('nav-btn-inbox').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inbox');
    });

    document.getElementById('nav-btn-profile').addEventListener('click', (e) => {
      e.preventDefault();
      switchView('profile');
    });

    const navNotifContainer = document.getElementById('nav-notif-container');
    if (navNotifContainer) {
      navNotifContainer.addEventListener('click', toggleNotifOverlayPanel);
    }
    
    updateInboxBadge();

    document.getElementById('nav-btn-logout').addEventListener('click', () => {
      Store.logout();
      showToast('Logged out successfully.');
      switchView('landing');
    });
  }

  // Highlight active link
  const activeLink = document.getElementById(
    currentView === 'loadboard' ? 'nav-btn-loadboard' : 
    (currentView === 'shipper' || currentView === 'carrier' ? 'nav-btn-dashboard' : 
    (currentView === 'inbox' ? 'nav-btn-inbox' : 
    (currentView === 'profile' ? 'nav-btn-profile' : '')))
  );
  if (activeLink) {
    activeLink.style.color = (user && user.role === 'carrier') ? 'var(--color-carrier, #2563eb)' : 'var(--color-shipper, #0f172a)';
  }
}

// --- LANDING STATS CONTROLLER ---
function updateLandingStats() {
  const shipments = Store.getShipments();
  const users = Store.getUsers();
  
  elements.statShipments.textContent = shipments.length;
  elements.statCarriers.textContent = users.filter(u => u.role === 'carrier').length;
}

// --- AUTHENTICATION CONTROLLER ---
function clearFieldValidationState(input) {
  if (!input) return;
  input.style.borderColor = '';
  input.style.boxShadow = '';
  const errEl = document.getElementById(`err-${input.id}`);
  if (errEl) {
    errEl.style.opacity = '0';
    setTimeout(() => { errEl.style.display = 'none'; }, 200);
  }
}

function updateFieldValidationState(input, isValid, errorMsg = "") {
  if (!input) return;
  const errEl = document.getElementById(`err-${input.id}`);
  
  if (isValid) {
    input.style.borderColor = '#22c55e';
    input.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
    if (errEl) {
      errEl.style.opacity = '0';
      setTimeout(() => { errEl.style.display = 'none'; }, 200);
    }
  } else {
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.15)';
    if (errEl && errorMsg) {
      errEl.textContent = errorMsg;
      errEl.style.display = 'block';
      setTimeout(() => { errEl.style.opacity = '1'; }, 10);
    }
  }
}

function updatePasswordLiveRequirements(password) {
  const reqs = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const updateReqUI = (id, isValid) => {
    const el = document.getElementById(id);
    if (el) {
      const icon = el.querySelector('.req-icon');
      if (isValid) {
        el.style.color = '#16a34a';
        if (icon) icon.textContent = '✓';
      } else {
        el.style.color = 'var(--text-muted)';
        if (icon) icon.textContent = '○';
      }
    }
  };

  updateReqUI('req-length', reqs.length);
  updateReqUI('req-uppercase', reqs.uppercase);
  updateReqUI('req-lowercase', reqs.lowercase);
  updateReqUI('req-number', reqs.number);
  updateReqUI('req-special', reqs.special);
  
  return Object.values(reqs).every(Boolean);
}

function bindRegistrationLiveValidation() {
  const usernameInput = document.getElementById('auth-username');
  const contactNameInput = document.getElementById('auth-contact-name');
  const emailInput = document.getElementById('auth-email');
  const phoneInput = document.getElementById('auth-phone');
  const companyInput = document.getElementById('auth-company');
  const passwordInput = document.getElementById('auth-password');
  const confirmPasswordInput = document.getElementById('auth-confirm-password');
  const mcNumberInput = document.getElementById('auth-mc-number');
  const dotNumberInput = document.getElementById('auth-dot-number');
  const equipmentContainer = document.getElementById('auth-equipment-container');

  const checkUsername = () => {
    const val = usernameInput.value.trim();
    if (!val) {
      updateFieldValidationState(usernameInput, false, "Username is required.");
      return false;
    } else if (val.length < 3) {
      updateFieldValidationState(usernameInput, false, "Username must be at least 3 characters.");
      return false;
    }
    updateFieldValidationState(usernameInput, true);
    return true;
  };

  const checkContactName = () => {
    const val = contactNameInput.value.trim();
    if (!val) {
      updateFieldValidationState(contactNameInput, false, "Contact name is required.");
      return false;
    }
    updateFieldValidationState(contactNameInput, true);
    return true;
  };

  const checkEmail = () => {
    const val = emailInput.value.trim();
    if (!val) {
      updateFieldValidationState(emailInput, false, "Email address is required.");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      updateFieldValidationState(emailInput, false, "Please enter a valid email address.");
      return false;
    }
    updateFieldValidationState(emailInput, true);
    return true;
  };

  const checkPhone = () => {
    const val = phoneInput.value.trim();
    const digits = val.replace(/\D/g, '');
    if (!val) {
      updateFieldValidationState(phoneInput, false, "Mobile phone number is required.");
      return false;
    } else if (digits.length < 10) {
      updateFieldValidationState(phoneInput, false, "Phone number must be at least 10 digits.");
      return false;
    }
    updateFieldValidationState(phoneInput, true);
    return true;
  };

  const checkCompany = () => {
    const val = companyInput.value.trim();
    if (!val) {
      updateFieldValidationState(companyInput, false, "Company name is required.");
      return false;
    }
    updateFieldValidationState(companyInput, true);
    return true;
  };

  const checkPassword = () => {
    const val = passwordInput.value;
    const isComplexityValid = updatePasswordLiveRequirements(val);
    if (!val) {
      updateFieldValidationState(passwordInput, false, "Password is required.");
      return false;
    } else if (val.length < 8) {
      updateFieldValidationState(passwordInput, false, "Password must be at least 8 characters.");
      return false;
    } else if (!isComplexityValid) {
      updateFieldValidationState(passwordInput, false, "Password does not meet complexity requirements.");
      return false;
    }
    updateFieldValidationState(passwordInput, true);
    return true;
  };

  const checkConfirmPassword = () => {
    const val = confirmPasswordInput.value;
    const pwdVal = passwordInput.value;
    if (!val) {
      updateFieldValidationState(confirmPasswordInput, false, "Please confirm your password.");
      return false;
    } else if (val !== pwdVal) {
      updateFieldValidationState(confirmPasswordInput, false, "Passwords do not match.");
      return false;
    }
    updateFieldValidationState(confirmPasswordInput, true);
    return true;
  };

  const checkMcNumber = () => {
    const roleCarrier = document.getElementById('role-carrier');
    if (roleCarrier && roleCarrier.checked) {
      const val = mcNumberInput.value.trim();
      if (!val) {
        updateFieldValidationState(mcNumberInput, false, "MC Number is required for carriers.");
        return false;
      }
    }
    updateFieldValidationState(mcNumberInput, true);
    return true;
  };

  const checkDotNumber = () => {
    const roleCarrier = document.getElementById('role-carrier');
    if (roleCarrier && roleCarrier.checked) {
      const val = dotNumberInput.value.trim();
      if (!val) {
        updateFieldValidationState(dotNumberInput, false, "DOT Number is required for carriers.");
        return false;
      }
    }
    updateFieldValidationState(dotNumberInput, true);
    return true;
  };

  const checkEquipment = () => {
    const roleCarrier = document.getElementById('role-carrier');
    if (roleCarrier && roleCarrier.checked) {
      const checkedCount = document.querySelectorAll('.auth-equipment-checkbox:checked').length;
      const errEl = document.getElementById('err-auth-equipment');
      if (checkedCount === 0) {
        if (equipmentContainer) {
          equipmentContainer.style.borderColor = '#ef4444';
          equipmentContainer.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.15)';
        }
        if (errEl) {
          errEl.textContent = "Please select at least one Equipment Type.";
          errEl.style.display = 'block';
          errEl.style.opacity = '1';
        }
        return false;
      }
      if (equipmentContainer) {
        equipmentContainer.style.borderColor = '#22c55e';
        equipmentContainer.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
      }
      if (errEl) {
        errEl.style.opacity = '0';
        errEl.style.display = 'none';
      }
    }
    return true;
  };

  if (usernameInput) usernameInput.oninput = checkUsername;
  if (contactNameInput) contactNameInput.oninput = checkContactName;
  if (emailInput) emailInput.oninput = checkEmail;
  if (phoneInput) phoneInput.oninput = checkPhone;
  if (companyInput) companyInput.oninput = checkCompany;
  if (passwordInput) {
    passwordInput.oninput = () => {
      checkPassword();
      if (confirmPasswordInput.value) checkConfirmPassword();
    };
  }
  if (confirmPasswordInput) confirmPasswordInput.oninput = checkConfirmPassword;
  if (mcNumberInput) mcNumberInput.oninput = checkMcNumber;
  if (dotNumberInput) dotNumberInput.oninput = checkDotNumber;
  
  const checkboxes = document.querySelectorAll('.auth-equipment-checkbox');
  checkboxes.forEach(cb => {
    cb.onchange = checkEquipment;
  });
}

function setAuthMode(mode) {
  elements.authModeInput.value = mode;
  if (elements.authError) elements.authError.classList.add('d-none');
  
  if (mode === 'login') {
    elements.tabLogin.classList.add('active');
    elements.tabRegister.classList.remove('active');
    elements.authTitle.textContent = 'Welcome Back';
    elements.authSubtitle.textContent = 'Sign in to manage your shipments and bids.';
    
    // Restore static login HTML
    elements.authForm.innerHTML = `
      <input type="hidden" id="auth-mode" value="login">
      <div class="form-group" style="margin-bottom: 20px;">
        <label for="auth-username" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Username</label>
        <input type="text" id="auth-username" class="form-control" placeholder="e.g. shipper1" required style="width: 100%; box-sizing: border-box;">
      </div>
      <div class="form-group" style="margin-bottom: 20px;">
        <label for="auth-password" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Password</label>
        <input type="password" id="auth-password" class="form-control" placeholder="••••••••" required style="width: 100%; box-sizing: border-box;">
      </div>
      <div id="register-fields" class="d-none"></div>
      <div id="auth-error" style="color: var(--color-rejected); font-size: 13px; margin-bottom: 16px; line-height: 1.4;" class="d-none"></div>
      <button type="submit" class="btn btn-primary" style="width: 100%;" id="auth-submit-btn">Sign In</button>
    `;
    
    elements.authUsername = document.getElementById('auth-username');
    elements.authPassword = document.getElementById('auth-password');
    elements.authModeInput = document.getElementById('auth-mode');
    elements.registerFields = document.getElementById('register-fields');
    elements.authSubmitBtn = document.getElementById('auth-submit-btn');
    elements.authError = document.getElementById('auth-error');
  } else {
    elements.tabLogin.classList.remove('active');
    elements.tabRegister.classList.add('active');
    elements.authTitle.textContent = 'Join Movana';
    elements.authSubtitle.textContent = 'Create an account as a Shipper or Carrier.';
    setupRegistrationUI();
  }
}

function setupRegistrationUI() {
  const form = elements.authForm;
  if (!form) return;

  console.log("=== setupRegistrationUI: Injecting premium registration DOM ===");

  const equipmentOptions = [
    'Dry Van', 'Reefer', 'Flatbed', 'Hotshot', 
    'Car Hauler', 'Box Truck', 'Power Only', 'Step Deck', 'Lowboy'
  ];

  let equipmentCheckboxesHtml = '';
  equipmentOptions.forEach(eq => {
    equipmentCheckboxesHtml += `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="auth-equipment-checkbox" value="${eq}"> ${eq}
      </label>
    `;
  });

  form.innerHTML = `
    <input type="hidden" id="auth-mode" value="register">
    
    <!-- Username -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-username" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Username <span style="color: #ef4444;">*</span></label>
      <input type="text" id="auth-username" class="form-control" placeholder="e.g. shipper1" required style="width: 100%; box-sizing: border-box;">
      <div class="field-error-message" id="err-auth-username" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>
    
    <!-- Email Address -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-email" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Email Address <span style="color: #ef4444;">*</span></label>
      <input type="email" id="auth-email" class="form-control" placeholder="e.g. john@acme.com" required style="width: 100%; box-sizing: border-box;">
      <div class="field-error-message" id="err-auth-email" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Phone Number -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-phone" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Mobile Phone Number <span style="color: #ef4444;">*</span></label>
      <input type="tel" id="auth-phone" class="form-control" placeholder="e.g. 555-0199" required style="width: 100%; box-sizing: border-box;">
      <div class="field-error-message" id="err-auth-phone" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Company Name -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-company" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Company Name <span style="color: #ef4444;">*</span></label>
      <input type="text" id="auth-company" class="form-control" placeholder="e.g. Acme Shipping Corp" required style="width: 100%; box-sizing: border-box;">
      <div class="field-error-message" id="err-auth-company" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Contact Name -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-contact-name" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Contact Name <span style="color: #ef4444;">*</span></label>
      <input type="text" id="auth-contact-name" class="form-control" placeholder="e.g. John Doe" required style="width: 100%; box-sizing: border-box;">
      <div class="field-error-message" id="err-auth-contact-name" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Password and Confirm Password -->
    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-password" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Password <span style="color: #ef4444;">*</span></label>
      <div style="position: relative; width: 100%;">
        <input type="password" id="auth-password" class="form-control" placeholder="••••••••" required style="padding-right: 40px; width: 100%; box-sizing: border-box;">
        <button type="button" class="btn-password-toggle" data-target="auth-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 0; margin: 0; cursor: pointer; color: var(--text-muted); font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%;">👁️</button>
      </div>
      <div id="password-requirements" style="font-size: 11px; margin-top: 8px; display: flex; flex-direction: column; gap: 4px; color: var(--text-muted);">
        <div id="req-length" style="display: flex; align-items: center; gap: 6px; transition: color 0.2s;"><span class="req-icon" style="font-weight: 700;">○</span> Minimum 8 characters</div>
        <div id="req-uppercase" style="display: flex; align-items: center; gap: 6px; transition: color 0.2s;"><span class="req-icon" style="font-weight: 700;">○</span> One uppercase letter</div>
        <div id="req-lowercase" style="display: flex; align-items: center; gap: 6px; transition: color 0.2s;"><span class="req-icon" style="font-weight: 700;">○</span> One lowercase letter</div>
        <div id="req-number" style="display: flex; align-items: center; gap: 6px; transition: color 0.2s;"><span class="req-icon" style="font-weight: 700;">○</span> One number</div>
        <div id="req-special" style="display: flex; align-items: center; gap: 6px; transition: color 0.2s;"><span class="req-icon" style="font-weight: 700;">○</span> One special character (!@#$%^&*(),.?":{}|<>)</div>
      </div>
      <div class="field-error-message" id="err-auth-password" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <div class="form-group" style="margin-bottom: 20px;">
      <label for="auth-confirm-password" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-main);">Confirm Password <span style="color: #ef4444;">*</span></label>
      <div style="position: relative; width: 100%;">
        <input type="password" id="auth-confirm-password" class="form-control" placeholder="••••••••" required style="padding-right: 40px; width: 100%; box-sizing: border-box;">
        <button type="button" class="btn-password-toggle" data-target="auth-confirm-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 0; margin: 0; cursor: pointer; color: var(--text-muted); font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%;">👁️</button>
      </div>
      <div class="field-error-message" id="err-auth-confirm-password" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Select Role -->
    <label class="form-group label" style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 13px; color: var(--text-main);">Select Your Role</label>
    <div class="role-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <input type="radio" name="auth-role" id="role-shipper" class="role-radio" value="shipper" checked>
      <label for="role-shipper" class="role-label shipper-btn" style="padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <span>Shipper</span>
      </label>

      <input type="radio" name="auth-role" id="role-carrier" class="role-radio" value="carrier">
      <label for="role-carrier" class="role-label carrier-btn" style="padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <span>Carrier</span>
      </label>
    </div>

    <!-- Carrier Specific Fields -->
    <div id="carrier-fields" class="d-none" style="margin-top: 16px; padding: 16px; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); background: hsl(210, 20%, 98%); margin-bottom: 20px;">
      <h4 style="font-size: 13px; font-weight: 700; color: var(--color-carrier); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Carrier Credentials</h4>
      
      <div class="form-group" style="margin-bottom: 12px;">
        <label for="auth-mc-number" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; color: var(--text-main);">MC Number <span style="color: #ef4444;">*</span></label>
        <input type="text" id="auth-mc-number" class="form-control" placeholder="e.g. MC123456" style="width: 100%; box-sizing: border-box;">
        <div class="field-error-message" id="err-auth-mc-number" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
      </div>
      
      <div class="form-group" style="margin-bottom: 12px;">
        <label for="auth-dot-number" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; color: var(--text-main);">DOT Number <span style="color: #ef4444;">*</span></label>
        <input type="text" id="auth-dot-number" class="form-control" placeholder="e.g. DOT1234567" style="width: 100%; box-sizing: border-box;">
        <div class="field-error-message" id="err-auth-dot-number" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
      </div>
      
      <label class="form-group label" style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 12px; color: var(--text-main);">Equipment Types (Select all that apply) <span style="color: #ef4444;">*</span></label>
      <div class="equipment-types-container" id="auth-equipment-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 150px; overflow-y: auto; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: #fff; margin-bottom: 8px; box-sizing: border-box;">
        ${equipmentCheckboxesHtml}
      </div>
      <div class="field-error-message" id="err-auth-equipment" style="color: #ef4444; font-size: 11px; margin-top: 4px; display: none; opacity: 0; transition: opacity 0.2s;"></div>
    </div>

    <!-- Error Block -->
    <div id="auth-error" style="color: var(--color-rejected); font-size: 13px; margin-bottom: 16px; line-height: 1.4;" class="d-none"></div>

    <!-- Submit Button -->
    <button type="submit" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;" id="auth-submit-btn">
      Create Account
    </button>
  `;

  elements.authUsername = document.getElementById('auth-username');
  elements.authPassword = document.getElementById('auth-password');
  elements.authCompany = document.getElementById('auth-company');
  elements.authModeInput = document.getElementById('auth-mode');
  elements.authSubmitBtn = document.getElementById('auth-submit-btn');
  elements.authError = document.getElementById('auth-error');

  const roleShipper = document.getElementById('role-shipper');
  const roleCarrier = document.getElementById('role-carrier');
  const carrierFields = document.getElementById('carrier-fields');

  if (roleShipper && roleCarrier && carrierFields) {
    roleShipper.addEventListener('change', () => {
      carrierFields.classList.add('d-none');
      clearFieldValidationState(document.getElementById('auth-mc-number'));
      clearFieldValidationState(document.getElementById('auth-dot-number'));
      const container = document.getElementById('auth-equipment-container');
      if (container) {
        container.style.borderColor = '';
        container.style.boxShadow = '';
      }
      const equipErr = document.getElementById('err-auth-equipment');
      if (equipErr) equipErr.style.display = 'none';
    });
    roleCarrier.addEventListener('change', () => {
      carrierFields.classList.remove('d-none');
    });
  }

  const toggleBtns = form.querySelectorAll('.btn-password-toggle');
  toggleBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    };
  });

  bindRegistrationLiveValidation();
}

// --- INTERACTIVE MAP GLOBALS & HELPERS ---
let detailsMap = null;
let routeAnimationInterval = null;
let mapLayers = [];

const CITY_LAT_LON = {
  'chicago, il': [41.8781, -87.6298],
  'houston, tx': [29.7604, -95.3698],
  'orlando, fl': [28.5383, -81.3792],
  'new york, ny': [40.7128, -74.0060],
  'seattle, wa': [47.6062, -122.3321],
  'los angeles, ca': [34.0522, -118.2437],
  'phoenix, az': [33.4484, -112.0740],
  'denver, co': [39.7392, -104.9903],
  'lagrange, ga': [33.0360, -85.0313],
  'valle crucis, nc': [36.2090, -81.7779],
  'saint martin parish, la': [30.1291, -91.6083]
};

function getPostedAge(createdAt) {
  if (!createdAt) return '--';
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getCoordinates(lat, lon, cityName) {
  if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
    return [parseFloat(lat), parseFloat(lon)];
  }
  const normalized = cityName.toLowerCase().trim();
  for (const key in CITY_LAT_LON) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CITY_LAT_LON[key];
    }
  }
  // Deterministic fallback using hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latVal = 28 + (Math.abs(hash % 20));
  const lonVal = -118 + (Math.abs((hash >> 8) % 40));
  return [latVal, lonVal];
}

// --- DETAILS / MAP MODAL SHOW ---
async function showDetailsModal(shipment) {
  // Clear any existing offers and history log divs first to prevent duplicate appends
  const existingOffers = document.getElementById('details-incoming-offers-section');
  if (existingOffers) existingOffers.remove();
  
  const existingHistory = document.getElementById('details-bid-history-section');
  if (existingHistory) existingHistory.remove();

  // Check authorization for full street addresses
  const currentUser = Store.getCurrentUser();
  const isAuthorized = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.id === shipment.shipperId ||
    (shipment.status !== 'open' && shipment.carrierId && currentUser.id === shipment.carrierId)
  );

  if (isAuthorized && shipment.originStreetAddress && shipment.destinationStreetAddress) {
    elements.detailsOrigin.innerHTML = `
      <div style="font-weight: 600;">${shipment.originStreetAddress}</div>
      <div style="color: var(--text-muted); font-size: 14px;">${shipment.originCity}, ${shipment.originState} ${shipment.originZip || ''}</div>
    `;
    elements.detailsDestination.innerHTML = `
      <div style="font-weight: 600;">${shipment.destinationStreetAddress}</div>
      <div style="color: var(--text-muted); font-size: 14px;">${shipment.destinationCity}, ${shipment.destinationState} ${shipment.destinationZip || ''}</div>
    `;
  } else {
    // Unauthorized or no street address present (e.g. seed data)
    const oCityState = (shipment.originCity && shipment.originState) ? `${shipment.originCity}, ${shipment.originState}` : shipment.origin;
    const dCityState = (shipment.destinationCity && shipment.destinationState) ? `${shipment.destinationCity}, ${shipment.destinationState}` : shipment.destination;
    
    // Add a lock privacy indicator if street address exists but is hidden
    const privacyNotice = shipment.hasFullAddress ? ' <span style="font-size: 11px; color: var(--accent-shipper); font-weight: 600; margin-left: 6px; padding: 2px 6px; background: rgba(24, 160, 240, 0.08); border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🔒 Address hidden until assigned</span>' : '';
    
    elements.detailsOrigin.innerHTML = `
      <div style="font-weight: 600; display: flex; align-items: center; flex-wrap: wrap;">${oCityState}${privacyNotice}</div>
    `;
    elements.detailsDestination.innerHTML = `
      <div style="font-weight: 600; display: flex; align-items: center; flex-wrap: wrap;">${dCityState}${privacyNotice}</div>
    `;
  }
  
  // Populate coordinates if present
  if (shipment.originLat && shipment.originLon) {
    elements.detailsOriginCoords.textContent = `Lat: ${parseFloat(shipment.originLat).toFixed(4)}, Lon: ${parseFloat(shipment.originLon).toFixed(4)}`;
  } else {
    elements.detailsOriginCoords.textContent = '';
  }
  if (shipment.destinationLat && shipment.destinationLon) {
    elements.detailsDestinationCoords.textContent = `Lat: ${parseFloat(shipment.destinationLat).toFixed(4)}, Lon: ${parseFloat(shipment.destinationLon).toFixed(4)}`;
  } else {
    elements.detailsDestinationCoords.textContent = '';
  }

  // Update priority badge
  const priorityEl = document.getElementById('details-priority');
  if (priorityEl) {
    priorityEl.className = `priority-badge ${shipment.priority || 'flexible'}`;
    priorityEl.textContent = shipment.priority || 'flexible';
  }

  elements.detailsCargo.textContent = shipment.shipmentType || 'Freight';
  elements.detailsWeight.textContent = shipment.weight > 0 ? (shipment.weight.toLocaleString() + ' lbs') : '--';
  elements.detailsDimensions.textContent = shipment.dimensions || '--';
  elements.detailsDescription.textContent = shipment.description || 'No description provided.';
  elements.detailsPickup.textContent = shipment.pickupDate;
  elements.detailsDropoff.textContent = shipment.deliveryDate || 'N/A';
  elements.detailsShipperCompany.textContent = shipment.shipperName;
  elements.detailsBudget.textContent = `$${shipment.budget.toLocaleString()}`;
  
  // Render cover image banner if present
  if (shipment.coverImage) {
    elements.detailsCoverWrapper.classList.remove('d-none');
    elements.detailsCoverImg.src = shipment.coverImage;
  } else {
    elements.detailsCoverWrapper.classList.add('d-none');
    elements.detailsCoverImg.src = '';
  }
  
  // Render photo gallery
  elements.detailsGalleryBox.classList.add('d-none');
  elements.detailsGalleryGrid.innerHTML = '';
  
  try {
    let photos = await Store.getShipmentPhotos(shipment.id);
    // If no uploaded photos, check if cover image exists to use as sole zoomable photo
    if (photos.length === 0 && shipment.coverImage) {
      photos = [shipment.coverImage];
    }
    
    elements.detailsGalleryBox.classList.remove('d-none');
    if (photos && photos.length > 0) {
      photos.forEach((photoBase64, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'gallery-thumb';
        thumb.innerHTML = `<img src="${photoBase64}" alt="Shipment image ${index + 1}">`;
        thumb.addEventListener('click', () => {
          openLightbox(photos, index);
        });
        elements.detailsGalleryGrid.appendChild(thumb);
      });
    } else {
      const msg = document.createElement('p');
      msg.style.color = 'var(--text-muted)';
      msg.style.fontSize = '14px';
      msg.style.margin = '0';
      msg.textContent = 'No photos uploaded.';
      elements.detailsGalleryGrid.appendChild(msg);
    }
  } catch (err) {
    console.error('Failed to load photos for shipment detail modal', err);
  }

  // Populate specifications HTML dynamically based on Shipment Type
  const specsBox = document.getElementById('details-specifications-box');
  if (specsBox) {
    let d = shipment.shipmentTypeDetails || {};
    let subSpecsHtml = '';
    
    // Normalise and fall back to top-level fields for backwards compatibility/seeds
    if (shipment.shipmentType === 'Vehicle Transport') {
      const year = d.year || shipment.vehicleYear || '';
      const make = d.make || shipment.vehicleMake || '';
      const model = d.model || shipment.vehicleModel || '';
      const subType = d.subType || shipment.vehicleType || 'Car';
      const trim = d.trim || '';
      const vin = d.vin || shipment.vehicleVin || '';
      const condition = d.condition || shipment.vehicleCondition || 'operable';
      const runsAndDrives = d.runsAndDrives !== undefined ? d.runsAndDrives : (shipment.description && shipment.description.includes('Runs and Drives'));
      const hasKeys = d.hasKeys !== undefined ? d.hasKeys : (shipment.description && shipment.description.includes('Has Keys'));
      const convertible = d.convertible !== undefined ? d.convertible : (shipment.description && shipment.description.includes('Convertible'));
      const lifted = d.lifted !== undefined ? d.lifted : (shipment.description && shipment.description.includes('Lifted'));
      const lowered = d.lowered !== undefined ? d.lowered : (shipment.description && shipment.description.includes('Lowered'));
      
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Vehicle Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Year/Make/Model</span><strong>${year} ${make} ${model} ${trim ? `(${trim})` : ''}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Sub-type</span><strong>${subType}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Condition</span><strong>${condition.charAt(0).toUpperCase() + condition.slice(1)}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">VIN</span><strong>${vin || 'N/A'}</strong></div>
          <div style="grid-column: span 2;">
            <span style="color: var(--text-muted); display: block; font-size: 12px; margin-bottom: 4px;">Features</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: ${runsAndDrives ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${runsAndDrives ? 'var(--color-delivered)' : 'var(--color-rejected)'}; font-weight: 600;">Runs & Drives: ${runsAndDrives ? 'Yes' : 'No'}</span>
              <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: ${hasKeys ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${hasKeys ? 'var(--color-delivered)' : 'var(--color-rejected)'}; font-weight: 600;">Has Keys: ${hasKeys ? 'Yes' : 'No'}</span>
              ${convertible ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(24, 160, 240, 0.1); color: var(--accent-shipper); font-weight: 600;">Convertible</span>` : ''}
              ${lifted ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 600;">Lifted</span>` : ''}
              ${lowered ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 600;">Lowered</span>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Motorcycle Transport') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Motorcycle Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Year/Make/Model</span><strong>${d.year || ''} ${d.make || ''} ${d.model || ''}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Condition</span><strong>${d.condition ? d.condition.charAt(0).toUpperCase() + d.condition.slice(1) : 'Operable'}</strong></div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Freight') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Freight Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Commodity Type</span><strong>${d.commodity || 'General Cargo'}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Number of Pallets</span><strong>${d.pallets || 0}</strong></div>
          <div style="grid-column: span 2;">
            <span style="color: var(--text-muted); display: block; font-size: 12px; margin-bottom: 4px;">Requirements</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(24, 160, 240, 0.1); color: var(--accent-shipper); font-weight: 600;">${d.stackable ? 'Stackable' : 'Non-Stackable'}</span>
              ${d.hazmat ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: var(--color-rejected); font-weight: 600;">⚠️ Hazmat</span>` : ''}
              ${d.liftgate ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 600;">⚡ Liftgate Required</span>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Household Move') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Household Move Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Move Size</span><strong>${d.moveSize || 'N/A'}</strong></div>
          <div style="grid-column: span 2;">
            <span style="color: var(--text-muted); display: block; font-size: 12px; margin-bottom: 4px;">Services Required</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${d.packing ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(24, 160, 240, 0.1); color: var(--accent-shipper); font-weight: 600;">📦 Packing</span>` : ''}
              ${d.loading ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(24, 160, 240, 0.1); color: var(--accent-shipper); font-weight: 600;">💪 Loading</span>` : ''}
              ${d.unloading ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(24, 160, 240, 0.1); color: var(--accent-shipper); font-weight: 600;">🚛 Unloading</span>` : ''}
              ${d.storage ? `<span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 600;">🏠 Storage Needed</span>` : ''}
              ${!d.packing && !d.loading && !d.unloading && !d.storage ? '<span style="color: var(--text-muted); font-size: 13px;">No special services requested</span>' : ''}
            </div>
          </div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Heavy Equipment') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Heavy Equipment Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Equipment Type</span><strong>${d.equipmentType || 'N/A'}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Make/Model</span><strong>${d.make || ''} ${d.model || ''}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Condition</span><strong>${d.condition ? d.condition.charAt(0).toUpperCase() + d.condition.slice(1) : 'Operable'}</strong></div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Boat Transport') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Boat Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Make/Model</span><strong>${d.make || ''} ${d.model || ''}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Dimensions (LxWxH)</span><strong>${d.length || 0}' x ${d.width || 0}' x ${d.height || 0}'</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Trailer Included</span><strong>${d.trailer ? d.trailer.toUpperCase() : 'NO'}</strong></div>
        </div>
      `;
    } else if (shipment.shipmentType === 'RV Transport') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">RV Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">RV Type</span><strong>${d.rvType || 'N/A'}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Year/Make/Model</span><strong>${d.year || ''} ${d.make || ''} ${d.model || ''}</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Length</span><strong>${d.length || 0} ft</strong></div>
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Operable</span><strong>${d.operable ? d.operable.toUpperCase() : 'YES'}</strong></div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Other') {
      subSpecsHtml = `
        <h4 style="font-size: 13px; text-transform: uppercase; color: var(--accent-shipper); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px;">Cargo Specifications</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><span style="color: var(--text-muted); display: block; font-size: 12px;">Cargo Type</span><strong>${d.cargoType || 'General Cargo'}</strong></div>
        </div>
      `;
    }
    
    const equipmentHtml = `
      <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed var(--border-color);">
        <span style="color: var(--text-muted); display: block; font-size: 12px; margin-bottom: 2px;">Equipment Required</span>
        <strong style="font-size: 15px; color: var(--accent-carrier);">${shipment.equipmentRequired || 'Dry Van'}</strong>
      </div>
    `;
    
    specsBox.innerHTML = equipmentHtml + subSpecsHtml;
    specsBox.classList.remove('d-none');
  }

  // Update status badge
  elements.detailsStatus.className = `status-badge ${shipment.status.replace(' ', '-')}`;
  elements.detailsStatus.textContent = formatStatusText(shipment.status);
  
  // Toggle bid buttons based on user persona
  const user = Store.getCurrentUser();
  if (user && user.role === 'carrier' && shipment.status === 'open') {
    elements.detailsBidBtn.classList.remove('d-none');
    // Save id to details bid click handler
    elements.detailsBidBtn.onclick = () => {
      elements.detailsModal.classList.remove('active');
      openBidModal(shipment);
      if (routeAnimationInterval) {
        clearInterval(routeAnimationInterval);
        routeAnimationInterval = null;
      }
    };
  } else {
    elements.detailsBidBtn.classList.add('d-none');
  }

  // --- Contact Cards & Privacy Control ---
  const detailsShipperCard = document.getElementById('details-shipper-card');
  const detailsCarrierCard = document.getElementById('details-carrier-card');
  
  if (detailsShipperCard) detailsShipperCard.classList.add('d-none');
  if (detailsCarrierCard) detailsCarrierCard.classList.add('d-none');
  
  const isAwarded = shipment.status !== 'open' && shipment.carrierId;
  if (isAwarded) {
    const shipperUser = Store.getUsers().find(u => u.id === shipment.shipperId);
    const carrierUser = Store.getUsers().find(u => u.id === shipment.carrierId);
    
    // Winning Carrier or Admin sees Shipper Contact Card
    if (user && (user.id === shipment.carrierId || user.role === 'admin')) {
      if (shipperUser && detailsShipperCard) {
        detailsShipperCard.classList.remove('d-none');
        document.getElementById('details-shipper-contact-name').textContent = shipperUser.contactName || shipperUser.username;
        document.getElementById('details-shipper-company').textContent = shipperUser.companyName || 'N/A';
        document.getElementById('details-shipper-phone').textContent = shipperUser.phone || 'N/A';
        document.getElementById('details-shipper-email').textContent = shipperUser.email || 'N/A';
      }
    }
    
    // Shipper or Admin sees Carrier Contact Card
    if (user && (user.id === shipment.shipperId || user.role === 'admin')) {
      if (carrierUser && detailsCarrierCard) {
        detailsCarrierCard.classList.remove('d-none');
        document.getElementById('details-carrier-company').textContent = carrierUser.companyName || 'N/A';
        document.getElementById('details-carrier-contact-name').textContent = carrierUser.contactName || carrierUser.username;
        document.getElementById('details-carrier-phone').textContent = carrierUser.phone || 'N/A';
        document.getElementById('details-carrier-email').textContent = carrierUser.email || 'N/A';
      }
    }
  }

  // --- Leaflet Map Render ---
  if (routeAnimationInterval) {
    clearInterval(routeAnimationInterval);
    routeAnimationInterval = null;
  }
  
  // Set up pickup and delivery coordinates based on authorization status
  const pickupCoords = isAuthorized ? 
    getCoordinates(shipment.originLat, shipment.originLon, shipment.origin) : 
    getCoordinates(null, null, `${shipment.originCity || shipment.origin.split(',')[0]}, ${shipment.originState || shipment.origin.split(',')[1] || ''}`);
    
  const deliveryCoords = isAuthorized ? 
    getCoordinates(shipment.destinationLat, shipment.destinationLon, shipment.destination) : 
    getCoordinates(null, null, `${shipment.destinationCity || shipment.destination.split(',')[0]}, ${shipment.destinationState || shipment.destination.split(',')[1] || ''}`);

  // Show Details modal first so map container has dimensions in DOM
  elements.detailsModal.classList.add('active');

  // Clean up existing dynamic sections to prevent duplication
  const oldOffers = document.getElementById('details-incoming-offers-section');
  if (oldOffers) oldOffers.remove();
  const oldHistory = document.getElementById('details-bid-history-section');
  if (oldHistory) oldHistory.remove();

  // Inject dynamic Incoming Offers panel if currentUser is shipper owner
  if (currentUser && currentUser.role === 'shipper' && shipment.shipperId === currentUser.id) {
    const lastFooter = document.getElementById('close-details-footer').parentNode;
    const offersSection = document.createElement('div');
    offersSection.id = 'details-incoming-offers-section';
    offersSection.className = 'mt-24 mb-24';
    offersSection.style.borderTop = '1px solid var(--border-color)';
    offersSection.style.paddingTop = '20px';
    const detailsModalCard = document.getElementById('details-modal-card');
    detailsModalCard.insertBefore(offersSection, lastFooter);
    
    renderIncomingOffers(shipment);
  }
  
  // Inject permanent Bid History section if applicable
  const historyHtml = renderBidHistorySection(shipment);
  if (historyHtml) {
    const lastFooter = document.getElementById('close-details-footer').parentNode;
    const historyDiv = document.createElement('div');
    historyDiv.id = 'details-bid-history-section';
    historyDiv.style.borderTop = '1px solid var(--border-color)';
    historyDiv.style.paddingTop = '20px';
    historyDiv.innerHTML = historyHtml;
    const detailsModalCard = document.getElementById('details-modal-card');
    detailsModalCard.insertBefore(historyDiv, lastFooter);
  }
  
  setTimeout(async () => {
    try {
      if (!detailsMap) {
        detailsMap = L.map('details-map', {
          zoomControl: true,
          scrollWheelZoom: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(detailsMap);
      }
      
      // Clear previous layers
      mapLayers.forEach(layer => detailsMap.removeLayer(layer));
      mapLayers = [];
      
      // Draw Pickup Marker
      const pickupMarker = L.marker(pickupCoords, {
        icon: L.divIcon({
          html: `<div style="background: var(--accent-shipper); color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-sm); font-size: 11px;">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(detailsMap);
      pickupMarker.bindPopup(`<strong>Pickup:</strong> ${isAuthorized ? shipment.originStreetAddress || shipment.origin : shipment.origin}`);
      mapLayers.push(pickupMarker);
      
      // Draw Delivery Marker
      const deliveryMarker = L.marker(deliveryCoords, {
        icon: L.divIcon({
          html: `<div style="background: var(--color-transit); color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-sm); font-size: 11px;">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(detailsMap);
      deliveryMarker.bindPopup(`<strong>Delivery:</strong> ${isAuthorized ? shipment.destinationStreetAddress || shipment.destination : shipment.destination}`);
      mapLayers.push(deliveryMarker);
      
      // Refresh map container size
      detailsMap.invalidateSize();
      
      // Fetch OSRM Route
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${deliveryCoords[1]},${deliveryCoords[0]}?overview=full&geometries=geojson`;
      
      try {
        const response = await fetch(routeUrl);
        if (!response.ok) throw new Error('OSRM routing request failed');
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
          
          const distanceMiles = (route.distance * 0.000621371).toFixed(1);
          const hours = Math.floor(route.duration / 3600);
          const minutes = Math.round((route.duration % 3600) / 60);
          const durationText = `${hours > 0 ? hours + ' hr ' : ''}${minutes} min`;
          
          document.getElementById('route-metrics-card').classList.remove('d-none');
          document.getElementById('route-metric-distance').textContent = `${distanceMiles} mi`;
          document.getElementById('route-metric-duration').textContent = durationText;
          
          // Draw Polyline
          const polyline = L.polyline(coordinates, {
            color: 'var(--accent-shipper)',
            weight: 5,
            dashArray: '10, 10',
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(detailsMap);
          mapLayers.push(polyline);
          
          // Animate Polyline dashes
          setTimeout(() => {
            const el = polyline.getElement();
            if (el) {
              el.classList.add('map-route-line-animated');
            }
          }, 100);
          
          // Add animated truck marker
          const truckIcon = L.divIcon({
            html: `<div style="background: var(--accent-carrier); color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-sm); font-size: 11px;">🚚</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          const truckMarker = L.marker(coordinates[0], { icon: truckIcon }).addTo(detailsMap);
          mapLayers.push(truckMarker);
          
          let step = 0;
          routeAnimationInterval = setInterval(() => {
            if (step >= coordinates.length) {
              step = 0;
            }
            truckMarker.setLatLng(coordinates[step]);
            step++;
          }, 80);
          
          detailsMap.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        }
      } catch (err) {
        console.warn('OSRM routing failed, drawing straight line fallback:', err);
        
        // Fallback: draw direct line
        const fallbackLine = L.polyline([pickupCoords, deliveryCoords], {
          color: 'var(--accent-shipper)',
          weight: 5,
          dashArray: '10, 10'
        }).addTo(detailsMap);
        mapLayers.push(fallbackLine);
        
        // Calculate distance
        const R = 3958.8; // Earth radius in miles
        const dLat = (deliveryCoords[0] - pickupCoords[0]) * Math.PI / 180;
        const dLon = (deliveryCoords[1] - pickupCoords[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pickupCoords[0] * Math.PI / 180) * Math.cos(deliveryCoords[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceMiles = R * c;
        const drivingHours = distanceMiles / 55;
        const hours = Math.floor(drivingHours);
        const minutes = Math.round((drivingHours - hours) * 60);
        
        document.getElementById('route-metrics-card').classList.remove('d-none');
        document.getElementById('route-metric-distance').textContent = `${distanceMiles.toFixed(1)} mi (est.)`;
        document.getElementById('route-metric-duration').textContent = `${hours > 0 ? hours + ' hr ' : ''}${minutes} min`;
        
        detailsMap.fitBounds(fallbackLine.getBounds(), { padding: [50, 50] });
      }
    } catch (e) {
      console.error('Leaflet map rendering failed', e);
    }
  }, 250);
}

// --- BID MODAL SHOW ---
function openBidModal(shipment) {
  elements.bidShipmentId.value = shipment.id;
  elements.bidModalOrigin.textContent = shipment.origin;
  elements.bidModalDestination.textContent = shipment.destination;
  elements.bidModalCargoSpec.textContent = `${shipment.cargoType} | ${shipment.weight ? `${shipment.weight.toLocaleString()} lbs | ` : ''}Budget: $${shipment.budget.toLocaleString()}`;
  
  // Seed default bid data
  elements.bidAmount.value = shipment.budget - 150; // suggest slightly below budget
  elements.bidDeliveryDate.value = shipment.pickupDate; // default to pickup date or day after
  
  const pickupInput = document.getElementById('bid-pickup-date');
  if (pickupInput) {
    pickupInput.value = shipment.pickupDate;
  }
  
  const ackCheckbox = document.getElementById('bid-acknowledgement-checkbox');
  if (ackCheckbox) {
    ackCheckbox.checked = false;
  }
  
  elements.bidMessage.value = '';
  elements.bidError.classList.add('d-none');
  
  // Populate carrier stats
  const carrier = Store.getCurrentUser();
  if (carrier) {
    const meta = getCarrierMetadata(carrier.id);
    const statsContainer = document.getElementById('bid-carrier-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div>Rating: <strong style="color: #f59e0b;">${meta.rating} ${meta.stars}</strong></div>
        <div>Completed Jobs: <strong>${meta.jobsCompleted}</strong></div>
        <div>Response Time: <strong>${meta.responseTime}</strong></div>
        <div>Verification: <strong style="color: #22c55e;">✓ Verified Badge</strong></div>
      `;
    }
  }
  
  elements.bidModal.classList.add('active');
}

// --- SHIPPER DASHBOARD RENDER ---
function renderShipperDashboard() {
  const shipper = Store.getCurrentUser();
  if (!shipper || shipper.role !== 'shipper') return;
  
  // Refresh default date on create post form to today + 3 days
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  document.getElementById('ship-pickup').value = inThreeDays.toISOString().split('T')[0];
  
  let shipments = Store.getShipments().filter(s => s.shipperId === shipper.id);
  
  // Apply visual status filter
  if (shipperFilter !== 'all') {
    if (shipperFilter === 'open') {
      shipments = shipments.filter(s => s.status === 'open' || s.status === 'bidding' || s.status === 'negotiating');
    } else {
      shipments = shipments.filter(s => s.status === shipperFilter);
    }
  }
  
  elements.shipperBoardList.innerHTML = '';
  
  if (shipments.length === 0) {
    elements.shipperBoardList.innerHTML = `
      <div class="card text-center" style="padding: 40px; color: var(--text-muted);">
        <p>No shipments found. Use the sidebar to post your first shipment.</p>
      </div>
    `;
    return;
  }
  
  shipments.forEach(shipment => {
    const bids = Store.getBidsForShipment(shipment.id);
    const hasBids = bids.length > 0;
    
    const card = document.createElement('div');
    card.className = 'card shipment-card shipper-accent';
    
    let bidsInboxHtml = '';
    const preAward = shipment.status === 'open' || shipment.status === 'bidding' || shipment.status === 'negotiating';
    if (preAward) {
      bidsInboxHtml = `
        <div class="bids-inbox">
          <div class="bids-inbox-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Bids Received (${bids.length})</span>
            ${hasBids ? `<span style="font-size: 11px; background: rgba(24, 160, 240, 0.15); color: var(--accent-shipper); padding: 2px 6px; border-radius: 4px; font-weight: 700; cursor: pointer;" class="btn-manage-offers" data-shipment-id="${shipment.id}">Manage Bids</span>` : ''}
          </div>
          ${hasBids ? `
            <div class="bids-list" style="max-height: 150px; overflow-y: auto; margin-top: 8px;">
              ${bids.map(bid => `
                <div class="bid-item" data-bid-id="${bid.id}" style="padding: 8px; border-bottom: 1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="font-size: 13px;">Verified ${bid.carrierName.replace('Carrier ', 'Hauler ')}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">Delivery: ${bid.deliveryDate}</div>
                  </div>
                  <div style="text-align: right; display:flex; gap: 8px; align-items:center;">
                    <strong style="color: var(--accent-carrier); font-size: 14px;">$${bid.amount.toLocaleString()}</strong>
                    <button class="btn btn-outline btn-sm btn-dashboard-chat" data-bid-id="${bid.id}" style="padding: 4px 8px; font-size: 11px;">💬 Chat</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-muted); font-size: 13px; font-style: italic; margin-top: 8px;">Awaiting bids from carriers...</p>
          `}
        </div>
      `;
    } else if (shipment.status === 'awarded' || shipment.status === 'picked up' || shipment.status === 'in transit') {
      const activeBid = bids.find(b => b.status === 'accepted');
      bidsInboxHtml = `
        <div class="bids-inbox" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
          <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Assigned Hauler</span>
          <div class="flex-space-between" style="margin-top: 8px;">
            <div>
              <strong style="font-size: 15px; color: var(--text-main);">${shipment.carrierName || 'Carrier'}</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Expected Delivery Date: ${activeBid ? activeBid.deliveryDate : 'TBD'}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: var(--text-muted); display: block;">Agreed Price</span>
              <strong style="color: var(--accent-carrier); font-size: 16px;">
                $${activeBid ? activeBid.amount.toLocaleString() : shipment.budget.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      `;
    } else if (shipment.status === 'delivered') {
      const activeBid = bids.find(b => b.status === 'accepted');
      bidsInboxHtml = `
        <div class="bids-inbox" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
          <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Delivery Details</span>
          <div class="flex-space-between" style="margin-top: 8px; align-items: center;">
            <div>
              <span style="color: var(--color-delivered); font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Delivered by ${shipment.carrierName}
              </span>
            </div>
            <div style="text-align: right; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
              <strong style="color: var(--text-main); font-size: 16px;">
                $${activeBid ? activeBid.amount.toLocaleString() : shipment.budget.toLocaleString()}
              </strong>
              <button class="btn btn-secondary btn-sm btn-mark-completed" data-shipment-id="${shipment.id}" style="padding: 4px 8px; font-size:11px; margin-top: 6px;">Mark Completed</button>
            </div>
          </div>
        </div>
      `;
    } else if (shipment.status === 'completed') {
      const activeBid = bids.find(b => b.status === 'accepted');
      bidsInboxHtml = `
        <div class="bids-inbox" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
          <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Completed Job</span>
          <div class="flex-space-between" style="margin-top: 8px;">
            <div>
              <span style="color: var(--text-muted); font-weight: 600; font-size: 14px;">
                🏁 Shipment completed
              </span>
            </div>
            <div style="text-align: right;">
              <strong style="color: var(--text-muted); font-size: 15px;">
                Paid: $${activeBid ? activeBid.amount.toLocaleString() : shipment.budget.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      `;
    }
    
    if (shipment.priority === 'priority') {
      card.classList.add('priority-highlight');
    }

    card.innerHTML = `
      <div class="shipment-header-click">
        <div class="shipment-header">
          <div>
            <h3 class="shipment-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${shipment.cargoType}
              <span class="role-badge shipper-role" style="font-size:11px; font-weight:600; padding: 2px 6px;">${shipment.shipmentType || 'Freight'}</span>
              <span class="priority-badge ${shipment.priority || 'flexible'}">${shipment.priority || 'flexible'}</span>
            </h3>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Posted ${new Date(shipment.createdAt).toLocaleDateString()}</div>
          </div>
          <span class="status-badge ${shipment.status.replace(' ', '-')}">${formatStatusText(shipment.status)}</span>
        </div>
        
        <div class="shipment-route">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <strong>${shipment.origin}</strong>
          <span style="margin: 0 4px; color: var(--text-muted);">➔</span>
          <strong>${shipment.destination}</strong>
        </div>
        
        <div class="shipment-details-row" style="flex-wrap: wrap;">
          <span>Weight: <strong>${shipment.weight ? `${shipment.weight.toLocaleString()} lbs` : '--'}</strong></span>
          <span>Specs: <strong>${shipment.dimensions || '--'}</strong></span>
          <span>Pickup: <strong>${shipment.pickupDate}</strong></span>
          ${shipment.deliveryDate ? `<span>Deliver: <strong>${shipment.deliveryDate}</strong></span>` : ''}
        </div>
        
        <div class="flex-space-between" style="margin-top: 12px;">
          <div>
            <span style="font-size: 11px; color: var(--text-muted); display: block; text-transform: uppercase;">Max Budget</span>
            <span class="shipment-budget">$${shipment.budget.toLocaleString()}</span>
          </div>
          <button class="btn btn-outline btn-sm btn-view-map" data-shipment-id="${shipment.id}">View Map Details</button>
        </div>
      </div>
      
      ${bidsInboxHtml}
    `;
    
    card.querySelector('.btn-view-map').addEventListener('click', (e) => {
      e.stopPropagation();
      showDetailsModal(shipment);
    });
    
    const btnManageOffers = card.querySelector('.btn-manage-offers');
    if (btnManageOffers) {
      btnManageOffers.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetailsModal(shipment);
      });
    }
    
    card.querySelectorAll('.btn-dashboard-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openNegotiationChat(e.target.getAttribute('data-bid-id'));
      });
    });
    
    card.querySelectorAll('.btn-mark-completed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sId = e.target.getAttribute('data-shipment-id');
        try {
          Store.updateShipmentStatus(sId, 'completed');
          showToast('Shipment marked completed! Payment released.');
          
          const s = Store.getShipment(sId);
          if (s && s.carrierId) {
            addNotification(s.carrierId, `Payment released: Shipment #${sId.substring(5)} marked completed`, 'shipment_completed', sId);
          }
          renderShipperDashboard();
        } catch (err) {
          alert(err.message);
        }
      });
    });
    
    elements.shipperBoardList.appendChild(card);
  });
}

// --- CARRIER DASHBOARD RENDER ---
function renderCarrierDashboard() {
  const carrier = Store.getCurrentUser();
  if (!carrier || carrier.role !== 'carrier') return;
  
  const allShipments = Store.getShipments();
  const carrierBids = Store.getBidsForCarrier(carrier.id);
  
  elements.carrierBidsList.innerHTML = '';
  if (carrierBids.length === 0) {
    elements.carrierBidsList.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; font-style: italic;">No bids submitted yet.</p>';
  } else {
    const sortedBids = [...carrierBids].reverse();
    sortedBids.forEach(bid => {
      const shipment = allShipments.find(s => s.id === bid.shipmentId);
      if (!shipment) return;
      
      const bidWidget = document.createElement('div');
      bidWidget.style.cssText = 'background: rgba(15, 23, 42, 0.4); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 13px;';
      bidWidget.innerHTML = `
        <div class="flex-space-between" style="margin-bottom: 6px;">
          <strong>${shipment.origin.split(',')[0]} ➔ ${shipment.destination.split(',')[0]}</strong>
          <span class="badge-bid-status ${bid.status}">${bid.status}</span>
        </div>
        <div class="flex-space-between" style="color: var(--text-muted); font-size: 12px; align-items: center;">
          <div>
            <span>My Offer: <strong>$${bid.amount.toLocaleString()}</strong></span><br>
            <span>Deliv: ${bid.deliveryDate}</span>
          </div>
          <button class="btn btn-outline btn-sm btn-carrier-chat" data-bid-id="${bid.id}" style="padding: 2px 6px; font-size: 11px;">💬 Chat</button>
        </div>
      `;
      bidWidget.querySelector('.btn-carrier-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        openNegotiationChat(bid.id);
      });
      elements.carrierBidsList.appendChild(bidWidget);
    });
  }
  
  elements.carrierJobsList.innerHTML = '';
  const carrierJobs = allShipments.filter(s => s.carrierId === carrier.id && s.status !== 'delivered' && s.status !== 'completed');
  
  if (carrierJobs.length === 0) {
    elements.carrierJobsList.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; font-style: italic;">No active assignments.</p>';
  } else {
    carrierJobs.forEach(job => {
      const activeBid = carrierBids.find(b => b.shipmentId === job.id && b.status === 'accepted');
      const jobWidget = document.createElement('div');
      jobWidget.className = 'card carrier-accent';
      jobWidget.style.padding = '16px';
      jobWidget.style.marginBottom = '8px';
      
      let actionBtnHtml = '';
      if (job.status === 'assigned' || job.status === 'awarded') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm btn-job-status" style="width: 100%;" data-job-id="${job.id}" data-target-status="picked up">Mark Picked Up</button>`;
      } else if (job.status === 'picked up') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm btn-job-status" style="width: 100%;" data-job-id="${job.id}" data-target-status="in transit">Depart (In Transit)</button>`;
      } else if (job.status === 'in transit' || job.status === 'in-transit') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm btn-job-status" style="width: 100%; background: linear-gradient(135deg, var(--color-delivered) 0%, hsl(142, 60%, 30%) 100%);" data-job-id="${job.id}" data-target-status="delivered">Mark Delivered</button>`;
      }
      
      jobWidget.innerHTML = `
        <div class="flex-space-between" style="margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 14px;">${job.cargoType}</span>
          <span class="status-badge ${job.status.replace(' ', '-')}">${formatStatusText(job.status)}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Origin: <strong>${job.origin}</strong></div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Dest: <strong>${job.destination}</strong></div>
        <div class="flex-space-between" style="font-size: 12px; border-top: 1px dashed var(--border-color); padding-top: 8px; flex-wrap: wrap; gap: 8px; align-items: center;">
          <span>Payout: <strong style="color: var(--accent-carrier);">$${activeBid ? activeBid.amount.toLocaleString() : job.budget.toLocaleString()}</strong></span>
          <span>Pickup: <strong>${job.pickupDate}</strong></span>
          <span>Drop-off: <strong>${activeBid ? activeBid.deliveryDate : (job.deliveryDate || 'TBD')}</strong></span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          ${activeBid ? `<button class="btn btn-outline btn-sm btn-job-chat" data-bid-id="${activeBid.id}" style="flex-grow: 1; padding: 6px 12px;">💬 Message Shipper</button>` : ''}
          ${actionBtnHtml ? `<div style="flex-grow: 1;">${actionBtnHtml}</div>` : ''}
        </div>
      `;
      
      if (activeBid) {
        jobWidget.querySelector('.btn-job-chat').addEventListener('click', (e) => {
          e.stopPropagation();
          openNegotiationChat(activeBid.id);
        });
      }
      
      const btn = jobWidget.querySelector('.btn-job-status');
      if (btn) {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.getAttribute('data-job-id');
          const targetStatus = e.target.getAttribute('data-target-status');
          try {
            Store.updateShipmentStatus(jobId, targetStatus);
            showToast(`Job status updated to: ${targetStatus}`);
            
            const jobObj = Store.getShipment(jobId);
            if (jobObj) {
              if (targetStatus === 'picked up') {
                addNotification(jobObj.shipperId, `Shipment #${jobId.replace('ship_', '')} has been picked up by carrier`, 'shipment_picked_up', jobId);
              } else if (targetStatus === 'delivered') {
                addNotification(jobObj.shipperId, `Shipment #${jobId.replace('ship_', '')} has been delivered by carrier`, 'shipment_delivered', jobId);
                
                // Trigger Shipment Delivered Email
                (function() {
                  const rawStore = JSON.parse(localStorage.getItem('movana_store_data'));
                  const shipper = rawStore.users.find(u => u.id === jobObj.shipperId);
                  if (shipper && shipper.email) {
                    const emailTemplate = EmailTemplates.shipmentDelivered(shipper.username, jobObj.cargoType);
                    sendEmail(shipper.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text, "shipmentDelivered").catch(err => {
                      console.error("Failed to send shipment delivered email:", err);
                    });
                  }
                })();
              } else if (targetStatus === 'in transit') {
                addNotification(jobObj.shipperId, `Shipment #${jobId.replace('ship_', '')} is now in transit`, 'shipment_in_transit', jobId);
              }
            }
            renderCarrierDashboard();
          } catch (err) {
            alert(err.message);
          }
        });
      }
      
      elements.carrierJobsList.appendChild(jobWidget);
    });
  }
  
  let openShipments = allShipments.filter(s => s.status === 'open' || s.status === 'bidding' || s.status === 'negotiating');
  
  const searchQuery = elements.carrierSearch.value.toLowerCase().trim();
  if (searchQuery) {
    openShipments = openShipments.filter(s => 
      s.origin.toLowerCase().includes(searchQuery) || 
      s.destination.toLowerCase().includes(searchQuery)
    );
  }
  
  const cargoFilter = elements.carrierFilterCargo.value;
  if (cargoFilter !== 'all') {
    openShipments = openShipments.filter(s => s.shipmentType === cargoFilter);
  }
  
  elements.carrierBoardList.innerHTML = '';
  
  if (openShipments.length === 0) {
    elements.carrierBoardList.innerHTML = `
      <div class="card text-center" style="padding: 40px; color: var(--text-muted);">
        <p>No open shipments fit your search parameters.</p>
      </div>
    `;
    return;
  }
  
  openShipments.forEach(shipment => {
    const myExistingBid = carrierBids.find(b => b.shipmentId === shipment.id);
    const hasMyBid = !!myExistingBid;
    
    const card = document.createElement('div');
    card.className = 'card shipment-card carrier-card carrier-accent';
    
    let bidButtonHtml = '';
    if (hasMyBid) {
      bidButtonHtml = `
        <button class="btn btn-outline btn-sm btn-place-bid" data-shipment-id="${shipment.id}">
          Update Bid ($${myExistingBid.amount})
        </button>
      `;
    } else {
      bidButtonHtml = `
        <button class="btn btn-secondary btn-sm btn-place-bid" data-shipment-id="${shipment.id}">
          Submit Bid Offer
        </button>
      `;
    }
    
    let coverImgHtml = '';
    if (shipment.coverImage) {
      coverImgHtml = `<div style="position:relative;">
        <img src="${shipment.coverImage}" class="shipment-cover-image" alt="${shipment.cargoType} cover">
        ${shipment.photoCount ? `<span style="position:absolute; top:8px; right:8px; background:rgba(15,23,42,0.85); color:white; font-size:11px; padding:3px 6px; border-radius:4px; font-weight:600; display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          ${shipment.photoCount}
        </span>` : ''}
      </div>`;
    }
    
    if (shipment.priority === 'priority') {
      card.classList.add('priority-highlight');
    } else if (shipment.priority === 'expedited') {
      card.classList.add('expedited-highlight');
    }

    card.innerHTML = `
      ${coverImgHtml}
      <div class="shipment-header">
        <div>
          <h3 class="shipment-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${shipment.cargoType}
            <span class="role-badge shipper-role" style="font-size:11px; font-weight:600; padding: 2px 6px;">${shipment.shipmentType || 'Freight'}</span>
            <span class="priority-badge ${shipment.priority || 'flexible'}">${shipment.priority || 'flexible'}</span>
          </h3>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Shipped by <strong>${shipment.shipperName}</strong></div>
        </div>
        <span class="status-badge ${shipment.status.replace(' ', '-')}">${formatStatusText(shipment.status)}</span>
      </div>
      
      <div class="shipment-route">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <strong>${shipment.origin}</strong>
        <span style="margin: 0 4px; color: var(--text-muted);">➔</span>
        <strong>${shipment.destination}</strong>
      </div>
      
      <div class="shipment-details-row" style="flex-wrap: wrap;">
        <span>Weight: <strong>${shipment.weight ? `${shipment.weight.toLocaleString()} lbs` : '--'}</strong></span>
        <span>Specs: <strong>${shipment.dimensions || '--'}</strong></span>
        <span>Pickup: <strong>${shipment.pickupDate}</strong></span>
        ${shipment.deliveryDate ? `<span>Drop-off: <strong>${shipment.deliveryDate}</strong></span>` : ''}
        <span>Distance: <strong>${shipment.routeDistance ? shipment.routeDistance + ' mi' : '--'}</strong></span>
        <span>Bids: <strong>${Store.getBidCountForShipment(shipment.id)}</strong></span>
        <span>Posted: <strong>${getPostedAge(shipment.createdAt)}</strong></span>
      </div>
      
      <div class="flex-space-between" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <div>
          <span style="font-size: 11px; color: var(--text-muted); display: block; text-transform: uppercase;">Max Budget</span>
          <span class="shipment-budget">Up to $${shipment.budget.toLocaleString()}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm btn-view-details" data-shipment-id="${shipment.id}">View Load</button>
          ${bidButtonHtml}
        </div>
      </div>
    `;
    
    // Specs button listener
    card.querySelector('.btn-view-details').addEventListener('click', (e) => {
      e.stopPropagation();
      showDetailsModal(shipment);
    });
    
    // Bid button listener
    card.querySelector('.btn-place-bid').addEventListener('click', (e) => {
      e.stopPropagation();
      openBidModal(shipment);
    });
    
    elements.carrierBoardList.appendChild(card);
  });
}

// --- LOAD BOARD VIEW CONTROLLER ---
function renderLoadBoard() {
  const shipments = Store.getShipments();
  
  // 1. Filter: Open, bidding, and negotiating shipments are visible on Load Board
  let filtered = shipments.filter(s => s.status === 'open' || s.status === 'bidding' || s.status === 'negotiating');
  
  // Keyword filter
  const keyword = document.getElementById('board-filter-keyword').value.toLowerCase().trim();
  if (keyword) {
    filtered = filtered.filter(s => 
      s.description.toLowerCase().includes(keyword) ||
      s.cargoType.toLowerCase().includes(keyword) ||
      s.origin.toLowerCase().includes(keyword) ||
      s.destination.toLowerCase().includes(keyword) ||
      (s.vehicleMake && s.vehicleMake.toLowerCase().includes(keyword)) ||
      (s.vehicleModel && s.vehicleModel.toLowerCase().includes(keyword))
    );
  }
  
  // Origin filter
  const originVal = document.getElementById('board-filter-origin').value.toLowerCase().trim();
  if (originVal) {
    filtered = filtered.filter(s => s.origin.toLowerCase().includes(originVal));
  }
  
  // Destination filter
  const destVal = document.getElementById('board-filter-destination').value.toLowerCase().trim();
  if (destVal) {
    filtered = filtered.filter(s => s.destination.toLowerCase().includes(destVal));
  }
  
  // Shipment type filter
  const cargoVal = document.getElementById('board-filter-type').value;
  if (cargoVal !== 'all') {
    filtered = filtered.filter(s => s.shipmentType === cargoVal);
  }
  
  // Weight filters
  const weightMinVal = document.getElementById('board-filter-weight-min').value;
  if (weightMinVal !== '') {
    filtered = filtered.filter(s => s.weight >= parseFloat(weightMinVal));
  }
  const weightMaxVal = document.getElementById('board-filter-weight-max').value;
  if (weightMaxVal !== '') {
    filtered = filtered.filter(s => s.weight <= parseFloat(weightMaxVal));
  }
  
  // Date filter
  const dateVal = document.getElementById('board-filter-date').value;
  if (dateVal) {
    filtered = filtered.filter(s => s.pickupDate === dateVal);
  }

  // Priority filter
  const priorityFilter = document.getElementById('board-filter-priority').value;
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(s => s.priority === priorityFilter);
  }
  
  // 2. Sort
  const sortBy = elements.boardSortBy.value;
  if (sortBy === 'newest') {
    filtered.sort((a, b) => {
      const getPriorityScore = (p) => {
        if (p === 'expedited') return 2;
        if (p === 'priority') return 1;
        return 0;
      };
      const aPri = getPriorityScore(a.priority);
      const bPri = getPriorityScore(b.priority);
      if (bPri !== aPri) return bPri - aPri;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } else if (sortBy === 'budget-high') {
    filtered.sort((a, b) => b.budget - a.budget);
  } else if (sortBy === 'budget-low') {
    filtered.sort((a, b) => a.budget - b.budget);
  } else if (sortBy === 'date-earliest') {
    filtered.sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate));
  }
  
  // 3. Paginate
  const totalCount = filtered.length;
  elements.loadboardResultsCount.textContent = `Showing ${totalCount} active load${totalCount === 1 ? '' : 's'}`;
  
  const totalPages = Math.ceil(totalCount / LOADBOARD_LIMIT);
  // Boundary check
  if (loadboardPage > totalPages && totalPages > 0) {
    loadboardPage = totalPages;
  }
  
  const startIndex = (loadboardPage - 1) * LOADBOARD_LIMIT;
  const paginated = filtered.slice(startIndex, startIndex + LOADBOARD_LIMIT);
  
  // Toggle layout containers
  if (loadboardLayout === 'table') {
    elements.loadboardTableContainer.classList.remove('d-none');
    elements.loadboardCardsContainer.classList.add('d-none');
    elements.toggleViewTable.classList.add('active');
    elements.toggleViewCard.classList.remove('active');
    renderLoadBoardTable(paginated);
  } else {
    elements.loadboardTableContainer.classList.add('d-none');
    elements.loadboardCardsContainer.classList.remove('d-none');
    elements.toggleViewTable.classList.remove('active');
    elements.toggleViewCard.classList.add('active');
    renderLoadBoardCards(paginated);
  }
  
  // Render pagination
  renderLoadBoardPagination(totalPages);
}

function getShortShipmentType(type) {
  if (!type) return 'Freight';
  if (type === 'Vehicle Transport') return 'Vehicle';
  if (type === 'Motorcycle Transport') return 'Motorcycle';
  if (type === 'Household Move') return 'Household';
  if (type === 'Heavy Equipment') return 'Equipment';
  if (type === 'Boat Transport') return 'Boat';
  if (type === 'RV Transport') return 'RV';
  return type;
}

function renderLoadBoardTable(shipments) {
  const tbody = elements.loadboardTableBody;
  tbody.innerHTML = '';
  
  if (shipments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No matching shipments found on the board.
        </td>
      </tr>
    `;
    return;
  }
  
  shipments.forEach(s => {
    const tr = document.createElement('tr');
    
    let borderLeftColor = 'hsl(200, 80%, 45%)'; // Blue for flexible
    if (s.priority === 'priority') {
      borderLeftColor = 'hsl(35, 90%, 48%)'; // Orange
    } else if (s.priority === 'expedited') {
      borderLeftColor = 'hsl(0, 90%, 48%)'; // Red
    }

    if (s.priority === 'priority') {
      tr.classList.add('priority-highlight');
    } else if (s.priority === 'expedited') {
      tr.classList.add('expedited-highlight');
    }

    tr.innerHTML = `
      <td class="col-pickup" style="border-left: 4px solid ${borderLeftColor} !important; padding-left: 16px;"><strong>${s.origin}</strong></td>
      <td class="col-delivery"><strong>${s.destination}</strong></td>
      <td class="col-distance">${s.routeDistance ? s.routeDistance + ' mi' : '--'}</td>
      <td class="col-budget">
        <div style="font-weight: 700; color: var(--accent-shipper); font-size: 15px;">$${s.budget.toLocaleString()}</div>
        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px;">Max Budget</div>
      </td>
      <td class="col-weight">${(s.weight && s.weight > 0) ? s.weight.toLocaleString() + ' lbs' : 'N/A'}</td>
      <td class="col-type"><span class="role-badge shipper-role" style="font-size:12px; font-weight: 600;">${getShortShipmentType(s.shipmentType)}</span></td>
      <td class="col-priority"><span class="priority-badge ${s.priority || 'flexible'}">${s.priority || 'flexible'}</span></td>
      <td class="col-equipment"><strong>${s.equipmentRequired || 'Dry Van'}</strong></td>
      <td class="col-bids" style="cursor: pointer;"><strong style="color: var(--accent-carrier);">${Store.getBidCountForShipment(s.id)} Bids</strong></td>
      <td class="col-posted">${getPostedAge(s.createdAt)}</td>
      <td class="col-date">${s.pickupDate}</td>
      <td class="col-status"><span class="status-badge ${s.status.replace(' ', '-')}">${formatStatusText(s.status)}</span></td>
      <td class="col-details"><button class="btn btn-outline btn-sm btn-table-details" style="padding: 6px 12px; font-size:12px;">View Load</button></td>
    `;
    
    tr.querySelector('.btn-table-details').addEventListener('click', () => {
      showDetailsModal(s);
    });
    
    tbody.appendChild(tr);
  });
  
  // Sync the column visibility with selector checkbox preferences immediately after rendering
  updateTableColumnVisibility();
}

function renderLoadBoardCards(shipments) {
  const container = elements.loadboardCardsContainer;
  container.innerHTML = '';
  
  if (shipments.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; color: var(--text-muted);">
        <p>No matching shipments found on the board.</p>
      </div>
    `;
    return;
  }
  
  shipments.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card shipment-card carrier-card carrier-accent';
    
    const user = Store.getCurrentUser();
    const bids = Store.getBidsForCarrier(user ? user.id : '');
    const myExistingBid = bids.find(b => b.shipmentId === s.id);
    const hasMyBid = !!myExistingBid;
    
    let bidButtonHtml = '';
    if (user && user.role === 'carrier') {
      if (hasMyBid) {
        bidButtonHtml = `<button class="btn btn-outline btn-sm btn-place-bid" data-shipment-id="${s.id}">Update Bid ($${myExistingBid.amount})</button>`;
      } else {
        bidButtonHtml = `<button class="btn btn-secondary btn-sm btn-place-bid" data-shipment-id="${s.id}">Submit Bid</button>`;
      }
    } else {
      bidButtonHtml = `<button class="btn btn-primary btn-sm btn-bid-redirect">Sign In to Bid</button>`;
    }
    
    // Cover Image HTML
    let coverImgHtml = '';
    if (s.coverImage) {
      coverImgHtml = `<div style="position:relative;">
        <img src="${s.coverImage}" class="shipment-cover-image" alt="${s.cargoType} cover">
        ${s.photoCount ? `<span style="position:absolute; top:8px; right:8px; background:rgba(15,23,42,0.85); color:white; font-size:11px; padding:3px 6px; border-radius:4px; font-weight:600; display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          ${s.photoCount}
        </span>` : ''}
      </div>`;
    }
    
    if (s.priority === 'priority') {
      card.classList.add('priority-highlight');
    } else if (s.priority === 'expedited') {
      card.classList.add('expedited-highlight');
    }

    card.innerHTML = `
      ${coverImgHtml}
      <div class="shipment-header">
        <div>
          <h3 class="shipment-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${s.cargoType}
            <span class="role-badge shipper-role" style="font-size:11px; font-weight:600; padding: 2px 6px;">${s.shipmentType || 'Freight'}</span>
            <span class="priority-badge ${s.priority || 'flexible'}">${s.priority || 'flexible'}</span>
          </h3>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Shipped by <strong>${s.shipperName}</strong></div>
        </div>
        <span class="status-badge open">Open</span>
      </div>
      
      <div class="shipment-route">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <strong>${s.origin}</strong>
        <span style="margin: 0 4px; color: var(--text-muted);">➔</span>
        <strong>${s.destination}</strong>
      </div>
      
      <div class="shipment-details-row" style="flex-wrap: wrap;">
        <span>Weight: <strong>${s.weight ? `${s.weight.toLocaleString()} lbs` : '--'}</strong></span>
        <span>Specs: <strong>${s.dimensions || '--'}</strong></span>
        <span>Pickup: <strong>${s.pickupDate}</strong></span>
        ${s.deliveryDate ? `<span>Drop-off: <strong>${s.deliveryDate}</strong></span>` : ''}
        <span>Distance: <strong>${s.routeDistance ? s.routeDistance + ' mi' : '--'}</strong></span>
        <span>Bids: <strong>${Store.getBidCountForShipment(s.id)}</strong></span>
        <span>Posted: <strong>${getPostedAge(s.createdAt)}</strong></span>
      </div>
      
      <div class="flex-space-between" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <div>
          <span style="font-size: 11px; color: var(--text-muted); display: block; text-transform: uppercase;">Max Budget</span>
          <span class="shipment-budget">Up to $${s.budget.toLocaleString()}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm btn-view-details" data-shipment-id="${s.id}">View Load</button>
          ${bidButtonHtml}
        </div>
      </div>
    `;
    
    card.querySelector('.btn-view-details').addEventListener('click', () => {
      showDetailsModal(s);
    });
    
    const bidBtn = card.querySelector('.btn-place-bid');
    if (bidBtn) {
      bidBtn.addEventListener('click', () => {
        openBidModal(s);
      });
    }
    
    const redirectBtn = card.querySelector('.btn-bid-redirect');
    if (redirectBtn) {
      redirectBtn.addEventListener('click', () => {
        setAuthMode('login');
        switchView('auth');
      });
    }
    
    container.appendChild(card);
  });
}

function renderLoadBoardPagination(totalPages) {
  const container = elements.loadboardPagination;
  container.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = loadboardPage === 1;
  prevBtn.addEventListener('click', () => {
    loadboardPage--;
    renderLoadBoard();
  });
  container.appendChild(prevBtn);
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${loadboardPage === i ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      loadboardPage = i;
      renderLoadBoard();
    });
    container.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = loadboardPage === totalPages;
  nextBtn.addEventListener('click', () => {
    loadboardPage++;
    renderLoadBoard();
  });
  container.appendChild(nextBtn);
}

// --- DEDICATED INBOX REDESIGN ENGINE ---
let activeInboxBidId = null;
let currentInboxFilter = 'all';
let activeInboxTab = 'messages';

function injectInboxStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    /* Inbox View styles */
    .inbox-filter-btn {
      background: white;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-smooth);
    }
    .inbox-filter-btn:hover {
      background: #f1f5f9;
      color: var(--text-main);
    }
    .inbox-filter-btn.active {
      background: var(--accent-shipper) !important;
      border-color: var(--accent-shipper) !important;
      color: white !important;
    }
    
    /* Workspace Tabs */
    .inbox-tab-btn {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      padding: 12px 16px;
      cursor: pointer;
      transition: all var(--transition-smooth);
      white-space: nowrap;
    }
    .inbox-tab-btn:hover {
      color: var(--text-main);
    }
    .inbox-tab-btn.active {
      color: var(--accent-shipper) !important;
      border-bottom-color: var(--accent-shipper) !important;
    }
    
    /* Stepper styles */
    .timeline-stepper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      padding-left: 28px;
    }
    .timeline-stepper::before {
      content: '';
      position: absolute;
      left: 9px;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: var(--border-color);
    }
    .timeline-step {
      position: relative;
      display: flex;
      gap: 12px;
    }
    .timeline-step-bullet {
      position: absolute;
      left: -28px;
      top: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: bold;
      color: var(--text-muted);
      z-index: 1;
    }
    .timeline-step.active .timeline-step-bullet {
      border-color: var(--accent-shipper);
      background: var(--accent-shipper);
      color: white;
    }
    .timeline-step.completed .timeline-step-bullet {
      border-color: #22c55e;
      background: #22c55e;
      color: white;
    }
    .timeline-step-title {
      font-weight: 700;
      font-size: 13px;
      color: var(--text-main);
    }
    .timeline-step.active .timeline-step-title {
      color: var(--accent-shipper);
    }
    .timeline-step.completed .timeline-step-title {
      color: #15803d;
    }
    
    /* Conversation card updates */
    .inbox-conv-item {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      cursor: pointer;
      display: flex;
      gap: 12px;
      background: white;
      transition: all var(--transition-smooth);
      position: relative;
    }
    .inbox-conv-item:hover {
      border-color: #cbd5e1 !important;
      background: #f8fafc !important;
      box-shadow: var(--shadow-sm);
    }
    .inbox-conv-item.active {
      border-color: var(--accent-shipper) !important;
      background: rgba(24, 160, 240, 0.04) !important;
    }
    .inbox-conv-img-container {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      background: #e2e8f0;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .inbox-conv-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .inbox-conv-unread-count {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ef4444;
      color: white;
      border-radius: 10px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 9px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .inbox-conv-details {
      flex-grow: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .inbox-conv-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .inbox-conv-title {
      font-weight: 700;
      font-size: 13px;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .inbox-conv-time {
      font-size: 10px;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .inbox-conv-route {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .inbox-conv-partner {
      font-size: 11px;
      color: var(--text-main);
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .inbox-conv-amount {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-carrier);
      flex-shrink: 0;
    }
    .inbox-conv-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    
    /* Badges */
    .inbox-badge-status, .inbox-badge-type, .inbox-badge-priority {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .inbox-badge-status.awaiting_carrier { background: #fee2e2; color: #ef4444; }
    .inbox-badge-status.awaiting_shipper { background: #fef3c7; color: #d97706; }
    .inbox-badge-status.negotiating { background: #dbeafe; color: #2563eb; }
    .inbox-badge-status.awarded { background: #dcfce7; color: #16a34a; }
    .inbox-badge-status.closed { background: #f1f5f9; color: #64748b; }
    .inbox-badge-status.pickup_scheduled { background: #e0f2fe; color: #0369a1; }
    .inbox-badge-status.picked_up { background: #fae8ff; color: #a21caf; }
    .inbox-badge-status.in_transit { background: #dbeafe; color: #1d4ed8; }
    .inbox-badge-status.delivered { background: #dcfce7; color: #15803d; }
    .inbox-badge-status.completed { background: #f1f5f9; color: #334155; }
    
    .inbox-badge-type {
      background: #f1f5f9;
      color: var(--text-main);
    }
    
    .inbox-badge-priority.expedited { background: #fee2e2; color: #b91c1c; }
    .inbox-badge-priority.standard { background: #eff6ff; color: #1d4ed8; }
    .inbox-badge-priority.flexible { background: #ecfdf5; color: #047857; }
    
    #inbox-text-input {
      font-size: 14px;
    }
    #inbox-conversation-list::-webkit-scrollbar,
    #inbox-workspace-content::-webkit-scrollbar,
    #inbox-chat-history-container::-webkit-scrollbar {
      width: 6px;
    }
    #inbox-conversation-list::-webkit-scrollbar-thumb,
    #inbox-workspace-content::-webkit-scrollbar-thumb,
    #inbox-chat-history-container::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 3px;
    }
    
    @keyframes typing {
      0% { transform: translateY(0px); opacity: 0.4; }
      50% { transform: translateY(-4px); opacity: 1; }
      100% { transform: translateY(0px); opacity: 0.4; }
    }
    .typing-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: var(--text-muted);
      border-radius: 50%;
      margin: 0 1px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function createInboxViewDom() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  if (document.getElementById('inbox-view')) return;
  
  const inboxSec = document.createElement('section');
  inboxSec.id = 'inbox-view';
  inboxSec.className = 'dashboard-layout d-none';
  inboxSec.style.cssText = `
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 0px;
    height: calc(100vh - 100px);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    overflow: hidden;
    margin: 10px auto;
    max-width: 1540px;
  `;
  
  inboxSec.innerHTML = `
    <aside class="inbox-sidebar" style="border-right: 1px solid var(--border-color); background: #f8fafc; display: flex; flex-direction: column; height: 100%; overflow: hidden; box-sizing: border-box;">
      <div class="inbox-sidebar-header" style="padding: 16px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: var(--text-main);">Shipment Workspace</h2>
        <div class="inbox-filter-tabs" style="display: flex; flex-wrap: wrap; gap: 6px;">
          <button class="inbox-filter-btn active" data-filter="all">All</button>
          <button class="inbox-filter-btn" data-filter="unread">Unread</button>
          <button class="inbox-filter-btn" data-filter="negotiating">Negotiating</button>
          <button class="inbox-filter-btn" data-filter="awarded">Awarded</button>
          <button class="inbox-filter-btn" data-filter="completed">Completed</button>
          <button class="inbox-filter-btn" data-filter="archived">Archived</button>
        </div>
      </div>
      <div class="inbox-conv-list" id="inbox-conversation-list" style="flex-grow: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
      </div>
    </aside>
    
    <div class="inbox-pane" id="inbox-chat-pane" style="display: flex; flex-direction: column; height: 100%; background: white; min-width: 0; overflow: hidden; box-sizing: border-box;">
      <div class="inbox-pane-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px; padding: 40px;">
        <span style="font-size: 48px; margin-bottom: 12px;">💬</span>
        <p>Select a shipment workspace from the list to view details and start messaging.</p>
      </div>
    </div>

    <aside class="inbox-info-panel" id="inbox-info-panel" style="border-left: 1px solid var(--border-color); background: #f8fafc; display: flex; flex-direction: column; height: 100%; overflow-y: auto; display: none; padding: 20px; gap: 20px; box-sizing: border-box;"></aside>
  `;
  
  mainContent.appendChild(inboxSec);
  elements.inboxView = inboxSec;
  
  const filterBtns = inboxSec.querySelectorAll('.inbox-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderInboxConversationList(e.target.getAttribute('data-filter'));
    });
  });
}

function getCargoEmoji(cargoType = '') {
  const t = cargoType.toLowerCase();
  if (t.includes('vehicle') || t.includes('car')) return '🚗';
  if (t.includes('motorcycle') || t.includes('moto')) return '🏍️';
  if (t.includes('freight') || t.includes('pallet')) return '📦';
  if (t.includes('boat')) return '⛵';
  if (t.includes('rv')) return '🚐';
  if (t.includes('equipment') || t.includes('heavy')) return '🚜';
  if (t.includes('household') || t.includes('furniture')) return '🏠';
  return '📦';
}

function formatTimeElapsed(isoString) {
  if (!isoString) return 'unknown';
  const created = new Date(isoString);
  const diffMs = new Date() - created;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function getUnreadMessagesCountForUser(userId) {
  const bids = Store.getBids();
  let unreadCount = 0;
  
  const currentUser = Store.getCurrentUser();
  if (!currentUser) return 0;
  
  let relevantBids = [];
  if (currentUser.role === 'shipper') {
    const shipperShipments = Store.getShipments().filter(s => s.shipperId === currentUser.id);
    const shipmentIds = shipperShipments.map(s => s.id);
    relevantBids = bids.filter(b => shipmentIds.includes(b.shipmentId));
  } else {
    relevantBids = bids.filter(b => b.carrierId === currentUser.id);
  }
  
  const archivedBids = JSON.parse(localStorage.getItem(`movana_chat_archived_${userId}`) || '[]');
  relevantBids = relevantBids.filter(b => !archivedBids.includes(b.id));
  
  relevantBids.forEach(bid => {
    const neg = Store.getNegotiationForBid(bid.id);
    if (neg && neg.messages) {
      const lastReadTime = localStorage.getItem(`movana_chat_read_${userId}_${bid.id}`) || '1970-01-01T00:00:00.000Z';
      neg.messages.forEach(msg => {
        if (msg.senderId !== userId && msg.createdAt > lastReadTime) {
          unreadCount++;
        }
      });
    }
  });
  
  return unreadCount;
}

function getUnreadCountForConversation(userId, bidId) {
  const neg = Store.getNegotiationForBid(bidId);
  if (!neg || !neg.messages) return 0;
  const lastReadTime = localStorage.getItem(`movana_chat_read_${userId}_${bidId}`) || '1970-01-01T00:00:00.000Z';
  return neg.messages.filter(msg => msg.senderId !== userId && msg.createdAt > lastReadTime).length;
}

function markConversationAsRead(userId, bidId) {
  localStorage.setItem(`movana_chat_read_${userId}_${bidId}`, new Date().toISOString());
  updateInboxBadge();
}

function getConversationState(bid, shipment) {
  const status = shipment.status.toLowerCase();
  
  if (status === 'completed') return 'Completed';
  if (status === 'delivered') return 'Delivered';
  if (status === 'in transit') return 'In Transit';
  if (status === 'picked up') return 'Picked Up';
  if (status === 'pickup scheduled' || status === 'assigned') return 'Pickup Scheduled';
  if (status === 'awarded') return 'Awarded';
  if (bid.status === 'rejected') return 'Closed';
  
  const neg = Store.getNegotiationForBid(bid.id);
  if (neg && neg.messages && neg.messages.length > 0) {
    const lastMsg = neg.messages[neg.messages.length - 1];
    if (lastMsg.amount !== null) {
      return 'Negotiating';
    }
    if (lastMsg.senderId === bid.carrierId) {
      return 'Awaiting Shipper Response';
    } else {
      return 'Awaiting Carrier Response';
    }
  }
  
  if (shipment.status === 'negotiating') return 'Negotiating';
  return 'Awaiting Shipper Response';
}

function getShipmentStageIndex(shipment, bid) {
  const status = shipment.status.toLowerCase();
  const bids = Store.getBidsForShipment(shipment.id);
  
  if (status === 'completed') return 8;
  if (status === 'delivered') return 7;
  if (status === 'in transit') return 6;
  if (status === 'picked up') return 5;
  if (status === 'pickup scheduled' || status === 'assigned') return 4;
  if (status === 'awarded') return 3;
  if (status === 'negotiating') return 2;
  if (bids.length > 0) return 1;
  return 0;
}

function renderInboxPage() {
  createInboxViewDom();
  renderHeader();
  
  const inboxSec = document.getElementById('inbox-view');
  if (inboxSec) {
    const filterBtns = inboxSec.querySelectorAll('.inbox-filter-btn');
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter') === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  renderInboxConversationList('all');
  
  if (activeInboxBidId) {
    selectInboxConversation(activeInboxBidId);
  } else {
    const pane = document.getElementById('inbox-chat-pane');
    if (pane) {
      pane.innerHTML = `
        <div class="inbox-pane-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px; padding: 40px;">
          <span style="font-size: 48px; margin-bottom: 12px;">💬</span>
          <p>Select a shipment workspace from the list to view details and start messaging.</p>
        </div>
      `;
    }
  }
}

function renderInboxConversationList(filter = 'all') {
  currentInboxFilter = filter;
  const currentUser = Store.getCurrentUser();
  if (!currentUser) return;
  
  const convListContainer = document.getElementById('inbox-conversation-list');
  if (!convListContainer) return;
  convListContainer.innerHTML = '';
  
  const allBids = Store.getBids();
  let relevantBids = [];
  if (currentUser.role === 'shipper') {
    const shipperShipments = Store.getShipments().filter(s => s.shipperId === currentUser.id);
    const shipmentIds = shipperShipments.map(s => s.id);
    relevantBids = allBids.filter(b => shipmentIds.includes(b.shipmentId));
  } else {
    relevantBids = allBids.filter(b => b.carrierId === currentUser.id);
  }
  
  const archivedBids = JSON.parse(localStorage.getItem(`movana_chat_archived_${currentUser.id}`) || '[]');
  
  if (filter === 'archived') {
    relevantBids = relevantBids.filter(b => archivedBids.includes(b.id));
  } else {
    relevantBids = relevantBids.filter(b => !archivedBids.includes(b.id));
  }
  
  if (filter === 'unread') {
    relevantBids = relevantBids.filter(b => {
      const neg = Store.getNegotiationForBid(b.id);
      if (!neg || !neg.messages) return false;
      const lastRead = localStorage.getItem(`movana_chat_read_${currentUser.id}_${b.id}`) || '1970-01-01T00:00:00.000Z';
      return neg.messages.some(m => m.senderId !== currentUser.id && m.createdAt > lastRead);
    });
  } else if (filter === 'negotiating') {
    relevantBids = relevantBids.filter(b => {
      const shipment = Store.getShipment(b.shipmentId);
      return shipment && shipment.status === 'negotiating' && b.status !== 'rejected';
    });
  } else if (filter === 'awarded') {
    relevantBids = relevantBids.filter(b => {
      const shipment = Store.getShipment(b.shipmentId);
      return shipment && (shipment.status === 'awarded' || shipment.status === 'picked up' || shipment.status === 'in transit') && shipment.carrierId === b.carrierId;
    });
  } else if (filter === 'completed') {
    relevantBids = relevantBids.filter(b => {
      const shipment = Store.getShipment(b.shipmentId);
      return shipment && (shipment.status === 'delivered' || shipment.status === 'completed') && shipment.carrierId === b.carrierId;
    });
  }
  
  relevantBids.sort((a, b) => {
    const negA = Store.getNegotiationForBid(a.id);
    const negB = Store.getNegotiationForBid(b.id);
    const timeA = negA && negA.messages && negA.messages.length > 0 ? negA.messages[negA.messages.length - 1].createdAt : a.createdAt;
    const timeB = negB && negB.messages && negB.messages.length > 0 ? negB.messages[negB.messages.length - 1].createdAt : b.createdAt;
    return new Date(timeB) - new Date(timeA);
  });
  
  if (relevantBids.length === 0) {
    convListContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 12px; text-align: center; margin: 20px 0; font-style: italic;">No conversations.</p>`;
    return;
  }
  
  relevantBids.forEach(bid => {
    const shipment = Store.getShipment(bid.shipmentId);
    if (!shipment) return;
    
    const neg = Store.getNegotiationForBid(bid.id);
    const lastMsg = neg && neg.messages && neg.messages.length > 0 ? neg.messages[neg.messages.length - 1] : null;
    const lastMsgText = lastMsg ? (lastMsg.amount !== null ? `Counter Offer: $${lastMsg.amount}` : lastMsg.message) : (bid.message || 'No messages');
    
    const unreadCount = getUnreadCountForConversation(currentUser.id, bid.id);
    
    const partnerName = currentUser.role === 'shipper' ? 
      ((shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed') ? bid.carrierName : "Verified " + bid.carrierName) : 
      shipment.shipperName;
      
    const convState = getConversationState(bid, shipment);
    
    const coverImg = shipment.coverImage || `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#e2e8f0"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" font-size="24" text-anchor="middle">📦</text></svg>')}`;
    
    let badgeStyleClass = 'closed';
    if (convState === 'Awaiting Carrier Response') badgeStyleClass = 'awaiting_carrier';
    else if (convState === 'Awaiting Shipper Response') badgeStyleClass = 'awaiting_shipper';
    else if (convState === 'Negotiating') badgeStyleClass = 'negotiating';
    else if (convState === 'Awarded') badgeStyleClass = 'awarded';
    else if (convState === 'Pickup Scheduled') badgeStyleClass = 'pickup_scheduled';
    else if (convState === 'Picked Up') badgeStyleClass = 'picked_up';
    else if (convState === 'In Transit') badgeStyleClass = 'in_transit';
    else if (convState === 'Delivered') badgeStyleClass = 'delivered';
    else if (convState === 'Completed') badgeStyleClass = 'completed';
    
    let currentOffer = bid.amount;
    if (neg && neg.messages) {
      const counterMsgs = neg.messages.filter(m => m.amount !== null);
      if (counterMsgs.length > 0) {
        currentOffer = counterMsgs[counterMsgs.length - 1].amount;
      }
    }
    
    let shipType = 'Cargo';
    const ct = shipment.cargoType.toLowerCase();
    if (ct.includes('vehicle')) shipType = 'Vehicle';
    else if (ct.includes('freight')) shipType = 'Freight';
    else if (ct.includes('motorcycle')) shipType = 'Motorcycle';
    else if (ct.includes('boat')) shipType = 'Boat';
    else if (ct.includes('rv')) shipType = 'RV';
    else if (ct.includes('equipment')) shipType = 'Equipment';
    else if (ct.includes('household')) shipType = 'Household';
    
    const lastActiveTime = neg && neg.messages && neg.messages.length > 0 ? neg.messages[neg.messages.length - 1].createdAt : bid.createdAt;
    const timeStr = formatLastActivityTime(lastActiveTime);
    const priority = shipment.priority || 'standard';
    
    const card = document.createElement('div');
    card.className = `inbox-conv-item ${bid.id === activeInboxBidId ? 'active' : ''}`;
    
    card.innerHTML = `
      <div class="inbox-conv-img-container">
        <img src="${coverImg}" class="inbox-conv-img">
        ${unreadCount > 0 ? `<span class="inbox-conv-unread-count">${unreadCount}</span>` : ''}
      </div>
      <div class="inbox-conv-details">
        <div class="inbox-conv-row">
          <span class="inbox-conv-title">${shipment.cargoType || 'General Cargo'}</span>
          <span class="inbox-conv-time">${timeStr}</span>
        </div>
        <div class="inbox-conv-route">
          ${shipment.origin.split(',')[0]} ➔ ${shipment.destination.split(',')[0]}
        </div>
        <div class="inbox-conv-row" style="margin-top: 2px;">
          <span class="inbox-conv-partner" style="font-size: 11px; color: var(--text-muted);">${partnerName}</span>
          <span class="inbox-conv-amount" style="font-size: 12px; font-weight: 700; color: var(--accent-carrier);">$${currentOffer.toLocaleString()}</span>
        </div>
        <div class="inbox-conv-badges">
          <span class="inbox-badge-status ${badgeStyleClass}">${convState}</span>
          <span class="inbox-badge-type">${shipType}</span>
          <span class="inbox-badge-priority ${priority}">${priority.toUpperCase()}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      selectInboxConversation(bid.id);
    });
    
    convListContainer.appendChild(card);
  });
}

function selectInboxConversation(bidId) {
  activeInboxBidId = bidId;
  activeInboxTab = 'messages';
  const currentUser = Store.getCurrentUser();
  if (!currentUser) return;
  
  markConversationAsRead(currentUser.id, bidId);
  
  const items = document.querySelectorAll('.inbox-conv-item');
  items.forEach(item => {
    item.classList.remove('active');
  });
  
  renderInboxConversationList(currentInboxFilter);
  renderInboxChatPane(bidId);
}

function renderInboxChatPane(bidId) {
  const pane = document.getElementById('inbox-chat-pane');
  if (!pane) return;
  
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) {
    pane.innerHTML = `
      <div class="inbox-pane-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px; padding: 40px;">
        <span style="font-size: 48px; margin-bottom: 12px;">💬</span>
        <p>Select a shipment workspace from the list to view details and start messaging.</p>
      </div>
    `;
    
    // Hide info panel and collapse grid
    const infoPanel = document.getElementById('inbox-info-panel');
    if (infoPanel) infoPanel.style.display = 'none';
    const inboxView = document.getElementById('inbox-view');
    if (inboxView) inboxView.style.gridTemplateColumns = '320px 1fr';
    return;
  }
  
  const shipment = Store.getShipment(bid.shipmentId);
  if (!shipment) return;
  
  const isClosed = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
  const isAwarded = shipment.status === 'awarded' || shipment.status === 'picked up' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
  
  const partnerName = currentUser.role === 'shipper' ? 
    ((shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed') ? bid.carrierName : "Verified " + bid.carrierName) : 
    shipment.shipperName;
    
  const convState = getConversationState(bid, shipment);
  const archivedBids = JSON.parse(localStorage.getItem(`movana_chat_archived_${currentUser.id}`) || '[]');
  const isArchived = archivedBids.includes(bidId);
  
  const emoji = getCargoEmoji(shipment.cargoType);
  const formattedTitle = shipment.cargoType || 'General Cargo';
  const routeText = `${shipment.originStreetAddress || shipment.origin} ➔ ${shipment.destinationStreetAddress || shipment.destination}`;
  const maxBudget = `$${shipment.budget.toLocaleString()}`;
  const postedText = formatTimeElapsed(shipment.createdAt);
  
  // Format dates
  const pickupDateFormatted = shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible';
  const deliveryDateFormatted = shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible';
  
  const priorityText = shipment.priority ? shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1) : 'Standard';
  const equipmentText = shipment.equipmentRequired || 'Dry Van';
  
  const neg = Store.getNegotiationForBid(bid.id);
  let currentOffer = bid.amount;
  if (neg && neg.messages) {
    const counterMsgs = neg.messages.filter(m => m.amount !== null);
    if (counterMsgs.length > 0) {
      currentOffer = counterMsgs[counterMsgs.length - 1].amount;
    }
  }
  
  let badgeStyleClass = 'closed';
  if (convState === 'Awaiting Carrier Response') badgeStyleClass = 'awaiting_carrier';
  else if (convState === 'Awaiting Shipper Response') badgeStyleClass = 'awaiting_shipper';
  else if (convState === 'Negotiating') badgeStyleClass = 'negotiating';
  else if (convState === 'Awarded') badgeStyleClass = 'awarded';
  else if (convState === 'Pickup Scheduled') badgeStyleClass = 'pickup_scheduled';
  else if (convState === 'Picked Up') badgeStyleClass = 'picked_up';
  else if (convState === 'In Transit') badgeStyleClass = 'in_transit';
  else if (convState === 'Delivered') badgeStyleClass = 'delivered';
  else if (convState === 'Completed') badgeStyleClass = 'completed';

  pane.innerHTML = `
    <!-- 1. Shipment Workspace Header -->
    <div class="inbox-workspace-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: #f8fafc; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <span style="font-size: 28px; line-height: 1; flex-shrink: 0;">${emoji}</span>
          <div style="min-width: 0; line-height: 1.3;">
            <h3 class="inbox-shipment-title" style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;">
              ${formattedTitle}
            </h3>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <span style="color: #10b981; font-size: 10px;">●</span> ${partnerName} • <span style="color: #10b981; font-weight: 700;">Online</span>
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <span class="status-badge ${shipment.status.replace(' ', '-')}" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
            ${formatStatusText(shipment.status)}
          </span>
          <button class="btn btn-outline btn-sm" id="inbox-btn-archive" style="padding: 4px 10px; font-size: 11px;">
            ${isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button class="btn btn-outline btn-sm" id="inbox-btn-view-shipment" style="padding: 4px 10px; font-size: 11px;">
            View Shipment
          </button>
        </div>
      </div>
    </div>
    
    <!-- 2. Workspace Tab Bar -->
    <div class="inbox-workspace-tabs" style="display: flex; gap: 4px; padding: 0 20px; border-bottom: 1px solid var(--border-color); background: white; flex-shrink: 0; overflow-x: auto;">
      <button class="inbox-tab-btn ${activeInboxTab === 'messages' ? 'active' : ''}" data-tab="messages">💬 Messages</button>
      <button class="inbox-tab-btn ${activeInboxTab === 'offers' ? 'active' : ''}" data-tab="offers">💵 Offers & Counter Offers</button>
      <button class="inbox-tab-btn ${activeInboxTab === 'photos' ? 'active' : ''}" data-tab="photos">📸 Photos</button>
      <button class="inbox-tab-btn ${activeInboxTab === 'documents' ? 'active' : ''}" data-tab="documents">📄 Documents <span style="font-size: 9px; opacity: 0.6;">(Soon)</span></button>
      ${isAwarded ? `<button class="inbox-tab-btn ${activeInboxTab === 'tracking' ? 'active' : ''}" data-tab="tracking">📍 Tracking</button>` : ''}
      <button class="inbox-tab-btn ${activeInboxTab === 'timeline' ? 'active' : ''}" data-tab="timeline">📋 Timeline</button>
    </div>
    
    <!-- 3. Scrollable Workspace Content Area -->
    <div id="inbox-workspace-content" style="flex-grow: 1; overflow-y: auto; background: #f8fafc; min-height: 0; display: flex; flex-direction: column;">
    </div>
    
    <!-- 4. Privacy Violations alert bar -->
    <div id="inbox-warning-alert" class="d-none" style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 10px 20px; display: flex; gap: 8px; align-items: flex-start; color: #b45309; font-size: 12px; border-top: 1px solid #fef3c7; flex-shrink: 0;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 1px;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
      </svg>
      <div>
        <strong>Warning: Prohibited Information Blocked!</strong>
        <span id="inbox-warning-text" style="display: block; margin-top: 2px;">Sharing contact details (phone, email, MC/DOT, websites, coordinates) before award is strictly prohibited.</span>
        <span style="font-weight: 600; display: block; margin-top: 2px;">Violations: <span id="inbox-violation-count">0</span>/3</span>
      </div>
    </div>
    
    <!-- 5. Bottom Panel: Message Composer -->
    <div class="inbox-chat-input-panel" id="inbox-chat-input-panel" style="padding: 16px 20px; border-top: 1px solid var(--border-color); background: white; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
      <!-- Image attachment preview container -->
      <div id="attachment-preview-container" class="d-none" style="display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 4px; width: fit-content; max-width: 100%;">
        <img id="attachment-preview-img" src="" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); flex-shrink:0;">
        <span style="font-size: 11px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 150px;" id="attachment-preview-name">Image.png</span>
        <button type="button" id="btn-remove-attachment" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; font-weight: 700; padding: 0 4px;">&times;</button>
      </div>

      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <button class="btn btn-outline btn-sm" id="btn-inbox-attach" style="padding: 10px; height: 38px; display: flex; align-items: center; justify-content: center; opacity: 0.9; cursor: pointer;" title="Attach image">
          📎
        </button>
        <textarea id="inbox-text-input" class="form-control" placeholder="Type a message to negotiate..." style="flex-grow: 1; height: 38px; min-height: 38px; max-height: 120px; padding: 8px 12px; line-height: 1.4; resize: vertical; overflow-y: auto;" maxlength="1000"></textarea>
        <button class="btn btn-primary" id="btn-inbox-send-message" style="height: 38px; padding: 0 16px;">Send</button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span id="inbox-char-counter" style="font-size: 11px; color: var(--text-muted);">0 / 1000</span>
      </div>
    </div>
    
    <div id="inbox-closed-panel" class="d-none" style="text-align: center; padding: 16px; font-weight: 600; color: var(--text-muted); background: hsl(210, 20%, 96%); border-top: 1px solid var(--border-color); flex-shrink: 0;">
      This negotiation has been finalized.
    </div>
  `;
  
  // Render dynamic Shipment Info Panel (Right Panel)
  const infoPanel = document.getElementById('inbox-info-panel');
  if (infoPanel) {
    infoPanel.style.display = 'flex';
    document.getElementById('inbox-view').style.gridTemplateColumns = '320px 1fr 340px';
    
    const carrierUser = Store.getUsers().find(u => u.id === bid.carrierId);
    const carrierMeta = getCarrierMetadata(bid.carrierId);
    
    const isMeShipper = currentUser.role === 'shipper';
    const carrierNameDisplay = isMeShipper ? 
      (isAwarded ? bid.carrierName : "Verified Carrier") : 
      "You (Carrier)";
      
    const showCarrierCredentials = isAwarded || !isMeShipper;
    
    let specsHtml = '';
    let d = shipment.shipmentTypeDetails || {};
    if (shipment.shipmentType === 'Vehicle Transport') {
      const year = d.year || shipment.vehicleYear || '';
      const make = d.make || shipment.vehicleMake || '';
      const model = d.model || shipment.vehicleModel || '';
      const subType = d.subType || shipment.vehicleType || 'Car';
      const condition = d.condition || shipment.vehicleCondition || 'operable';
      const vin = d.vin || shipment.vehicleVin || 'N/A';
      
      specsHtml = `
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color: var(--text-muted);">Vehicle:</span> <strong>${year} ${make} ${model}</strong></div>
          <div><span style="color: var(--text-muted);">Type:</span> <strong>${subType}</strong></div>
          <div><span style="color: var(--text-muted);">Condition:</span> <strong>${condition.charAt(0).toUpperCase() + condition.slice(1)}</strong></div>
          <div><span style="color: var(--text-muted);">VIN:</span> <strong>${vin}</strong></div>
        </div>
      `;
    } else if (shipment.shipmentType === 'Freight') {
      specsHtml = `
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color: var(--text-muted);">Commodity:</span> <strong>${d.commodity || 'General Cargo'}</strong></div>
          <div><span style="color: var(--text-muted);">Pallets:</span> <strong>${d.pallets || 0}</strong></div>
          <div><span style="color: var(--text-muted);">Stackable:</span> <strong>${d.stackable ? 'Yes' : 'No'}</strong></div>
          <div><span style="color: var(--text-muted);">Hazmat:</span> <strong>${d.hazmat ? 'Yes ⚠️' : 'No'}</strong></div>
        </div>
      `;
    } else {
      specsHtml = `
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div><span style="color: var(--text-muted);">Type:</span> <strong>${shipment.shipmentType || 'General Cargo'}</strong></div>
          <div><span style="color: var(--text-muted);">Description:</span> <strong style="font-weight: 500;">${shipment.description || 'No description provided'}</strong></div>
        </div>
      `;
    }
    
    infoPanel.innerHTML = `
      <div id="info-panel-photos-section" style="display: none; flex-shrink: 0; width: 100%;"></div>
      
      ${shipment.coverImage ? `
        <div id="info-panel-cover-image" style="width: 100%; height: 140px; overflow: hidden; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: #e2e8f0; flex-shrink: 0;">
          <img src="${shipment.coverImage}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      ` : ''}

      <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <h4 style="font-size: 14px; font-weight: 800; color: var(--text-main); margin: 0 0 6px 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${shipment.cargoType || 'General Cargo'}</h4>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="status-badge ${shipment.status.replace(' ', '-')}" style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;">
            ${formatStatusText(shipment.status)}
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">${postedText}</span>
        </div>
      </div>

      <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); font-size: 12px; line-height: 1.4; flex-shrink: 0;">
        <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px;">Locations</span>
        <div style="margin-bottom: 6px; display: flex; gap: 6px; align-items: flex-start;">
          <span style="color: #10b981; font-weight: 700; font-size: 11px;">🟢</span>
          <span style="min-width: 0; word-break: break-word;">${shipment.originStreetAddress || shipment.origin}</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: flex-start;">
          <span style="color: #ef4444; font-weight: 700; font-size: 11px;">🔴</span>
          <span style="min-width: 0; word-break: break-word;">${shipment.destinationStreetAddress || shipment.destination}</span>
        </div>
      </div>

      <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex-shrink: 0;">
        <div>
          <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Pickup Date</span>
          <strong style="font-size: 12px; color: var(--text-main);">${pickupDateFormatted}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Delivery Date</span>
          <strong style="font-size: 12px; color: var(--text-main);">${deliveryDateFormatted}</strong>
        </div>
      </div>

      <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px;">Specifications</span>
        ${specsHtml}
      </div>

      <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex-shrink: 0;">
        <div>
          <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Shipper Budget</span>
          <strong style="font-size: 13px; color: var(--text-main);">$${shipment.budget.toLocaleString()}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Current Offer</span>
          <strong style="font-size: 13px; color: var(--accent-carrier);">$${currentOffer.toLocaleString()}</strong>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
        <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px;">Carrier Details</span>
        <div style="background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; box-shadow: var(--shadow-xs); display: flex; flex-direction: column; gap: 6px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--text-main); display: flex; align-items: center; justify-content: space-between;">
            <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${carrierNameDisplay}</span>
            <span style="font-size: 10px; background: rgba(34, 197, 94, 0.1); color: #16a34a; padding: 1px 6px; border-radius: 10px; font-weight: 700; flex-shrink: 0;">✓ Verified</span>
          </div>
          <div style="font-size: 12px; color: #eab308; font-weight: 600;">
            ${carrierMeta.rating} ${carrierMeta.stars} <span style="color: var(--text-muted); font-weight: 500; font-size: 11px;">(${carrierMeta.jobsCompleted} jobs)</span>
          </div>
          
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 2px;">
            <div>Response: <strong>${carrierMeta.responseTime}</strong></div>
            <div>Joined: <strong>${carrierMeta.memberSince}</strong></div>
            
            ${showCarrierCredentials ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 2px;">
                <div>MC Number: <strong>${carrierUser && carrierUser.mcNumber ? carrierUser.mcNumber : 'Pending'}</strong></div>
                <div>DOT Number: <strong>${carrierUser && carrierUser.dotNumber ? carrierUser.dotNumber : 'Pending'}</strong></div>
                <div style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Trailer: <strong>${carrierUser && carrierUser.equipmentTypes ? carrierUser.equipmentTypes.join(', ') : 'Dry Van'}</strong></div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #16a34a; background: rgba(34, 197, 94, 0.06); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid rgba(34, 197, 94, 0.15); font-weight: 600;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink: 0;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>✓ Active ($250k Cargo Insurance)</span>
        </div>
      </div>
    `;

    // Load Photos async
    Store.getShipmentPhotos(shipment.id).then(photosList => {
      const photoSection = document.getElementById('info-panel-photos-section');
      const coverImg = document.getElementById('info-panel-cover-image');
      if (photoSection && photosList && photosList.length > 0) {
        photoSection.innerHTML = `
          <span style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; flex-shrink:0;">Photos (${photosList.length})</span>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; flex-shrink: 0; margin-bottom: 8px;">
            ${photosList.slice(0, 3).map(p => `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: white; aspect-ratio: 1; cursor: pointer;" onclick="window.open('${p}', '_blank')">
                <img src="${p}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            `).join('')}
          </div>
        `;
        photoSection.style.display = 'block';
        if (coverImg) coverImg.style.display = 'none';
      }
    });
  }
  
  const viewShipment = () => {
    showDetailsModal(shipment);
  };
  
  // Safe element binding checks
  const titleEl = pane.querySelector('.inbox-shipment-title');
  if (titleEl) titleEl.onclick = viewShipment;
  
  const viewBtn = document.getElementById('inbox-btn-view-shipment');
  if (viewBtn) viewBtn.onclick = viewShipment;
  
  document.getElementById('inbox-btn-archive').onclick = () => {
    let archived = JSON.parse(localStorage.getItem(`movana_chat_archived_${currentUser.id}`) || '[]');
    if (isArchived) {
      archived = archived.filter(id => id !== bidId);
      showToast('Conversation unarchived.');
    } else {
      archived.push(bidId);
      showToast('Conversation archived.');
    }
    localStorage.setItem(`movana_chat_archived_${currentUser.id}`, JSON.stringify(archived));
    renderInboxConversationList(currentInboxFilter);
    renderInboxChatPane(bidId);
  };
  
  // Wire up tabs clicks
  const tabBtns = pane.querySelectorAll('.inbox-tab-btn');
  tabBtns.forEach(btn => {
    btn.onclick = (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeInboxTab = e.currentTarget.getAttribute('data-tab');
      renderInboxWorkspaceContent(bidId);
    };
  });
  
  // Setup violations details
  const violationCount = Store.getViolationCount(currentUser.id);
  const warningAlert = document.getElementById('inbox-warning-alert');
  if (violationCount > 0) {
    if (warningAlert) {
      warningAlert.classList.remove('d-none');
      const countEl = document.getElementById('inbox-violation-count');
      if (countEl) countEl.textContent = violationCount;
      const textEl = document.getElementById('inbox-warning-text');
      if (textEl) {
        if (violationCount >= 3) {
          textEl.textContent = "Sensitive information was detected in your message. Your account is currently FLAGGED FOR REVIEW due to repeated violations of our contact sharing policy.";
        } else {
          textEl.textContent = "Sharing contact details (phone, email, MC/DOT, websites, coordinates) before award is strictly prohibited.";
        }
      }
    }
  } else {
    if (warningAlert) warningAlert.classList.add('d-none');
  }
  
  // Hidden attachment input setup
  let fileInput = document.getElementById('chat-file-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'chat-file-input';
    fileInput.accept = 'image/*';
    fileInput.className = 'd-none';
    document.body.appendChild(fileInput);
  }
  
  let pendingAttachmentBase64 = null;
  
  const attachBtn = document.getElementById('btn-inbox-attach');
  const previewContainer = document.getElementById('attachment-preview-container');
  const previewImg = document.getElementById('attachment-preview-img');
  const previewName = document.getElementById('attachment-preview-name');
  const removeAttachBtn = document.getElementById('btn-remove-attachment');
  
  if (attachBtn) {
    attachBtn.onclick = (e) => {
      e.preventDefault();
      fileInput.click();
    };
  }
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file only.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        pendingAttachmentBase64 = event.target.result;
        if (previewImg && previewContainer && previewName) {
          previewImg.src = pendingAttachmentBase64;
          previewName.textContent = file.name;
          previewContainer.classList.remove('d-none');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (removeAttachBtn) {
    removeAttachBtn.onclick = (e) => {
      e.preventDefault();
      pendingAttachmentBase64 = null;
      fileInput.value = '';
      if (previewContainer) previewContainer.classList.add('d-none');
    };
  }
  
  // Send Handlers
  const btnSend = document.getElementById('btn-inbox-send-message');
  const textInput = document.getElementById('inbox-text-input');
  const counterEl = document.getElementById('inbox-char-counter');
  
  if (textInput && counterEl) {
    textInput.addEventListener('input', () => {
      const len = textInput.value.length;
      counterEl.textContent = `${len} / 1000`;
      if (len > 1000) {
        counterEl.style.color = '#ef4444';
      } else {
        counterEl.style.color = 'var(--text-muted)';
      }
    });
  }
  
  const handleSend = () => {
    const text = textInput.value.trim();
    if (!text && !pendingAttachmentBase64) return;
    
    const isBidRejected = bid.status === 'rejected';
    if (!isClosed && !isBidRejected && containsProhibitedInfo(text)) {
      Store.logViolation(currentUser.id, text, 'chat_message');
      
      const msg = "Sensitive information was detected in your message.\n\nFor the protection of both parties, contact information cannot be exchanged before a shipment has been awarded.\n\nRepeated violations may result in suspension of your account.";
      alert(msg);
      
      const violationCount = Store.getViolationCount(currentUser.id);
      if (warningAlert) {
        warningAlert.classList.remove('d-none');
        const countEl = document.getElementById('inbox-violation-count');
        if (countEl) countEl.textContent = violationCount;
        const textEl = document.getElementById('inbox-warning-text');
        if (textEl) {
          if (violationCount >= 3) {
            textEl.textContent = "Sensitive information was detected in your message. Your account is currently FLAGGED FOR REVIEW due to repeated violations of our contact sharing policy.";
          } else {
            textEl.textContent = "Sensitive information was detected in your message. For the protection of both parties, contact information cannot be exchanged before a shipment has been awarded. Repeated violations may result in suspension of your account.";
          }
        }
      }
      
      textInput.value = '';
      if (counterEl) counterEl.textContent = '0 / 1000';
      pendingAttachmentBase64 = null;
      fileInput.value = '';
      if (previewContainer) previewContainer.classList.add('d-none');
      return;
    }
    
    const additionalFields = {};
    if (pendingAttachmentBase64) {
      additionalFields.imageAttachment = pendingAttachmentBase64;
    }
    
    try {
      Store.addNegotiationMessage(bidId, currentUser.id, currentUser.companyName, text || "Sent an attachment", null, false, additionalFields);
      
      textInput.value = '';
      if (counterEl) counterEl.textContent = '0 / 1000';
      pendingAttachmentBase64 = null;
      fileInput.value = '';
      if (previewContainer) previewContainer.classList.add('d-none');
      
      const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
      addNotification(partnerId, `New message received regarding Shipment #${shipment.id.replace('ship_', '')}`, 'message_received', bidId);
      
      markConversationAsRead(currentUser.id, bidId);
      
      renderInboxConversationList(currentInboxFilter);
      if (activeInboxTab === 'messages') {
        renderInboxChatHistory(bidId);
      } else {
        renderInboxWorkspaceContent(bidId);
      }
    } catch (err) {
      alert(err.message);
    }
  };
  
  if (btnSend) btnSend.onclick = handleSend;
  if (textInput) {
    textInput.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  }
  
  renderInboxWorkspaceContent(bidId);
}

async function renderInboxWorkspaceContent(bidId) {
  const container = document.getElementById('inbox-workspace-content');
  if (!container) return;
  
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  const shipment = Store.getShipment(bid.shipmentId);
  if (!shipment) return;
  
  const isClosed = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
  const isBidRejected = bid.status === 'rejected';
  
  container.innerHTML = '';
  
  const composer = document.getElementById('inbox-chat-input-panel');
  const closedPanel = document.getElementById('inbox-closed-panel');
  
  if (activeInboxTab === 'messages') {
    container.innerHTML = `<div id="inbox-chat-history-container" style="display: flex; flex-direction: column; gap: 20px; overflow-y: auto; flex-grow: 1; padding: 20px;"></div>`;
    renderInboxChatHistory(bidId);
    
    if (composer && closedPanel) {
      if (isClosed || isBidRejected) {
        composer.classList.add('d-none');
        closedPanel.classList.remove('d-none');
        closedPanel.textContent = isBidRejected ? "This bid has been declined." : "This shipment has been awarded. Bidding is closed.";
      } else {
        composer.classList.remove('d-none');
        closedPanel.classList.add('d-none');
      }
    }
  } else {
    if (composer) composer.classList.remove('d-none');
    if (closedPanel) closedPanel.classList.add('d-none');
    
    if (activeInboxTab === 'offers') {
      renderOffersTab(container, bidId, shipment, currentUser);
    } else if (activeInboxTab === 'photos') {
      renderPhotosTab(container, shipment);
    } else if (activeInboxTab === 'documents') {
      renderDocumentsTab(container);
    } else if (activeInboxTab === 'tracking') {
      renderTrackingTab(container, shipment, bid);
    } else if (activeInboxTab === 'timeline') {
      renderTimelineTab(container, shipment, bid);
    }
  }
}

function renderOffersTab(container, bidId, shipment, currentUser) {
  const neg = Store.getNegotiationForBid(bidId);
  if (!neg) return;
  
  const bids = Store.getBidsForShipment(shipment.id);
  const isClosed = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
  const isBidRejected = bids.find(b => b.id === bidId)?.status === 'rejected';
  
  const counterOffers = neg.messages.filter(m => m.amount !== null && !m.isSystem);
  const latestCounter = counterOffers.length > 0 ? counterOffers[counterOffers.length - 1] : null;
  
  let activeOfferHtml = '';
  if (!isClosed && !isBidRejected) {
    const isMe = latestCounter ? latestCounter.senderId === currentUser.id : false;
    const isPending = latestCounter && (shipment.status === 'open' || shipment.status === 'bidding' || shipment.status === 'negotiating');
    
    let currentOfferAmount = latestCounter ? latestCounter.amount : bids.find(b => b.id === bidId)?.amount || 0;
    let offerProposedBy = latestCounter ? (isMe ? 'You' : (currentUser.role === 'shipper' ? 'Carrier' : 'Shipper')) : 'Carrier (Initial Bid)';
    
    activeOfferHtml = `
      <div style="background: hsl(120, 30%, 98%); border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
        <h4 style="font-size: 12px; text-transform: uppercase; color: #16a34a; font-weight: 700; letter-spacing: 0.5px; margin: 0 0 10px 0;">Active Offer</h4>
        <div style="font-size: 32px; font-weight: 800; color: #15803d; margin-bottom: 8px;">$${currentOfferAmount.toLocaleString()}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Proposed by ${offerProposedBy}</div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${(currentUser.role === 'shipper' && !isClosed) ? `
            <button class="btn btn-outline btn-sm btn-offers-decline" style="border-color: #ef4444; color: #ef4444; padding: 6px 16px;">Decline Offer</button>
            <button class="btn btn-primary btn-sm btn-offers-accept" style="background: #22c55e; border-color: #22c55e; padding: 6px 16px;">Accept Offer</button>
          ` : ''}
          ${(!isClosed && (latestCounter === null || !isMe || !isPending)) ? `
            <button class="btn btn-outline btn-sm btn-offers-counter" style="padding: 6px 16px;">Propose Counter Offer</button>
          ` : ''}
        </div>
        
        <div id="offers-counter-input-panel" class="d-none" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 10px; align-items: center;">
          <div style="position: relative; flex-grow: 1; max-width: 200px;">
            <span style="position: absolute; left: 12px; top: 8px; font-weight: 600; color: var(--text-muted); font-size: 14px;">$</span>
            <input type="number" id="offers-counter-amount" class="form-control form-control-sm" placeholder="Amount" style="padding-left: 24px;" min="1">
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-offers-submit-counter">Submit</button>
        </div>
      </div>
    `;
  }
  
  let historyHtml = `
    <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Offer History</h4>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--text-main); font-size: 13px;">$${(bids.find(b => b.id === bidId)?.amount || 0).toLocaleString()}</strong>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Initial Bid by Carrier • ${new Date(neg.createdAt || new Date()).toLocaleDateString()}</div>
        </div>
        <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; color: var(--text-muted);">
          ${isClosed && bids.find(b => b.id === bidId)?.status === 'accepted' ? 'Accepted' : 'Superseded'}
        </span>
      </div>
      
      ${counterOffers.map((co, index) => {
        const isLast = index === counterOffers.length - 1;
        const isMe = co.senderId === currentUser.id;
        const dateStr = new Date(co.createdAt).toLocaleDateString();
        const timeStr = new Date(co.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let statusText = 'Superseded';
        let statusClass = 'superseded';
        
        if (isClosed && shipment.carrierId === bids.find(b => b.id === bidId)?.carrierId && shipment.budget === co.amount) {
          statusText = 'Accepted';
          statusClass = 'accepted';
        } else if (co.isDeclined) {
          statusText = 'Declined';
          statusClass = 'declined';
        } else if (isLast && !isClosed && !isBidRejected) {
          statusText = 'Awaiting Response';
          statusClass = 'pending';
        }
        
        let badgeStyle = 'background: #e2e8f0; color: var(--text-muted);';
        if (statusClass === 'accepted') badgeStyle = 'background: #dcfce7; color: #15803d;';
        if (statusClass === 'declined') badgeStyle = 'background: #fee2e2; color: #ef4444;';
        if (statusClass === 'pending') badgeStyle = 'background: #fef3c7; color: #d97706;';
        
        return `
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; background: white; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-xs);">
            <div>
              <strong style="color: var(--text-main); font-size: 13px;">$${co.amount.toLocaleString()}</strong>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Counter proposed by ${isMe ? 'You' : (currentUser.role === 'shipper' ? 'Carrier' : 'Shipper')} • ${dateStr} ${timeStr}</div>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${badgeStyle}">
              ${statusText}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  wrapper.innerHTML = `
    ${activeOfferHtml}
    ${historyHtml}
  `;
  container.appendChild(wrapper);
  
  if (currentUser.role === 'shipper' && !isClosed) {
    const btnAccept = wrapper.querySelector('.btn-offers-accept');
    const btnDecline = wrapper.querySelector('.btn-offers-decline');
    
    if (btnAccept) btnAccept.onclick = () => confirmAcceptBid(bidId);
    if (btnDecline) {
      btnDecline.onclick = () => {
        if (latestCounter && latestCounter.senderId !== currentUser.id) {
          declineCounterOffer(bidId, latestCounter.amount);
          setTimeout(() => {
            renderInboxConversationList(currentInboxFilter);
            renderInboxWorkspaceContent(bidId);
          }, 200);
        } else {
          if (confirm('Decline this bid? This cannot be undone.')) {
            try {
              Store.rejectBid(bidId);
              showToast('Bid declined.');
              addNotification(bids.find(b => b.id === bidId).carrierId, `Your bid was declined`, 'bid_declined', shipment.id);
              renderInboxConversationList(currentInboxFilter);
              renderInboxWorkspaceContent(bidId);
            } catch (err) { alert(err.message); }
          }
        }
      };
    }
  }
  
  const btnCounter = wrapper.querySelector('.btn-offers-counter');
  if (btnCounter) {
    btnCounter.onclick = () => {
      const panel = wrapper.querySelector('#offers-counter-input-panel');
      panel.classList.toggle('d-none');
    };
  }
  
  const btnSubmitCounter = wrapper.querySelector('#btn-offers-submit-counter');
  const counterInput = wrapper.querySelector('#offers-counter-amount');
  if (btnSubmitCounter && counterInput) {
    btnSubmitCounter.onclick = () => {
      const amount = parseFloat(counterInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid counter offer amount.');
        return;
      }
      
      try {
        Store.addNegotiationMessage(bidId, currentUser.id, currentUser.companyName, `${currentUser.companyName} proposed a counter offer of $${amount.toLocaleString()}`, amount, false);
        
        if (shipment.status !== 'negotiating') {
          shipment.status = 'negotiating';
          const stored = localStorage.getItem('movana_store_data');
          if (stored) {
            const data = JSON.parse(stored);
            const s = data.shipments.find(x => x.id === shipment.id);
            if (s) {
              s.status = 'negotiating';
              localStorage.setItem('movana_store_data', JSON.stringify(data));
            }
          }
        }
        
        const partnerId = currentUser.role === 'shipper' ? bids.find(b => b.id === bidId).carrierId : shipment.shipperId;
        addNotification(partnerId, `Counter offer of $${amount.toLocaleString()} proposed on Shipment #${shipment.id.replace('ship_', '')}`, 'counter_offer_received', bidId);
        
        counterInput.value = '';
        wrapper.querySelector('#offers-counter-input-panel').classList.add('d-none');
        
        renderInboxConversationList(currentInboxFilter);
        renderInboxChatPane(bidId);
        
        renderShipperDashboard();
        renderCarrierDashboard();
        renderLoadBoard();
        
        showToast('Counter offer submitted.');
      } catch (err) {
        alert(err.message);
      }
    };
  }
}

async function renderPhotosTab(container, shipment) {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  wrapper.innerHTML = `<p style="font-size: 13px; color: var(--text-muted);">Loading photos...</p>`;
  container.appendChild(wrapper);
  
  let photos = [];
  try {
    photos = await Store.getShipmentPhotos(shipment.id);
  } catch (err) {
    console.error(err);
  }
  
  if (photos.length === 0 && shipment.coverImage) {
    photos = [shipment.coverImage];
  }
  
  wrapper.innerHTML = '';
  if (photos.length > 0) {
    wrapper.innerHTML = `
      <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">Shipment Photos</h4>
      <div class="inbox-photos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;">
        ${photos.map((p, index) => `
          <div class="inbox-photo-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; background: white; box-shadow: var(--shadow-sm); cursor: pointer; aspect-ratio: 1;" onclick="window.open('${p}', '_blank')">
            <img src="${p}" style="width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-smooth);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          </div>
        `).join('')}
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <span style="font-size: 48px; display: block; margin-bottom: 12px;">📸</span>
        <p>No photos uploaded for this shipment.</p>
      </div>
    `;
  }
}

function renderDocumentsTab(container) {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  wrapper.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted); max-width: 500px; margin: 20px auto;">
      <span style="font-size: 48px; display: block; margin-bottom: 16px;">📄</span>
      <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Document Management (Coming Soon)</h3>
      <p style="font-size: 13px; line-height: 1.5; color: var(--text-muted); margin-bottom: 20px;">
        Soon you will be able to upload and sign Bill of Lading (BOL), Proof of Delivery (POD), and Carrier Agreements directly inside this workspace.
      </p>
      <div style="text-align: left; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 12px; display: flex; justify-content: space-between; color: var(--text-main); opacity: 0.7;">
          <span>📄 Bill of Lading (BOL)</span> <span style="font-size: 10px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Pending</span>
        </div>
        <div style="font-size: 12px; display: flex; justify-content: space-between; color: var(--text-main); opacity: 0.7;">
          <span>📄 Proof of Delivery (POD)</span> <span style="font-size: 10px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Pending</span>
        </div>
        <div style="font-size: 12px; display: flex; justify-content: space-between; color: var(--text-main); opacity: 0.7;">
          <span>📄 Cargo Insurance Cert</span> <span style="font-size: 10px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Pending</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(wrapper);
}

let inboxTrackingMap = null;
let inboxTrackingMapLayers = [];

function renderTrackingTab(container, shipment, bid) {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  
  const originCity = shipment.originCity || shipment.origin.split(',')[0];
  const destinationCity = shipment.destinationCity || shipment.destination.split(',')[0];
  
  wrapper.innerHTML = `
    <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">Shipment Tracking</h4>
    
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px;">Assigned Carrier</span>
          <strong style="font-size: 13px; color: var(--text-main);">${shipment.carrierName || 'Verified Carrier'}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px;">Current Status</span>
          <span class="status-badge ${shipment.status.replace(' ', '-')}" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; display: inline-block;">
            ${formatStatusText(shipment.status)}
          </span>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 11px; display: block; margin-bottom: 2px;">Transit Route</span>
          <strong style="font-size: 13px; color: var(--text-main);">${originCity} ➔ ${destinationCity}</strong>
        </div>
      </div>
      
      <div id="inbox-tracking-map" style="width: 100%; height: 350px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: #e2e8f0; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-muted); font-size: 13px;">
          Initializing map...
        </div>
      </div>
    </div>
  `;
  container.appendChild(wrapper);
  
  setTimeout(() => {
    const mapContainer = document.getElementById('inbox-tracking-map');
    if (!mapContainer) return;
    
    try {
      if (inboxTrackingMap) {
        inboxTrackingMap.remove();
        inboxTrackingMap = null;
      }
      
      inboxTrackingMap = L.map('inbox-tracking-map', {
        zoomControl: true,
        scrollWheelZoom: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(inboxTrackingMap);
      
      inboxTrackingMapLayers = [];
      
      const pickupCoords = getCoordinates(shipment.originLat, shipment.originLon, shipment.origin);
      const deliveryCoords = getCoordinates(shipment.destinationLat, shipment.destinationLon, shipment.destination);
      
      const pickupMarker = L.marker(pickupCoords, {
        icon: L.divIcon({
          html: `<div style="background: var(--accent-shipper); color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-sm); font-size: 11px;">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(inboxTrackingMap).bindPopup(`<strong>Pickup:</strong> ${shipment.originStreetAddress || shipment.origin}`);
      
      const deliveryMarker = L.marker(deliveryCoords, {
        icon: L.divIcon({
          html: `<div style="background: var(--accent-carrier); color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-sm); font-size: 11px;">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(inboxTrackingMap).bindPopup(`<strong>Delivery:</strong> ${shipment.destinationStreetAddress || shipment.destination}`);
      
      inboxTrackingMapLayers.push(pickupMarker, deliveryMarker);
      
      const polyline = L.polyline([pickupCoords, deliveryCoords], {
        color: 'var(--accent-shipper)',
        weight: 4,
        dashArray: '5, 8'
      }).addTo(inboxTrackingMap);
      inboxTrackingMapLayers.push(polyline);
      
      const bounds = L.latLngBounds([pickupCoords, deliveryCoords]);
      inboxTrackingMap.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      console.error('Failed to render inbox tracking map', e);
      mapContainer.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">
          Failed to load interactive map coordinates.
        </div>
      `;
    }
  }, 100);
}

function getShipmentHistory(shipment, bid) {
  // If it already has history, return it
  if (shipment.history && shipment.history.length > 0) {
    return shipment.history;
  }
  
  // Otherwise, construct a mock historical sequence based on its current status
  const history = [
    {
      event: 'created',
      label: 'Shipment Created',
      desc: `Shipment listed on the marketplace with a budget of $${shipment.budget.toLocaleString()}.`,
      timestamp: shipment.createdAt || new Date(Date.now() - 5*24*3600*1000).toISOString()
    }
  ];
  
  const createdTime = new Date(shipment.createdAt || Date.now() - 5*24*3600*1000);
  
  if (bid) {
    history.push({
      event: 'bid_submitted',
      label: 'Carrier Bid Submitted',
      desc: `Carrier proposed initial bid of $${bid.amount.toLocaleString()}.`,
      timestamp: new Date(createdTime.getTime() + 1*3600*1000).toISOString()
    });
  }
  
  const status = shipment.status.toLowerCase();
  
  if (status === 'negotiating' && bid) {
    history.push({
      event: 'counter_offer',
      label: 'Counter Offer Proposed',
      desc: `Shipper and Carrier started active pricing negotiations.`,
      timestamp: new Date(createdTime.getTime() + 2*3600*1000).toISOString()
    });
  }
  
  if (['awarded', 'assigned', 'picked up', 'in transit', 'delivered', 'completed'].includes(status) && bid) {
    history.push({
      event: 'accepted',
      label: 'Offer Accepted / Awarded',
      desc: `Offer accepted by Shipper. Shipment awarded to ${shipment.carrierName || bid.carrierName} for $${bid.amount.toLocaleString()}.`,
      timestamp: new Date(createdTime.getTime() + 6*3600*1000).toISOString()
    });
  }
  
  if (['assigned', 'picked up', 'in transit', 'delivered', 'completed'].includes(status) && bid) {
    history.push({
      event: 'assigned',
      label: 'Pickup Scheduled',
      desc: `Carrier scheduled cargo pickup date with Shipper.`,
      timestamp: new Date(createdTime.getTime() + 12*3600*1000).toISOString()
    });
  }
  
  if (['picked up', 'in transit', 'delivered', 'completed'].includes(status) && bid) {
    history.push({
      event: 'picked up',
      label: 'Cargo Picked Up',
      desc: `Cargo loaded onto carrier transport vehicle.`,
      timestamp: new Date(createdTime.getTime() + 24*3600*1000).toISOString()
    });
  }
  
  if (['in transit', 'delivered', 'completed'].includes(status) && bid) {
    history.push({
      event: 'in transit',
      label: 'Departed (In Transit)',
      desc: `Carrier departed and is now in transit to destination.`,
      timestamp: new Date(createdTime.getTime() + 26*3600*1000).toISOString()
    });
  }
  
  if (['delivered', 'completed'].includes(status) && bid) {
    history.push({
      event: 'delivered',
      label: 'Cargo Delivered',
      desc: `Cargo reached destination and unloaded.`,
      timestamp: new Date(createdTime.getTime() + 48*3600*1000).toISOString()
    });
  }
  
  if (status === 'completed' && bid) {
    history.push({
      event: 'completed',
      label: 'Shipment Completed',
      desc: `Shipper confirmed delivery completion, releasing payout funds.`,
      timestamp: new Date(createdTime.getTime() + 50*3600*1000).toISOString()
    });
  }
  
  return history;
}

function renderTimelineTab(container, shipment, bid) {
  const stageIndex = getShipmentStageIndex(shipment, bid);
  const stages = [
    { id: 'posted', title: 'Shipment Posted', desc: `Shipment listed on the marketplace with a budget of $${shipment.budget.toLocaleString()}.` },
    { id: 'bids', title: 'Bids Received', desc: 'Carriers submitted transport bid offers for shipper review.' },
    { id: 'negotiating', title: 'Negotiation Active', desc: 'Shipper and Carrier currently discussing offer details.' },
    { id: 'awarded', title: 'Shipment Awarded', desc: 'Shipper accepted bid offer, unlocking coordination contact details.' },
    { id: 'assigned', title: 'Pickup Scheduled', desc: 'Carrier scheduled cargo pickup date with shipper.' },
    { id: 'picked_up', title: 'Cargo Picked Up', desc: 'Cargo loaded onto carrier transport vehicle.' },
    { id: 'in_transit', title: 'In Transit', desc: 'Carrier transporting cargo to delivery destination.' },
    { id: 'delivered', title: 'Cargo Delivered', desc: 'Cargo reached destination and unloaded.' },
    { id: 'completed', title: 'Shipment Completed', desc: 'Shipper confirmed delivery completion, releasing payout funds.' }
  ];
  
  const history = getShipmentHistory(shipment, bid);
  
  const wrapper = document.createElement('div');
  wrapper.style.padding = '24px';
  wrapper.style.boxSizing = 'border-box';
  wrapper.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1100px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Stepper Panel -->
      <div style="background: white; border-radius: var(--radius-md); border: 1px solid var(--border-color); padding: 24px; box-shadow: var(--shadow-xs); box-sizing: border-box;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-top: 0;">Milestone Progress</h3>
        <div class="timeline-stepper">
          ${stages.map((stg, idx) => {
            const isActive = idx === stageIndex;
            const isCompleted = idx < stageIndex;
            let stepClass = '';
            if (isActive) stepClass = 'active';
            else if (isCompleted) stepClass = 'completed';
            
            return `
              <div class="timeline-step ${stepClass}">
                <div class="timeline-step-bullet" style="flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${isCompleted ? '✓' : idx + 1}</div>
                 <div style="min-width: 0;">
                   <div class="timeline-step-title" style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">${stg.title}</div>
                   <div class="timeline-step-desc" style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">${stg.desc}</div>
                 </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Activity Log Panel -->
      <div style="background: white; border-radius: var(--radius-md); border: 1px solid var(--border-color); padding: 24px; box-shadow: var(--shadow-xs); box-sizing: border-box; display: flex; flex-direction: column;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-top: 0;">Activity Log History</h3>
        
        <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex-grow: 1; max-height: 520px; padding-right: 6px;">
          ${history.slice().reverse().map((evt) => {
            const dateObj = new Date(evt.timestamp);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            
            return `
              <div style="display: flex; gap: 12px; align-items: flex-start; font-size: 12px; border-bottom: 1px dashed var(--border-color); padding-bottom: 12px;">
                <div style="background: #f1f5f9; color: var(--text-main); font-weight: 700; padding: 4px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase; white-space: nowrap; text-align: center; flex-shrink: 0; min-width: 70px;">
                  ${evt.event.replace('_', ' ')}
                </div>
                <div style="min-width: 0; flex-grow: 1;">
                  <div style="font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${evt.label}</div>
                  <div style="color: var(--text-muted); line-height: 1.3;">${evt.desc}</div>
                  <div style="font-size: 9px; color: var(--text-muted); margin-top: 4px; font-weight: 600;">${dateStr} at ${timeStr}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
    </div>
  `;
  container.appendChild(wrapper);
}

function renderInboxChatHistory(bidId) {
  const container = document.getElementById('inbox-chat-history-container');
  if (!container) return;
  
  const currentUser = Store.getCurrentUser();
  const bid = Store.getBids().find(b => b.id === bidId);
  if (!bid) return;
  const shipment = Store.getShipment(bid.shipmentId);
  const neg = Store.getNegotiationForBid(bidId);
  if (!neg) return;
  
  container.innerHTML = '';
  
  let lastCounterMsgIndex = -1;
  for (let i = neg.messages.length - 1; i >= 0; i--) {
    if (neg.messages[i].amount !== null) {
      lastCounterMsgIndex = i;
      break;
    }
  }
  
  const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
  const partnerLastRead = localStorage.getItem(`movana_chat_read_${partnerId}_${bidId}`) || '1970-01-01T00:00:00.000Z';
  
  neg.messages.forEach((msg, index) => {
    const isMe = msg.senderId === currentUser.id;
    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    let readStatusHtml = '';
    if (isMe && msg.amount === null && !msg.isSystem) {
      const isRead = msg.createdAt <= partnerLastRead;
      readStatusHtml = `<span style="margin-left: 6px; color: ${isRead ? 'var(--color-delivered)' : '#94a3b8'}; font-weight: 600;">${isRead ? '✓ Read' : '✓ Delivered'}</span>`;
    }
    
    if (msg.amount !== null) {
      const isLastCounter = index === lastCounterMsgIndex;
      const isPending = isLastCounter && (shipment.status === 'open' || shipment.status === 'bidding' || shipment.status === 'negotiating');
      const showButtons = isPending && !isMe;
      
      const cardDiv = document.createElement('div');
      cardDiv.className = 'inbox-chat-counter-card';
      cardDiv.style.cssText = `
        align-self: center;
        background: white;
        border: 1.5px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 16px;
        width: 85%;
        max-width: 380px;
        box-shadow: var(--shadow-sm);
        margin: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        text-align: left;
      `;
      
      const pickupDateStr = msg.pickupDate ? new Date(msg.pickupDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : (shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible');
      const deliveryDateStr = msg.deliveryDate ? new Date(msg.deliveryDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : (shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible');
      const trailerType = msg.trailerType || shipment.equipmentRequired || 'Dry Van';
      const notes = msg.notes || '';
      
      cardDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <span style="font-weight: 700; color: var(--text-main); font-size: 13px;">Proposed Offer</span>
          <span style="font-size: 10px; font-weight: 700; background: hsl(120, 20%, 94%); color: #16a34a; padding: 2px 8px; border-radius: 20px;">Offer</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 28px; font-weight: 800; color: var(--accent-carrier);">$${msg.amount.toLocaleString()}</span>
          <span style="font-size: 11px; color: var(--text-muted);">Trailer: <strong>${trailerType}</strong></span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: var(--text-main);">
          <div>
            <span style="display: block; font-size: 10px; color: var(--text-muted);">Est. Pickup</span>
            <strong>${pickupDateStr}</strong>
          </div>
          <div>
            <span style="display: block; font-size: 10px; color: var(--text-muted);">Est. Delivery</span>
            <strong>${deliveryDateStr}</strong>
          </div>
        </div>
        
        ${notes ? `
          <div style="font-size: 11px; font-style: italic; background: #f8fafc; padding: 8px; border-radius: 4px; border-left: 3px solid var(--border-color);">
            "${notes}"
          </div>
        ` : ''}
        
        <div style="font-size: 11px; color: var(--text-muted);">
          By ${isMe ? 'You' : (currentUser.role === 'shipper' ? 'Carrier' : 'Shipper')} • ${dateStr} ${timeStr}
        </div>
        
        ${showButtons ? `
          <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">
            <button class="btn btn-outline btn-sm btn-offer-decline" style="flex: 1; padding: 6px; font-size: 11px; border-color: #ef4444; color: #ef4444; background: white;">Decline</button>
            <button class="btn btn-outline btn-sm btn-offer-counter" style="flex: 1; padding: 6px; font-size: 11px; background: white;">Counter</button>
            <button class="btn btn-primary btn-sm btn-offer-accept" style="flex: 1; padding: 6px; font-size: 11px; background: #22c55e; border-color: #22c55e; color: white;">Accept</button>
          </div>
        ` : `
          <div style="border-top: 1px solid var(--border-color); padding-top: 8px; font-size: 12px; font-weight: 600; text-align: center; color: ${isPending ? '#d97706' : (bid.amount === msg.amount && shipment.carrierId === bid.carrierId ? '#16a34a' : '#94a3b8')};">
            ${isPending ? 'Awaiting Response' : (bid.amount === msg.amount && shipment.carrierId === bid.carrierId ? '✓ Accepted' : '❌ Superseded / Declined')}
          </div>
        `}
      `;
      
      if (showButtons) {
        cardDiv.querySelector('.btn-offer-accept').onclick = () => {
          acceptCounterOffer(bidId, msg.amount);
          setTimeout(() => {
            renderInboxConversationList(currentInboxFilter);
            renderInboxWorkspaceContent(bidId);
          }, 200);
        };
        cardDiv.querySelector('.btn-offer-decline').onclick = () => {
          declineCounterOffer(bidId, msg.amount);
          setTimeout(() => {
            renderInboxConversationList(currentInboxFilter);
            renderInboxWorkspaceContent(bidId);
          }, 200);
        };
        cardDiv.querySelector('.btn-offer-counter').onclick = () => {
          openCounterOfferModal(bidId);
        };
      }
      
      container.appendChild(cardDiv);
    } else if (msg.isSystem) {
      const sysDiv = document.createElement('div');
      sysDiv.className = 'inbox-chat-system';
      sysDiv.style.cssText = `
        align-self: center;
        background: #f1f5f9;
        border-radius: var(--radius-sm);
        padding: 4px 12px;
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 500;
        text-align: center;
        max-width: 90%;
        margin: 4px 0;
      `;
      sysDiv.textContent = `${msg.message} • ${dateStr} ${timeStr}`;
      container.appendChild(sysDiv);
    } else {
      const bubble = document.createElement('div');
      bubble.className = `inbox-chat-bubble ${isMe ? 'me' : 'partner'}`;
      bubble.style.cssText = `
        display: flex;
        flex-direction: column;
        max-width: 70%;
        align-self: ${isMe ? 'flex-end' : 'flex-start'};
      `;
      
      bubble.innerHTML = `
        <div class="inbox-chat-bubble-sender" style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 3px; padding: 0 4px; text-align: ${isMe ? 'right' : 'left'};">
          ${isMe ? 'You' : msg.senderName}
        </div>
        <div class="inbox-chat-bubble-content" style="padding: 12px 16px; border-radius: 18px; font-size: 15px; line-height: 1.5; word-break: break-word; box-shadow: var(--shadow-sm); background: ${isMe ? 'var(--accent-shipper)' : 'white'}; color: ${isMe ? 'white' : 'var(--text-main)'}; border-bottom-right-radius: ${isMe ? '4px' : '18px'}; border-bottom-left-radius: ${isMe ? '18px' : '4px'}; ${!isMe ? 'border: 1px solid var(--border-color);' : ''}">
          ${msg.imageAttachment ? `
            <div style="margin-bottom: 8px; border-radius: 8px; overflow: hidden; max-width: 100%; border: 1px solid var(--border-color);">
              <img src="${msg.imageAttachment}" style="width: 100%; height: auto; max-height: 200px; object-fit: contain; cursor: pointer;" onclick="window.open('${msg.imageAttachment}', '_blank')">
            </div>
          ` : ''}
          ${escapeHtml(msg.message)}
        </div>
        <div class="inbox-chat-bubble-meta" style="font-size: 10px; color: var(--text-muted); margin-top: 4px; padding: 0 4px; display: flex; align-items: center; gap: 4px; justify-content: ${isMe ? 'flex-end' : 'flex-start'};">
          <span>${dateStr} ${timeStr}</span>
          ${readStatusHtml}
        </div>
      `;
      container.appendChild(bubble);
    }
  });
  
  // Append simulated typing indicator if appropriate
  if (shipment.status === 'negotiating' && !isClosed) {
    const typingDiv = document.createElement('div');
    typingDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      width: fit-content;
      margin: 8px 0;
      font-size: 11px;
      color: var(--text-muted);
      align-self: flex-start;
      box-shadow: var(--shadow-sm);
    `;
    typingDiv.innerHTML = `
      <span class="typing-dot" style="animation: typing 1s infinite 0s;"></span>
      <span class="typing-dot" style="animation: typing 1s infinite 0.2s;"></span>
      <span class="typing-dot" style="animation: typing 1s infinite 0.4s;"></span>
      <span style="margin-left: 4px; font-weight: 500;">${partnerName} is typing...</span>
    `;
    container.appendChild(typingDiv);
  }
  
  container.scrollTop = container.scrollHeight;
}

function updateInboxBadge() {
  const currentUser = Store.getCurrentUser();
  if (!currentUser) return;
  
  const navInbox = document.getElementById('nav-btn-inbox');
  if (!navInbox) return;
  
  const count = getUnreadMessagesCountForUser(currentUser.id);
  let badge = navInbox.querySelector('.inbox-unread-badge');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'inbox-unread-badge';
      badge.style.cssText = 'background: #ef4444; color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 6px; vertical-align: middle;';
      navInbox.appendChild(badge);
    }
    badge.textContent = count;
  } else if (badge) {
    badge.remove();
  }
}

// --- SETUP NEGOTIATION CHAT MODAL EVENTS ---
function setupNegotiationModalEvents() {
  const btnSend = document.getElementById('btn-neg-send-message');
  const textInput = document.getElementById('neg-text-input');
  
  if (btnSend && textInput) {
    const handleSend = () => {
      if (!activeChatBidId) return;
      const text = textInput.value.trim();
      if (!text) return;
      
      const currentUser = Store.getCurrentUser();
      if (!currentUser) return;
      const bid = Store.getBids().find(b => b.id === activeChatBidId);
      if (!bid) return;
      const shipment = Store.getShipment(bid.shipmentId);
      if (!shipment) return;
      
      // Before a shipment is awarded, apply message filters
      const isClosed = shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed';
      if (!isClosed && containsProhibitedInfo(text)) {
        Store.logViolation(currentUser.id, text, 'chat_message');
        
        const msg = "Sensitive information was detected in your message.\n\nFor the protection of both parties, contact information cannot be exchanged before a shipment has been awarded.\n\nRepeated violations may result in suspension of your account.";
        alert(msg);
        
        const violationCount = Store.getViolationCount(currentUser.id);
        const warningAlert = document.getElementById('neg-warning-alert');
        if (warningAlert) {
          warningAlert.classList.remove('d-none');
          const countEl = document.getElementById('neg-violation-count');
          if (countEl) countEl.textContent = violationCount;
          const textEl = document.getElementById('neg-warning-text');
          if (textEl) {
            if (violationCount >= 3) {
              textEl.textContent = "Sensitive information was detected in your message. Your account is currently FLAGGED FOR REVIEW due to repeated violations of our contact sharing policy.";
            } else {
              textEl.textContent = "Sensitive information was detected in your message. For the protection of both parties, contact information cannot be exchanged before a shipment has been awarded. Repeated violations may result in suspension of your account.";
            }
          }
        }
        
        textInput.value = '';
        return;
      }
      
      try {
        Store.addNegotiationMessage(activeChatBidId, currentUser.id, currentUser.companyName, text, null, false);
        textInput.value = '';
        
        const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
        addNotification(partnerId, `New message received regarding Shipment #${shipment.id.replace('ship_', '')}`, 'message_received', shipment.id);
        
        renderChatBubbles(activeChatBidId);
      } catch (err) {
        alert(err.message);
      }
    };
    
    btnSend.addEventListener('click', handleSend);
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }
  
  const btnToggleCounter = document.getElementById('btn-toggle-counter-offer');
  const counterPanel = document.getElementById('counter-offer-panel');
  if (btnToggleCounter && counterPanel) {
    btnToggleCounter.addEventListener('click', () => {
      counterPanel.classList.toggle('d-none');
    });
  }
  
  const btnSubmitCounter = document.getElementById('btn-neg-submit-counter');
  const counterInput = document.getElementById('neg-counter-amount');
  if (btnSubmitCounter && counterInput) {
    btnSubmitCounter.addEventListener('click', () => {
      if (!activeChatBidId) return;
      const amount = parseFloat(counterInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid counter offer amount.');
        return;
      }
      
      const currentUser = Store.getCurrentUser();
      if (!currentUser) return;
      const bid = Store.getBids().find(b => b.id === activeChatBidId);
      if (!bid) return;
      const shipment = Store.getShipment(bid.shipmentId);
      if (!shipment) return;
      
      try {
        Store.addNegotiationMessage(activeChatBidId, currentUser.id, currentUser.companyName, `${currentUser.companyName} proposed a counter offer of $${amount.toLocaleString()}`, amount, false);
        
        if (shipment.status !== 'negotiating') {
          shipment.status = 'negotiating';
          const stored = localStorage.getItem('movana_store_data');
          if (stored) {
            const data = JSON.parse(stored);
            const s = data.shipments.find(x => x.id === shipment.id);
            if (s) {
              s.status = 'negotiating';
              localStorage.setItem('movana_store_data', JSON.stringify(data));
            }
          }
        }
        
        const partnerId = currentUser.role === 'shipper' ? bid.carrierId : shipment.shipperId;
        addNotification(partnerId, `Counter offer of $${amount.toLocaleString()} proposed on Shipment #${shipment.id.replace('ship_', '')}`, 'counter_offer_received', shipment.id);
        
        counterInput.value = '';
        counterPanel.classList.add('d-none');
        document.getElementById('neg-current-amount').textContent = `$${amount.toLocaleString()}`;
        
        renderChatBubbles(activeChatBidId);
        
        renderShipperDashboard();
        renderCarrierDashboard();
        renderLoadBoard();
        
        showToast('Counter offer submitted.');
      } catch (err) {
        alert(err.message);
      }
    });
  }
  
  const btnAccept = document.getElementById('btn-neg-accept');
  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      if (!activeChatBidId) return;
      confirmAcceptBid(activeChatBidId);
    });
  }
  
  const btnReject = document.getElementById('btn-neg-reject');
  if (btnReject) {
    btnReject.addEventListener('click', () => {
      if (!activeChatBidId) return;
      
      const currentUser = Store.getCurrentUser();
      if (!currentUser) return;
      const bid = Store.getBids().find(b => b.id === activeChatBidId);
      if (!bid) return;
      
      const neg = Store.getNegotiationForBid(activeChatBidId);
      let pendingCounter = null;
      if (neg && neg.messages) {
        const counterMsgs = neg.messages.filter(m => m.amount !== null);
        if (counterMsgs.length > 0) {
          const latestCounter = counterMsgs[counterMsgs.length - 1];
          const isMe = latestCounter.senderId === currentUser.id;
          if (!isMe) {
            pendingCounter = latestCounter;
          }
        }
      }
      
      if (pendingCounter) {
        declineCounterOffer(activeChatBidId, pendingCounter.amount);
      } else {
        if (confirm('Decline this bid? This cannot be undone.')) {
          try {
            Store.rejectBid(activeChatBidId);
            showToast('Bid declined.');
            
            addNotification(bid.carrierId, `Your bid of $${bid.amount} on shipment #${bid.shipmentId.substring(5)} was declined`, 'bid_declined', bid.shipmentId);
            
            document.getElementById('negotiation-modal').classList.remove('active');
            activeChatBidId = null;
            
            renderShipperDashboard();
            renderCarrierDashboard();
          } catch (err) {
            alert(err.message);
          }
        }
      }
    });
  }
}

function bindAuthFormSubmit() {
  if (!elements.authForm) return;
  
  elements.authForm.onsubmit = (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('auth-error') || elements.authError;
    if (errorEl) {
      errorEl.classList.add('d-none');
      errorEl.innerHTML = '';
    }

    const username = elements.authUsername.value.trim();
    const password = elements.authPassword.value;
    const mode = elements.authModeInput.value;
    
    console.log(`=== Auth Form Submission [${mode.toUpperCase()}] ===`);
    console.log(`Username entered: ${username}`);
    
    try {
      let user;
      if (mode === 'login') {
        console.log(`Attempting login for user: ${username}...`);
        user = Store.loginUser(username, password);
        console.log("Login successful! User object:", JSON.stringify(user, null, 2));
        showToast(`Welcome back, ${user.companyName}!`);
        switchView(user.role);
      } else {
        console.log("Validating registration fields...");
        const errors = [];
        
        // 1. Username
        if (!username) {
          errors.push("Username is required.");
          updateFieldValidationState(elements.authUsername, false, "Username is required.");
        } else if (username.length < 3) {
          errors.push("Username must be at least 3 characters long.");
          updateFieldValidationState(elements.authUsername, false, "Username must be at least 3 characters long.");
        } else {
          updateFieldValidationState(elements.authUsername, true);
        }
        
        // 2. Contact Name
        const contactNameInput = document.getElementById('auth-contact-name');
        const contactName = contactNameInput ? contactNameInput.value.trim() : '';
        if (!contactName) {
          errors.push("Contact name is required.");
          updateFieldValidationState(contactNameInput, false, "Contact name is required.");
        } else {
          updateFieldValidationState(contactNameInput, true);
        }

        // 3. Email Address
        const emailInput = document.getElementById('auth-email');
        const email = emailInput ? emailInput.value.trim() : '';
        if (!email) {
          errors.push("Email address is required.");
          updateFieldValidationState(emailInput, false, "Email address is required.");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Please enter a valid email address.");
          updateFieldValidationState(emailInput, false, "Please enter a valid email address.");
        } else {
          updateFieldValidationState(emailInput, true);
        }

        // 4. Phone Number
        const phoneInput = document.getElementById('auth-phone');
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const digits = phone.replace(/\D/g, '');
        if (!phone) {
          errors.push("Mobile phone number is required.");
          updateFieldValidationState(phoneInput, false, "Mobile phone number is required.");
        } else if (digits.length < 10) {
          errors.push("Please enter a valid 10-digit mobile phone number.");
          updateFieldValidationState(phoneInput, false, "Please enter a valid 10-digit mobile phone number.");
        } else {
          updateFieldValidationState(phoneInput, true);
        }

        // 5. Company Name
        const companyName = elements.authCompany.value.trim();
        if (!companyName) {
          errors.push("Company name is required.");
          updateFieldValidationState(elements.authCompany, false, "Company name is required.");
        } else {
          updateFieldValidationState(elements.authCompany, true);
        }

        // 6. Password
        const passwordInput = elements.authPassword;
        const isComplexityValid = updatePasswordLiveRequirements(password);
        if (!password) {
          errors.push("Password is required.");
          updateFieldValidationState(passwordInput, false, "Password is required.");
        } else if (password.length < 8) {
          errors.push("Password must be at least 8 characters.");
          updateFieldValidationState(passwordInput, false, "Password must be at least 8 characters.");
        } else if (!isComplexityValid) {
          errors.push("Password does not meet complexity requirements.");
          updateFieldValidationState(passwordInput, false, "Password does not meet complexity requirements.");
        } else {
          updateFieldValidationState(passwordInput, true);
        }

        // 7. Confirm Password
        const confirmPasswordInput = document.getElementById('auth-confirm-password');
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        if (!confirmPassword) {
          errors.push("Please confirm your password.");
          updateFieldValidationState(confirmPasswordInput, false, "Please confirm your password.");
        } else if (password !== confirmPassword) {
          errors.push("Passwords do not match.");
          updateFieldValidationState(confirmPasswordInput, false, "Passwords do not match.");
        } else {
          updateFieldValidationState(confirmPasswordInput, true);
        }

        // 8. Role Select
        const role = document.querySelector('input[name="auth-role"]:checked').value;

        // Carrier details if carrier
        let mcNumber = '';
        let dotNumber = '';
        let selectedEquipment = [];

        if (role === 'carrier') {
          const mcInput = document.getElementById('auth-mc-number');
          const dotInput = document.getElementById('auth-dot-number');
          const equipContainer = document.getElementById('auth-equipment-container');
          
          mcNumber = mcInput ? mcInput.value.trim() : '';
          dotNumber = dotInput ? dotInput.value.trim() : '';

          if (!mcNumber) {
            errors.push("MC Number is required for Carriers.");
            updateFieldValidationState(mcInput, false, "MC Number is required for Carriers.");
          } else {
            updateFieldValidationState(mcInput, true);
          }

          if (!dotNumber) {
            errors.push("DOT Number is required for Carriers.");
            updateFieldValidationState(dotInput, false, "DOT Number is required for Carriers.");
          } else {
            updateFieldValidationState(dotInput, true);
          }

          const checkedCheckboxes = document.querySelectorAll('.auth-equipment-checkbox:checked');
          checkedCheckboxes.forEach(cb => selectedEquipment.push(cb.value));

          const equipErrEl = document.getElementById('err-auth-equipment');
          if (selectedEquipment.length === 0) {
            errors.push("Please select at least one Equipment Type.");
            if (equipContainer) {
              equipContainer.style.borderColor = '#ef4444';
              equipContainer.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.15)';
            }
            if (equipErrEl) {
              equipErrEl.textContent = "Please select at least one Equipment Type.";
              equipErrEl.style.display = 'block';
              equipErrEl.style.opacity = '1';
            }
          } else {
            if (equipContainer) {
              equipContainer.style.borderColor = '#22c55e';
              equipContainer.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
            }
            if (equipErrEl) {
              equipErrEl.style.opacity = '0';
              equipErrEl.style.display = 'none';
            }
          }
        }

        if (errors.length > 0) {
          throw new Error(errors.join("<br>"));
        }

        const additionalData = {
          contactName,
          email,
          phone
        };

        if (role === 'carrier') {
          additionalData.mcNumber = mcNumber;
          additionalData.dotNumber = dotNumber;
          additionalData.equipmentTypes = selectedEquipment;
        }

        console.log("All validations passed. Calling Store.registerUser...");
        
        // Show Button Loading State
        elements.authSubmitBtn.disabled = true;
        elements.authSubmitBtn.innerHTML = '<span class="loading-spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span> Creating Account...';

        user = Store.registerUser(username, password, role, companyName, additionalData);
        console.log("Registration successful! Initializing OTP verification...", JSON.stringify(user, null, 2));

        setTimeout(() => {
          showToast("Registration successful! Verification code sent.");
          showOTPVerification(user.username);
        }, 1000);
      }
    } catch (err) {
      console.error(`Authentication error [${mode.toUpperCase()}]:`, err.message);
      
      if (err.message.startsWith('UNVERIFIED_EMAIL:')) {
        const unverifiedUsername = err.message.split(':')[1];
        showToast("Email verification required. Check console for OTP.", true);
        showOTPVerification(unverifiedUsername);
        return;
      }

      const errBox = document.getElementById('auth-error') || elements.authError;
      if (errBox) {
        errBox.innerHTML = err.message;
        errBox.classList.remove('d-none');
      }
      
      if (elements.authSubmitBtn) {
        elements.authSubmitBtn.disabled = false;
        elements.authSubmitBtn.innerHTML = mode === 'login' ? 'Sign In' : 'Create Account';
      }
    }
  };
}

function showOTPVerification(username) {
  const card = document.querySelector('.auth-card');
  if (!card) return;

  let email = 'your email';
  let otp = '';
  try {
    const rawData = JSON.parse(localStorage.getItem('movana_store_data'));
    const u = rawData.users.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (u) {
      email = u.email;
      otp = u.verificationOtp;
    }
  } catch (e) {}

  // Trigger registration/unverified-login OTP email immediately on show
  if (email && otp) {
    const template = EmailTemplates.emailVerificationOtp(username, otp);
    sendEmail(email, template.subject, template.html, template.text, "emailVerificationOtp").catch(e => {
      console.error("Failed to send verification email:", e);
    });
  }

  let countdown = 60;
  let timerInterval;
  let resendAttempts = 0;
  const maxResendAttempts = 5;

  const startTimer = () => {
    const timerEl = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('otp-resend-btn');
    if (!timerEl || !resendBtn) return;

    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.5';
    resendBtn.style.cursor = 'not-allowed';

    countdown = 60;
    timerEl.textContent = `Resend code in ${countdown}s`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timerInterval);
        timerEl.textContent = '';
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
        resendBtn.style.cursor = 'pointer';
      } else {
        timerEl.textContent = `Resend code in ${countdown}s`;
      }
    }, 1000);
  };

  card.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="logo.svg" alt="Movana Logo" style="width: 80px; height: auto;">
    </div>
    <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; text-align: center;">Verify Your Email</h2>
    <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 24px 0; line-height: 1.5; text-align: center;">
      A 6-digit verification code has been sent to <strong>${email}</strong>.<br>Enter the code below to activate your account.
    </p>
    
    <div id="otp-error" class="alert alert-danger d-none" style="margin-bottom: 20px; padding: 12px; font-size: 13px; border-radius: var(--radius-sm);"></div>
    
    <form id="otp-form" style="display: flex; flex-direction: column; gap: 20px;">
      <div class="form-group" style="text-align: center;">
        <input type="text" id="otp-input" maxlength="6" placeholder="000000" style="width: 100%; max-width: 200px; height: 50px; font-size: 24px; font-weight: 800; text-align: center; letter-spacing: 6px; border: 2px solid var(--border-color); border-radius: var(--radius-md); outline: none; transition: var(--transition-smooth); margin: 0 auto; display: block;" required autocomplete="one-time-code">
      </div>
      
      <button type="submit" id="otp-submit-btn" class="btn btn-primary" style="width: 100%; height: 45px; font-weight: 600;">Verify & Activate</button>
    </form>
    
    <div style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-muted);">
      Didn't receive the code? <button id="otp-resend-btn" style="background: none; border: none; color: var(--accent-shipper, #0f172a); font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline;">Resend Code</button>
      <div id="otp-timer" style="margin-top: 8px; font-size: 12px; color: var(--text-muted);"></div>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
      <a href="#" id="otp-back-btn" style="font-size: 13px; color: var(--text-muted); text-decoration: none; font-weight: 600;">← Back to Sign In</a>
    </div>
  `;

  const otpInput = document.getElementById('otp-input');
  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  startTimer();

  document.getElementById('otp-back-btn').addEventListener('click', (e) => {
    e.preventDefault();
    clearInterval(timerInterval);
    restoreAuthCardStructure();
  });

  document.getElementById('otp-resend-btn').addEventListener('click', () => {
    if (resendAttempts >= maxResendAttempts) {
      const otpErr = document.getElementById('otp-error');
      if (otpErr) {
        otpErr.textContent = "Maximum resend attempts reached. Please try registering again.";
        otpErr.classList.remove('d-none');
      }
      return;
    }
    
    resendAttempts++;

    try {
      Store.resendVerificationOtp(username);
      
      // Get newly regenerated code
      let newOtp = '';
      try {
        const rawData = JSON.parse(localStorage.getItem('movana_store_data'));
        const u = rawData.users.find(x => x.username.toLowerCase() === username.toLowerCase());
        if (u) newOtp = u.verificationOtp;
      } catch (e) {}

      if (email && newOtp) {
        const template = EmailTemplates.emailVerificationOtp(username, newOtp);
        sendEmail(email, template.subject, template.html, template.text, "emailVerificationOtpResend").catch(e => {
          console.error("Failed to send verification email:", e);
        });
      }

      showToast("Verification email sent!");
      startTimer();
      const otpErr = document.getElementById('otp-error');
      if (otpErr) otpErr.classList.add('d-none');
    } catch (err) {
      const otpErr = document.getElementById('otp-error');
      if (otpErr) {
        otpErr.innerHTML = err.message;
        otpErr.classList.remove('d-none');
      }
    }
  });

  document.getElementById('otp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = otpInput.value.trim();
    const otpErr = document.getElementById('otp-error');
    const submitBtn = document.getElementById('otp-submit-btn');

    if (otp.length !== 6) {
      if (otpErr) {
        otpErr.textContent = "Please enter the full 6-digit verification code.";
        otpErr.classList.remove('d-none');
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span> Verifying...';

    if (otpErr) otpErr.classList.add('d-none');

    setTimeout(() => {
      try {
        const verifiedUser = Store.verifyUserEmail(username, otp);
        clearInterval(timerInterval);

        // Send Welcome & Account Activated emails
        (function() {
          const welcome = EmailTemplates.welcomeEmail(verifiedUser.username);
          sendEmail(verifiedUser.email, welcome.subject, welcome.html, welcome.text, "welcomeEmail").catch(e => console.error(e));
          
          const activated = EmailTemplates.accountActivated(verifiedUser.username);
          sendEmail(verifiedUser.email, activated.subject, activated.html, activated.text, "accountActivated").catch(e => console.error(e));
        })();

        card.innerHTML = `
          <div id="auth-success-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; animation: fadeIn 0.4s ease-in-out;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">✓</div>
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; text-align: center;">Welcome to Movana</h2>
            <p style="font-size: 14px; color: var(--text-muted); margin: 0 0 24px 0; line-height: 1.5; text-align: center;">
              Your account has been created and verified successfully.<br>Redirecting to your dashboard...
            </p>
            <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #22c55e; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          </div>
        `;

        setTimeout(() => {
          showToast(`Welcome to Movana, ${verifiedUser.companyName}!`);
          switchView(verifiedUser.role);
          setTimeout(() => {
            restoreAuthCardStructure();
          }, 500);
        }, 2000);

      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Verify & Activate";
        if (otpErr) {
          otpErr.innerHTML = err.message;
          otpErr.classList.remove('d-none');
        }
      }
    }, 1000);
  });
}

function bindSocialAuthListeners() {
  const googleBtn = document.getElementById('social-google-btn');
  const icloudBtn = document.getElementById('social-icloud-btn');

  if (googleBtn) {
    googleBtn.onclick = () => openSocialLoginPopup('google');
  }
  if (icloudBtn) {
    icloudBtn.onclick = () => openSocialLoginPopup('icloud');
  }
}

function openSocialLoginPopup(provider) {
  if (window.useFirebase && window.auth) {
    console.log(`Using Firebase Auth for ${provider}...`);
    let authProvider;
    if (provider === 'google') {
      authProvider = new firebase.auth.GoogleAuthProvider();
    } else if (provider === 'icloud') {
      authProvider = new firebase.auth.OAuthProvider('apple.com');
    }
    
    if (authProvider) {
      window.auth.signInWithPopup(authProvider)
        .then((result) => {
          const user = result.user;
          const profile = {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            avatar: user.photoURL || '',
            provider: provider
          };
          handleSocialAuthSuccess(profile);
        })
        .catch((error) => {
          console.error("Firebase auth failed:", error);
          showToast(`Authentication failed: ${error.message}`, true);
        });
      return;
    }
  }

  // Fallback to Vercel API redirect flow in a popup
  const width = 500;
  const height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const url = `/api/auth/login?provider=${provider === 'icloud' ? 'apple' : 'google'}`;
  
  console.log(`Opening social login redirect popup for provider: ${provider}...`);
  window.open(url, 'social-login', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`);
}

function handleSocialAuthSuccess(profile) {
  const email = profile.email;
  const name = profile.name || email.split('@')[0];
  const avatar = profile.avatar || '';
  const provider = profile.provider || 'google';

  console.log(`OAuth Authentication Succeeded: ${email} via ${provider}`);

  // Check if user exists in our local store
  const existingUser = Store.getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    // Existing user: log in immediately
    const user = Store.loginSocialUser(email);
    showToast(`Welcome back, ${user.companyName}!`);
    switchView(user.role);
  } else {
    // New user: show onboarding modal
    showSocialOnboardingModal({ email, name, avatar, provider });
  }
}

function showSocialOnboardingModal(profile) {
  // Remove existing modal if any
  const existing = document.getElementById('social-onboarding-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'social-onboarding-modal';
  overlay.className = 'social-modal-overlay';

  const equipmentOptions = [
    'Dry Van', 'Reefer', 'Flatbed', 'Hotshot', 
    'Car Hauler', 'Box Truck', 'Power Only', 'Step Deck', 'Lowboy'
  ];

  let equipmentCheckboxesHtml = '';
  equipmentOptions.forEach(eq => {
    equipmentCheckboxesHtml += `
      <label style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="onboard-equip-cb" value="${eq}"> ${eq}
      </label>
    `;
  });

  overlay.innerHTML = `
    <div class="social-modal-card" style="box-sizing: border-box;">
      <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0;">Complete Your Profile</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">Welcome to Movana! Finish setting up your account details below.</p>
      
      <div id="onboard-error" class="alert alert-danger d-none" style="margin-bottom: 16px; padding: 12px; font-size: 13px; border-radius: var(--radius-sm); color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2;"></div>

      <form id="social-onboard-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Email Address (Verified)</label>
          <input type="text" value="${profile.email}" class="form-control" readonly style="background-color: #f1f5f9; cursor: not-allowed; width: 100%;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Contact Name</label>
          <input type="text" id="onboard-contact" value="${profile.name}" class="form-control" placeholder="e.g. John Doe" required style="width: 100%;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Desired Username</label>
          <input type="text" id="onboard-username" value="${profile.email.split('@')[0]}" class="form-control" placeholder="e.g. jdoe99" required minlength="3" style="width: 100%;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Company Name</label>
          <input type="text" id="onboard-company" class="form-control" placeholder="e.g. Acme Logistics" required style="width: 100%;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Mobile Phone Number</label>
          <input type="tel" id="onboard-phone" class="form-control" placeholder="e.g. 555-0100" required style="width: 100%;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Select Role</label>
          <div class="role-select-container">
            <input type="radio" name="onboard-role" id="onboard-role-shipper" class="role-radio" value="shipper" checked>
            <label for="onboard-role-shipper" class="role-label shipper-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Shipper</span>
            </label>

            <input type="radio" name="onboard-role" id="onboard-role-carrier" class="role-radio" value="carrier">
            <label for="onboard-role-carrier" class="role-label carrier-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Carrier</span>
            </label>
          </div>
        </div>

        <div id="onboard-carrier-panel" class="carrier-panel d-none">
          <h3>Carrier Credentials</h3>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">MC Number *</label>
            <input type="text" id="onboard-mc" class="form-control" placeholder="MC123456" style="width: 100%;">
          </div>
          <div class="form-group" style="margin-top: 12px; margin-bottom: 0;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">DOT Number *</label>
            <input type="text" id="onboard-dot" class="form-control" placeholder="DOT1234567" style="width: 100%;">
          </div>
          <div class="form-group" style="margin-top: 12px; margin-bottom: 0;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Equipment Types *</label>
            <div class="equipment-grid">
              ${equipmentCheckboxesHtml}
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Create Profile & Get Started</button>
        <button type="button" id="btn-onboard-cancel" class="btn btn-outline" style="width: 100%;">Cancel</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger CSS transition animation
  setTimeout(() => overlay.classList.add('active'), 50);

  // Bind radio toggles
  const shipperRadio = overlay.querySelector('#onboard-role-shipper');
  const carrierRadio = overlay.querySelector('#onboard-role-carrier');
  const carrierPanel = overlay.querySelector('#onboard-carrier-panel');

  shipperRadio.addEventListener('change', () => carrierPanel.classList.add('d-none'));
  carrierRadio.addEventListener('change', () => carrierPanel.classList.remove('d-none'));

  // Cancel Handler
  overlay.querySelector('#btn-onboard-cancel').onclick = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  // Onboard Submit Handler
  const onboardForm = overlay.querySelector('#social-onboard-form');
  onboardForm.onsubmit = (e) => {
    e.preventDefault();
    
    const username = overlay.querySelector('#onboard-username').value.trim();
    const contactName = overlay.querySelector('#onboard-contact').value.trim();
    const companyName = overlay.querySelector('#onboard-company').value.trim();
    const phone = overlay.querySelector('#onboard-phone').value.trim();
    const role = overlay.querySelector('input[name="onboard-role"]:checked').value;

    const errors = [];
    if (!username || username.length < 3) errors.push("Username must be at least 3 characters.");
    if (!contactName) errors.push("Contact name is required.");
    if (!companyName) errors.push("Company name is required.");
    if (!phone) errors.push("Phone number is required.");

    let mcNumber = '';
    let dotNumber = '';
    let equipmentTypes = [];

    if (role === 'carrier') {
      mcNumber = overlay.querySelector('#onboard-mc').value.trim();
      dotNumber = overlay.querySelector('#onboard-dot').value.trim();
      const selectedCbs = overlay.querySelectorAll('.onboard-equip-cb:checked');
      selectedCbs.forEach(cb => equipmentTypes.push(cb.value));

      if (!mcNumber) errors.push("MC Number is required for Carriers.");
      if (!dotNumber) errors.push("DOT Number is required for Carriers.");
      if (equipmentTypes.length === 0) errors.push("Please select at least one Equipment Type.");
    }

    if (errors.length > 0) {
      const errDiv = overlay.querySelector('#onboard-error');
      errDiv.innerHTML = errors.join('<br>');
      errDiv.classList.remove('d-none');
      return;
    }

    try {
      // Register via social authentication
      const additionalData = { contactName, phone };
      if (role === 'carrier') {
        additionalData.mcNumber = mcNumber;
        additionalData.dotNumber = dotNumber;
        additionalData.equipmentTypes = equipmentTypes;
      }

      const newUser = Store.registerSocialUser(username, profile.email, role, companyName, additionalData);
      
      // Auto Login
      const loggedUser = Store.loginSocialUser(newUser.email);

      // Clean up modal
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);

      // Redirect
      showToast(`Welcome to Movana, ${loggedUser.companyName}!`);
      switchView(loggedUser.role);
    } catch (err) {
      const errDiv = overlay.querySelector('#onboard-error');
      errDiv.textContent = err.message || "Failed to create profile.";
      errDiv.classList.remove('d-none');
    }
  };
}

function restoreAuthCardStructure() {
  const card = document.querySelector('.auth-card');
  if (card) {
    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="logo.svg" alt="Movana Logo" style="width: 80px; height: auto;">
      </div>
      <div class="auth-tab">
        <button class="tab-btn active" id="tab-login">Login</button>
        <button class="tab-btn" id="tab-register">Register</button>
      </div>
      <h2 id="auth-title">Welcome Back</h2>
      <p id="auth-subtitle">Sign in to manage your shipments and bids.</p>
      <form id="auth-form"></form>
      
      <div class="social-divider">
        <span>or continue with</span>
      </div>

      <div class="social-buttons-container">
        <button type="button" class="btn-social google-btn" id="social-google-btn">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style="width: 18px; height: 18px; margin-right: 8px;">
          Google
        </button>
        <button type="button" class="btn-social icloud-btn" id="social-icloud-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.52-.64.74-1.2 1.88-1.05 3 .16 3.01.83 2.43 1.15 2.25 1.12.08 2.19-.7 2.8-1.71z"/>
          </svg>
          iCloud
        </button>
      </div>
    `;
    elements.tabLogin = document.getElementById('tab-login');
    elements.tabRegister = document.getElementById('tab-register');
    elements.authTitle = document.getElementById('auth-title');
    elements.authSubtitle = document.getElementById('auth-subtitle');
    elements.authForm = document.getElementById('auth-form');
    
    elements.tabLogin.addEventListener('click', () => setAuthMode('login'));
    elements.tabRegister.addEventListener('click', () => setAuthMode('register'));
    bindAuthFormSubmit();
    bindSocialAuthListeners();
    setAuthMode('login');
  }
}

function openCroppingModal(file, onCropComplete) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const cropModal = document.createElement('div');
      cropModal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      `;
      
      cropModal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: var(--radius-lg); width: 340px; box-shadow: var(--shadow-xl); display: flex; flex-direction: column; gap: 15px; align-items: center;">
          <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">Adjust & Crop Avatar</h4>
          
          <div style="width: 180px; height: 180px; border-radius: 50%; border: 2px dashed var(--border-color); overflow: hidden; position: relative; background: #f8fafc; display: flex; align-items: center; justify-content: center;">
            <canvas id="crop-canvas" width="150" height="150" style="border-radius: 50%; width: 150px; height: 150px; cursor: move;"></canvas>
          </div>
          
          <div style="width: 100%;">
            <label style="font-size: 12px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 5px;">Zoom</label>
            <input type="range" id="crop-zoom" min="0.5" max="3" step="0.05" value="1" style="width: 100%;">
          </div>
          
          <div style="display: flex; gap: 10px; width: 100%; margin-top: 10px;">
            <button id="crop-cancel-btn" class="btn btn-outline" style="flex: 1; height: 38px;">Cancel</button>
            <button id="crop-save-btn" class="btn btn-primary" style="flex: 1; height: 38px;">Crop & Save</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(cropModal);
      
      const canvas = document.getElementById('crop-canvas');
      const ctx = canvas.getContext('2d');
      const zoomInput = document.getElementById('crop-zoom');
      
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
      let startX, startY;
      
      const draw = () => {
        ctx.clearRect(0, 0, 150, 150);
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(75, 75, 75, 0, Math.PI * 2);
        ctx.clip();
        
        const w = img.width * scale;
        const h = img.height * scale;
        const x = 75 - w/2 + offsetX;
        const y = 75 - h/2 + offsetY;
        
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
      };
      
      const minScale = Math.max(150 / img.width, 150 / img.height);
      zoomInput.min = minScale;
      zoomInput.max = minScale * 4;
      scale = minScale;
      zoomInput.value = scale;
      
      draw();
      
      zoomInput.addEventListener('input', () => {
        scale = parseFloat(zoomInput.value);
        draw();
      });
      
      canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
      });
      
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        draw();
      });
      
      window.addEventListener('mouseup', () => {
        isDragging = false;
      });
      
      document.getElementById('crop-cancel-btn').addEventListener('click', () => {
        cropModal.remove();
      });
      
      document.getElementById('crop-save-btn').addEventListener('click', () => {
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        onCropComplete(croppedBase64);
        cropModal.remove();
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function openSensitiveChangeOtpModal(changeType, onSuccess) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const user = Store.getCurrentUser();
  if (!user) return;
  
  // Trigger sensitive change OTP email
  (function() {
    let template;
    if (changeType === 'email') {
      template = EmailTemplates.emailChangeOtp(user.username, otp);
    } else if (changeType === 'phone') {
      template = EmailTemplates.phoneChangeOtp(user.username, otp);
    } else if (changeType === 'password') {
      template = EmailTemplates.passwordResetOtp(user.username, otp);
    } else {
      template = { subject: "Verify security action on Movana", html: `<p>Your verification code is: ${otp}</p>`, text: `Your code is: ${otp}` };
    }
    
    sendEmail(user.email, template.subject, template.html, template.text, `${changeType}ChangeOtp`).catch(err => {
      console.error("Failed to send sensitive change verification email:", err);
    });
  })();
  
  showToast("Security code sent!");
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: var(--radius-lg); width: 380px; box-shadow: var(--shadow-xl); display: flex; flex-direction: column; gap: 15px;">
      <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0; text-align: center;">Confirm Security Verification</h3>
      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; text-align: center; margin: 0;">
        To apply these sensitive account changes, please enter the 6-digit confirmation code sent to your email (<strong>${user.email}</strong>).
      </p>
      
      <div id="modal-otp-error" class="alert alert-danger d-none" style="font-size: 12px; padding: 10px; margin: 0; border-radius: var(--radius-sm);"></div>
      
      <div style="text-align: center; margin: 10px 0;">
        <input type="text" id="modal-otp-input" maxlength="6" placeholder="000000" style="width: 160px; height: 45px; font-size: 22px; font-weight: 800; text-align: center; letter-spacing: 4px; border: 2px solid var(--border-color); border-radius: var(--radius-md); outline: none;" required>
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 10px;">
        <button id="modal-otp-cancel" class="btn btn-outline" style="flex: 1; height: 40px;">Cancel</button>
        <button id="modal-otp-confirm" class="btn btn-primary" style="flex: 1; height: 40px;">Confirm</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const otpInput = document.getElementById('modal-otp-input');
  otpInput.focus();
  otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
  
  document.getElementById('modal-otp-cancel').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('modal-otp-confirm').addEventListener('click', () => {
    const entered = otpInput.value.trim();
    const errorEl = document.getElementById('modal-otp-error');
    if (entered === otp) {
      modal.remove();
      onSuccess();
    } else {
      if (errorEl) {
        errorEl.textContent = "Invalid confirmation code. Please check email/console.";
        errorEl.classList.remove('d-none');
      }
    }
  });
}

function createProfileViewDom() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  if (document.getElementById('profile-view')) return;
  
  const profileSec = document.createElement('section');
  profileSec.id = 'profile-view';
  profileSec.className = 'dashboard-layout d-none';
  profileSec.style.cssText = `
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 30px;
    max-width: 1200px;
    margin: 30px auto;
    padding: 0 20px;
  `;
  
  profileSec.innerHTML = `
    <div class="profile-settings-sidebar" style="background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px; height: fit-content;">
      <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 0 0 12px 0; letter-spacing: 0.5px;">Account Settings</h3>
      <button class="settings-tab-btn active" data-tab="profile-info" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; border-radius: var(--radius-md); font-weight: 600; text-align: left; cursor: pointer; color: var(--accent-shipper); transition: var(--transition-smooth);">
        <span style="font-size: 18px;">👤</span> Profile Information
      </button>
      <button class="settings-tab-btn" data-tab="security-settings" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; border-radius: var(--radius-md); font-weight: 600; text-align: left; cursor: pointer; color: var(--text-muted); transition: var(--transition-smooth);">
        <span style="font-size: 18px;">🔒</span> Security & Verification
      </button>
      <button class="settings-tab-btn" id="settings-carrier-tab" data-tab="carrier-specs" style="display: none; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; border-radius: var(--radius-md); font-weight: 600; text-align: left; cursor: pointer; color: var(--text-muted); transition: var(--transition-smooth);">
        <span style="font-size: 18px;">🚛</span> Carrier Credentials
      </button>
      <button class="settings-tab-btn" data-tab="activity-logs" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; border-radius: var(--radius-md); font-weight: 600; text-align: left; cursor: pointer; color: var(--text-muted); transition: var(--transition-smooth);">
        <span style="font-size: 18px;">📋</span> Activity Logs
      </button>
      <button class="settings-tab-btn" data-tab="email-logs" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: none; background: none; border-radius: var(--radius-md); font-weight: 600; text-align: left; cursor: pointer; color: var(--text-muted); transition: var(--transition-smooth);">
        <span style="font-size: 18px;">✉️</span> Email Logs
      </button>
    </div>
    
    <div id="profile-settings-content" style="background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 30px; box-shadow: var(--shadow-sm); min-height: 500px;">
    </div>
  `;
  
  mainContent.appendChild(profileSec);
  
  const tabs = profileSec.querySelectorAll('.settings-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-muted)';
        t.style.background = 'none';
      });
      tab.classList.add('active');
      const roleAccent = Store.getCurrentUser().role === 'carrier' ? 'var(--color-carrier, #2563eb)' : 'var(--color-shipper, #0f172a)';
      tab.style.color = roleAccent;
      tab.style.background = '#f8fafc';
      
      const tabName = tab.getAttribute('data-tab');
      renderProfileSettingsTab(tabName);
    });
  });
}

let currentSettingsTab = 'profile-info';

function renderProfileViewContent() {
  const user = Store.getCurrentUser();
  if (!user) return;
  
  const carrierTab = document.getElementById('settings-carrier-tab');
  if (carrierTab) {
    if (user.role === 'carrier') {
      carrierTab.style.display = 'flex';
    } else {
      carrierTab.style.display = 'none';
      if (currentSettingsTab === 'carrier-specs') {
        currentSettingsTab = 'profile-info';
      }
    }
  }
  
  const tabs = document.querySelectorAll('.settings-tab-btn');
  tabs.forEach(tab => {
    const tabName = tab.getAttribute('data-tab');
    if (tabName === currentSettingsTab) {
      tab.classList.add('active');
      const roleAccent = user.role === 'carrier' ? 'var(--color-carrier, #2563eb)' : 'var(--color-shipper, #0f172a)';
      tab.style.color = roleAccent;
      tab.style.background = '#f8fafc';
    } else {
      tab.classList.remove('active');
      tab.style.color = 'var(--text-muted)';
      tab.style.background = 'none';
    }
  });
  
  renderProfileSettingsTab(currentSettingsTab);
}

function renderProfileSettingsTab(tabName) {
  const contentArea = document.getElementById('profile-settings-content');
  if (!contentArea) return;
  
  const user = Store.getCurrentUser();
  if (!user) return;
  
  const roleAccent = user.role === 'carrier' ? 'var(--color-carrier, #2563eb)' : 'var(--color-shipper, #0f172a)';
  currentSettingsTab = tabName;
  
  if (tabName === 'profile-info') {
    const avatarSrc = user.profilePic || `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="55" font-size="28" font-family="Outfit, sans-serif" font-weight="700" fill="#94a3b8" text-anchor="middle">' + (user.contactName || user.username).substring(0,2).toUpperCase() + '</text></svg>')}`;
    
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Profile Information</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Update your account's public profile information and contact details.</p>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 10px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px;">
          <div style="flex: 1; min-width: 140px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Account ID</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); font-family: monospace;">${user.id}</div>
          </div>
          <div style="flex: 1; min-width: 140px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Username</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); font-family: monospace;">${user.username}</div>
          </div>
          <div style="flex: 1; min-width: 140px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Role</div>
            <div style="font-size: 13px; font-weight: 700; color: ${roleAccent};">${user.role === 'carrier' ? 'Carrier' : 'Shipper'}</div>
          </div>
          <div style="flex: 1; min-width: 140px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Registered</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${new Date(user.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px;">
          <div style="position: relative; width: 85px; height: 85px; border-radius: 50%; overflow: hidden; background: #e2e8f0; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); border: 2px solid white; outline: 1px solid var(--border-color);">
            <img id="settings-avatar-img" src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Profile Picture</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Upload a square photo to update your avatar.</div>
            <div style="display: flex; gap: 8px;">
              <button id="upload-avatar-trigger" class="btn btn-outline btn-sm">Upload Photo</button>
              <button id="remove-avatar-btn" class="btn btn-sm btn-outline" style="border-color: #ef4444; color: #ef4444;">Remove</button>
              <input type="file" id="settings-avatar-input" accept="image/*" style="display: none;">
            </div>
          </div>
        </div>
        
        <form id="settings-profile-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="form-group">
            <label class="label">Contact Name <span style="color: red;">*</span></label>
            <input type="text" id="settings-contact-name" class="input" value="${user.contactName || ''}" required>
          </div>
          <div class="form-group">
            <label class="label">Company Name <span style="color: red;">*</span></label>
            <input type="text" id="settings-company-name" class="input" value="${user.companyName || ''}" required>
          </div>
          
          <div class="form-group">
            <label class="label">Email Address <span style="color: red;">*</span> <span style="font-size:11px; color:#22c55e; font-weight:700; margin-left:5px;">✓ Verified</span></label>
            <input type="email" id="settings-email" class="input" value="${user.email || ''}" required>
          </div>
          <div class="form-group">
            <label class="label">Phone Number <span style="color: red;">*</span></label>
            <input type="tel" id="settings-phone" class="input" value="${user.phone || ''}" required>
          </div>
          
          <div class="form-group" style="grid-column: span 2;">
            <label class="label">Street Address</label>
            <input type="text" id="settings-address" class="input" value="${user.address || ''}">
          </div>
          
          <div class="form-group">
            <label class="label">City</label>
            <input type="text" id="settings-city" class="input" value="${user.city || ''}">
          </div>
          <div class="form-group">
            <label class="label">State</label>
            <input type="text" id="settings-state" class="input" value="${user.state || ''}">
          </div>
          
          <div class="form-group">
            <label class="label">ZIP / Postal Code</label>
            <input type="text" id="settings-zip" class="input" value="${user.zip || ''}">
          </div>
          <div class="form-group">
            <label class="label">Country</label>
            <input type="text" id="settings-country" class="input" value="${user.country || 'United States'}">
          </div>
          
          <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" class="btn btn-primary" style="height: 42px; padding: 0 24px; font-weight: 600; background: ${roleAccent}; border-color: ${roleAccent};">Save Profile Changes</button>
          </div>
        </form>
      </div>
    `;
    
    document.getElementById('upload-avatar-trigger').addEventListener('click', () => {
      document.getElementById('settings-avatar-input').click();
    });
    
    document.getElementById('settings-avatar-input').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        openCroppingModal(e.target.files[0], (croppedBase64) => {
          user.profilePic = croppedBase64;
          document.getElementById('settings-avatar-img').src = croppedBase64;
          Store.updateUserProfile(user.id, {
            contactName: user.contactName,
            companyName: user.companyName,
            address: user.address,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            profilePic: croppedBase64
          });
          showToast("Profile picture updated successfully.");
        });
      }
    });
    
    document.getElementById('remove-avatar-btn').addEventListener('click', () => {
      user.profilePic = '';
      const defaultSrc = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="55" font-size="28" font-family="Outfit, sans-serif" font-weight="700" fill="#94a3b8" text-anchor="middle">' + (user.contactName || user.username).substring(0,2).toUpperCase() + '</text></svg>')}`;
      document.getElementById('settings-avatar-img').src = defaultSrc;
      Store.updateUserProfile(user.id, {
        contactName: user.contactName,
        companyName: user.companyName,
        address: user.address,
        city: user.city,
        state: user.state,
        zip: user.zip,
        country: user.country,
        profilePic: ''
      });
      showToast("Profile picture removed.");
    });
    
    document.getElementById('settings-profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newContactName = document.getElementById('settings-contact-name').value.trim();
      const newCompanyName = document.getElementById('settings-company-name').value.trim();
      const newEmail = document.getElementById('settings-email').value.trim();
      const newPhone = document.getElementById('settings-phone').value.trim();
      const newAddress = document.getElementById('settings-address').value.trim();
      const newCity = document.getElementById('settings-city').value.trim();
      const newState = document.getElementById('settings-state').value.trim();
      const newZip = document.getElementById('settings-zip').value.trim();
      const newCountry = document.getElementById('settings-country').value.trim();
      
      const emailChanged = newEmail !== user.email;
      const phoneChanged = newPhone !== user.phone;
      
      const performSave = () => {
        try {
          if (emailChanged) {
            Store.updateUserSensitiveField(user.id, 'email', newEmail);
            // Send confirmation email to the NEW email address
            (function() {
              const activated = EmailTemplates.accountActivated(user.username);
              sendEmail(newEmail, "Email Address Updated Successfully", activated.html, activated.text, "emailChangedConfirmation").catch(err => {
                console.error("Failed to send confirmation email to new address:", err);
              });
            })();
          }
          if (phoneChanged) {
            Store.updateUserSensitiveField(user.id, 'phone', newPhone);
          }
          
          Store.updateUserProfile(user.id, {
            contactName: newContactName,
            companyName: newCompanyName,
            address: newAddress,
            city: newCity,
            state: newState,
            zip: newZip,
            country: newCountry
          });
          
          showToast("Profile updated successfully!");
          renderProfileViewContent();
        } catch (err) {
          alert("Error saving profile: " + err.message);
        }
      };
      
      if (emailChanged || phoneChanged) {
        const changeType = emailChanged ? 'email' : 'phone';
        openSensitiveChangeOtpModal(changeType, performSave);
      } else {
        performSave();
      }
    });
  } else if (tabName === 'security-settings') {
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 30px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Security & Verification</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Change your account password and review verification checklist status.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px;">
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Email Verification</div>
              <div style="font-size: 11px; color: var(--text-muted);">Required to log in and receive actions.</div>
            </div>
            <span class="role-badge shipper-role" style="background:#dcfce7; color:#16a34a; border: 1px solid #bbf7d0; font-weight:bold;">✓ Email Verified</span>
          </div>
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px; display: flex; align-items: center; justify-content: space-between; opacity: 0.75;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Phone Verification</div>
              <div style="font-size: 11px; color: var(--text-muted);">For SMS dispatch text alerts.</div>
            </div>
            <span class="role-badge" style="background:#f1f5f9; color:#64748b; border: 1px solid #cbd5e1; font-weight:bold;">Coming Soon</span>
          </div>
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px; display: flex; align-items: center; justify-content: space-between; opacity: 0.75;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Carrier Audit License</div>
              <div style="font-size: 11px; color: var(--text-muted);">FMCSA authority validation check.</div>
            </div>
            <span class="role-badge" style="background:#f1f5f9; color:#64748b; border: 1px solid #cbd5e1; font-weight:bold;">Coming Soon</span>
          </div>
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px; display: flex; align-items: center; justify-content: space-between; opacity: 0.75;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Identity Verification</div>
              <div style="font-size: 11px; color: var(--text-muted);">Stripe Identity verification.</div>
            </div>
            <span class="role-badge" style="background:#f1f5f9; color:#64748b; border: 1px solid #cbd5e1; font-weight:bold;">Coming Soon</span>
          </div>
        </div>
        
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0 0 16px 0;">Change Account Password</h3>
          <div id="change-pass-error" class="alert alert-danger d-none" style="margin-bottom: 20px; font-size:13px; padding:12px;"></div>
          
          <form id="settings-password-form" style="display: flex; flex-direction: column; gap: 20px; max-width: 500px;">
            <div class="form-group" style="position: relative;">
              <label class="label">Current Password</label>
              <input type="password" id="settings-curr-pass" class="input" style="padding-right: 40px;" required>
              <button type="button" class="eye-toggle-btn" data-input-id="settings-curr-pass" style="position: absolute; right: 12px; top: 38px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted); opacity: 0.75; padding: 0;">👁️</button>
            </div>
            
            <div class="form-group" style="position: relative;">
              <label class="label">New Password</label>
              <input type="password" id="settings-new-pass" class="input" style="padding-right: 40px;" required>
              <button type="button" class="eye-toggle-btn" data-input-id="settings-new-pass" style="position: absolute; right: 12px; top: 38px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted); opacity: 0.75; padding: 0;">👁️</button>
            </div>
            
            <div class="password-requirements" style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Password Requirements</div>
              <div class="req-item" id="req-length-set" style="font-size: 12px; color: var(--color-rejected, #ef4444); display: flex; align-items: center; gap: 6px; font-weight:600;">❌ Min. 8 characters</div>
              <div class="req-item" id="req-upper-set" style="font-size: 12px; color: var(--color-rejected, #ef4444); display: flex; align-items: center; gap: 6px; font-weight:600;">❌ One uppercase letter</div>
              <div class="req-item" id="req-lower-set" style="font-size: 12px; color: var(--color-rejected, #ef4444); display: flex; align-items: center; gap: 6px; font-weight:600;">❌ One lowercase letter</div>
              <div class="req-item" id="req-number-set" style="font-size: 12px; color: var(--color-rejected, #ef4444); display: flex; align-items: center; gap: 6px; font-weight:600;">❌ One number</div>
              <div class="req-item" id="req-special-set" style="font-size: 12px; color: var(--color-rejected, #ef4444); display: flex; align-items: center; gap: 6px; font-weight:600;">❌ One special character</div>
            </div>
            
            <div class="form-group" style="position: relative;">
              <label class="label">Confirm New Password</label>
              <input type="password" id="settings-confirm-pass" class="input" style="padding-right: 40px;" required>
              <button type="button" class="eye-toggle-btn" data-input-id="settings-confirm-pass" style="position: absolute; right: 12px; top: 38px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted); opacity: 0.75; padding: 0;">👁️</button>
            </div>
            
            <div>
              <button type="submit" class="btn btn-primary" style="height: 42px; padding: 0 24px; font-weight: 600; background: ${roleAccent}; border-color: ${roleAccent};">Update Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.querySelectorAll('.eye-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.getAttribute('data-input-id'));
        if (inp) {
          if (inp.type === 'password') {
            inp.type = 'text';
            btn.textContent = '🙈';
          } else {
            inp.type = 'password';
            btn.textContent = '👁️';
          }
        }
      });
    });
    
    const newPassInput = document.getElementById('settings-new-pass');
    newPassInput.addEventListener('input', () => {
      const val = newPassInput.value;
      const rules = {
        length: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        number: /[0-9]/.test(val),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(val)
      };
      
      const updateRuleUI = (id, isValid, text) => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = isValid ? `✓ ${text}` : `❌ ${text}`;
          el.style.color = isValid ? 'var(--color-approved, #22c55e)' : 'var(--color-rejected, #ef4444)';
        }
      };
      
      updateRuleUI('req-length-set', rules.length, "Min. 8 characters");
      updateRuleUI('req-upper-set', rules.upper, "One uppercase letter");
      updateRuleUI('req-lower-set', rules.lower, "One lowercase letter");
      updateRuleUI('req-number-set', rules.number, "One number");
      updateRuleUI('req-special-set', rules.special, "One special character");
    });
    
    document.getElementById('settings-password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const curr = document.getElementById('settings-curr-pass').value;
      const newP = newPassInput.value;
      const conf = document.getElementById('settings-confirm-pass').value;
      const errBox = document.getElementById('change-pass-error');
      
      if (errBox) errBox.classList.add('d-none');
      
      if (sha256(curr) !== user.password) {
        if (errBox) {
          errBox.textContent = "Current password is incorrect.";
          errBox.classList.remove('d-none');
        }
        return;
      }
      
      const isComplex = newP.length >= 8 && /[A-Z]/.test(newP) && /[a-z]/.test(newP) && /[0-9]/.test(newP) && /[!@#$%^&*(),.?":{}|<>]/.test(newP);
      if (!isComplex) {
        if (errBox) {
          errBox.textContent = "New password does not meet complexity requirements.";
          errBox.classList.remove('d-none');
        }
        return;
      }
      
      if (newP !== conf) {
        if (errBox) {
          errBox.textContent = "New passwords do not match.";
          errBox.classList.remove('d-none');
        }
        return;
      }
      
      openSensitiveChangeOtpModal('password', () => {
        Store.updateUserSensitiveField(user.id, 'password', newP);
        showToast("Password updated successfully!");
        renderProfileViewContent();
      });
    });
  } else if (tabName === 'carrier-specs') {
    const logoSrc = user.companyLogo || `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="55" font-size="28" font-family="Outfit, sans-serif" font-weight="700" fill="#cbd5e1" text-anchor="middle">LOGO</text></svg>')}`;
    const mc = user.mcNumber || '';
    const dot = user.dotNumber || '';
    const selectedTypes = user.equipmentTypes || [];
    
    const equipmentOptions = ['Flatbed', 'Dry Van', 'Reefer', 'Step Deck', 'Hot Shot', 'Power Only'];
    const checklistHtml = equipmentOptions.map(opt => {
      const isChecked = selectedTypes.includes(opt) ? 'checked' : '';
      return `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-main);">
          <input type="checkbox" class="settings-equip-checkbox" value="${opt}" ${isChecked} style="width: 16px; height: 16px; accent-color: var(--color-carrier, #2563eb);">
          ${opt}
        </label>
      `;
    }).join('');
    
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Carrier Credentials</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Provide your USDOT authority information and equipment capabilities.</p>
        </div>
        
        <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px;">
          <div style="width: 90px; height: 90px; border-radius: var(--radius-md); overflow: hidden; background: #e2e8f0; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); border: 2px solid white; outline: 1px solid var(--border-color);">
            <img id="settings-logo-img" src="${logoSrc}" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Company Logo</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Upload your company logo for bids visibility.</div>
            <div style="display: flex; gap: 8px;">
              <button id="upload-logo-trigger" class="btn btn-outline btn-sm">Upload Logo</button>
              <button id="remove-logo-btn" class="btn btn-sm btn-outline" style="border-color: #ef4444; color: #ef4444;">Remove</button>
              <input type="file" id="settings-logo-input" accept="image/*" style="display: none;">
            </div>
          </div>
        </div>
        
        <form id="settings-carrier-form" style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group">
              <label class="label">USDOT Number <span style="color: red;">*</span></label>
              <input type="text" id="settings-dot" class="input" value="${dot}" required>
            </div>
            <div class="form-group">
              <label class="label">MC Number <span style="color: red;">*</span></label>
              <input type="text" id="settings-mc" class="input" value="${mc}" required>
            </div>
          </div>
          
          <div class="form-group">
            <label class="label" style="margin-bottom: 10px;">Equipment Specialization <span style="color: red;">*</span></label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 15px;">
              ${checklistHtml}
            </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" class="btn btn-primary" style="height: 42px; padding: 0 24px; font-weight: 600; background: var(--color-carrier, #2563eb); border-color: var(--color-carrier, #2563eb);">Save Carrier Credentials</button>
          </div>
        </form>
      </div>
    `;
    
    document.getElementById('upload-logo-trigger').addEventListener('click', () => {
      document.getElementById('settings-logo-input').click();
    });
    
    document.getElementById('settings-logo-input').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        openCroppingModal(e.target.files[0], (croppedBase64) => {
          user.companyLogo = croppedBase64;
          document.getElementById('settings-logo-img').src = croppedBase64;
          Store.updateUserProfile(user.id, {
            contactName: user.contactName,
            companyName: user.companyName,
            address: user.address,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            mcNumber: user.mcNumber,
            dotNumber: user.dotNumber,
            equipmentTypes: user.equipmentTypes,
            companyLogo: croppedBase64
          });
          showToast("Company logo updated successfully.");
        });
      }
    });
    
    document.getElementById('remove-logo-btn').addEventListener('click', () => {
      user.companyLogo = '';
      const defaultSrc = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="55" font-size="28" font-family="Outfit, sans-serif" font-weight="700" fill="#cbd5e1" text-anchor="middle">LOGO</text></svg>')}`;
      document.getElementById('settings-logo-img').src = defaultSrc;
      Store.updateUserProfile(user.id, {
        contactName: user.contactName,
        companyName: user.companyName,
        address: user.address,
        city: user.city,
        state: user.state,
        zip: user.zip,
        country: user.country,
        mcNumber: user.mcNumber,
        dotNumber: user.dotNumber,
        equipmentTypes: user.equipmentTypes,
        companyLogo: ''
      });
      showToast("Company logo removed.");
    });
    
    document.getElementById('settings-carrier-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newDot = document.getElementById('settings-dot').value.trim();
      const newMc = document.getElementById('settings-mc').value.trim();
      
      const selected = [];
      document.querySelectorAll('.settings-equip-checkbox:checked').forEach(cb => {
        selected.push(cb.value);
      });
      
      if (selected.length === 0) {
        alert("Please select at least one Equipment Type.");
        return;
      }
      
      Store.updateUserProfile(user.id, {
        contactName: user.contactName,
        companyName: user.companyName,
        address: user.address,
        city: user.city,
        state: user.state,
        zip: user.zip,
        country: user.country,
        mcNumber: newMc,
        dotNumber: newDot,
        equipmentTypes: selected
      });
      
      showToast("Carrier credentials updated successfully!");
      renderProfileViewContent();
    });
    
  } else if (tabName === 'activity-logs') {
    const logs = Store.getActivityLogs(user.id);
    let tableRows = '';
    
    if (logs.length === 0) {
      tableRows = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">No activity logs found for this account.</td></tr>`;
    } else {
      tableRows = logs.map(l => {
        let badgeColor = '#64748b';
        if (l.action === 'security_update') badgeColor = '#ef4444';
        else if (l.action === 'email_verified') badgeColor = '#22c55e';
        else if (l.action === 'profile_update') badgeColor = '#f59e0b';
        
        return `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 14px 10px; font-size: 13px; color: var(--text-muted); font-family: monospace;">${new Date(l.timestamp).toLocaleString()}</td>
            <td style="padding: 14px 10px; font-size: 12px; font-weight: 700;">
              <span class="role-badge" style="background: none; border: 1px solid ${badgeColor}; color: ${badgeColor}; padding: 3px 6px;">${l.action.toUpperCase()}</span>
            </td>
            <td style="padding: 14px 10px; font-size: 13px; color: var(--text-main); font-weight:500;">${l.details}</td>
          </tr>
        `;
      }).join('');
    }
    
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Activity Logs</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Auditable history of all sensitive actions and security revisions made on this account.</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-weight: 800; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 10px;">Timestamp</th>
              <th style="padding: 10px;">Action Type</th>
              <th style="padding: 10px;">Details Summary</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  } else if (tabName === 'email-logs') {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('movana_email_logs') || '[]');
    } catch (e) {}
    
    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let tableRows = '';
    if (logs.length === 0) {
      tableRows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No email delivery logs found.</td></tr>`;
    } else {
      tableRows = logs.map(l => {
        const isDelivered = l.status === 'delivered';
        const statusBadge = isDelivered 
          ? `<span class="role-badge" style="background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; font-weight:bold;">Delivered</span>`
          : `<span class="role-badge" style="background:#fee2e2; color:#ef4444; border:1px solid #fca5a5; font-weight:bold;">Failed</span>`;
          
        const detailText = isDelivered ? (l.response || 'Success') : (l.error || 'Unknown error');
        
        return `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 14px 10px; font-size: 13px; color: var(--text-muted); font-family: monospace; white-space: nowrap;">${new Date(l.timestamp).toLocaleString()}</td>
            <td style="padding: 14px 10px; font-size: 13px; color: var(--text-main); font-weight: 600;">${l.recipient}</td>
            <td style="padding: 14px 10px; font-size: 13px; color: var(--text-main); font-weight: 500;">
              <span class="role-badge" style="background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;">${l.template}</span>
            </td>
            <td style="padding: 14px 10px; font-size: 13px;">${statusBadge}</td>
            <td style="padding: 14px 10px; font-size: 11px; color: var(--text-muted); font-family: monospace; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${detailText.replace(/"/g, '&quot;')}">${detailText}</td>
          </tr>
        `;
      }).join('');
    }
    
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Email Delivery Logs</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Audit trail of transactional and notification emails dispatched to users.</p>
          </div>
          <button id="clear-email-logs-btn" class="btn btn-sm btn-outline" style="border-color: #ef4444; color: #ef4444; height: 32px;">Clear Logs</button>
        </div>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 600px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-weight: 800; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 10px;">Timestamp</th>
                <th style="padding: 10px;">Recipient</th>
                <th style="padding: 10px;">Template</th>
                <th style="padding: 10px;">Status</th>
                <th style="padding: 10px;">Details / Response</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('clear-email-logs-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all email delivery logs?')) {
        localStorage.removeItem('movana_email_logs');
        renderProfileSettingsTab('email-logs');
      }
    });
  }
}

// --- SETUP EVENT LISTENERS ---
function initApp() {
  bindAuthFormSubmit();
  bindSocialAuthListeners();
  setAuthMode('login');

  // Listen for social login popup messages
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data) {
      if (event.data.type === 'social-auth-verified') {
        handleSocialAuthSuccess(event.data.user);
      } else if (event.data.type === 'social-login-success') {
        const user = event.data.user;
        console.log("Social login successful! User object:", JSON.stringify(user, null, 2));
        showToast(`Welcome back, ${user.companyName}!`);
        switchView(user.role);
      }
    }
  });

  // Navigation Logo returns home
  elements.logo.addEventListener('click', () => {
    const user = Store.getCurrentUser();
    if (user) {
      switchView(user.role);
    } else {
      switchView('landing');
    }
  });
  
  // Landing Actions
  elements.btnGetStarted.addEventListener('click', () => {
    setAuthMode('register');
    switchView('auth');
  });
  
  elements.btnViewMarketplace.addEventListener('click', () => {
    setAuthMode('login');
    switchView('auth');
  });
  
  // Auth Tab Toggles
  elements.tabLogin.addEventListener('click', () => setAuthMode('login'));
  elements.tabRegister.addEventListener('click', () => setAuthMode('register'));
  
  // Shipper Form Submission
  elements.postShipmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = Store.getCurrentUser();
    if (!user || user.role !== 'shipper') return;

    const originInput = document.getElementById('ship-origin');
    const destInput = document.getElementById('ship-destination');

    // Strict Autocomplete Validation
    if (originInput.dataset.selected !== 'true' || destInput.dataset.selected !== 'true') {
      alert('Please select a valid address from the autocomplete suggestions dropdown for both Pickup and Delivery locations.');
      return;
    }
    
    // Prevent invalid or incomplete (city-only) addresses
    if (!originInput.dataset.street || !destInput.dataset.street) {
      alert('Please select a specific street address, business, or warehouse (not just a city or state) for both Pickup and Delivery.');
      return;
    }
    
    const shipTypeVal = document.getElementById('ship-type').value;
    if (!shipTypeVal) {
      alert('Please select a shipment type.');
      return;
    }

    let descriptionText = document.getElementById('ship-description').value.trim();
    let weightVal = 0;
    let dimensionsVal = '';
    let shipmentTypeDetails = {};
    let cargoTypeVal = '';

    if (shipTypeVal === 'Vehicle Transport') {
      const vSubtype = document.getElementById('vehicle-type').value;
      const vMake = elements.vehicleMake.value;
      const vModel = elements.vehicleModel.value;
      const vYear = elements.vehicleYear.value;
      const vTrim = document.getElementById('vehicle-trim').value.trim();
      const vVin = elements.vehicleVin.value.trim().toUpperCase();
      const vCondition = document.getElementById('vehicle-condition').value;
      const runsAndDrives = document.getElementById('vehicle-opt-runs').checked;
      const hasKeys = document.getElementById('vehicle-opt-keys').checked;
      const convertible = document.getElementById('vehicle-opt-convertible').checked;
      const lifted = document.getElementById('vehicle-opt-lifted').checked;
      const lowered = document.getElementById('vehicle-opt-lowered').checked;

      if (!vSubtype || !vMake || !vModel || !vYear) {
        alert('Please complete all vehicle details (Sub-type, Manufacturer, Model, and Year).');
        return;
      }

      shipmentTypeDetails = {
        subType: vSubtype,
        make: vMake,
        model: vModel,
        year: vYear,
        trim: vTrim,
        vin: vVin,
        condition: vCondition,
        runsAndDrives,
        hasKeys,
        convertible,
        lifted,
        lowered
      };

      cargoTypeVal = `Vehicle: ${vYear} ${vMake} ${vModel}`;
      weightVal = 0;
      dimensionsVal = '';
    } else if (shipTypeVal === 'Motorcycle Transport') {
      const mYear = document.getElementById('moto-year').value;
      const mMake = document.getElementById('moto-make').value.trim();
      const mModel = document.getElementById('moto-model').value.trim();
      const mCondition = document.getElementById('moto-condition').value;

      if (!mYear || !mMake || !mModel) {
        alert('Please complete all motorcycle details.');
        return;
      }

      shipmentTypeDetails = {
        year: mYear,
        make: mMake,
        model: mModel,
        condition: mCondition
      };

      cargoTypeVal = `Motorcycle: ${mYear} ${mMake} ${mModel}`;
      weightVal = 0;
      dimensionsVal = '';
    } else if (shipTypeVal === 'Freight') {
      const fCommodity = document.getElementById('freight-commodity').value;
      const fPallets = parseInt(document.getElementById('freight-pallets').value) || 0;
      const fWeight = parseFloat(document.getElementById('freight-weight').value) || 0;
      const fDimensions = document.getElementById('freight-dimensions').value.trim();
      const stackable = document.getElementById('freight-stackable').checked;
      const hazmat = document.getElementById('freight-hazmat').checked;
      const liftgate = document.getElementById('freight-liftgate').checked;

      if (!fCommodity || !fWeight || !fDimensions) {
        alert('Please complete all freight details.');
        return;
      }

      shipmentTypeDetails = {
        commodity: fCommodity,
        pallets: fPallets,
        weight: fWeight,
        dimensions: fDimensions,
        stackable,
        hazmat,
        liftgate
      };

      cargoTypeVal = `Freight: ${fCommodity}`;
      weightVal = fWeight;
      dimensionsVal = fDimensions;
    } else if (shipTypeVal === 'Household Move') {
      const hSize = document.getElementById('household-size').value;
      const packing = document.getElementById('household-packing').checked;
      const loading = document.getElementById('household-loading').checked;
      const unloading = document.getElementById('household-unloading').checked;
      const storage = document.getElementById('household-storage').checked;

      if (!hSize) {
        alert('Please select the size of the move.');
        return;
      }

      shipmentTypeDetails = {
        moveSize: hSize,
        packing,
        loading,
        unloading,
        storage
      };

      cargoTypeVal = `Household Move (${hSize})`;
      weightVal = 0;
      dimensionsVal = '';
    } else if (shipTypeVal === 'Heavy Equipment') {
      const eType = document.getElementById('equipment-type').value.trim();
      const eCondition = document.getElementById('equipment-condition').value;
      const eMake = document.getElementById('equipment-make').value.trim();
      const eModel = document.getElementById('equipment-model').value.trim();
      const eWeight = parseFloat(document.getElementById('equipment-weight').value) || 0;
      const eDimensions = document.getElementById('equipment-dimensions').value.trim();

      if (!eType || !eMake || !eModel || !eWeight || !eDimensions) {
        alert('Please complete all equipment details.');
        return;
      }

      shipmentTypeDetails = {
        equipmentType: eType,
        condition: eCondition,
        make: eMake,
        model: eModel,
        weight: eWeight,
        dimensions: eDimensions
      };

      cargoTypeVal = `Heavy Equipment: ${eType} (${eMake} ${eModel})`;
      weightVal = eWeight;
      dimensionsVal = eDimensions;
    } else if (shipTypeVal === 'Boat Transport') {
      const bMake = document.getElementById('boat-make').value.trim();
      const bModel = document.getElementById('boat-model').value.trim();
      const bLength = parseFloat(document.getElementById('boat-length').value) || 0;
      const bWidth = parseFloat(document.getElementById('boat-width').value) || 0;
      const bHeight = parseFloat(document.getElementById('boat-height').value) || 0;
      const bTrailer = document.getElementById('boat-trailer').value;

      if (!bMake || !bModel || !bLength || !bWidth || !bHeight) {
        alert('Please complete all boat details.');
        return;
      }

      shipmentTypeDetails = {
        make: bMake,
        model: bModel,
        length: bLength,
        width: bWidth,
        height: bHeight,
        trailer: bTrailer
      };

      cargoTypeVal = `Boat: ${bMake} ${bModel} (${bLength} ft)`;
      weightVal = 0;
      dimensionsVal = `${bLength}x${bWidth}x${bHeight} ft`;
    } else if (shipTypeVal === 'RV Transport') {
      const rType = document.getElementById('rv-type').value;
      const rYear = document.getElementById('rv-year').value;
      const rMake = document.getElementById('rv-make').value.trim();
      const rModel = document.getElementById('rv-model').value.trim();
      const rLength = parseFloat(document.getElementById('rv-length').value) || 0;
      const rOperable = document.getElementById('rv-operable').value;

      if (!rType || !rYear || !rMake || !rModel || !rLength) {
        alert('Please complete all RV details.');
        return;
      }

      shipmentTypeDetails = {
        rvType: rType,
        year: rYear,
        make: rMake,
        model: rModel,
        length: rLength,
        operable: rOperable
      };

      cargoTypeVal = `RV: ${rYear} ${rMake} ${rModel} (${rType})`;
      weightVal = 0;
      dimensionsVal = `${rLength} ft`;
    } else if (shipTypeVal === 'Other') {
      const oCargo = document.getElementById('other-cargo-type').value.trim();
      const oWeight = parseFloat(document.getElementById('other-weight').value) || 0;
      const oDimensions = document.getElementById('other-dimensions').value.trim();

      if (!oCargo) {
        alert('Please specify the cargo type.');
        return;
      }

      shipmentTypeDetails = {
        cargoType: oCargo,
        weight: oWeight,
        dimensions: oDimensions
      };

      cargoTypeVal = `Other: ${oCargo}`;
      weightVal = oWeight;
      dimensionsVal = oDimensions;
    }

    const pickupVal = document.getElementById('ship-pickup').value;
    const deliveryVal = document.getElementById('ship-delivery').value;

    // Simple date range check
    if (new Date(deliveryVal) < new Date(pickupVal)) {
      alert('Drop-off date cannot be earlier than pickup date.');
      return;
    }
    
    // Process cover image compression from uploads
    let coverImage = '';
    if (uploadedPhotos.length > 0) {
      coverImage = await compressCoverImage(uploadedPhotos[0]);
    }

    // Pre-fetch actual OSRM routing mileage and duration
    let routeDistance = 0;
    let routeDuration = '';
    
    const pickupCoords = getCoordinates(originInput.dataset.lat, originInput.dataset.lon, originInput.value);
    const deliveryCoords = getCoordinates(destInput.dataset.lat, destInput.dataset.lon, destInput.value);
    
    try {
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${deliveryCoords[1]},${deliveryCoords[0]}?overview=false`;
      const res = await fetch(routeUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          routeDistance = Math.round(route.distance * 0.000621371); // convert to miles
          const hours = Math.floor(route.duration / 3600);
          const minutes = Math.round((route.duration % 3600) / 60);
          routeDuration = `${hours > 0 ? hours + ' hr ' : ''}${minutes} min`;
        }
      }
    } catch (err) {
      console.error('Failed to pre-fetch OSRM routing details', err);
    }
    
    const shipmentData = {
      origin: `${originInput.dataset.city}, ${originInput.dataset.state}`, // Masked public location (City, State)
      destination: `${destInput.dataset.city}, ${destInput.dataset.state}`, // Masked public location (City, State)
      cargoType: cargoTypeVal,
      weight: weightVal,
      dimensions: dimensionsVal,
      pickupDate: pickupVal,
      deliveryDate: deliveryVal,
      budget: document.getElementById('ship-budget').value,
      description: descriptionText,
      
      // Store full street address fields
      originStreetAddress: originInput.dataset.street || '',
      destinationStreetAddress: destInput.dataset.street || '',
      
      // Store urgency priority level
      priority: document.getElementById('ship-priority').value || 'flexible',

      // Store equipment required
      equipmentRequired: document.getElementById('ship-equipment').value || 'Dry Van',

      // Location coordinates & zip code metadata
      originCity: originInput.dataset.city || '',
      originState: originInput.dataset.state || '',
      originZip: originInput.dataset.zip || '',
      originLat: originInput.dataset.lat || '',
      originLon: originInput.dataset.lon || '',
      destinationCity: destInput.dataset.city || '',
      destinationState: destInput.dataset.state || '',
      destinationZip: destInput.dataset.zip || '',
      destinationLat: destInput.dataset.lat || '',
      destinationLon: destInput.dataset.lon || '',

      // Vehicle specific fields (backwards compatibility fallback)
      vehicleType: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.subType : '',
      vehicleMake: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.make : '',
      vehicleModel: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.model : '',
      vehicleYear: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.year : '',
      vehicleVin: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.vin : '',
      vehicleCondition: shipTypeVal === 'Vehicle Transport' ? shipmentTypeDetails.condition : '',

      // Shipment type properties
      shipmentType: shipTypeVal,
      shipmentTypeDetails: shipmentTypeDetails,

      // Photos metadata
      coverImage: coverImage,
      photoCount: uploadedPhotos.length,

      // Pre-fetched route details
      routeDistance: routeDistance,
      routeDuration: routeDuration
    };
    
    try {
      const createdShipment = Store.createShipment(user.id, user.companyName, shipmentData);
      
      // Save all photos to IndexedDB using shipment ID
      if (uploadedPhotos.length > 0) {
        await Store.saveShipmentPhotos(createdShipment.id, uploadedPhotos);
      }
      
      showToast('Shipment listing published successfully!');
      
      // Trigger Shipment Posted Email
      (function() {
        const emailTemplate = EmailTemplates.shipmentPosted(user.username, createdShipment.cargoType, createdShipment.origin, createdShipment.destination);
        sendEmail(user.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text, "shipmentPosted").catch(err => {
          console.error("Failed to send shipment posted email:", err);
        });
      })();
      
      // Reset Form fields
      originInput.value = '';
      originInput.dataset.selected = 'false';
      delete originInput.dataset.street;
      delete originInput.dataset.city;
      delete originInput.dataset.state;
      delete originInput.dataset.zip;
      delete originInput.dataset.lat;
      delete originInput.dataset.lon;
      
      destInput.value = '';
      destInput.dataset.selected = 'false';
      delete destInput.dataset.street;
      delete destInput.dataset.city;
      delete destInput.dataset.state;
      delete destInput.dataset.zip;
      delete destInput.dataset.lat;
      delete destInput.dataset.lon;
      
      document.getElementById('ship-type').value = '';
      document.getElementById('ship-priority').value = 'flexible';
      document.getElementById('ship-equipment').value = '';
      document.getElementById('ship-budget').value = '';
      document.getElementById('ship-description').value = '';
      document.getElementById('ship-pickup').value = '';
      document.getElementById('ship-delivery').value = '';

      // Reset photos state
      uploadedPhotos = [];
      elements.photoPreviews.innerHTML = '';
      if (elements.shipPhotos) elements.shipPhotos.value = '';

      // Hide all dynamic subforms and reset inputs programmatically
      document.querySelectorAll('.form-type-section').forEach(section => {
        section.classList.add('d-none');
        section.querySelectorAll('input, select, textarea').forEach(input => {
          input.removeAttribute('required');
          if (input.type === 'checkbox') {
            input.checked = false;
          } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
          } else {
            input.value = '';
          }
        });
      });

      // Clear specific vehicle models and indicators
      elements.vehicleSpecsWrapper.classList.add('d-none');
      elements.vehicleModel.innerHTML = '<option value="" disabled selected>Select Model</option>';
      elements.vehicleModel.disabled = true;
      elements.vinDecodeSuccess.classList.add('d-none');
      elements.vinDecodeSuccess.innerHTML = '';
      
      renderShipperDashboard();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
  
  // Shipper Dashboard Visual Filter Toggles
  const filters = [
    { el: elements.shipperFilterAll, val: 'all' },
    { el: elements.shipperFilterOpen, val: 'open' },
    { el: elements.shipperFilterAssigned, val: 'assigned' },
    { el: elements.shipperFilterCompleted, val: 'delivered' }
  ];
  
  filters.forEach(item => {
    item.el.addEventListener('click', () => {
      filters.forEach(i => i.el.classList.remove('active'));
      item.el.classList.add('active');
      shipperFilter = item.val;
      renderShipperDashboard();
    });
  });
  
  // Carrier board filters and search
  elements.carrierSearch.addEventListener('input', renderCarrierDashboard);
  elements.carrierFilterCargo.addEventListener('change', renderCarrierDashboard);
  
  // Bid Offer Form Submission
  elements.bidForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const carrier = Store.getCurrentUser();
    if (!carrier || carrier.role !== 'carrier') return;
    
    const shipmentId = elements.bidShipmentId.value;
    const earliestPickup = document.getElementById('bid-pickup-date').value;
    const deliveryDate = elements.bidDeliveryDate.value;
    
    if (new Date(deliveryDate) < new Date(earliestPickup)) {
      alert('Estimated delivery date cannot be earlier than earliest pickup date.');
      return;
    }
    
    const ackCheckbox = document.getElementById('bid-acknowledgement-checkbox');
    if (ackCheckbox && !ackCheckbox.checked) {
      alert('You must review the shipment and agree to complete it as requested.');
      return;
    }
    
    const bidData = {
      amount: elements.bidAmount.value,
      deliveryDate: deliveryDate,
      earliestPickupDate: earliestPickup,
      message: elements.bidMessage.value.trim()
    };
    
    // Check message for sensitive information
    if (bidData.message && containsProhibitedInfo(bidData.message)) {
      Store.logViolation(carrier.id, bidData.message, 'bid_message');
      
      const msg = "Sensitive information was detected in your message.\n\nFor the protection of both parties, contact information cannot be exchanged before a shipment has been awarded.\n\nRepeated violations may result in suspension of your account.";
      alert(msg);
      
      elements.bidError.textContent = "Sensitive information was detected in your message. For the protection of both parties, contact information cannot be exchanged before a shipment has been awarded.";
      elements.bidError.classList.remove('d-none');
      return;
    }
    
    try {
      Store.createBid(carrier.id, carrier.companyName, shipmentId, bidData);
      showToast('Bid offer submitted to shipper!');
      
      const shipment = Store.getShipment(shipmentId);
      if (shipment) {
        addNotification(shipment.shipperId, `New bid of $${parseFloat(bidData.amount).toLocaleString()} received on shipment #${shipmentId.replace('ship_', '')}`, 'new_bid', shipmentId);
        
        // Trigger New Bid Received Email
        (function() {
          const rawStore = JSON.parse(localStorage.getItem('movana_store_data'));
          const shipper = rawStore.users.find(u => u.id === shipment.shipperId);
          if (shipper && shipper.email) {
            const emailTemplate = EmailTemplates.newBidReceived(shipper.username, shipment.cargoType, carrier.companyName, parseFloat(bidData.amount).toLocaleString());
            sendEmail(shipper.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text, "newBidReceived").catch(err => {
              console.error("Failed to send new bid email:", err);
            });
          }
        })();
      }
      
      elements.bidModal.classList.remove('active');
      renderCarrierDashboard();
    } catch (err) {
      elements.bidError.textContent = err.message;
      elements.bidError.classList.remove('d-none');
    }
  });
  
  // Modal Dismissals
  elements.closeBidModal.addEventListener('click', () => elements.bidModal.classList.remove('active'));
  elements.cancelBidSubmit.addEventListener('click', () => elements.bidModal.classList.remove('active'));
  
  const closeDetails = () => {
    elements.detailsModal.classList.remove('active');
    if (routeAnimationInterval) {
      clearInterval(routeAnimationInterval);
      routeAnimationInterval = null;
    }
  };
  elements.closeDetailsModal.addEventListener('click', closeDetails);
  elements.closeDetailsFooter.addEventListener('click', closeDetails);
  
  // Close negotiation modal listener
  const closeNegModalBtn = document.getElementById('close-negotiation-modal');
  if (closeNegModalBtn) {
    closeNegModalBtn.addEventListener('click', () => {
      document.getElementById('negotiation-modal').classList.remove('active');
      activeChatBidId = null;
    });
  }
  
  // Click outside to dismiss modals
  window.addEventListener('click', (e) => {
    if (e.target === elements.bidModal) {
      elements.bidModal.classList.remove('active');
    }
    if (e.target === elements.detailsModal) {
      closeDetails();
    }
    if (e.target === elements.lightboxModal) {
      elements.lightboxModal.classList.remove('active');
    }
    const negModal = document.getElementById('negotiation-modal');
    if (e.target === negModal) {
      negModal.classList.remove('active');
      activeChatBidId = null;
    }
  });
  
  // Initialize dynamic autocomplete & zipcode helpers
  setupAutocomplete(document.getElementById('ship-origin'), elements.originSuggestions);
  setupAutocomplete(document.getElementById('ship-destination'), elements.destinationSuggestions);

  // Initialize dynamic sub-forms and validation flow
  setupSmartFormFlow();

  // Initialize photos upload dropzone
  initPhotoUpload();

  // Initialize lightbox gallery modal controls
  initLightboxGallery();

  // Close Lightbox trigger
  if (elements.closeLightboxModal) {
    elements.closeLightboxModal.addEventListener('click', () => {
      elements.lightboxModal.classList.remove('active');
    });
  }

  // Load Board Filters and Search Listeners
  const boardFilterForm = document.getElementById('loadboard-filter-form');
  if (boardFilterForm) {
    const filterInputs = boardFilterForm.querySelectorAll('input, select');
    filterInputs.forEach(input => {
      input.addEventListener('input', () => {
        loadboardPage = 1;
        renderLoadBoard();
      });
      input.addEventListener('change', () => {
        loadboardPage = 1;
        renderLoadBoard();
      });
    });

    document.getElementById('board-filter-reset').addEventListener('click', () => {
      boardFilterForm.reset();
      loadboardPage = 1;
      renderLoadBoard();
    });
  }

  // Load Board Sorting
  if (elements.boardSortBy) {
    elements.boardSortBy.addEventListener('change', () => {
      loadboardPage = 1;
      renderLoadBoard();
    });
  }

  // Load Board Layout toggles
  if (elements.toggleViewCard && elements.toggleViewTable) {
    elements.toggleViewCard.addEventListener('click', () => {
      loadboardLayout = 'card';
      renderLoadBoard();
    });
    elements.toggleViewTable.addEventListener('click', () => {
      loadboardLayout = 'table';
      renderLoadBoard();
    });
  }

  // Trigger native date picker calendar on field click
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('click', () => {
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        }
      } catch (err) {
        console.warn('Native date picker showPicker() not supported or blocked:', err);
      }
    });
  });

  // Initialize column headers and dropdown list DOM elements dynamically
  const theadRow = document.querySelector('.loadboard-table thead tr');
  if (theadRow) {
    theadRow.innerHTML = `
      <th class="col-pickup" style="width: 16%; min-width: 140px;">Pickup Location</th>
      <th class="col-delivery" style="width: 16%; min-width: 140px;">Delivery Location</th>
      <th class="col-distance" style="width: 80px;">Distance</th>
      <th class="col-budget" style="width: 110px;">Budget</th>
      <th class="col-weight" style="width: 90px;">Weight</th>
      <th class="col-type" style="width: 110px;">Shipment Type</th>
      <th class="col-priority" style="width: 90px;">Priority</th>
      <th class="col-equipment" style="width: 120px;">Equipment</th>
      <th class="col-bids" style="width: 75px;">Bids</th>
      <th class="col-posted" style="width: 85px;">Posted</th>
      <th class="col-date" style="width: 110px;">Pickup Date</th>
      <th class="col-status" style="width: 85px;">Status</th>
      <th class="col-details" style="width: 110px; min-width: 110px; text-align: center;">View Load</th>
    `;
  }

  const dropdownColumnsList = document.getElementById('dropdown-columns-list');
  if (dropdownColumnsList) {
    dropdownColumnsList.innerHTML = `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-pickup" checked> Pickup Location
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-delivery" checked> Delivery Location
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-distance" checked> Distance
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-budget" checked> Budget
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-weight" checked> Weight
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-type" checked> Shipment Type
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-priority" checked> Priority
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-equipment" checked> Equipment
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-bids" checked> Bids
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-posted" checked> Posted
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-date" checked> Pickup Date
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-color); margin-bottom: 0;">
        <input type="checkbox" class="col-toggle-checkbox" data-column="col-status" checked> Status
      </label>
    `;
  }

  // Load preferences for user
  loadColumnPreferences();
  updateTableColumnVisibility();

  // Column visibility button toggle click handler
  const btnToggleColumns = document.getElementById('btn-toggle-columns');
  if (btnToggleColumns && dropdownColumnsList) {
    btnToggleColumns.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownColumnsList.classList.toggle('d-none');
    });
    
    document.addEventListener('click', (e) => {
      if (!dropdownColumnsList.classList.contains('d-none') && !btnToggleColumns.contains(e.target) && !dropdownColumnsList.contains(e.target)) {
        dropdownColumnsList.classList.add('d-none');
      }
    });
  }

  const colCheckboxes = document.querySelectorAll('.col-toggle-checkbox');
  colCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateTableColumnVisibility();
      saveColumnPreferences();
    });
  });

  // Resolve initial view from clean SPA route / hash routing on load
  handleUrlRouting();
  // Inject status colors style tag
  injectStatusStyles();
  // Inject dedicated inbox styles
  injectInboxStyles();
  // Create inbox DOM
  createInboxViewDom();
  // Restructure carrier bid form modal
  setupBidModalForm();
  // Set up negotiation modal event handlers
  setupNegotiationModalEvents();
  
  // Bind click listener for notification bell icon
  const notifContainer = document.getElementById('nav-notif-container');
  if (notifContainer) {
    notifContainer.addEventListener('click', toggleNotifOverlayPanel);
  }
  
  // Set up a real-time polling interval for synchronization
  setInterval(() => {
    const user = Store.getCurrentUser();
    if (!user) return;
    
    // Update navigation badges
    updateInboxBadge();
    updateNotificationCenterUI();
    
    // If inbox view is active, refresh the UI
    if (currentView === 'inbox') {
      const listContainer = document.getElementById('inbox-conversation-list');
      if (listContainer) {
        const allBids = Store.getBids();
        let totalMsgs = 0;
        allBids.forEach(b => {
          const neg = Store.getNegotiationForBid(b.id);
          if (neg && neg.messages) totalMsgs += neg.messages.length;
        });
        
        // Save state to compare
        const lastMsgCountKey = `movana_polling_msg_count_${user.id}`;
        const lastMsgCount = parseInt(localStorage.getItem(lastMsgCountKey) || '0');
        
        if (totalMsgs !== lastMsgCount) {
          localStorage.setItem(lastMsgCountKey, totalMsgs);
          renderInboxConversationList(currentInboxFilter);
          if (activeInboxBidId) {
            if (activeInboxTab === 'messages') {
              renderInboxChatHistory(activeInboxBidId);
            } else {
              renderInboxWorkspaceContent(activeInboxBidId);
            }
          }
        }
      }
    }
  }, 1000);
}

  // Real-time Firestore Update UI listener
  window.addEventListener('movana-store-updated', () => {
    const user = Store.getCurrentUser();
    if (!user) return;

    // Update navigation badges
    updateInboxBadge();
    updateNotificationCenterUI();

    // Re-render active view
    if (currentView === 'shipper') {
      renderShipperDashboard();
    } else if (currentView === 'carrier') {
      renderCarrierDashboard();
    } else if (currentView === 'loadboard') {
      renderLoadBoard();
    } else if (currentView === 'inbox') {
      renderInboxConversationList(currentInboxFilter);
      if (activeInboxBidId) {
        if (activeInboxTab === 'messages') {
          renderInboxChatHistory(activeInboxBidId);
        } else {
          renderInboxWorkspaceContent(activeInboxBidId);
        }
      }
    } else if (currentView === 'profile') {
      renderProfileViewContent();
    }
  });

// Initial Run
initApp();

})();
