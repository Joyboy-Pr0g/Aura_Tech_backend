import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL =
    process.env.SENDGRID_FROM_EMAIL || "noreply@aura-tech.com";

const BRAND = {
    bg: "#050507",
    card: "#0F0F0F",
    cardInner: "#1A1A1A",
    primary: "#00D9FF",
    secondary: "#0066FF",
    text: "#F5F5F5",
    muted: "rgba(255,255,255,0.6)",
    faint: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
    danger: "#FF3B5C",
    success: "#00C853",
} as const;

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

interface AuraEmailLayoutOptions {
    title: string;
    greeting: string;
    bodyHtml: string;
    code?: string;
    codeAccent?: string;
    footerNote?: string;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildAuraEmailLayout({
    title,
    greeting,
    bodyHtml,
    code,
    codeAccent = BRAND.primary,
    footerNote = "This is an automated message from AURA TECH. Please do not reply to this email.",
}: AuraEmailLayoutOptions): string {
    const codeBlock = code
        ? `
        <tr>
          <td style="padding:0 32px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cardInner};border:1px solid ${codeAccent}4D;border-radius:8px;">
              <tr>
                <td align="center" style="padding:28px 20px;">
                  <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:10px;color:${codeAccent};font-family:'Courier New',Courier,monospace;">
                    ${escapeHtml(code)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Inter,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:36px 32px 28px;text-align:center;border-bottom:1px solid ${BRAND.border};background:linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%);">
              <p style="margin:0;font-size:30px;font-weight:800;letter-spacing:3px;line-height:1;">
                <span style="color:${BRAND.primary};">AURA</span><span style="color:${BRAND.text};">TECH</span>
              </p>
              <p style="margin:10px 0 0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRAND.faint};">
                Premium Tech · Yemen
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.text};line-height:1.3;">
                ${escapeHtml(title)}
              </h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${BRAND.muted};">
                ${escapeHtml(greeting)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <div style="font-size:15px;line-height:1.7;color:${BRAND.muted};">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          ${codeBlock}
          <tr>
            <td style="padding:24px 32px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.faint};border-top:1px solid ${BRAND.border};padding-top:20px;">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${BRAND.faint};">
                &copy; ${new Date().getFullYear()} AURA TECH · Sana'a, Yemen
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        if (!SENDGRID_API_KEY) {
            console.warn(
                "⚠️  SENDGRID_API_KEY not configured, logging email stub instead:",
            );
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log("(email body suppressed — SendGrid not configured)");
            return true;
        }

        const msg = {
            to: options.to,
            from: SENDGRID_FROM_EMAIL,
            subject: options.subject,
            html: options.html,
            text: options.text || options.subject,
            trackingSettings: {
                clickTracking: { enable: true },
                openTracking: { enable: true },
            },
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent to ${options.to}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
}

export async function sendEmailVerificationCode(
    email: string,
    code: string,
    full_name: string,
): Promise<boolean> {
    const html = buildAuraEmailLayout({
        title: "Verify your email",
        greeting: `Hello ${full_name},`,
        bodyHtml: `
          <p style="margin:0 0 16px;">Welcome to <strong style="color:${BRAND.text};">AURA TECH</strong> — Yemen's destination for premium gaming and tech gear.</p>
          <p style="margin:0;">Enter the verification code below to confirm your email address:</p>
        `,
        code,
        footerNote: "This code expires in 15 minutes. If you did not create an AURA TECH account, you can safely ignore this email.",
    });

    return sendEmail({
        to: email,
        subject: "Verify your email — AURA TECH",
        html,
        text: `Hello ${full_name},\n\nYour AURA TECH email verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    });
}

export async function sendPhoneVerificationNotification(
    email: string,
    code: string,
    full_name: string,
): Promise<boolean> {
    const html = buildAuraEmailLayout({
        title: "Phone verification",
        greeting: `Hello ${full_name},`,
        bodyHtml: `
          <p style="margin:0 0 16px;">You're almost set up on <strong style="color:${BRAND.text};">AURA TECH</strong>.</p>
          <p style="margin:0;">Use the code below to verify your Yemeni mobile number and complete your registration:</p>
        `,
        code,
        codeAccent: BRAND.success,
        footerNote: "This code expires in 15 minutes. If you did not request this, please ignore this email.",
    });

    return sendEmail({
        to: email,
        subject: "Phone verification code — AURA TECH",
        html,
        text: `Hello ${full_name},\n\nYour AURA TECH phone verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    });
}

export async function sendPasswordResetCode(
    email: string,
    code: string,
    full_name: string,
): Promise<boolean> {
    const html = buildAuraEmailLayout({
        title: "Reset your password",
        greeting: `Hello ${full_name},`,
        bodyHtml: `
          <p style="margin:0 0 16px;">We received a request to reset your <strong style="color:${BRAND.text};">AURA TECH</strong> account password.</p>
          <p style="margin:0;">Enter this code to continue:</p>
        `,
        code,
        codeAccent: BRAND.danger,
        footerNote: "This code expires in 30 minutes. If you did not request a password reset, ignore this email — your password will stay the same.",
    });

    return sendEmail({
        to: email,
        subject: "Password reset code — AURA TECH",
        html,
        text: `Hello ${full_name},\n\nYour AURA TECH password reset code is: ${code}\n\nThis code expires in 30 minutes.`,
    });
}

export async function sendPasswordResetEmail(
    email: string,
    password: string,
    full_name: string,
): Promise<boolean> {
    const html = buildAuraEmailLayout({
        title: "Your password has been reset",
        greeting: `Hello ${full_name},`,
        bodyHtml: `
          <p style="margin:0 0 16px;">Your <strong style="color:${BRAND.text};">AURA TECH</strong> password was reset successfully.</p>
          <p style="margin:0;">Your new temporary password is shown below. Sign in and change it as soon as possible.</p>
        `,
        code: password,
        codeAccent: BRAND.secondary,
        footerNote: "Keep this password private and do not share it with anyone. If you did not request this change, contact support immediately.",
    });

    return sendEmail({
        to: email,
        subject: "Your new password — AURA TECH",
        html,
        text: `Hello ${full_name},\n\nYour AURA TECH password has been reset.\n\nNew password: ${password}\n\nPlease sign in and change it as soon as possible.`,
    });
}

export async function sendWelcomeEmail(
    email: string,
    full_name: string,
): Promise<boolean> {
    const html = buildAuraEmailLayout({
        title: "Welcome to AURA TECH",
        greeting: `Hello ${full_name},`,
        bodyHtml: `
          <p style="margin:0 0 20px;">Your account is ready. You're now part of Yemen's premium tech and gaming store.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cardInner};border:1px solid ${BRAND.border};border-radius:8px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${BRAND.text};text-transform:uppercase;letter-spacing:1px;">What's next</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.muted};">&#8226;&nbsp;Browse laptops, phones, and gaming gear</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.muted};">&#8226;&nbsp;Add items to your cart and checkout securely</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.muted};">&#8226;&nbsp;Track orders and manage your addresses</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">&#8226;&nbsp;Save favourites to your wishlist</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;">Questions? Our team is here to help you get the gear you need.</p>
        `,
        footerNote: "Thank you for choosing AURA TECH — technology for Yemen, delivered with care.",
    });

    return sendEmail({
        to: email,
        subject: "Welcome to AURA TECH",
        html,
        text: `Hello ${full_name},\n\nWelcome to AURA TECH! Your account has been created successfully.\n\nBrowse products, place orders, and track deliveries from your dashboard.`,
    });
}
