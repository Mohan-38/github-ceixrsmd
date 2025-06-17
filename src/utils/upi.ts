// UPI Payment Utilities

export interface UPIPaymentData {
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  transactionNote: string;
  transactionRef: string;
}

export interface UPIApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  deepLinkScheme?: string;
}

// Popular UPI apps in India
export const UPI_APPS: UPIApp[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    icon: '📱',
    deepLinkScheme: 'phonepe'
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    icon: '💳',
    deepLinkScheme: 'tez'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    icon: '💰',
    deepLinkScheme: 'paytmmp'
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    packageName: 'in.org.npci.upiapp',
    icon: '🏦',
    deepLinkScheme: 'bhim'
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    packageName: 'in.amazon.mShop.android.shopping',
    icon: '🛒',
    deepLinkScheme: 'amazonpay'
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    packageName: 'com.mobikwik_new',
    icon: '💸',
    deepLinkScheme: 'mobikwik'
  }
];

/**
 * Generate UPI payment URL according to UPI specification
 */
export const generateUPIUrl = (paymentData: UPIPaymentData): string => {
  const params = new URLSearchParams({
    pa: paymentData.merchantId, // Payee Address (UPI ID)
    pn: paymentData.merchantName, // Payee Name
    am: paymentData.amount.toString(), // Amount
    cu: paymentData.currency, // Currency
    tn: paymentData.transactionNote, // Transaction Note
    tr: paymentData.transactionRef, // Transaction Reference
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Generate QR code URL for UPI payment
 */
export const generateQRCodeUrl = (upiUrl: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUrl)}`;
};

/**
 * Open specific UPI app with payment details
 */
export const openUPIApp = (app: UPIApp, upiUrl: string): void => {
  const userAgent = navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  if (isAndroid) {
    // Android Intent URL
    const intentUrl = `intent://pay?${upiUrl.split('?')[1]}#Intent;scheme=upi;package=${app.packageName};end`;
    window.location.href = intentUrl;
  } else if (isIOS && app.deepLinkScheme) {
    // iOS Deep Link
    const deepLinkUrl = `${app.deepLinkScheme}://pay?${upiUrl.split('?')[1]}`;
    window.location.href = deepLinkUrl;
  } else {
    // Fallback to generic UPI URL
    window.location.href = upiUrl;
  }
};

/**
 * Check if device supports UPI payments
 */
export const isUPISupported = (): boolean => {
  const userAgent = navigator.userAgent;
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
};

/**
 * Validate UPI ID format
 */
export const validateUPIId = (upiId: string): boolean => {
  // Basic UPI ID validation: username@bank
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
};

/**
 * Generate transaction reference ID
 */
export const generateTransactionRef = (prefix: string = 'TXN'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Check if payment is expired
 */
export const isPaymentExpired = (createdAt: Date, expiryMinutes: number = 10): boolean => {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
  return now > expiryTime;
};

/**
 * Get payment status color
 */
export const getPaymentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'pending':
    case 'processing':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
    case 'expired':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Simulate payment verification (replace with actual API call)
 */
export const verifyPayment = async (transactionRef: string): Promise<{
  status: 'success' | 'pending' | 'failed';
  transactionId?: string;
  message?: string;
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random success/failure for demo
  const success = Math.random() > 0.3; // 70% success rate
  
  if (success) {
    return {
      status: 'success',
      transactionId: `UPI${Date.now()}`,
      message: 'Payment completed successfully'
    };
  } else {
    return {
      status: 'failed',
      message: 'Payment verification failed'
    };
  }
};