<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <router-link to="/" class="navbar-brand">Vue E-Commerce</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <div class="navbar-nav me-auto">
            <router-link to="/" class="nav-link">Home</router-link>
            <router-link to="/products" class="nav-link">Products</router-link>
            <router-link to="/cart" class="nav-link position-relative">
              Cart 
              <span v-if="cartItemCount > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {{ cartItemCount }}
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </nav>
    <div class="container mt-4">
      <router-view />
    </div>
  </div>
</template>

<script>
import { eventBus } from './eventBus';

export default {
  data() {
    return {
      cartItems: [],
    };
  },
  computed: {
    cartItemCount() {
      return this.cartItems.reduce((total, item) => total + item.quantity, 0);
    }
  },
  created() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
    }

    eventBus.on('add-to-cart', (product) => {
      const existingItem = this.cartItems.find((item) => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.cartItems.push({ ...product, quantity: 1 });
      }
      this.saveCart();
    });

    eventBus.on('update-cart', (cartItems) => {
      this.cartItems = cartItems;
      this.saveCart();
    });
  },
  methods: {
    saveCart() {
      localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
      eventBus.emit('cart-updated');
    }
  }
};
</script>

<style>
body {
  font-family: 'Poppins', sans-serif;
  background-color: #f8f9fa;
}

.navbar {
  background: linear-gradient(45deg, #3a4a9e, #26A69A);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.5rem;
}

.nav-link {
  font-weight: 500;
  padding: 8px 15px !important;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.badge {
  font-size: 0.7rem;
  padding: 4px 6px;
}
</style>