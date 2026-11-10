import { notify } from '@kyvg/vue3-notification';
import { useCartStore } from '@/stores/cart';
import { useCompareStore, useWishlistStore, MAX_COMPARE } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';
import { defaultSelection } from '@/utils/variants';

function flyToCart(source) {
  const target = document.querySelector('[data-cart-target]');
  if (!source || !target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const clone = document.createElement('img');
  clone.src = source.currentSrc || source.src;
  clone.alt = '';
  Object.assign(clone.style, {
    position: 'fixed', left: `${from.left}px`, top: `${from.top}px`,
    width: `${from.width}px`, height: `${from.height}px`,
    objectFit: 'cover', borderRadius: '1rem', zIndex: 1700, pointerEvents: 'none',
  });
  document.body.append(clone);

  const moveX = to.left + to.width / 2 - (from.left + from.width / 2);
  const moveY = to.top + to.height / 2 - (from.top + from.height / 2);
  const animation = clone.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${moveX}px, ${moveY}px) scale(0.08)`, opacity: 0.4 },
  ], { duration: 700, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' });
  animation.onfinish = () => clone.remove();
  animation.oncancel = () => clone.remove();
}

export function useShopActions() {
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const compare = useCompareStore();
  const ui = useUiStore();

  function addToCart(product, quantity = 1, selection = defaultSelection(product), source = null) {
    if (cart.add(product, quantity, selection)) {
      flyToCart(source);
      ui.cartPulse += 1;
      notify({ title: 'Added to cart', text: product.name, type: 'success' });
      return true;
    }
    notify({ title: 'Stock limit reached', text: `Only ${product.stock} of ${product.name} available.`, type: 'warn' });
    return false;
  }

  function toggleWishlist(product) {
    const added = wishlist.toggle(product.id);
    notify({ title: added ? 'Added to wishlist' : 'Removed from wishlist', text: product.name });
  }

  function toggleCompare(product) {
    if (!compare.toggle(product.id)) {
      notify({ title: 'Comparison is full', text: `You can compare up to ${MAX_COMPARE} products.`, type: 'warn' });
    }
  }

  return { addToCart, toggleWishlist, toggleCompare };
}
