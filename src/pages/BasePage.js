/**
 * Base Page Object Model
 * Contains common methods used across all pages
 * All page objects should extend this base class
 */

class BasePage {
  constructor() {
    this.timeout = 10000;
  }

  /**
   * Visit a URL
   * @param {string} url - The URL to visit (relative or absolute)
   * @param {Object} options - Cypress visit options
   */
  visit(url, options = {}) {
    cy.visit(url, options);
    return this;
  }

  /**
   * Get element by CSS selector
   * @param {string} selector - CSS selector
   * @param {Object} options - Cypress get options
   * @returns {Cypress.Chainable} Cypress element
   */
  getElement(selector, options = {}) {
    return cy.get(selector, options);
  }

  /**
   * Get element by data-test attribute
   * @param {string} testId - data-test attribute value
   * @returns {Cypress.Chainable} Cypress element
   */
  getByTestId(testId) {
    return cy.getByTestId(testId);
  }

  /**
   * Get element by data-cy attribute
   * @param {string} selector - data-cy attribute value
   * @returns {Cypress.Chainable} Cypress element
   */
  getByCy(selector) {
    return cy.getByCy(selector);
  }

  /**
   * Click an element with optional force
   * @param {string} selector - CSS selector or Cypress chainable
   * @param {Object} options - Click options
   */
  click(selector, options = {}) {
    if (typeof selector === 'string') {
      this.getElement(selector).click(options);
    } else {
      selector.click(options);
    }
    return this;
  }

  /**
   * Type text into an input field
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   * @param {Object} options - Type options
   */
  type(selector, text, options = {}) {
    this.getElement(selector).clear().type(text, options);
    return this;
  }

  /**
   * Fill input without clearing first
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   */
  fill(selector, text) {
    this.getElement(selector).type(text);
    return this;
  }

  /**
   * Select from dropdown
   * @param {string} selector - CSS selector
   * @param {string} value - Value to select
   */
  select(selector, value) {
    this.getElement(selector).select(value);
    return this;
  }

  /**
   * Check checkbox or radio button
   * @param {string} selector - CSS selector
   */
  check(selector) {
    this.getElement(selector).check();
    return this;
  }

  /**
   * Uncheck checkbox
   * @param {string} selector - CSS selector
   */
  uncheck(selector) {
    this.getElement(selector).uncheck();
    return this;
  }

  /**
   * Get element text content
   * @param {string} selector - CSS selector
   * @returns {Cypress.Chainable} Text content
   */
  getText(selector) {
    return this.getElement(selector).invoke('text');
  }

  /**
   * Get element value
   * @param {string} selector - CSS selector
   * @returns {Cypress.Chainable} Element value
   */
  getValue(selector) {
    return this.getElement(selector).invoke('val');
  }

  /**
   * Verify URL contains text
   * @param {string} text - Text to check in URL
   */
  verifyUrlContains(text) {
    cy.url().should('include', text);
    return this;
  }

  /**
   * Verify URL equals specific path
   * @param {string} path - Expected URL path
   */
  verifyUrl(path) {
    cy.url().should('eq', Cypress.config().baseUrl + path);
    return this;
  }

  /**
   * Verify element is visible
   * @param {string} selector - CSS selector
   */
  verifyElementVisible(selector) {
    this.getElement(selector).should('be.visible');
    return this;
  }

  /**
   * Verify element exists in DOM
   * @param {string} selector - CSS selector
   */
  verifyElementExists(selector) {
    this.getElement(selector).should('exist');
    return this;
  }

  /**
   * Verify element does not exist
   * @param {string} selector - CSS selector
   */
  verifyElementNotExists(selector) {
    cy.get(selector).should('not.exist');
    return this;
  }

  /**
   * Verify element has text
   * @param {string} selector - CSS selector
   * @param {string} text - Expected text
   */
  verifyElementText(selector, text) {
    this.getElement(selector).should('have.text', text);
    return this;
  }

  /**
   * Verify element contains text
   * @param {string} selector - CSS selector
   * @param {string} text - Text that should be contained
   */
  verifyElementContainsText(selector, text) {
    this.getElement(selector).should('contain.text', text);
    return this;
  }

  /**
   * Verify element has specific attribute value
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute name
   * @param {string} value - Expected value
   */
  verifyElementAttribute(selector, attribute, value) {
    this.getElement(selector).should('have.attr', attribute, value);
    return this;
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  waitForElement(selector, timeout = this.timeout) {
    cy.get(selector, { timeout }).should('be.visible');
    return this;
  }

  /**
   * Wait for element to exist
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  waitForElementToExist(selector, timeout = this.timeout) {
    cy.get(selector, { timeout }).should('exist');
    return this;
  }

  /**
   * Wait for element to not exist
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  waitForElementToNotExist(selector, timeout = this.timeout) {
    cy.get(selector, { timeout }).should('not.exist');
    return this;
  }

  /**
   * Wait for page to load (checks document ready state)
   */
  waitForPageLoad() {
    cy.document().its('readyState').should('eq', 'complete');
    return this;
  }

  /**
   * Scroll element into view
   * @param {string} selector - CSS selector
   */
  scrollToElement(selector) {
    this.getElement(selector).scrollIntoView();
    return this;
  }

  /**
   * Reload the page
   */
  reload() {
    cy.reload();
    return this;
  }

  /**
   * Go back in browser history
   */
  goBack() {
    cy.go('back');
    return this;
  }

  /**
   * Take a screenshot
   * @param {string} name - Screenshot name
   */
  takeScreenshot(name) {
    cy.screenshot(name);
    return this;
  }
}

export default BasePage;
