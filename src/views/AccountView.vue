<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { notify } from '@kyvg/vue3-notification';
import AddressForm from '@/components/AddressForm.vue';
import FormField from '@/components/FormField.vue';
import { useAuthStore } from '@/stores/auth';
import { nextTier, tierFor } from '@/utils/loyalty';
import { validateAddress } from '@/utils/validators';

const router = useRouter();
const auth = useAuthStore();

const tier = computed(() => tierFor(auth.user.lifetimePoints));
const upcoming = computed(() => nextTier(auth.user.lifetimePoints));
const tierProgress = computed(() => (upcoming.value
  ? Math.round(((auth.user.lifetimePoints - tier.value.from) / (upcoming.value.from - tier.value.from)) * 100)
  : 100));

const profile = reactive({ name: auth.user.name, phone: auth.user.phone });
const profileError = ref('');

const blankAddress = () => ({ name: auth.user.name, phone: auth.user.phone, line1: '', line2: '', city: '', state: '', pincode: '' });
const editing = ref(null);
const addressErrors = ref({});

async function saveProfile() {
  profileError.value = profile.name.trim() ? '' : 'Enter your name.';
  if (profileError.value) return;
  await auth.updateProfile(profile);
  notify({ title: 'Profile updated', type: 'success' });
}

async function saveAddress() {
  addressErrors.value = validateAddress(editing.value);
  if (Object.keys(addressErrors.value).length) return;
  await auth.saveAddress(editing.value);
  editing.value = null;
  notify({ title: 'Address saved', type: 'success' });
}

function startEditing(address) {
  addressErrors.value = {};
  editing.value = address ? { ...address } : blankAddress();
}

// Leave first: this page cannot render without a signed-in user.
async function signOut() {
  await router.push('/');
  await auth.logout();
}
</script>

<template>
  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
    <h1 class="h3 mb-0">My account</h1>
    <div class="d-flex gap-2">
      <router-link v-if="auth.user.isAdmin" to="/admin" class="btn btn-outline-primary">Dashboard</router-link>
      <router-link to="/orders" class="btn btn-outline-primary">My orders</router-link>
      <button type="button" class="btn btn-outline-secondary" @click="signOut">Sign out</button>
    </div>
  </div>

  <section class="loyalty mb-4" aria-label="Rewards" data-testid="loyalty">
    <div>
      <p class="eyebrow mb-1">{{ tier.label }} member</p>
      <p class="loyalty__points mb-0"><span data-testid="points-balance">{{ auth.user.points }}</span> points</p>
      <p class="small text-body-secondary mb-0">Worth ₹{{ auth.user.points }} at checkout. You earn {{ tier.multiplier }}× points per ₹100.</p>
    </div>
    <div class="loyalty__next">
      <p class="small mb-1">
        <template v-if="upcoming">{{ upcoming.from - auth.user.lifetimePoints }} points to {{ upcoming.label }}</template>
        <template v-else>You've reached the top tier</template>
      </p>
      <div class="loyalty__meter" role="progressbar" :aria-valuenow="tierProgress" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to next tier">
        <span :style="{ width: `${tierProgress}%` }"></span>
      </div>
    </div>
  </section>

  <div class="row g-4">
    <div class="col-lg-5">
      <form class="card card-body" novalidate @submit.prevent="saveProfile">
        <h2 class="h5 mb-3">Profile</h2>
        <p class="small text-body-secondary">{{ auth.user.email }}</p>
        <FormField id="profile-name" v-model="profile.name" label="Name" :error="profileError" autocomplete="name" />
        <FormField id="profile-phone" v-model="profile.phone" label="Mobile number" type="tel" autocomplete="tel-national" />
        <div><button type="submit" class="btn btn-primary">Save profile</button></div>
      </form>
    </div>

    <div class="col-lg-7">
      <section class="card card-body" aria-labelledby="addresses-heading">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 id="addresses-heading" class="h5 mb-0">Saved addresses</h2>
          <button v-if="!editing" type="button" class="btn btn-sm btn-outline-primary" @click="startEditing(null)">Add address</button>
        </div>

        <form v-if="editing" novalidate @submit.prevent="saveAddress">
          <AddressForm v-model="editing" :errors="addressErrors" />
          <button type="submit" class="btn btn-primary">Save address</button>
          <button type="button" class="btn btn-link" @click="editing = null">Cancel</button>
        </form>
        <template v-else>
          <p v-if="!auth.user.addresses.length" class="text-body-secondary mb-0">You have no saved addresses yet.</p>
          <div v-for="address in auth.user.addresses" :key="address.id" class="border rounded p-3 mb-2" data-testid="saved-address">
            <strong>{{ address.name }}</strong>, {{ address.phone }}<br>
            {{ address.line1 }}<template v-if="address.line2">, {{ address.line2 }}</template>, {{ address.city }}, {{ address.state }} {{ address.pincode }}
            <div class="mt-2">
              <button type="button" class="btn btn-link btn-sm p-0 me-3" @click="startEditing(address)">Edit</button>
              <button type="button" class="btn btn-link btn-sm p-0 text-danger" @click="auth.deleteAddress(address.id)">Delete</button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.loyalty {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  border: 1px solid var(--line);
  border-radius: 1.5rem;
  background: radial-gradient(30rem 14rem at 95% 0, rgba(200, 245, 66, 0.14), transparent 70%), var(--surface-1);
}

.loyalty__points {
  font-family: var(--display-font);
  font-size: 2.25rem;
  font-weight: 700;
}

.loyalty__next {
  flex: 1;
  min-width: 14rem;
  max-width: 24rem;
}

.loyalty__meter {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.loyalty__meter span {
  display: block;
  height: 100%;
  background: var(--accent);
}
</style>
