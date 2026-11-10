<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormField from '@/components/FormField.vue';
import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect, validateSignup } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = reactive({ name: '', email: '', password: '' });
const errors = ref({});
const formError = ref('');
const busy = ref(false);

async function submit() {
  errors.value = validateSignup(form);
  if (Object.keys(errors.value).length) return;
  busy.value = true;
  formError.value = '';
  try {
    await auth.signup(form);
    await router.replace(safeRedirect(route.query.redirect));
  } catch (error) {
    formError.value = errorMessage(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
      <div class="card card-body">
        <h1 class="h4 mb-3">Create account</h1>
        <div class="alert alert-warning small py-2">Demo only: accounts live in this browser. Don't reuse a real password.</div>
        <form novalidate @submit.prevent="submit">
          <FormField id="signup-name" v-model="form.name" label="Name" :error="errors.name" autocomplete="name" />
          <FormField id="signup-email" v-model="form.email" label="Email" :error="errors.email" type="email" autocomplete="email" />
          <FormField id="signup-password" v-model="form.password" label="Password" :error="errors.password" type="password" autocomplete="new-password" />
          <div v-if="formError" class="alert alert-danger py-2" role="alert">{{ formError }}</div>
          <button type="submit" class="btn btn-primary w-100" :disabled="busy">Create account</button>
        </form>
        <p class="text-center small mt-3 mb-0">
          Already registered? <router-link :to="{ path: '/login', query: route.query }">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
