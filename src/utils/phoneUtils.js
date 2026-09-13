// Clean phone number and convert to international format for WhatsApp
export function cleanPhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return '';
  
  // Remove all non-digit characters except leading +
  let phone = rawPhone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it
  if (phone.startsWith('+')) {
    return phone.replace('+', '');
  }
  
  // French DOM-TOM conversions
  // Guadeloupe: 0590/0690 -> +590
  if (phone.startsWith('0590') || phone.startsWith('0690') || phone.startsWith('0691')) {
    return '590' + phone.substring(1);
  }
  // Martinique: 0596/0696 -> +596
  if (phone.startsWith('0596') || phone.startsWith('0696')) {
    return '596' + phone.substring(1);
  }
  // Guyane: 0594/0694 -> +594
  if (phone.startsWith('0594') || phone.startsWith('0694')) {
    return '594' + phone.substring(1);
  }
  // La Réunion: 0262/0692/0693 -> +262
  if (phone.startsWith('0262') || phone.startsWith('0692') || phone.startsWith('0693')) {
    return '262' + phone.substring(1);
  }
  // Nouvelle-Calédonie: starts with local number
  // Mayotte: 0269/0639 -> +262
  if (phone.startsWith('0269') || phone.startsWith('0639')) {
    return '262' + phone.substring(1);
  }
  // Metropolitan France: 0X -> +33X
  if (phone.startsWith('0') && phone.length === 10) {
    return '33' + phone.substring(1);
  }
  
  return phone;
}

export function buildWhatsAppLink(phone, message) {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return '';
  const encodedMsg = encodeURIComponent(message || '');
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}
