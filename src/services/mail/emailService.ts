import { BrevoClient } from '@getbrevo/brevo';
import { container } from 'tsyringe';
import { WebsiteSettingsService } from '../websiteSettings/WebsiteSettingsService';

const BRAND_NAME = 'AuraTech';

const BRAND = {
  bg: '#050507',
  card: '#0F0F0F',
  cardInner: '#1A1A1A',
  primary: '#00D9FF',
  secondary: '#0066FF',
  text: '#F5F5F5',
  muted: 'rgba(255,255,255,0.6)',
  faint: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
  danger: '#FF3B5C',
  success: '#00C853',
} as const;

const DEFAULT_FOOTER_NOTE =
  'هذه رسالة آلية من AuraTech. يُرجى عدم الرد على هذا البريد.';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

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

async function getEmailLogoUrl(): Promise<string | null> {
  const settingsService = container.resolve(WebsiteSettingsService);
  const settings = await settingsService.getSettings();

  return settings.header_logo_url?.trim() || settings.footer_logo_url?.trim() || null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildAuraEmailLayout({
  title,
  greeting,
  bodyHtml,
  code,
  codeAccent = BRAND.primary,
  footerNote = DEFAULT_FOOTER_NOTE,
}: AuraEmailLayoutOptions): Promise<string> {
  const logoUrl = await getEmailLogoUrl();

  const logoBlock = logoUrl
    ? `<img
                src="${escapeHtml(logoUrl)}"
                alt="${escapeHtml(BRAND_NAME)}"
                width="140"
                style="display:block;margin:0 auto 16px;max-width:160px;height:auto;border:0;"
              />`
    : '';

  const codeBlock = code
    ? `
        <tr>
          <td style="padding:0 32px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cardInner};border:1px solid ${codeAccent}4D;border-radius:8px;">
              <tr>
                <td align="center" dir="ltr" style="padding:28px 20px;">
                  <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:10px;color:${codeAccent};font-family:'Courier New',Courier,monospace;direction:ltr;unicode-bidi:embed;">
                    ${escapeHtml(code)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Segoe UI',Tahoma,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};direction:rtl;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;direction:rtl;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid ${BRAND.border};background:linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%);">
              ${logoBlock}
              <p style="margin:0;font-size:26px;font-weight:800;letter-spacing:2px;line-height:1;color:${BRAND.text};">
                ${BRAND_NAME}
              </p>
              <p style="margin:10px 0 0;font-size:12px;font-weight:600;color:${BRAND.faint};">
                تقنية متميزة · اليمن
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;text-align:right;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.text};line-height:1.4;">
                ${escapeHtml(title)}
              </h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:${BRAND.muted};">
                ${escapeHtml(greeting)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;text-align:right;">
              <div style="font-size:15px;line-height:1.8;color:${BRAND.muted};">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          ${codeBlock}
          <tr>
            <td style="padding:24px 32px 32px;text-align:right;">
              <p style="margin:0;font-size:12px;line-height:1.7;color:${BRAND.faint};border-top:1px solid ${BRAND.border};padding-top:20px;">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${BRAND.faint};">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME} · صنعاء، اليمن
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
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️  BREVO_API_KEY not configured, logging email stub instead:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      return true;
    }

    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: process.env.BREVO_FROM_EMAIL!, name: BRAND_NAME },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || options.subject,
    });

    console.log(`✅ Email sent to ${options.to}, Message ID:`, result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

export async function sendEmailChangeVerificationCode(
  email: string,
  code: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: 'تأكيد بريدك الإلكتروني الجديد',
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 16px;">طلبت تغيير البريد الإلكتروني لحسابك في <strong style="color:${BRAND.text};">${BRAND_NAME}</strong>.</p>
          <p style="margin:0;">أدخل رمز التحقق أدناه لتأكيد عنوان البريد الجديد:</p>
        `,
    code,
    footerNote:
      'ينتهي صلاحية هذا الرمز خلال 15 دقيقة. إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد بأمان.',
  });

  return sendEmail({
    to: email,
    subject: `تأكيد بريدك الإلكتروني الجديد — ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nرمز تأكيد تغيير البريد في ${BRAND_NAME} هو: ${code}\n\nينتهي صلاحية هذا الرمز خلال 15 دقيقة.`,
  });
}

