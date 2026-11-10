import { ref } from 'vue';
import { errorMessage } from '@/api/client';

// Runs an API call immediately and tracks its loading, error and result state.
export function useLoad(loader) {
  const data = ref(null);
  const status = ref('loading');
  const error = ref('');

  async function reload({ quiet = false } = {}) {
    if (!quiet) status.value = 'loading';
    try {
      data.value = await loader();
      status.value = 'ready';
    } catch (cause) {
      error.value = errorMessage(cause);
      status.value = 'error';
    }
  }

  reload();
  return { data, status, error, reload };
}
