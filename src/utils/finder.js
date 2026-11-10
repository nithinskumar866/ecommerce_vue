export const finderQuestions = [
  {
    id: 'use',
    title: 'What will you use it for most?',
    options: [
      { id: 'work', label: 'Work and study', icon: 'bi-briefcase' },
      { id: 'music', label: 'Music and calls', icon: 'bi-music-note-beamed' },
      { id: 'fitness', label: 'Fitness', icon: 'bi-heart-pulse' },
      { id: 'home', label: 'Around the home', icon: 'bi-house-heart' },
      { id: 'travel', label: 'Travel', icon: 'bi-airplane' },
      { id: 'gaming', label: 'Gaming', icon: 'bi-controller' },
    ],
  },
  {
    id: 'budget',
    title: "What's your budget?",
    options: [
      { id: 'low', label: 'Under ₹5,000', icon: 'bi-wallet', max: 500000 },
      { id: 'mid', label: '₹5,000 to ₹25,000', icon: 'bi-wallet2', min: 500000, max: 2500000 },
      { id: 'high', label: 'Over ₹25,000', icon: 'bi-gem', min: 2500000 },
      { id: 'any', label: 'Show me anything', icon: 'bi-infinity' },
    ],
  },
  {
    id: 'priority',
    title: 'What matters most?',
    options: [
      { id: 'value', label: 'Best value', icon: 'bi-tag' },
      { id: 'rating', label: 'Top rated', icon: 'bi-star' },
      { id: 'premium', label: 'The premium pick', icon: 'bi-stars' },
    ],
  },
];

const optionFor = (questionId, optionId) => finderQuestions
  .find((question) => question.id === questionId).options
  .find((option) => option.id === optionId);

function scoreProduct(product, answers, highestPrice) {
  const budget = optionFor('budget', answers.budget);
  const reasons = [];
  let score = 0;

  if (product.uses?.includes(answers.use)) {
    score += 50;
    reasons.push(`Great for ${optionFor('use', answers.use).label.toLowerCase()}`);
  }

  const inBudget = (budget.min ?? 0) <= product.price && product.price <= (budget.max ?? Infinity);
  if (inBudget) {
    score += 30;
    if (answers.budget !== 'any') reasons.push('Fits your budget');
  }

  if (answers.priority === 'value') {
    const discount = (product.mrp - product.price) / product.mrp;
    score += Math.min(20, discount * 60);
    if (discount >= 0.2) reasons.push(`${Math.round(discount * 100)}% below MRP`);
  } else if (answers.priority === 'rating') {
    score += (product.rating / 5) * 20;
    if (product.rating >= 4.2) reasons.push(`Rated ${product.rating} out of 5`);
  } else {
    score += (product.price / highestPrice) * 20;
    reasons.push('A premium choice');
  }

  return { product, match: Math.round(Math.min(score, 100)), reasons };
}

// Only products actually for sale are recommended.
export function recommendProducts(products, answers, count = 3) {
  const available = products.filter((product) => product.stock > 0);
  const highestPrice = Math.max(...available.map((product) => product.price), 1);
  return available
    .map((product) => scoreProduct(product, answers, highestPrice))
    .sort((a, b) => b.match - a.match)
    .slice(0, count);
}
