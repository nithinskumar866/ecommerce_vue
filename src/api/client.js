// Mock transport. To use a real backend, replace the bodies of the functions
// in this folder with fetch calls; views and stores only depend on their results.
export class ApiError extends Error {
  constructor(message, code = 'error') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Vitest sets MODE to "test", where waiting would only slow the suite down.
const simulatedDelay = () => (import.meta.env.MODE === 'test' ? 0 : 150 + Math.random() * 250);

export async function respond(handler, { instant = false } = {}) {
  if (!instant) await new Promise((resolve) => setTimeout(resolve, simulatedDelay()));
  const result = await handler();
  return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
}

export function errorMessage(error) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export function randomId(bytes = 6) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
