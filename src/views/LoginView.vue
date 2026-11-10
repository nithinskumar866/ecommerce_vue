<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormField from '@/components/FormField.vue';
import { DEMO_ACCOUNT } from '@/api/auth';
import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect, validateLogin } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = reactive({ email: '', password: '' });
const errors = ref({});
const formError = ref('');
const busy = ref(false);
const redirect = computed(() => safeRedirect(route.query.redirect));

async function submit() {
  errors.value = validateLogin(form);
  if (Object.keys(errors.value).length) return;
  busy.value = true;
  formError.value = '';
  try {
    await auth.login(form);
    await router.replace(redirect.value);
  } catch (error) {
    formError.value = errorMessage(error);
  } finally {
    busy.value = false;
  }
}

function useDemoAccount() {
  Object.assign(form, DEMO_ACCOUNT);
  submit();
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="card card-body">
        <h1 class="h4 mb-3">Sign in</h1>
        <form novalidate @submit.prevent="submit">
          <FormField id="login-email" v-model="form.email" label="Email" :error="errors.email" type="email" autocomplete="email" />
          <FormField id="login-password" v-model="form.password" label="Password" :error="errors.password" type="password" autocomplete="current-password" />
          <div v-if="formError" class="alert alert-danger py-2" role="alert">{{ formError }}</div>
          <button type="submit" class="btn btn-primary w-100" :disabled="busy">Sign in</button>
        </form>
        <button type="button" class="btn btn-outline-secondary w-100 mt-2" :disabled="busy" @click="useDemoAccount">Use demo account</button>
        <p class="text-center small mt-3 mb-0">
          New here? <router-link :to="{ path: '/signup', query: route.query }">Create an account</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
