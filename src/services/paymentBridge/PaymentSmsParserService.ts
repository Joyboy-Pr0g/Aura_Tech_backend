import { injectable } from 'tsyringe';
import Joi from 'joi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { paymentVerifyDebug } from '../../utils/paymentVerifyDebug';

export type ParseMethod = 'regex' | 'gemini' | 'failed';

export interface ParsedPaymentSms {
  provider: string;
  amount: number;
  currency: string;
  account_number: string;
  balance?: number | null;
  sender?: string | null;
}

export interface ParseResult {
  success: boolean;
  method: ParseMethod;
  data?: ParsedPaymentSms;
}

const parsedSchema = Joi.object({
  provider: Joi.string().trim().min(1).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().trim().min(1).required(),
  account_number: Joi.string().trim().pattern(/^\d+$/).min(6).max(15).required(),
  balance: Joi.number().allow(null).optional(),
  sender: Joi.string().allow(null, '').optional(),
});

@injectable()
export class PaymentSmsParserService {
  parse(rawMessage: string): ParseResult {
    const regexResult = this.parseWithRegex(rawMessage);
    if (regexResult.success && regexResult.data) {
      return regexResult;
    }
    return { success: false, method: 'failed' };
  }

  async parseWithFallback(rawMessage: string): Promise<ParseResult> {
    const regexResult = this.parseWithRegex(rawMessage);
    if (regexResult.success && regexResult.data) {
      paymentVerifyDebug('parse_regex_success', {
        amount: regexResult.data.amount,
        account: regexResult.data.account_number,
        provider: regexResult.data.provider,
      });
      return regexResult;
    }

    paymentVerifyDebug('parse_regex_failed', { rawMessage });

    const geminiResult = await this.parseWithGemini(rawMessage);
    if (geminiResult.success && geminiResult.data) {
      paymentVerifyDebug('parse_gemini_success', {
        amount: geminiResult.data.amount,
        account: geminiResult.data.account_number,
        provider: geminiResult.data.provider,
      });
      return geminiResult;
    }

    paymentVerifyDebug('parse_all_failed', {
      rawMessage,
      geminiSkipped: !process.env.GEMINI_API_KEY?.trim(),
    });

    return { success: false, method: 'failed' };
  }

  private parseWithRegex(rawMessage: string): ParseResult {
    const text = rawMessage.replace(/\s+/g, ' ').trim();
    if (!text) return { success: false, method: 'failed' };

    const providerMatch = text.match(/^([^\n-]+?)\s*-\s*/u) ?? text.match(/^([A-Za-z\u0600-\u06FF]+)/u);
    const provider = providerMatch?.[1]?.trim();
    if (!provider) return { success: false, method: 'failed' };

    const amountMatch =
      text.match(/(?:اضيف|أضيف|add|added)\s*(\d+)/iu) ??
      text.match(/(\d+)\s*ر\.?\s*ي/u) ??
      text.match(/(\d+)\s*(?:YER|RY|ر\.ي)/iu);
    const amount = amountMatch ? Number(amountMatch[1]) : NaN;

    const accountMatch =
      text.match(/-(\d{6,15})\s*$/u) ??
      text.match(/(?:من|from)\s+[^-\n]*-(\d{6,15})/iu) ??
      text.match(/(?:من|from)\s+(\d{6,15})\s*$/iu) ??
      text.match(/(\d{9,15})\s*$/u);
    const accountNumber = accountMatch?.[1] ?? '';

    const currencyMatch = text.match(/(ر\.?\s*ي|YER|RY)/iu);
    const currency = currencyMatch ? currencyMatch[1].replace(/\s/g, '') : 'YER';

    const balanceMatch = text.match(/(?:رص|balance)[:\s]*([\d.]+)/iu);
    const balance = balanceMatch ? Number(balanceMatch[1]) : null;

    const senderMatch = text.match(/(?:من|from)\s+(.+?)(?:-|\d{6,})/iu);
    const sender = senderMatch?.[1]?.trim() ?? null;

    const candidate = {
      provider: provider.trim(),
      amount,
      currency,
      account_number: accountNumber.replace(/\D/g, ''),
      balance,
      sender,
    };

    const { error, value } = parsedSchema.validate(candidate, { abortEarly: false, stripUnknown: true });
    if (error || !value) {
      return { success: false, method: 'failed' };
    }

    return { success: true, method: 'regex', data: value as ParsedPaymentSms };
  }

  private async parseWithGemini(rawMessage: string): Promise<ParseResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      paymentVerifyDebug('parse_gemini_skipped', { reason: 'GEMINI_API_KEY not set' });
      return { success: false, method: 'failed' };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash' });
      const prompt = `You extract structured payment data from Yemen mobile wallet SMS messages in Arabic or English.
Return ONLY valid JSON with these fields:
{
  "provider": "wallet/provider name",
  "amount": number,
  "currency": "YER or ر.ي",
  "account_number": "digits only sender/payer wallet account",
  "balance": number or null,
  "sender": "sender name or null"
}
Rules:
- amount is the transferred amount, not balance
- account_number must be digits only (6-15 digits) — the payer wallet number after "من" or at end of SMS
- provider is the wallet name (e.g. جيب, ejaib, kuraimi)
SMS:
${rawMessage}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(jsonText);
      const { error, value } = parsedSchema.validate(parsed, { abortEarly: false, stripUnknown: true });
      if (error || !value) {
        paymentVerifyDebug('parse_gemini_invalid', {
          validationErrors: error?.details.map((d) => d.message) ?? [],
          rawResponse: text.slice(0, 500),
        });
        return { success: false, method: 'failed' };
      }

      return { success: true, method: 'gemini', data: value as ParsedPaymentSms };
    } catch (err) {
      paymentVerifyDebug('parse_gemini_error', {
        message: err instanceof Error ? err.message : String(err),
      });
      return { success: false, method: 'failed' };
    }
  }
}
