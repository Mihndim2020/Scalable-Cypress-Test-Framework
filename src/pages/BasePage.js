/**
 * Base Page Object Model
 * Contains common methods used across all pages
 */

class BasePage {
  /**
   * Visit a URL
   * @param {string} url - The URL to visit
   */
  visit(url) {
    cy.visit(url);
  }

  /**
   * Get element by selector
   * @param {string} selector - CSS selector
   */
  getElement(selector) {
    return cy.get(selector);
  }

  /**
   * Get element by test ID
   * @param {string} testId - data-test attribute value
   */
  getByTestId(testId) {
    return cy.getByTestId(testId);
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector
   */
  click(selector) {
    this.getElement(selector).click();
  }

  /**
   * Type text into an input field
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   */
  type(selector, text) {
    this.getElement(selector).clear().type(text);
  }

  /**
   * Verify URL contains text
   * @param {string} text - Text to check in URL
   */
  verifyUrlContains(text) {
    cy.url().should('include', text);
  }

  /**
   * Verify element is visible
   * @param {string} selector - CSS selector
   */
  verifyElementVisible(selector) {
    this.getElement(selector).should('be.visible');
  }

  /**
   * Wait for element to exist
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  waitForElement(selector, timeout = 10000) {
    cy.get(selector, { timeout }).should('exist');
  }
}

export default BasePage;
