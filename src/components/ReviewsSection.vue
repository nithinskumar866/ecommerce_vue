<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { notify } from '@kyvg/vue3-notification';
import RatingStars from './RatingStars.vue';
import { errorMessage } from '@/api/client';
import { reviewsApi } from '@/api/reviews';
import { useLoad } from '@/composables/useLoad';
import { useAuthStore } from '@/stores/auth';
import { useCatalogStore } from '@/stores/catalog';

const props = defineProps({ productId: { type: Number, required: true } });

const route = useRoute();
const auth = useAuthStore();
const catalog = useCatalogStore();
const { data: reviews, status, reload } = useLoad(() => reviewsApi.list(props.productId));

const rating = ref(5);
const text = ref('');
const formError = ref('');
const submitting = ref(false);

const alreadyReviewed = computed(() => reviews.value?.some((review) => review.userId === auth.user?.id));
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

async function afterChange() {
  await Promise.all([reload({ quiet: true }), catalog.load({ force: true })]);
}

async function submit() {
  if (text.value.trim().length < 5) {
    formError.value = 'Please write at least 5 characters.';
    return;
  }
  submitting.value = true;
  formError.value = '';
  try {
    await reviewsApi.add({ productId: props.productId, rating: rating.value, text: text.value });
    text.value = '';
    await afterChange();
    notify({ title: 'Thanks for your review', type: 'success' });
  } catch (error) {
    formError.value = errorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function remove(id) {
  await reviewsApi.remove(id);
  await afterChange();
}
</script>

<template>
  <section class="mt-5" aria-labelledby="reviews-heading">
    <h2 id="reviews-heading" class="h4 mb-3">Customer reviews</h2>

    <form v-if="auth.isSignedIn && !alreadyReviewed && status === 'ready'" class="card card-body mb-4" novalidate @submit.prevent="submit">
      <div class="mb-3" style="max-width: 12rem">
        <label for="review-rating" class="form-label">Your rating</label>
        <select id="review-rating" v-model.number="rating" class="form-select">
          <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} star{{ n > 1 ? 's' : '' }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="review-text" class="form-label">Your review</label>
        <textarea id="review-text" v-model="text" class="form-control" :class="{ 'is-invalid': formError }" rows="3" maxlength="500"></textarea>
        <div v-if="formError" class="invalid-feedback">{{ formError }}</div>
      </div>
      <div><button type="submit" class="btn btn-primary" :disabled="submitting">Post review</button></div>
    </form>
    <p v-else-if="!auth.isSignedIn">
      <router-link :to="{ path: '/login', query: { redirect: route.fullPath } }">Sign in</router-link> to write a review.
    </p>

    <p v-if="status === 'loading'" class="text-body-secondary">Loading reviews…</p>
    <p v-else-if="status === 'error'" class="text-danger">Reviews could not be loaded.</p>
    <ul v-else class="list-unstyled mb-0">
      <li v-for="review in reviews" :key="review.id" class="border-bottom py-3" data-testid="review">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>{{ review.author }}</strong>
            <span v-if="review.sample" class="badge text-bg-secondary ms-2">Sample</span>
            <div><RatingStars :rating="review.rating" /></div>
          </div>
          <small class="text-body-secondary">{{ formatDate(review.date) }}</small>
        </div>
        <p class="mt-2 mb-0">{{ review.text }}</p>
        <button v-if="review.userId && review.userId === auth.user?.id" type="button" class="btn btn-link btn-sm text-danger p-0 mt-1" @click="remove(review.id)">Delete my review</button>
      </li>
    </ul>
  </section>
</template>
