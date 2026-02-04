const { buildMatrix } = require('../js/build-matrix.cjs');

if (require.main === module) {
  try {
    buildMatrix();
  } catch (error) {
    console.error('[BUILD] Error building matrix:', error);
    process.exit(1);
  }
}

module.exports = { buildMatrix };
