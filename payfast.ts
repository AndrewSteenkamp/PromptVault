import crypto from "crypto";

/**
 * PayFast Payment Integration
 * 
 * This file handles all PayFast payment processing for the AI Prompts Academy.
 * PayFast is a South African payment gateway that supports cards, EFT, and more.
 * 
 * Documentation: https://developers.payfast.co.za/docs
 */

// PayFast Configuration
// TODO: Add these to your environment variables after getting PayFast credentials
export const PAYFAST_CONFIG = {
  // Test credentials (for testing only - no real money)
  merchantId: process.env.PAYFAST_MERCHANT_ID || "10000100",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
  passphrase: process.env.PAYFAST_PASSPHRASE || "",
  
  // PayFast URLs
  // Use sandbox for testing, production for real payments
  paymentUrl: process.env.NODE_ENV === "production"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process",
};

/**
 * Generate PayFast payment data
 * This creates the data needed to redirect a customer to PayFast for payment
 */
export function generatePaymentData(params: {
  orderId: string;
  amount: number; // in cents (e.g., 500 = R5.00)
  itemName: string;
  itemDescription: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}) {
  const data: Record<string, string> = {
    // Merchant details
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    
    // URLs
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
    
    // Transaction details
    m_payment_id: params.orderId,
    amount: (params.amount / 100).toFixed(2), // Convert cents to rands
    item_name: params.itemName,
    item_description: params.itemDescription,
    
    // Customer details
    email_address: params.customerEmail,
    name_first: params.customerName.split(" ")[0] || params.customerName,
    name_last: params.customerName.split(" ").slice(1).join(" ") || "",
  };

  // Generate signature for security
  const signature = generateSignature(data);
  
  return {
    ...data,
    signature,
  };
}

/**
 * Generate MD5 signature for PayFast
 * This ensures the payment data hasn't been tampered with
 */
function generateSignature(data: Record<string, string>): string {
  // Create parameter string
  let paramString = "";
  
  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    const value = data[key];
    if (value !== "") {
      paramString += `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}&`;
    }
  }
  
  // Remove last ampersand
  paramString = paramString.slice(0, -1);
  
  // Add passphrase if set
  if (PAYFAST_CONFIG.passphrase) {
    paramString += `&passphrase=${encodeURIComponent(PAYFAST_CONFIG.passphrase)}`;
  }
  
  // Generate MD5 hash
  return crypto.createHash("md5").update(paramString).digest("hex");
}

/**
 * Verify PayFast payment notification (ITN)
 * This checks that a payment notification from PayFast is legitimate
 */
export function verifyPaymentNotification(data: Record<string, string>): boolean {
  const signature = data.signature;
  const dataWithoutSignature = { ...data };
  delete dataWithoutSignature.signature;
  
  const expectedSignature = generateSignature(dataWithoutSignature);
  
  return signature === expectedSignature;
}

/**
 * Parse PayFast payment status
 * PayFast sends different status codes - this interprets them
 */
export function parsePaymentStatus(status: string): {
  success: boolean;
  message: string;
} {
  switch (status) {
    case "COMPLETE":
      return {
        success: true,
        message: "Payment successful",
      };
    case "CANCELLED":
      return {
        success: false,
        message: "Payment was cancelled",
      };
    case "FAILED":
      return {
        success: false,
        message: "Payment failed",
      };
    default:
      return {
        success: false,
        message: "Unknown payment status",
      };
  }
}

/**
 * Create PayFast payment form HTML
 * This generates an HTML form that automatically submits to PayFast
 */
export function createPaymentForm(paymentData: Record<string, string>): string {
  const fields = Object.entries(paymentData)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
    .join("\n    ");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to PayFast...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Redirecting to PayFast...</h1>
    <p>Please wait while we redirect you to complete your payment.</p>
  </div>
  
  <form id="payfast_form" action="${PAYFAST_CONFIG.paymentUrl}" method="post">
    ${fields}
  </form>
  
  <script>
    // Auto-submit form after 1 second
    setTimeout(() => {
      document.getElementById('payfast_form').submit();
    }, 1000);
  </script>
</body>
</html>
  `.trim();
}
