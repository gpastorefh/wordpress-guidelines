import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { onMounted } from 'vue';

import './custom.css';

/**
 * Click-to-zoom for screenshots: a single native <dialog> reused for every image,
 * wired through event delegation so it keeps working across client-side navigation.
 */
function setupImageZoom(): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-zoom';
  const image = document.createElement('img');
  dialog.append(image);
  document.body.append(dialog);

  // Any click (backdrop or image) closes it; Esc is handled natively by <dialog>.
  dialog.addEventListener('click', () => dialog.close());

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLImageElement) || !target.closest('.vp-doc')) {
      return;
    }

    image.src = target.currentSrc || target.src;
    image.alt = target.alt;
    dialog.showModal();
  });
}

const theme: Theme = {
  extends: DefaultTheme,
  setup() {
    onMounted(setupImageZoom);
  },
};

export default theme;
