const PREFIX = 'shop:';

// Storage can be unavailable, full or hold corrupt data; none of that may break the app.
export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

// Valid JSON can still be the wrong shape, so these guarantee what callers expect.
export function readRecords(key) {
  const saved = readStorage(key, []);
  return Array.isArray(saved) ? saved.filter(isRecord) : [];
}

export function readObject(key) {
  const saved = readStorage(key, {});
  return isRecord(saved) ? saved : {};
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // The in-memory state still works for this visit.
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to remove.
  }
}

// Calls back when another browser tab changes this key.
export function onStorageChange(key, callback) {
  window.addEventListener('storage', (event) => {
    if (event.key === PREFIX + key || event.key === null) callback();
  });
}
