import { SMSMessage } from '../types';

export const simulateSMS = (phoneNumber: string, message: string) => {
  console.log(`[SMS] Sending to: ${phoneNumber}`);
  console.log(`[SMS] Message: ${message}`);
  
  const smsObj: SMSMessage = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    phoneNumber,
    message,
    date: new Date().toISOString()
  };
  
  window.dispatchEvent(new CustomEvent('onSmsSent', { detail: smsObj }));
};

// Replace this with the actual manager's phone number
export const MANAGER_PHONE = '09120000000';
