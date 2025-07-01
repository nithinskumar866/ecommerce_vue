<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="card-header bg-white py-3">
            <h2 class="h4 mb-0">Payment Details</h2>
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
              <div class="mb-4">
                <h5 class="mb-3">Order Summary</h5>
                <div v-for="(item, index) in cartItems" :key="index" class="d-flex justify-content-between py-2 border-bottom">
                  <div>
                    <span class="fw-medium">{{ item.name }}</span>
                    <span class="text-muted ms-2">x{{ item.quantity }}</span>
                  </div>
                  <span>₹{{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
                
                <div class="mt-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <span>₹{{ calculateSubtotal().toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span>Tax (5%):</span>
                    <span>₹{{ calculateTax().toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mt-2 fw-bold fs-5">
                    <span>Total:</span>
                    <span>₹{{ calculateTotal().toFixed(2) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="payment-form">
                <h5 class="mb-3">Payment Information</h5>
                <div class="mb-3">
                  <label for="cardNumber" class="form-label">Card Number</label>
                  <input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456">
                </div>
                
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="expiryDate" class="form-label">Expiry Date</label>
                    <input type="text" class="form-control" id="expiryDate" placeholder="MM/YY">
                  </div>
                  <div class="col-md-6">
                    <label for="cvv" class="form-label">CVV</label>
                    <input type="text" class="form-control" id="cvv" placeholder="123">
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="nameOnCard" class="form-label">Name on Card</label>
                  <input type="text" class="form-control" id="nameOnCard" placeholder="John Doe">
                </div>
                
                <div class="d-grid">
                  <button class="btn btn-primary btn-lg" @click="completePayment">
                    Pay ₹{{ calculateTotal().toFixed(2) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cartItems: []
    };
  },
  created() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
    }
  },
  methods: {
    calculateSubtotal() {
      return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    calculateTax() {
      return this.calculateSubtotal() * 0.05;
    },
    calculateTotal() {
      return this.calculateSubtotal() + this.calculateTax();
    },
    completePayment() {
      // In a real app, you would process payment here
      alert(`Payment of ₹${this.calculateTotal().toFixed(2)} successful!`);
      localStorage.removeItem('cartItems');
      this.$router.push('/order-confirmation');
    }
  }
};
</script>

<style scoped>
.payment-form {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.btn-primary {
  background-color: #26A69A;
  border-color: #26A69A;
  padding: 10px;
}

.btn-primary:hover {
  background-color: #1e8c82;
  border-color: #1e8c82;
}

.form-control {
  padding: 10px;
  border-radius: 5px;
}

.form-label {
  font-weight: 500;
}
</style>