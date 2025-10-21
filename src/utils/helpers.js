/**
 * Utility helper functions
 */

/**
 * Generate a random email address
 * @returns {string} Random email
 */
export const generateRandomEmail = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test_${timestamp}_${random}@example.com`;
};

/**
 * Generate a random username
 * @returns {string} Random username
 */
export const generateRandomUsername = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `user_${timestamp}_${random}`;
};

/**
 * Format date to string
 * @param {Date} date - Date object
 * @param {string} format - Format string (e.g., 'YYYY-MM-DD')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
};

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 */
export const getEnv = (key, defaultValue = '') => {
  return Cypress.env(key) || defaultValue;
};
