const authors = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sara', 'Vikram', 'Zoya'];

const comments = [
  [5, 'Exactly what I wanted. Setup took a couple of minutes.'],
  [4, 'Very good for the price. Packaging could be better.'],
  [5, 'Using it every day and it still feels premium.'],
  [3, 'Decent overall, though I expected a bit more.'],
  [4, 'Solid build and it does the job well.'],
  [5, 'Arrived early and works perfectly.'],
  [4, 'Happy with it. Battery and performance are good.'],
];

// Deterministic so each product always shows the same sample reviews.
export function sampleReviews(productId) {
  const count = 2 + (productId % 4);
  return Array.from({ length: count }, (_, i) => {
    const seed = productId * 7 + i * 3;
    const [rating, text] = comments[seed % comments.length];
    return {
      id: `sample-${productId}-${i}`,
      productId,
      author: authors[seed % authors.length],
      rating,
      text,
      date: new Date(Date.UTC(2026, seed % 9, 1 + (seed % 27))).toISOString(),
      sample: true,
    };
  });
}
