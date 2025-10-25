import BasePage from './BasePage.js';

/**
 * Dashboard Page Object Model
 * Handles all interactions with the dashboard page
 */
class DashboardPage extends BasePage {
  constructor() {
    super();

    // Page URL
    this.url = '/';

    // Selectors - Based on actual dashboard HTML
    this.selectors = {
      // App branding
      appNameLogo: '[data-test="app-name-logo"]',

      // Top navigation
      newTransactionButton: '[data-test="nav-top-new-transaction"]',
      notificationsLink: '[data-test="nav-top-notifications-link"]',
      notificationCount: '[data-test="nav-top-notifications-count"]',

      // Navigation tabs
      publicTab: '[data-test="nav-public-tab"]',
      contactsTab: '[data-test="nav-contacts-tab"]',
      personalTab: '[data-test="nav-personal-tab"]',

      // Side navigation
      sideNav: '[data-test="sidenav"]',
      menuButton: '[data-test="sidenav-toggle"]',
      userFullName: '[data-test="sidenav-user-full-name"]',
      username: '[data-test="sidenav-username"]',
      userBalance: '[data-test="sidenav-user-balance"]',
      homeLink: '[data-test="sidenav-home"]',
      settingsButton: '[data-test="sidenav-user-settings"]',
      bankAccountsLink: '[data-test="sidenav-bankaccounts"]',
      notificationBell: '[data-test="sidenav-notifications"]',
      logoutButton: '[data-test="sidenav-signout"]',

      // Main content
      mainContent: '[data-test="main"]',

      // Transaction filters
      dateRangeFilter: '[data-test="transaction-list-filter-date-range-button"]',
      amountRangeFilter: '[data-test="transaction-list-filter-amount-range-button"]',

      // Transactions list
      transactionsList: '[data-test="transaction-list"]',
      transactionItem: '[data-test^="transaction-item-"]',

      // Backward compatibility aliases
      pageTitle: '[data-test="app-name-logo"]',
      userGreeting: '[data-test="sidenav-user-full-name"]',
      balanceDisplay: '[data-test="sidenav-user-balance"]',
      accountLink: '[data-test="sidenav-user-settings"]',
      notificationBadge: '[data-test="nav-top-notifications-count"]',
      loadingSpinner: '[data-test="loading-spinner"]',
    };
  }

  /**
   * Load the dashboard page
   * @param {Object} options - Visit options
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  load(options = {}) {
    this.visit(this.url, options);
    this.waitForPageLoad();
    return this;
  }

  /**
   * Click logout button
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  logout() {
    this.click(this.selectors.logoutButton);
    return this;
  }

  /**
   * Open notifications panel
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  openNotifications() {
    this.click(this.selectors.notificationBell);
    return this;
  }

  /**
   * Open user settings
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  openSettings() {
    this.click(this.selectors.settingsButton);
    return this;
  }

  /**
   * Click user avatar to open user menu
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  openUserMenu() {
    this.click(this.selectors.userAvatar);
    return this;
  }

  /**
   * Search for content
   * @param {string} searchTerm - Search term to enter
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  search(searchTerm) {
    this.type(this.selectors.searchInput, searchTerm);
    this.getElement(this.selectors.searchInput).type('{enter}');
    return this;
  }

  /**
   * Click create button (for new transaction, etc.)
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  clickCreate() {
    this.click(this.selectors.createButton);
    return this;
  }

  /**
   * Navigate to home
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  navigateToHome() {
    this.click(this.selectors.homeLink);
    return this;
  }

  /**
   * Navigate to account page
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  navigateToAccount() {
    this.click(this.selectors.accountLink);
    return this;
  }

  /**
   * Toggle side navigation menu
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  toggleMenu() {
    this.click(this.selectors.menuButton);
    return this;
  }

  /**
   * Get user greeting text
   * @returns {Cypress.Chainable} Greeting text
   */
  getUserGreeting() {
    return this.getText(this.selectors.userGreeting);
  }

  /**
   * Get current balance
   * @returns {Cypress.Chainable} Balance text
   */
  getBalance() {
    return this.getText(this.selectors.balanceDisplay);
  }

