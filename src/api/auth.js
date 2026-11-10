import { ApiError, randomId, respond } from './client';
import { readRecords, readStorage, removeStorage, writeStorage } from '@/utils/storage';

export const DEMO_ACCOUNT = { email: 'demo@shop.test', password: 'demo1234' };
const DEMO_POINTS = 750;

const readUsers = () => readRecords('users');
const writeUsers = (users) => writeStorage('users', users);

async function hashPassword(password, salt) {
  if (!crypto.subtle) {
    throw new ApiError('Sign-in needs HTTPS or localhost in this demo.', 'insecure');
  }
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function publicUser({ id, name, email, phone, addresses, points = 0, lifetimePoints = 0 }) {
  return {
    id, name, email, phone, addresses, points, lifetimePoints,
    isAdmin: email === DEMO_ACCOUNT.email,
  };
}

async function createUser({ name, email, password, phone = '', addresses = [], points = 0 }) {
  const salt = randomId();
  const user = {
    id: randomId(), name: name.trim(), email, phone, addresses, salt, points, lifetimePoints: points,
    passwordHash: await hashPassword(password, salt),
  };
  writeUsers([...readUsers(), user]);
  return user;
}

async function ensureDemoUser() {
  if (readUsers().some((user) => user.email === DEMO_ACCOUNT.email)) return;
  await createUser({
    ...DEMO_ACCOUNT,
    name: 'Demo Shopper',
    phone: '9876543210',
    points: DEMO_POINTS,
    addresses: [{
      id: randomId(), name: 'Demo Shopper', phone: '9876543210',
      line1: '12 MG Road', line2: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038',
    }],
  });
}

export function sessionUserId() {
  return readStorage('session', null);
}

export function requireUser() {
  const user = readUsers().find((candidate) => candidate.id === sessionUserId());
  if (!user) throw new ApiError('Please sign in to continue.', 'unauthenticated');
  return user;
}

export function requireAdmin() {
  const user = requireUser();
  if (user.email !== DEMO_ACCOUNT.email) {
    throw new ApiError('Only the demo account can view the dashboard.', 'forbidden');
  }
  return user;
}

export function updateUser(changes) {
  const current = requireUser();
  const updated = { ...current, ...changes };
  writeUsers(readUsers().map((user) => (user.id === updated.id ? updated : user)));
  return publicUser(updated);
}

const normalise = (email) => email.trim().toLowerCase();

export const authApi = {
  currentUser: () => respond(() => {
    const user = readUsers().find((candidate) => candidate.id === sessionUserId());
    return user ? publicUser(user) : null;
  }, { instant: true }),

  signup: ({ name, email, password }) => respond(async () => {
    const address = normalise(email);
    if (readUsers().some((user) => user.email === address)) {
      throw new ApiError('An account with this email already exists.', 'duplicate');
    }
    const user = await createUser({ name, email: address, password });
    writeStorage('session', user.id);
    return publicUser(user);
  }),

  login: ({ email, password }) => respond(async () => {
    await ensureDemoUser();
    const user = readUsers().find((candidate) => candidate.email === normalise(email));
    if (!user || user.passwordHash !== await hashPassword(password, user.salt)) {
      throw new ApiError('Incorrect email or password.', 'invalid-credentials');
    }
    writeStorage('session', user.id);
    return publicUser(user);
  }),

  logout: () => respond(() => removeStorage('session')),

  updateProfile: ({ name, phone }) => respond(() => updateUser({ name: name.trim(), phone: phone.trim() })),

  saveAddress: (address) => respond(() => {
    const { addresses } = requireUser();
    const saved = { ...address, id: address.id ?? randomId() };
    const exists = addresses.some((item) => item.id === saved.id);
    return updateUser({
      addresses: exists
        ? addresses.map((item) => (item.id === saved.id ? saved : item))
        : [...addresses, saved],
    });
  }),

  deleteAddress: (id) => respond(() => updateUser({
    addresses: requireUser().addresses.filter((item) => item.id !== id),
  })),
};
