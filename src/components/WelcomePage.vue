<template>
  <div class="hero-section text-center">
    <div class="hero-content">
      <h1 class="display-4">Welcome to Vue E-Commerce</h1>
      <p class="lead">Shop the Best Products with Amazing Deals!</p>
      <router-link to="/products" class="btn btn-hero">Shop Now</router-link>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  background: linear-gradient(rgba(255, 111, 97, 0.8), rgba(38, 166, 154, 0.8)), url('https://images.unsplash.com/photo-1507521628349-dee6c896dd15?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80');
  background-size: cover;
  background-position: center;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.hero-content {
  padding: 30px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
}

.display-4 {
  font-weight: 600;
  font-size: 3.5rem;
}

.lead {
  font-size: 1.5rem;
  font-weight: 300;
}

.btn-hero {
  background-color: #FF6F61;
  color: white;
  padding: 12px 40px;
  font-weight: 600;
  border-radius: 25px;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.btn-hero:hover {
  background-color: #26A69A;
  transform: scale(1.05);
}
</style>