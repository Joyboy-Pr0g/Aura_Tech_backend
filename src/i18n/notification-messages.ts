import type { OrderStatus } from '../models/Order';
import type { NotificationType } from '../models/Notification';

export interface NotificationCopy {
  type: NotificationType;
  title: string;
  message: string;
}

type StaffNotificationType = 'staff_new_order' | 'staff_payment_submitted' | 'staff_refund_request';

export interface StaffNotificationCopy {
  type: StaffNotificationType;
  title: string;
  message: string;
}

export const notificationMessages = {
  orderConfirmation(orderNumber: string): NotificationCopy {
    return {
      type: 'order_confirmation',
      title: 'تم تأكيد الطلب',
      message: `تم تقديم طلبك ${orderNumber} بنجاح.`,
    };
  },

  staffNewOrder(orderNumber: string): StaffNotificationCopy {
    return {
      type: 'staff_new_order',
      title: 'طلب جديد',
      message: `تم تقديم الطلب ${orderNumber} ويحتاج إلى مراجعة.`,
    };
  },

  staffPaymentSubmitted(orderNumber: string): StaffNotificationCopy {
    return {
      type: 'staff_payment_submitted',
      title: 'دفع جديد',
      message: `أرسل العميل إيصال دفع للطلب ${orderNumber}. راجع المدفوعات في لوحة التحكم.`,
    };
  },

  staffRefundRequest(orderNumber: string): StaffNotificationCopy {
    return {
      type: 'staff_refund_request',
      title: 'طلب استرداد جديد',
      message: `قدّم العميل طلب استرداد للطلب ${orderNumber}. راجع طلبات الاسترداد في لوحة التحكم.`,
    };
  },

  questionAnswered(productTitle: string): NotificationCopy {
    return {
      type: 'question_answered',
      title: 'تم الرد على سؤالك',
      message: `أجاب فريق AURA TECH على سؤالك بخصوص «${productTitle}».`,
    };
  },

  paymentApproved(orderNumber: string): NotificationCopy {
    return {
      type: 'payment_approved',
      title: 'تم اعتماد الدفع',
      message: `تم اعتماد الدفع للطلب ${orderNumber}.`,
    };
  },

  paymentRecorded(orderNumber: string): NotificationCopy {
    return {
      type: 'payment_approved',
      title: 'تم تسجيل الدفع',
      message: `تم تسجيل الدفع للطلب ${orderNumber}.`,
    };
  },

  autoVerifyFailed(orderNumber: string): NotificationCopy {
    return {
      type: 'payment_rejected',
      title: 'تعذر التحقق التلقائي من الدفع',
      message: `تعذر التحقق التلقائي من دفعتك للطلب ${orderNumber}، لكن طلبك مسجل وسيراجعه فريقنا خلال 24 ساعة.`,
    };
  },

  paymentRejected(orderNumber: string, reason: string): NotificationCopy {
    return {
      type: 'payment_rejected',
      title: 'تم رفض الدفع',
      message: `تم رفض الدفع للطلب ${orderNumber}: ${reason}`,
    };
  },

  refundApproved(orderNumber: string): NotificationCopy {
    return {
      type: 'payment_approved',
      title: 'تم قبول طلب الاسترداد',
      message: `تم قبول طلب الاسترداد للطلب ${orderNumber}.`,
    };
  },

  refundRejected(orderNumber: string): NotificationCopy {
    return {
      type: 'payment_rejected',
      title: 'تم رفض طلب الاسترداد',
      message: `تم رفض طلب الاسترداد للطلب ${orderNumber}.`,
    };
  },

  productBackInStock(productTitle: string): NotificationCopy {
    return {
      type: 'product_available',
      title: 'المنتج متوفر مجدداً',
      message: `«${productTitle}» متوفر الآن في المخزون.`,
    };
  },

  orderStatusChange(
    orderNumber: string,
    newStatus: OrderStatus,
    reason?: string | null,
  ): NotificationCopy | null {
    const statusMessages: Partial<Record<OrderStatus, NotificationCopy>> = {
      payment_confirmed: {
        type: 'payment_approved',
        title: 'تم تأكيد الدفع',
        message: `تم تأكيد الدفع للطلب ${orderNumber}.`,
      },
      processing: {
        type: 'order_status_updated',
        title: 'جاري تجهيز الطلب',
        message: `يتم الآن تجهيز طلبك ${orderNumber}.`,
      },
      ready_to_ship: {
        type: 'shipment_ready',
        title: 'الطلب جاهز للشحن',
        message: `طلبك ${orderNumber} جاهز للشحن.`,
      },
      shipped: {
        type: 'shipment_ready',
        title: 'تم شحن الطلب',
        message: `تم شحن طلبك ${orderNumber}.`,
      },
      delivered: {
        type: 'delivery_confirmation',
        title: 'تم التسليم',
        message: `تم تسليم طلبك ${orderNumber} بنجاح.`,
      },
      cancelled: {
        type: 'order_status_updated',
        title: 'تم إلغاء الطلب',
        message: reason
          ? `تم إلغاء الطلب ${orderNumber}: ${reason}`
          : `تم إلغاء الطلب ${orderNumber}.`,
      },
      refunded: {
        type: 'order_status_updated',
        title: 'تم استرداد الطلب',
        message: `تم استرداد مبلغ طلبك ${orderNumber}.`,
      },
    };

    return statusMessages[newStatus] ?? null;
  },
};
