<script setup>
import FormField from './FormField.vue';

defineProps({ errors: { type: Object, default: () => ({}) } });
const address = defineModel({ type: Object, required: true });
</script>

<template>
  <div class="row gx-3">
    <div class="col-md-6"><FormField id="address-name" v-model="address.name" label="Full name" :error="errors.name" autocomplete="name" /></div>
    <div class="col-md-6"><FormField id="address-phone" v-model="address.phone" label="Mobile number" :error="errors.phone" type="tel" autocomplete="tel-national" /></div>
    <div class="col-12"><FormField id="address-line1" v-model="address.line1" label="Street address" :error="errors.line1" autocomplete="address-line1" /></div>
    <div class="col-12"><FormField id="address-line2" v-model="address.line2" label="Apartment or landmark (optional)" autocomplete="address-line2" /></div>
    <div class="col-md-5"><FormField id="address-city" v-model="address.city" label="City" :error="errors.city" autocomplete="address-level2" /></div>
    <div class="col-md-4"><FormField id="address-state" v-model="address.state" label="State" :error="errors.state" autocomplete="address-level1" /></div>
    <div class="col-md-3"><FormField id="address-pincode" v-model="address.pincode" label="PIN code" :error="errors.pincode" inputmode="numeric" autocomplete="postal-code" /></div>
  </div>
</template>
