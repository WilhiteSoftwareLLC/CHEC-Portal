// PayPal configuration
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const baseURL = process.env.PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

if (!clientId || !clientSecret) {
  throw new Error('PayPal client ID and secret must be configured in environment variables');
}

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export interface PayPalOrderRequest {
  amount: string;
  familyId: number;
  invoiceHash: string;
}

export async function createPayPalOrder(orderData: PayPalOrderRequest) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: orderData.amount,
          },
          description: `CHEC Invoice Payment for Family ID ${orderData.familyId}`,
          custom_id: `family_${orderData.familyId}_invoice_${orderData.invoiceHash}`,
        },
      ],
      application_context: {
        return_url: `${process.env.BASE_URL || 'http://localhost:5050'}/invoice/${orderData.invoiceHash}?payment=success`,
        cancel_url: `${process.env.BASE_URL || 'http://localhost:5050'}/invoice/${orderData.invoiceHash}?payment=cancelled`,
        brand_name: "CHEC Portal",
        locale: "en-US",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
      },
    };

    const response = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    if (!response.ok) {
      throw new Error(`PayPal capture error: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal order capture failed:', error);
    throw error;
  }
}

export async function createPayPalWebhook(webhookUrl: string): Promise<any> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const body = {
      url: webhookUrl,
      event_types: [
        {
          name: "PAYMENT.CAPTURE.COMPLETED"
        },
        {
          name: "CHECKOUT.ORDER.APPROVED" 
        },
        {
          name: "CHECKOUT.PAYMENT-APPROVAL.REVERSED"
        }
      ]
    };

    const response = await fetch(`${baseURL}/v1/notifications/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayPal webhook creation failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PayPal webhook creation failed:', error);
    throw error;
  }
}

export async function verifyPayPalWebhook(
  requestBody: string,
  headers: Record<string, string>
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn('PayPal webhook verification skipped - PAYPAL_WEBHOOK_ID not configured');
    return true; // Allow webhook processing without verification in development
  }

  // For now, skip verification and just validate basic structure
  // TODO: Implement proper webhook signature verification
  try {
    const event = JSON.parse(requestBody);
    return event && event.event_type && event.resource;
  } catch (error) {
    console.error('PayPal webhook verification failed:', error);
    return false;
  }
}