// Public files live under the site's base path, which is a sub-folder on GitHub Pages.
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
