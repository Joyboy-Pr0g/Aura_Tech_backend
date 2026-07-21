export function isPaymentVerifyDebugEnabled(): boolean {
  return process.env.PAYMENT_VERIFY_DEBUG === 'true';
}

export function paymentVerifyDebug(message: string, data?: Record<string, unknown>): void {
  if (!isPaymentVerifyDebugEnabled()) return;
  if (data) {
    console.log(`[payment-verify] ${message}`, JSON.stringify(data));
    return;
  }
  console.log(`[payment-verify] ${message}`);
}
