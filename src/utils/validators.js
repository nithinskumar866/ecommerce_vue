const digitsOnly = (value) => String(value ?? '').replace(/[\s-]/g, '');
const filled = (value) => String(value ?? '').trim() !== '';

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

function passesLuhn(digits) {
  let sum = 0;
  [...digits].reverse().forEach((character, index) => {
    let digit = Number(character);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  });
  return sum % 10 === 0;
}

export function isCardNumber(value) {
  const digits = digitsOnly(value);
  return /^\d{13,19}$/.test(digits) && passesLuhn(digits);
}

export function isFutureExpiry(value, now = new Date()) {
  const match = String(value ?? '').trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;
  // Day 1 of the following month: a card is valid through its expiry month.
  return new Date(2000 + Number(match[2]), Number(match[1]), 1) > now;
}

// Each validator returns an object of field -> message; empty means valid.
function collect(rules) {
  return Object.fromEntries(rules.filter(([, valid]) => !valid).map(([field, , message]) => [field, message]));
}

export function validateAddress(address) {
  return collect([
    ['name', filled(address.name), 'Enter the recipient name.'],
    ['phone', /^[6-9]\d{9}$/.test(digitsOnly(address.phone)), 'Enter a 10-digit mobile number.'],
    ['line1', filled(address.line1), 'Enter the street address.'],
    ['city', filled(address.city), 'Enter the city.'],
    ['state', filled(address.state), 'Enter the state.'],
    ['pincode', /^[1-9]\d{5}$/.test(String(address.pincode ?? '').trim()), 'Enter a 6-digit PIN code.'],
  ]);
}

export function validateCard(card, now = new Date()) {
  return collect([
    ['number', isCardNumber(card.number), 'Enter a valid card number.'],
    ['expiry', isFutureExpiry(card.expiry, now), 'Enter a future expiry date as MM/YY.'],
    ['cvv', /^\d{3,4}$/.test(String(card.cvv ?? '')), 'Enter the 3 or 4 digit CVV.'],
    ['name', filled(card.name), 'Enter the name on the card.'],
  ]);
}

export function validateUpi(upi) {
  return collect([
    ['id', /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(String(upi.id ?? '').trim()), 'Enter a UPI ID such as name@bank.'],
  ]);
}

export function validateSignup(form) {
  return collect([
    ['name', filled(form.name), 'Enter your name.'],
    ['email', isEmail(form.email), 'Enter a valid email address.'],
    ['password', String(form.password ?? '').length >= 8, 'Use at least 8 characters.'],
  ]);
}

export function validateLogin(form) {
  return collect([
    ['email', isEmail(form.email), 'Enter a valid email address.'],
    ['password', filled(form.password), 'Enter your password.'],
  ]);
}

export function safeRedirect(target, fallback = '/') {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : fallback;
}