  /**
   * Get notification count
   * @returns {Cypress.Chainable} Notification count
   */
  getNotificationCount() {
    return this.getText(this.selectors.notificationBadge);
  }

  /**
   * Get all transaction items
   * @returns {Cypress.Chainable} Transaction elements
   */
  getTransactions() {
    return this.getElement(this.selectors.transactionItem);
  }

  /**
   * Get transaction by index
   * @param {number} index - Zero-based index
   * @returns {Cypress.Chainable} Transaction element
   */
  getTransactionByIndex(index) {
    return this.getElement(this.selectors.transactionItem).eq(index);
  }

  /**
   * Click on a specific transaction
   * @param {number} index - Zero-based index
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  clickTransaction(index) {
    this.getTransactionByIndex(index).click();
    return this;
  }

  /**
   * Wait for dashboard to fully load
   * @param {number} timeout - Timeout in milliseconds
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  waitForDashboardLoad(timeout = 10000) {
    this.waitForElementToNotExist(this.selectors.loadingSpinner, timeout);
    this.waitForElement(this.selectors.mainContent, timeout);
    return this;
  }

  /**
   * Wait for transactions to load
   * @param {number} timeout - Timeout in milliseconds
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  waitForTransactionsLoad(timeout = 10000) {
    this.waitForElement(this.selectors.transactionsList, timeout);
    return this;
  }

  // ===== Assertion Methods =====

  /**
   * Verify dashboard page is loaded
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyPageLoaded() {
    this.verifyUrlContains(this.url);
    this.verifyElementVisible(this.selectors.mainContent);
    this.verifyElementVisible(this.selectors.sideNav);
    return this;
  }

  /**
   * Verify user is logged in
   * @param {string} expectedUsername - Expected username in greeting (optional)
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyUserLoggedIn(expectedUsername = null) {
    this.verifyElementVisible(this.selectors.userGreeting);

    if (expectedUsername) {
      this.verifyElementContainsText(this.selectors.userGreeting, expectedUsername);
    }

    return this;
  }

  /**
   * Verify page title
   * @param {string} expectedTitle - Expected title text
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyPageTitle(expectedTitle = 'Dashboard') {
    this.verifyElementContainsText(this.selectors.pageTitle, expectedTitle);
    return this;
  }

  /**
   * Verify notifications badge is visible
   * @param {number} expectedCount - Expected notification count (optional)
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyNotificationBadge(expectedCount = null) {
    this.verifyElementVisible(this.selectors.notificationBadge);

    if (expectedCount !== null) {
      this.verifyElementText(this.selectors.notificationBadge, expectedCount.toString());
    }

    return this;
  }

  /**
   * Verify no notifications
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyNoNotifications() {
    this.verifyElementNotExists(this.selectors.notificationBadge);
    return this;
  }

  /**
   * Verify transactions are displayed
   * @param {number} minCount - Minimum expected transaction count
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyTransactionsDisplayed(minCount = 1) {
    this.getTransactions().should('have.length.at.least', minCount);
    return this;
  }

  /**
   * Verify no transactions message
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyNoTransactions() {
    this.verifyElementNotExists(this.selectors.transactionItem);
    return this;
  }

  /**
   * Verify balance is displayed
   * @param {string} expectedBalance - Expected balance amount (optional)
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifyBalanceDisplayed(expectedBalance = null) {
    this.verifyElementVisible(this.selectors.balanceDisplay);

    if (expectedBalance) {
      this.verifyElementContainsText(this.selectors.balanceDisplay, expectedBalance);
    }

    return this;
  }

  /**
   * Verify side navigation is visible
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifySideNavVisible() {
    this.verifyElementVisible(this.selectors.sideNav);
    return this;
  }

  /**
   * Verify side navigation is hidden
   * @returns {DashboardPage} DashboardPage instance for chaining
   */
  verifySideNavHidden() {
    this.verifyElementNotExists(this.selectors.sideNav);
    return this;
  }
}

export default DashboardPage;
