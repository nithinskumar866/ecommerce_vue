<template>
  <div class="products-page py-5 bg-light">
    <div class="container">
      <h2 class="text-center mb-5">Our Products</h2>
      <div class="row g-4">
        <div v-for="product in products" :key="product.id" class="col-md-4 col-lg-3">
          <div class="card product-card h-100 border-0 shadow-sm">
            <div class="card-img-top overflow-hidden" style="height: 200px;">
              <img :src="product.image" class="w-100 h-100 object-fit-cover" alt="Product Image">
            </div>
            <div class="card-body">
              <h5 class="card-title">{{ product.name }}</h5>
              <p class="card-text text-primary fw-bold mb-2">₹{{ product.price.toFixed(2) }}</p>
              <div class="d-flex gap-2">
                <router-link :to="'/product/' + product.id" class="btn btn-outline-primary btn-sm flex-grow-1">
                  Details
                </router-link>
                <button @click="addToCart(product)" class="btn btn-primary btn-sm">
                  <i class="bi bi-cart-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventBus } from '../eventBus';
import products from '../assets/products.json';

export default {
  data() {
    return { products };
  },
  methods: {
    addToCart(product) {
      eventBus.emit('add-to-cart', product);
      this.$notify({
        title: 'Added to Cart',
        text: `${product.name} has been added to your cart`,
        type: 'success'
      });
    }
  }
};
</script>

<style scoped>
.product-card {
  transition: all 0.3s ease;
  border-radius: 10px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-img-top {
  border-radius: 10px 10px 0 0;
}

.btn-primary {
  background-color: #26A69A;
  border-color: #26A69A;
}

.btn-primary:hover {
  background-color: #1e8c82;
  border-color: #1e8c82;
}

.btn-outline-primary {
  color: #26A69A;
  border-color: #26A69A;
}

.btn-outline-primary:hover {
  background-color: #26A69A;
  color: white;
}
</style>