export async function sendEmailVerificationCode(
  email: string,
  code: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: 'تحقق من بريدك الإلكتروني',
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 16px;">مرحباً بك في <strong style="color:${BRAND.text};">${BRAND_NAME}</strong> — وجهتك للأجهزة والتقنية والألعاب المتميزة في اليمن.</p>
          <p style="margin:0;">أدخل رمز التحقق أدناه لتأكيد بريدك الإلكتروني:</p>
        `,
    code,
    footerNote:
      'ينتهي صلاحية هذا الرمز خلال 15 دقيقة. إذا لم تنشئ حساباً في AuraTech، يمكنك تجاهل هذا البريد بأمان.',
  });

  return sendEmail({
    to: email,
    subject: `تحقق من بريدك الإلكتروني — ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nرمز التحقق من البريد في ${BRAND_NAME} هو: ${code}\n\nينتهي صلاحية هذا الرمز خلال 15 دقيقة.`,
  });
}

export async function sendPhoneVerificationNotification(
  email: string,
  code: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: 'التحقق من رقم الهاتف',
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 16px;">أنت على وشك إكمال إعداد حسابك في <strong style="color:${BRAND.text};">${BRAND_NAME}</strong>.</p>
          <p style="margin:0;">استخدم الرمز أدناه للتحقق من رقم هاتفك اليمني وإكمال التسجيل:</p>
        `,
    code,
    codeAccent: BRAND.success,
    footerNote:
      'ينتهي صلاحية هذا الرمز خلال 15 دقيقة. إذا لم تطلب ذلك، يُرجى تجاهل هذا البريد.',
  });

  return sendEmail({
    to: email,
    subject: `رمز التحقق من الهاتف — ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nرمز التحقق من الهاتف في ${BRAND_NAME} هو: ${code}\n\nينتهي صلاحية هذا الرمز خلال 15 دقيقة.`,
  });
}

export async function sendPasswordResetCode(
  email: string,
  code: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: 'إعادة تعيين كلمة المرور',
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 16px;">تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في <strong style="color:${BRAND.text};">${BRAND_NAME}</strong>.</p>
          <p style="margin:0;">أدخل هذا الرمز للمتابعة:</p>
        `,
    code,
    codeAccent: BRAND.danger,
    footerNote:
      'ينتهي صلاحية هذا الرمز خلال 30 دقيقة. إذا لم تطلب إعادة التعيين، تجاهل هذا البريد — ستبقى كلمة مرورك كما هي.',
  });

  return sendEmail({
    to: email,
    subject: `رمز إعادة تعيين كلمة المرور — ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nرمز إعادة تعيين كلمة المرور في ${BRAND_NAME} هو: ${code}\n\nينتهي صلاحية هذا الرمز خلال 30 دقيقة.`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  password: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: 'تم إعادة تعيين كلمة مرورك',
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 16px;">تم إعادة تعيين كلمة مرور حسابك في <strong style="color:${BRAND.text};">${BRAND_NAME}</strong> بنجاح.</p>
          <p style="margin:0;">كلمة المرور المؤقتة الجديدة موضحة أدناه. سجّل الدخول وغيّرها في أقرب وقت ممكن.</p>
        `,
    code: password,
    codeAccent: BRAND.secondary,
    footerNote:
      'احتفظ بكلمة المرور سرية ولا تشاركها مع أحد. إذا لم تطلب هذا التغيير، تواصل مع الدعم فوراً.',
  });

  return sendEmail({
    to: email,
    subject: `كلمة مرورك الجديدة — ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nتم إعادة تعيين كلمة مرور ${BRAND_NAME}.\n\nكلمة المرور الجديدة: ${password}\n\nيُرجى تسجيل الدخول وتغييرها في أقرب وقت.`,
  });
}

export async function sendWelcomeEmail(
  email: string,
  full_name: string,
): Promise<boolean> {
  const html = await buildAuraEmailLayout({
    title: `مرحباً بك في ${BRAND_NAME}`,
    greeting: `مرحباً ${full_name}،`,
    bodyHtml: `
          <p style="margin:0 0 20px;">حسابك جاهز. أنت الآن جزء من متجر التقنية والألعاب المتميز في اليمن.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cardInner};border:1px solid ${BRAND.border};border-radius:8px;">
            <tr>
              <td style="padding:20px 24px;text-align:right;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${BRAND.text};">الخطوات التالية</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${BRAND.muted};">&#8226;&nbsp;تصفّح الحواسيب والهواتف ومعدات الألعاب</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${BRAND.muted};">&#8226;&nbsp;أضف المنتجات إلى سلة التسوق وادفع بأمان</p>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${BRAND.muted};">&#8226;&nbsp;تتبّع الطلبات وأدر عناوينك</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.muted};">&#8226;&nbsp;احفظ المفضلة في قائمة الأمنيات</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;">هل لديك أسئلة؟ فريقنا جاهز لمساعدتك في الحصول على ما تحتاجه.</p>
        `,
    footerNote: `شكراً لاختيارك ${BRAND_NAME} — تقنية لليمن، بعناية واهتمام.`,
  });

  return sendEmail({
    to: email,
    subject: `مرحباً بك في ${BRAND_NAME}`,
    html,
    text: `مرحباً ${full_name}،\n\nمرحباً بك في ${BRAND_NAME}! تم إنشاء حسابك بنجاح.\n\nتصفّح المنتجات، قدّم الطلبات، وتتبّع التوصيل من لوحة التحكم.`,
  });
}
