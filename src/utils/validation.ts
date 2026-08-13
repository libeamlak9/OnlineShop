export function isValidEthiopianPhoneNumber(phone: string): boolean {
  // Allow spaces and dashes; accept formats such as:
  // +251 9XX XXX XXX, 251 9XX XXX XXX, 09XX XXX XXX, +251 7XX XXX XXX, 07XX XXX XXX
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(?:\+?251[79]\d{8}|0[79]\d{8})$/.test(cleaned);
}
