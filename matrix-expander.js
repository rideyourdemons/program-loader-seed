// Node entry shim for the browser-only Matrix Expander.
// This prevents MODULE_NOT_FOUND when running `node matrix-expander.js`.
console.log('[MatrixExpander] This is a browser module located at public/js/matrix-expander.js.');
console.log('[MatrixExpander] Run the site with: npm start');
console.log('[MatrixExpander] Then open: http://localhost:3000/');
