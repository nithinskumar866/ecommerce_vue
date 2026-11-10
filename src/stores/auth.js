import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isSignedIn = computed(() => user.value !== null);

  async function run(call) {
    user.value = await call;
    return user.value;
  }

  const init = () => run(authApi.currentUser());
  const login = (credentials) => run(authApi.login(credentials));
  const signup = (details) => run(authApi.signup(details));
  const updateProfile = (details) => run(authApi.updateProfile(details));
  const saveAddress = (address) => run(authApi.saveAddress(address));
  const deleteAddress = (id) => run(authApi.deleteAddress(id));

  async function logout() {
    await authApi.logout();
    user.value = null;
  }

  return { user, isSignedIn, init, login, signup, logout, updateProfile, saveAddress, deleteAddress };
});
