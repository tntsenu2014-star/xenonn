export interface PayHerePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

declare global {
  interface Window {
    payhere: {
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
      startPayment: (payment: PayHerePayment) => void;
    };
  }
}

export async function initiatePayHerePayment(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  packageName: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}) {
  try {
    // 1. Get Hash from Server
    const response = await fetch('/api/payhere-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: params.orderId,
        amount: params.amount,
        currency: 'LKR'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate payment hash');
    }

    const { hash, merchantId } = await response.json();

    // 2. Prepare Payment Object
    const payment: PayHerePayment = {
      sandbox: true, // Set to false for production
      merchant_id: merchantId,
      return_url: window.location.origin + '/order-history',
      cancel_url: window.location.origin + '/order-history',
      notify_url: 'https://your-domain.com/api/payhere-notify', // Replace with real notify URL if needed
      order_id: params.orderId,
      items: params.packageName,
      amount: params.amount.toFixed(2),
      currency: 'LKR',
      hash: hash,
      first_name: params.customerName.split(' ')[0] || 'Customer',
      last_name: params.customerName.split(' ').slice(1).join(' ') || 'Store',
      email: 'customer@email.com', // Optional
      phone: params.customerPhone,
      address: 'No 1, Main Street',
      city: 'Colombo',
      country: 'Sri Lanka'
    };

    // 3. Start Payment
    const startPayment = () => {
      if (window.payhere) {
        window.payhere.onCompleted = (orderId: string) => {
          console.log("Payment completed. OrderID:" + orderId);
          params.onSuccess();
        };

        window.payhere.onDismissed = () => {
          console.log("Payment dismissed");
          params.onCancel();
        };

        window.payhere.onError = (error: string) => {
          console.log("Error:"  + error);
          params.onError(error);
        };

        window.payhere.startPayment(payment);
      } else {
        throw new Error('PayHere script not loaded');
      }
    };

    if (!window.payhere) {
      // Small wait just in case script is still initializing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    startPayment();
  } catch (error: any) {
    console.error('PayHere integration error:', error);
    params.onError(error.message);
  }
}
