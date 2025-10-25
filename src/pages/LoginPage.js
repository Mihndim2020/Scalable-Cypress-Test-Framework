import BasePage from './BasePage.js';

/**
 * Login Page Object Model
 * Handles all interactions with the login page
 */
class LoginPage extends BasePage {
  constructor() {
    super();

    // Page URL
    this.url = '/signin';

    // Selectors - Based on actual page HTML structure
    this.selectors = {
      // Input fields use data-test on the parent div, not the input itself
      usernameContainer: '[data-test="signin-username"]',
      usernameInput: '#username',
      passwordContainer: '[data-test="signin-password"]',
      passwordInput: '#password',
      submitButton: '[data-test="signin-submit"]',
      rememberMeCheckbox: '[data-test="signin-remember-me"]',
      errorMessage: '[data-test="signin-error"]',
      signupLink: '[data-test="signup"]',
      // Note: Form title doesn't have data-test attribute, using h1 instead
      formTitle: 'h1',
      loadingSpinner: '[data-test="loading-spinner"]',
      successMessage: '[data-test="success-message"]',
    };
  }

  /**
   * Load the login page
   * @param {Object} options - Visit options
   * @returns {LoginPage} LoginPage instance for chaining
   */
  load(options = {}) {
    this.visit(this.url, options);
    this.waitForPageLoad();
    return this;
  }

  /**
   * Enter username
   * @param {string} username - Username to enter
   * @returns {LoginPage} LoginPage instance for chaining
   */
  enterUsername(username) {
    this.type(this.selectors.usernameInput, username);
    return this;
  }

  /**
   * Enter password
   * @param {string} password - Password to enter
   * @returns {LoginPage} LoginPage instance for chaining
   */
  enterPassword(password) {
    this.type(this.selectors.passwordInput, password);
    return this;
  }

  /**
   * Click submit button
   * @returns {LoginPage} LoginPage instance for chaining
   */
  clickSubmit() {
    this.click(this.selectors.submitButton);
    return this;
  }

  /**
   * Toggle remember me checkbox
   * @param {boolean} check - True to check, false to uncheck
   * @returns {LoginPage} LoginPage instance for chaining
   */
  toggleRememberMe(check = true) {
    if (check) {
      this.check(this.selectors.rememberMeCheckbox);
    } else {
      this.uncheck(this.selectors.rememberMeCheckbox);
    }
    return this;
  }

  /**
   * Click signup link
   * @returns {LoginPage} LoginPage instance for chaining
   */
  clickSignup() {
    this.click(this.selectors.signupLink);
    return this;
  }

  /**
   * Click forgot password link
   * @returns {LoginPage} LoginPage instance for chaining
   */
  clickForgotPassword() {
    this.click(this.selectors.forgotPasswordLink);
    return this;
  }

  /**
   * Perform complete login action
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {boolean} rememberMe - Whether to check remember me
   * @returns {LoginPage} LoginPage instance for chaining
   */
  login(username, password, rememberMe = false) {
    this.enterUsername(username);
    this.enterPassword(password);

    if (rememberMe) {
      this.toggleRememberMe(true);
    }

    this.clickSubmit();
    return this;
  }

  /**
   * Login with credentials from fixture or env
   * @param {string} userType - Type of user (validUser, adminUser, etc.)
   * @returns {LoginPage} LoginPage instance for chaining
   */
  loginWithFixture(userType = 'validUser') {
    cy.fixture('users').then((users) => {
      const user = users[userType];
      this.login(user.username, user.password);
    });
    return this;
  }

  /**
   * Login using environment variables
   * @returns {LoginPage} LoginPage instance for chaining
   */
  loginWithEnv() {
    const username = Cypress.env('username');
    const password = Cypress.env('password');
    this.login(username, password);
    return this;
  }

  /**
   * Wait for login to complete (loading spinner disappears)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {LoginPage} LoginPage instance for chaining
   */
  waitForLoginComplete(timeout = 10000) {
    this.waitForElementToNotExist(this.selectors.loadingSpinner, timeout);
    return this;
  }

  // ===== Assertion Methods =====

  /**
   * Verify login page is loaded
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifyPageLoaded() {
    this.verifyUrlContains(this.url);
    this.verifyElementVisible(this.selectors.usernameInput);
    this.verifyElementVisible(this.selectors.passwordInput);
    this.verifyElementVisible(this.selectors.submitButton);
    return this;
  }

  /**
   * Verify error message is displayed
   * @param {string} expectedMessage - Expected error message (optional)
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifyErrorMessage(expectedMessage = null) {
    this.verifyElementVisible(this.selectors.errorMessage);

    if (expectedMessage) {
      this.verifyElementContainsText(this.selectors.errorMessage, expectedMessage);
    }

    return this;
  }

  /**
   * Verify login was successful (redirected away from login page)
   * @param {string} expectedUrl - Expected URL after login
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifyLoginSuccess(expectedUrl = '/dashboard') {
    this.verifyUrlContains(expectedUrl);
    return this;
  }

  /**
   * Verify form title
   * @param {string} expectedTitle - Expected title text
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifyFormTitle(expectedTitle = 'Sign In') {
    this.verifyElementContainsText(this.selectors.formTitle, expectedTitle);
    return this;
  }

  /**
   * Verify submit button is disabled
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifySubmitDisabled() {
    this.getElement(this.selectors.submitButton).should('be.disabled');
    return this;
  }

  /**
   * Verify submit button is enabled
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifySubmitEnabled() {
    this.getElement(this.selectors.submitButton).should('not.be.disabled');
    return this;
  }

  /**
   * Verify success message is displayed
   * @param {string} expectedMessage - Expected success message (optional)
   * @returns {LoginPage} LoginPage instance for chaining
   */
  verifySuccessMessage(expectedMessage = null) {
    this.verifyElementVisible(this.selectors.successMessage);

    if (expectedMessage) {
      this.verifyElementContainsText(this.selectors.successMessage, expectedMessage);
    }

    return this;
  }

  /**
   * Clear all form fields
   * @returns {LoginPage} LoginPage instance for chaining
   */
  clearForm() {
    this.getElement(this.selectors.usernameInput).clear();
    this.getElement(this.selectors.passwordInput).clear();
    return this;
  }

  /**
   * Get username field value
   * @returns {Cypress.Chainable} Username value
   */
  getUsernameValue() {
    return this.getValue(this.selectors.usernameInput);
  }

  /**
   * Get password field value
   * @returns {Cypress.Chainable} Password value
   */
  getPasswordValue() {
    return this.getValue(this.selectors.passwordInput);
  }
}

export default LoginPage;
