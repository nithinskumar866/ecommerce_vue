import { respond } from './client';
import { reviewsFor } from './reviews';
import { products } from '@/data/products';
import { flashProductIds, flashWindow, FLASH_PERCENT } from '@/utils/deals';
import { readObject } from '@/utils/storage';

export const readSold = () => readObject('sold');

const toPaise = (rupees) => rupees * 100;

function toProduct(product, sold, flash) {
  const reviews = reviewsFor(product.id);
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const onFlash = flash.ids.includes(product.id);
  const basePrice = toPaise(product.price);

  return {
    ...product,
    price: onFlash ? toPaise(Math.round((product.price * (100 - FLASH_PERCENT)) / 100)) : basePrice,
    mrp: toPaise(product.mrp),
    storages: product.storages?.map((option) => ({ ...option, delta: toPaise(option.delta) })),
    stock: Math.max(0, product.stock - (sold[product.id] ?? 0)),
    flashEndsAt: onFlash ? flash.endsAt : null,
    rating: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
    reviewCount: reviews.length,
  };
}

export function allProducts(now = Date.now()) {
  const sold = readSold();
  const window = flashWindow(now);
  const flash = {
    endsAt: window.endsAt,
    ids: flashProductIds(window.index, products.map((product) => product.id)),
  };
  return products.map((product) => toProduct(product, sold, flash));
}

export const productsApi = {
  list: () => respond(() => allProducts()),
};
