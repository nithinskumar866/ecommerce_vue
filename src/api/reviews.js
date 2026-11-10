import { ApiError, randomId, respond } from './client';
import { requireUser } from './auth';
import { sampleReviews } from '@/data/sampleReviews';
import { readRecords, writeStorage } from '@/utils/storage';

const readUserReviews = () => readRecords('reviews');

export function reviewsFor(productId) {
  return [
    ...readUserReviews().filter((review) => review.productId === productId),
    ...sampleReviews(productId),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export const reviewsApi = {
  list: (productId) => respond(() => reviewsFor(productId)),

  add: ({ productId, rating, text }) => respond(() => {
    const user = requireUser();
    const reviews = readUserReviews();
    if (reviews.some((review) => review.productId === productId && review.userId === user.id)) {
      throw new ApiError('You have already reviewed this product.', 'duplicate');
    }
    const review = {
      id: randomId(), productId, userId: user.id, author: user.name,
      rating, text: text.trim(), date: new Date().toISOString(),
    };
    writeStorage('reviews', [...reviews, review]);
    return review;
  }),

  remove: (id) => respond(() => {
    const user = requireUser();
    writeStorage('reviews', readUserReviews()
      .filter((review) => !(review.id === id && review.userId === user.id)));
  }),
};
