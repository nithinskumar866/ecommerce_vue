<template>
  <div>
    <h2 class="text-center mb-4">Product Details</h2>
    <div v-if="product" class="card product-card">
      <img :src="product.image" class="card-img-top" alt="Product Image" style="height: 300px; object-fit: cover;" />
      <div class="card-body text-center">
        <h5 class="card-title">{{ product.name }}</h5>
        <p class="card-text">₹{{ product.price.toFixed(2) }}</p>
        <p class="card-text text-muted">{{ product.description }}</p>
        <button @click="addToCart(product)" class="btn btn-coral">Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<script>
import { eventBus } from '../eventBus';
import products from '../assets/products.json';

export default {
  data() {
    return {
      product: null,
    };
  },
  created() {
    const productId = parseInt(this.$route.params.id);
    this.product = products.find((p) => p.id === productId);
  },
  methods: {
    addToCart(product) {
      eventBus.emit('add-to-cart', product);
      alert(`${product.name} added to cart!`);
    },
  },
};
</script>

<style scoped>
h2 {
  color: #26A69A;
  font-weight: 600;
}

.product-card {
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  max-width: 500px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.card-text {
  font-size: 1.2rem;
}

.btn-coral {
  background-color: #FF6F61;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 30px;
  transition: background-color 0.3s ease;
}

.btn-coral:hover {
  background-color: #e65b50;
}
</style>