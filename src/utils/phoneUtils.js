// Clean phone number and convert to international format for WhatsApp
export function cleanPhoneForWhatsApp(rawPhone, defaultCode = '') {
  if (!rawPhone) return '';
  
  // Remove all non-digit characters except leading +
  let phone = String(rawPhone).replace(/[^\d+]/g, '');
  
  // If it starts with +, it already has a country code. Just strip the + and return.
  if (phone.startsWith('+')) {
    return phone.replace('+', '');
  }

  // If it starts with 00 (international prefix), treat it as having a country code.
  if (phone.startsWith('00')) {
    return phone.substring(2);
  }

  // If a default country code is provided by the user, apply it.
  if (defaultCode) {
    let cleanCode = String(defaultCode).replace(/[^\d]/g, '');
    if (cleanCode) {
      // If the number starts with the country code already (e.g. they forgot the +), don't duplicate it
      if (phone.startsWith(cleanCode) && phone.length > cleanCode.length + 5) {
        return phone; // It probably already has the code
      }
      
      // Most countries drop the leading 0 when adding country code
      if (phone.startsWith('0')) {
        return cleanCode + phone.substring(1);
      }
      return cleanCode + phone;
    }
  }
  
  // Fallback to legacy French DOM-TOM / Metropolitan logic if no default code provided
  if (phone.startsWith('0590') || phone.startsWith('0690') || phone.startsWith('0691')) return '590' + phone.substring(1);
  if (phone.startsWith('0596') || phone.startsWith('0696')) return '596' + phone.substring(1);
  if (phone.startsWith('0594') || phone.startsWith('0694')) return '594' + phone.substring(1);
  if (phone.startsWith('0262') || phone.startsWith('0692') || phone.startsWith('0693')) return '262' + phone.substring(1);
  if (phone.startsWith('0269') || phone.startsWith('0639')) return '262' + phone.substring(1);
  if (phone.startsWith('0') && phone.length === 10) return '33' + phone.substring(1);
  
  return phone;
}

export function buildWhatsAppLink(phone, message, defaultCode = '') {
  const cleanPhone = cleanPhoneForWhatsApp(phone, defaultCode);
  if (!cleanPhone) return '';
  const encodedMsg = encodeURIComponent(message || '');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
}
