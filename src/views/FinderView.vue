<script setup>
import { computed, reactive, ref } from 'vue';
import CatalogGate from '@/components/CatalogGate.vue';
import RatingStars from '@/components/RatingStars.vue';
import { useCatalogStore } from '@/stores/catalog';
import { finderQuestions, recommendProducts } from '@/utils/finder';
import { formatMoney } from '@/utils/pricing';

const catalog = useCatalogStore();
const step = ref(0);
const answers = reactive({});

const finished = computed(() => step.value >= finderQuestions.length);
const question = computed(() => finderQuestions[step.value]);
const progress = computed(() => Math.round((step.value / finderQuestions.length) * 100));
const results = computed(() => (finished.value ? recommendProducts(catalog.products, answers) : []));

function choose(optionId) {
  answers[question.value.id] = optionId;
  step.value += 1;
}

function restart() {
  step.value = 0;
}
</script>

<template>
  <CatalogGate>
    <div class="finder">
      <p class="eyebrow mb-2">Product finder</p>
      <div class="finder__progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="Finder progress">
        <span :style="{ width: `${finished ? 100 : progress}%` }"></span>
      </div>

      <Transition name="page" mode="out-in">
        <section v-if="!finished" :key="question.id">
          <p class="small text-body-secondary mt-4 mb-1">Question {{ step + 1 }} of {{ finderQuestions.length }}</p>
          <h1 class="finder__title">{{ question.title }}</h1>
          <div class="row g-3">
            <div v-for="option in question.options" :key="option.id" class="col-6 col-md-4">
              <button type="button" class="finder__option" data-testid="finder-option" @click="choose(option.id)">
                <i class="bi fs-2 text-primary" :class="option.icon" aria-hidden="true"></i>
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>
          <button v-if="step > 0" type="button" class="btn btn-link px-0 mt-3" @click="step -= 1">Back</button>
        </section>

        <section v-else key="results">
          <h1 class="finder__title mt-4">Your top matches</h1>
          <article v-for="(result, index) in results" :key="result.product.id" class="card match" data-testid="finder-result">
            <img :src="result.product.images[0]" :alt="result.product.name" class="match__image">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <span v-if="index === 0" class="badge badge-flash mb-1">Best match</span>
                  <h2 class="h4 mb-1">{{ result.product.name }}</h2>
                </div>
                <strong class="display-font fs-4 text-nowrap">{{ result.match }}%</strong>
              </div>
              <RatingStars :rating="result.product.rating" :count="result.product.reviewCount" />
              <ul class="list-unstyled small my-2">
                <li v-for="reason in result.reasons" :key="reason"><i class="bi bi-check2 text-primary me-1" aria-hidden="true"></i>{{ reason }}</li>
              </ul>
              <div class="d-flex justify-content-between align-items-center">
                <strong>{{ formatMoney(result.product.price) }}</strong>
                <router-link :to="`/product/${result.product.id}`" class="btn btn-primary btn-sm">View product</router-link>
              </div>
            </div>
          </article>
          <button type="button" class="btn btn-outline-secondary mt-2" @click="restart">Start over</button>
        </section>
      </Transition>
    </div>
  </CatalogGate>
</template>

<style scoped>
.finder {
  max-width: 50rem;
  margin-inline: auto;
}

.finder__progress {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.finder__progress span {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.45s var(--ease);
}

.finder__title {
  font-size: clamp(1.9rem, 5vw, 3rem);
  margin-bottom: 1.5rem;
}

.finder__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  min-height: 9rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  background: var(--surface-1);
  color: var(--ink);
  font-weight: 600;
  transition: border-color 0.2s ease, transform 0.25s var(--ease);
}

.finder__option:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
}

.match {
  flex-direction: row;
  overflow: hidden;
  margin-bottom: 1rem;
}

.match__image {
  flex: none;
  width: min(14rem, 36%);
  object-fit: cover;
}
</style>
