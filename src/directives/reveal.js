const canAnimate = () => 'IntersectionObserver' in window
  && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Usage: v-reveal fades an element in the first time it scrolls into view.
export const reveal = {
  mounted(element) {
    if (!canAnimate()) return;
    element.classList.add('reveal');
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        element.classList.add('is-visible');
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    observer.observe(element);
    element.revealObserver = observer;
  },
  unmounted(element) {
    element.revealObserver?.disconnect();
  },
};
