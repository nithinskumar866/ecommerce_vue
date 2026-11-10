<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  // [{ date: 'YYYY-MM-DD', value: number }]
  points: { type: Array, required: true },
  formatValue: { type: Function, required: true },
  formatTick: { type: Function, required: true },
  label: { type: String, required: true },
});

const PLOT_HEIGHT = 240;
const X_AXIS_BAND = 28;
const MARGIN = { top: 16, right: 58, left: 56 };
const TICK_COUNT = 4;
const LABEL_COUNT = 5;

const root = ref(null);
const width = ref(640);
const hovered = ref(null);

let observer;
onMounted(() => {
  width.value = root.value.clientWidth;
  observer = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width; });
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());

function niceMax(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value || 1));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value);
  return step * magnitude;
}

const plotWidth = computed(() => Math.max(40, width.value - MARGIN.left - MARGIN.right));
const yMax = computed(() => niceMax(Math.max(...props.points.map((point) => point.value), 1)));
const x = (index) => MARGIN.left + (index / Math.max(1, props.points.length - 1)) * plotWidth.value;
const y = (value) => MARGIN.top + PLOT_HEIGHT - (value / yMax.value) * PLOT_HEIGHT;
const baseline = computed(() => MARGIN.top + PLOT_HEIGHT);

const ticks = computed(() => Array.from({ length: TICK_COUNT + 1 }, (_, index) => (yMax.value / TICK_COUNT) * index));
const line = computed(() => props.points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' '));
const area = computed(() => `${line.value} L${x(props.points.length - 1).toFixed(1)} ${baseline.value} L${x(0).toFixed(1)} ${baseline.value} Z`);
const last = computed(() => props.points.length - 1);

const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const dateLabels = computed(() => {
  const total = props.points.length;
  const count = Math.min(LABEL_COUNT, total);
  return Array.from({ length: count }, (_, index) => Math.round((index / Math.max(1, count - 1)) * (total - 1)));
});

const anchorFor = (index) => {
  if (index === 0) return 'start';
  return index === last.value ? 'end' : 'middle';
};

function trackPointer(event) {
  const box = root.value.getBoundingClientRect();
  const fraction = (event.clientX - box.left - MARGIN.left) / plotWidth.value;
  hovered.value = Math.max(0, Math.min(last.value, Math.round(fraction * last.value)));
}

function moveWithKeys(event) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const step = event.key === 'ArrowRight' ? 1 : -1;
  hovered.value = Math.max(0, Math.min(last.value, (hovered.value ?? last.value) + step));
}

const tooltipStyle = computed(() => {
  const left = x(hovered.value);
  return left > width.value / 2
    ? { right: `${width.value - left + 12}px` }
    : { left: `${left + 12}px` };
});
</script>

<template>
  <div
    ref="root"
    class="chart"
    tabindex="0"
    role="img"
    :aria-label="label"
    data-testid="area-chart"
    @pointermove="trackPointer"
    @pointerleave="hovered = null"
    @blur="hovered = null"
    @keydown="moveWithKeys"
  >
    <svg :width="width" :height="PLOT_HEIGHT + MARGIN.top + X_AXIS_BAND" aria-hidden="true">
      <g v-for="tick in ticks" :key="tick">
        <line :x1="MARGIN.left" :x2="MARGIN.left + plotWidth" :y1="y(tick)" :y2="y(tick)" class="chart__grid" />
        <text :x="MARGIN.left - 8" :y="y(tick) + 4" text-anchor="end" class="chart__text">{{ formatTick(tick) }}</text>
      </g>
      <text
        v-for="index in dateLabels"
        :key="index"
        :x="x(index)"
        :y="baseline + 20"
        :text-anchor="anchorFor(index)"
        class="chart__text"
      >{{ shortDate(points[index].date) }}</text>

      <path :d="area" class="chart__area" />
      <path :d="line" class="chart__line" />

      <line v-if="hovered !== null" :x1="x(hovered)" :x2="x(hovered)" :y1="MARGIN.top" :y2="baseline" class="chart__crosshair" />
      <circle v-if="hovered !== null" :cx="x(hovered)" :cy="y(points[hovered].value)" r="4" class="chart__dot" />

      <circle :cx="x(last)" :cy="y(points[last].value)" r="4" class="chart__dot" />
      <text :x="x(last) + 8" :y="y(points[last].value) + 4" class="chart__text chart__text--strong">{{ formatTick(points[last].value) }}</text>
    </svg>

    <div v-if="hovered !== null" class="chart__tooltip" :style="tooltipStyle" data-testid="chart-tooltip">
      <strong>{{ formatValue(points[hovered].value) }}</strong>
      <span>{{ shortDate(points[hovered].date) }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  touch-action: pan-y;
}

svg {
  display: block;
}

.chart__grid {
  stroke: var(--chart-grid);
  stroke-width: 1;
}

.chart__text {
  fill: var(--ink-soft);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.chart__text--strong {
  fill: var(--ink);
  font-weight: 600;
}

.chart__area {
  fill: var(--chart);
  opacity: 0.1;
}

.chart__line {
  fill: none;
  stroke: var(--chart);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart__crosshair {
  stroke: var(--ink-soft);
  stroke-width: 1;
}

.chart__dot {
  fill: var(--chart);
  stroke: var(--surface-1);
  stroke-width: 2;
}

.chart__tooltip {
  position: absolute;
  top: 12px;
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  background: var(--surface-2);
  font-size: 0.8rem;
  pointer-events: none;
}

.chart__tooltip span {
  color: var(--ink-soft);
}
</style>
