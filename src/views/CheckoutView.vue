<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AddressForm from '@/components/AddressForm.vue';
import CatalogGate from '@/components/CatalogGate.vue';
import EmptyState from '@/components/EmptyState.vue';
import FormField from '@/components/FormField.vue';
import TotalsList from '@/components/TotalsList.vue';
import { errorMessage } from '@/api/client';
import { ordersApi } from '@/api/orders';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useCatalogStore } from '@/stores/catalog';
import { deliveryOptions, formatMoney } from '@/utils/pricing';
import { validateAddress, validateCard, validateUpi } from '@/utils/validators';

const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();
const catalog = useCatalogStore();

const steps = ['Address', 'Delivery', 'Payment'];
const step = ref(0);

const emptyAddress = () => ({ name: auth.user.name, phone: auth.user.phone, line1: '', line2: '', city: '', state: '', pincode: '' });
const addresses = computed(() => auth.user.addresses);
const addressId = ref(addresses.value[0]?.id ?? null);
const addingAddress = ref(addresses.value.length === 0);
const newAddress = ref(emptyAddress());
const addressErrors = ref({});
const stepError = ref('');

const deliveryId = ref('standard');
const usePoints = ref(false);
const availablePoints = computed(() => (usePoints.value ? auth.user.points : 0));
const totals = computed(() => cart.totalsFor(deliveryId.value, availablePoints.value));
const deliveryFee = (option) => cart.totalsFor(option.id).shipping;
// How many points the order could take, whether or not they're currently applied.
const redeemable = computed(() => cart.totalsFor(deliveryId.value, auth.user.points).pointsUsed);

const paymentMethod = ref('card');
const card = reactive({ number: '', expiry: '', cvv: '', name: '' });
const upi = reactive({ id: '' });
const paymentErrors = ref({});
const orderError = ref('');
const placing = ref(false);

const selectedAddress = computed(() => addresses.value.find((address) => address.id === addressId.value));

async function saveNewAddress() {
  addressErrors.value = validateAddress(newAddress.value);
  if (Object.keys(addressErrors.value).length) return;
  const before = new Set(addresses.value.map((address) => address.id));
  await auth.saveAddress(newAddress.value);
  addressId.value = addresses.value.find((address) => !before.has(address.id)).id;
  addingAddress.value = false;
  newAddress.value = emptyAddress();
}

function continueFromAddress() {
  stepError.value = selectedAddress.value ? '' : 'Choose a delivery address.';
  if (!stepError.value) step.value = 1;
}

function fillTestCard() {
  Object.assign(card, { number: '4242 4242 4242 4242', expiry: '12/34', cvv: '123', name: auth.user.name });
}

function paymentPayload() {
  if (paymentMethod.value === 'card') {
    paymentErrors.value = validateCard(card);
    return { method: 'card', cardNumber: card.number };
  }
  if (paymentMethod.value === 'upi') {
    paymentErrors.value = validateUpi(upi);
    return { method: 'upi', upiId: upi.id };
  }
  paymentErrors.value = {};
  return { method: 'cod' };
}

async function placeOrder() {
  const payment = paymentPayload();
  if (Object.keys(paymentErrors.value).length) return;
  placing.value = true;
  orderError.value = '';
  try {
    const order = await ordersApi.place({
      lines: cart.lines,
      address: selectedAddress.value,
      deliveryId: deliveryId.value,
      couponCode: cart.couponCode,
      payment,
      usePoints: usePoints.value,
    });
    await Promise.all([catalog.load({ force: true }), auth.init()]);
    await router.replace({ path: `/orders/${order.id}`, query: { placed: '1' } });
    cart.clear();
  } catch (error) {
    orderError.value = errorMessage(error);
    await catalog.load({ force: true });
  } finally {
    placing.value = false;
  }
}
</script>

