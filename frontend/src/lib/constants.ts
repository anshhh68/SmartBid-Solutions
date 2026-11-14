export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

export const TENDER_SOURCES = [
  { id: '', label: 'All notices' },
  { id: 'GeM', label: 'GeM' },
  { id: 'Railway', label: 'Railway' },
  { id: 'CPPP', label: 'CPPP / eProcure' },
  { id: 'nProcure', label: 'nProcure' },
];

export const PRIMARY_PHONE = '+91 70162 35257';
export const ALTERNATE_PHONE = '+91 85117 22588';
export const PHONES = [PRIMARY_PHONE, ALTERNATE_PHONE];
export const WHATSAPP_URL = 'https://wa.me/917016235257';
export const EMAILS = ['kinjal.modismartbidsolutions@gmail.com', 'kinjalsmartbidsolutions@outlook.com'];
export const ADDRESS = 'Vaibhav Laxmi Complex, Shop No. 29, 4th Floor, Outside Delhi Darwaja, Ahmedabad, Gujarat';

export function formatINR(val?: number | null) {
  if (val == null) return 'Refer document';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export function daysUntil(date: string | Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
