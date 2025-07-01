<template>
  <div class="container py-5">
    <div class="row">
      <div class="col-lg-8">
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-white border-bottom-0 py-3">
            <h2 class="h4 mb-0">🛒 Your Shopping Cart</h2>
          </div>
          <div class="card-body">
            <div v-if="cartItems.length === 0" class="text-center py-5">
              <i class="bi bi-cart-x fs-1 text-muted"></i>
              <p class="mt-3 text-muted">Your cart is empty</p>
              <router-link to="/products" class="btn btn-primary mt-3">
                Continue Shopping
              </router-link>
            </div>
            
            <div v-else>
              <div v-for="(item, index) in cartItems" :key="index" class="cart-item mb-3 p-3 border rounded">
                <div class="row align-items-center">
                  <div class="col-md-2">
                    <img :src="item.image" :alt="item.name" class="img-fluid rounded">
                  </div>
                  <div class="col-md-4">
                    <h5 class="mb-1">{{ item.name }}</h5>
                    <p class="mb-1 text-muted">₹{{ item.price.toFixed(2) }}</p>
                  </div>
                  <div class="col-md-3">
                    <div class="d-flex align-items-center">
                      <button @click="updateQuantity(index, -1)" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-dash"></i>
                      </button>
                      <span class="mx-3">{{ item.quantity }}</span>
                      <button @click="updateQuantity(index, 1)" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-2 text-end">
                    <p class="mb-0 fw-bold">₹{{ (item.price * item.quantity).toFixed(2) }}</p>
                  </div>
                  <div class="col-md-1 text-end">
                    <button @click="removeItem(index)" class="btn btn-link text-danger">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-lg-4">
        <div class="card shadow-sm sticky-top" style="top: 20px;">
          <div class="card-header bg-white border-bottom-0 py-3">
            <h2 class="h4 mb-0">Order Summary</h2>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>₹{{ calculateSubtotal().toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span>Tax (5%)</span>
              <span>₹{{ calculateTax().toFixed(2) }}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
              <span class="fw-bold">Total</span>
              <span class="fw-bold">₹{{ calculateTotal().toFixed(2) }}</span>
            </div>
            
            <div v-if="cartItems.length > 0" class="payment-section mt-4">
              <h5 class="mb-3">Payment Method</h5>
              <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="paymentMethod" id="creditCard" checked>
                <label class="form-check-label" for="creditCard">
                  Credit Card
                </label>
              </div>
              <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="paymentMethod" id="paypal">
                <label class="form-check-label" for="paypal">
                  PayPal
                </label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" name="paymentMethod" id="cod">
                <label class="form-check-label" for="cod">
                  Cash on Delivery
                </label>
              </div>
              
              <button class="btn btn-primary w-100 py-2" @click="proceedToPayment">
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventBus } from '../eventBus';

export default {
  name: 'CartPage',
  data() {
    return {
      cartItems: [],
    };
  },
  created() {
    this.loadCart();
    eventBus.on('cart-updated', this.loadCart);
  },
  methods: {
    loadCart() {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        this.cartItems = JSON.parse(savedCart);
      }
    },
    updateQuantity(index, change) {
      const item = this.cartItems[index];
      item.quantity += change;
      
      if (item.quantity <= 0) {
        this.removeItem(index);
      } else {
        this.saveCart();
      }
    },
    removeItem(index) {
      this.cartItems.splice(index, 1);
      this.saveCart();
    },
    saveCart() {
      localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
      eventBus.emit('update-cart', this.cartItems);
    },
    calculateSubtotal() {
      return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    calculateTax() {
      return this.calculateSubtotal() * 0.05;
    },
    calculateTotal() {
      return this.calculateSubtotal() + this.calculateTax();
    },
    proceedToPayment() {
      if (this.cartItems.length > 0) {
        this.$router.push('/payment');
      }
    }
  }
};
</script>

<style scoped>
.cart-item {
  transition: all 0.2s ease;
}

.cart-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.img-fluid {
  max-height: 80px;
  object-fit: contain;
}

.btn-outline-secondary {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.payment-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.form-check-input:checked {
  background-color: #26A69A;
  border-color: #26A69A;
}

.btn-primary {
  background-color: #26A69A;
  border-color: #26A69A;
}

.btn-primary:hover {
  background-color: #1e8c82;
  border-color: #1e8c82;
}
</style>