<template>
  <CatalogGate>
    <h1 class="h3 mb-4">Checkout</h1>
    <EmptyState v-if="!cart.items.length" icon="bi-cart-x" title="Your cart is empty">
      <router-link to="/products" class="btn btn-primary">Browse products</router-link>
    </EmptyState>

    <div v-else class="row g-4">
      <div class="col-lg-8">
        <ol class="list-inline mb-4" aria-label="Checkout steps">
          <li v-for="(label, index) in steps" :key="label" class="list-inline-item me-3" :aria-current="index === step ? 'step' : undefined">
            <span class="badge rounded-pill me-1" :class="index <= step ? 'text-bg-primary' : 'text-bg-secondary'">{{ index + 1 }}</span>
            <span :class="{ 'fw-semibold': index === step }">{{ label }}</span>
          </li>
        </ol>

        <section v-if="step === 0" class="card card-body" aria-label="Delivery address">
          <h2 class="h5 mb-3">Delivery address</h2>
          <div v-for="address in addresses" :key="address.id" class="form-check border rounded p-3 ps-5 mb-2">
            <input :id="`address-${address.id}`" v-model="addressId" class="form-check-input" type="radio" name="address" :value="address.id">
            <label class="form-check-label" :for="`address-${address.id}`">
              <strong>{{ address.name }}</strong>, {{ address.phone }}<br>
              {{ address.line1 }}<template v-if="address.line2">, {{ address.line2 }}</template>, {{ address.city }}, {{ address.state }} {{ address.pincode }}
            </label>
          </div>

          <form v-if="addingAddress" class="mt-3" novalidate @submit.prevent="saveNewAddress">
            <AddressForm v-model="newAddress" :errors="addressErrors" />
            <button type="submit" class="btn btn-outline-primary">Save address</button>
            <button v-if="addresses.length" type="button" class="btn btn-link" @click="addingAddress = false">Cancel</button>
          </form>
          <div v-else>
            <button type="button" class="btn btn-link px-0" @click="addingAddress = true">+ Add a new address</button>
          </div>

          <p v-if="stepError" class="text-danger mt-2 mb-0" role="alert">{{ stepError }}</p>
          <div class="text-end mt-3"><button type="button" class="btn btn-primary" @click="continueFromAddress">Continue</button></div>
        </section>

        <section v-else-if="step === 1" class="card card-body" aria-label="Delivery method">
          <h2 class="h5 mb-3">Delivery method</h2>
          <div v-for="option in deliveryOptions" :key="option.id" class="form-check border rounded p-3 ps-5 mb-2">
            <input :id="`delivery-${option.id}`" v-model="deliveryId" class="form-check-input" type="radio" name="delivery" :value="option.id">
            <label class="form-check-label d-flex justify-content-between" :for="`delivery-${option.id}`">
              <span><strong>{{ option.label }}</strong><br><small class="text-body-secondary">{{ option.eta }}</small></span>
              <span>{{ deliveryFee(option) ? formatMoney(deliveryFee(option)) : 'Free' }}</span>
            </label>
          </div>
          <div class="d-flex justify-content-between mt-3">
            <button type="button" class="btn btn-link px-0" @click="step = 0">Back</button>
            <button type="button" class="btn btn-primary" @click="step = 2">Continue</button>
          </div>
        </section>

        <form v-else class="card card-body" novalidate aria-label="Payment" @submit.prevent="placeOrder">
          <h2 class="h5 mb-3">Payment</h2>
          <div class="alert alert-warning small">Simulated payment. Please don't enter real card details.</div>

          <div v-if="redeemable" class="form-check form-switch mb-3">
            <input id="use-points" v-model="usePoints" class="form-check-input" type="checkbox" role="switch">
            <label class="form-check-label" for="use-points">
              Use {{ redeemable }} points to save {{ formatMoney(redeemable * 100) }}
              <span class="small text-body-secondary">({{ auth.user.points }} available)</span>
            </label>
          </div>

          <div class="mb-3" role="radiogroup" aria-label="Payment method">
            <div class="form-check form-check-inline">
              <input id="pay-card" v-model="paymentMethod" class="form-check-input" type="radio" value="card">
              <label class="form-check-label" for="pay-card">Card</label>
            </div>
            <div class="form-check form-check-inline">
              <input id="pay-upi" v-model="paymentMethod" class="form-check-input" type="radio" value="upi">
              <label class="form-check-label" for="pay-upi">UPI</label>
            </div>
            <div class="form-check form-check-inline">
              <input id="pay-cod" v-model="paymentMethod" class="form-check-input" type="radio" value="cod">
              <label class="form-check-label" for="pay-cod">Cash on Delivery</label>
            </div>
          </div>

          <div v-if="paymentMethod === 'card'">
            <button type="button" class="btn btn-sm btn-outline-secondary mb-2" @click="fillTestCard">Fill test card</button>
            <p class="small text-body-secondary">Card 4000 0000 0000 0002 simulates a decline.</p>
            <FormField id="card-number" v-model="card.number" label="Card number" :error="paymentErrors.number" inputmode="numeric" autocomplete="off" />
            <div class="row">
              <div class="col-6"><FormField id="card-expiry" v-model="card.expiry" label="Expiry (MM/YY)" :error="paymentErrors.expiry" autocomplete="off" /></div>
              <div class="col-6"><FormField id="card-cvv" v-model="card.cvv" label="CVV" :error="paymentErrors.cvv" type="password" inputmode="numeric" autocomplete="off" /></div>
            </div>
            <FormField id="card-name" v-model="card.name" label="Name on card" :error="paymentErrors.name" autocomplete="off" />
          </div>
          <FormField v-else-if="paymentMethod === 'upi'" id="upi-id" v-model="upi.id" label="UPI ID" :error="paymentErrors.id" placeholder="name@bank" autocomplete="off" />
          <p v-else class="mb-3">Pay {{ formatMoney(totals.total) }} in cash when your order arrives.</p>

          <div v-if="orderError" class="alert alert-danger" role="alert" data-testid="order-error">{{ orderError }}</div>
          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-link px-0" @click="step = 1">Back</button>
            <button type="submit" class="btn btn-primary" :disabled="placing || cart.hasStockIssue">
              {{ placing ? 'Placing order…' : `Place order · ${formatMoney(totals.total)}` }}
            </button>
          </div>
        </form>
      </div>

      <div class="col-lg-4">
        <div class="card card-body">
          <h2 class="h5 mb-3">Order summary</h2>
          <ul class="list-unstyled small">
            <li v-for="item in cart.items" :key="item.key" class="d-flex justify-content-between gap-2 mb-1">
              <span>{{ item.product.name }}<template v-if="item.variant.label"> ({{ item.variant.label }})</template> × {{ item.quantity }}</span>
              <span class="text-nowrap">{{ formatMoney(item.variant.price * item.quantity) }}</span>
            </li>
          </ul>
          <TotalsList :totals="totals" />
        </div>
      </div>
    </div>
  </CatalogGate>
</template>
