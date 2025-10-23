/**
 * Step definitions for Dashboard feature
 */

import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { DashboardPage } from '../../pages';

// Create page instance
const dashboardPage = new DashboardPage();

// ===== Given Steps =====

Given('I am logged in as a valid user', () => {
  // Use custom command for login
  cy.loginUser();
});

Given('I am on the dashboard page', () => {
  dashboardPage.load();
  dashboardPage.waitForDashboardLoad();
});

Given('I have notifications pending', () => {
  // Mock or seed notifications data
  cy.seedNotifications(3);
});

// ===== When Steps =====

When('I click the logout button', () => {
  dashboardPage.logout();
});

When('I click on the settings button', () => {
  dashboardPage.openSettings();
});

When('I click on the notification bell', () => {
  dashboardPage.openNotifications();
});

When('I enter {string} in the search box', (searchTerm) => {
  dashboardPage.search(searchTerm);
});

When('I press enter', () => {
  // Already handled in search method
});

When('I click the create button', () => {
  dashboardPage.clickCreate();
});

When('I click on the first transaction', () => {
  dashboardPage.clickTransaction(0);
});

When('I click the menu toggle button', () => {
  dashboardPage.toggleMenu();
});

When('I click the menu toggle button again', () => {
  dashboardPage.toggleMenu();
});

When('I click on the home link', () => {
  dashboardPage.navigateToHome();
});

When('I refresh the dashboard page', () => {
  dashboardPage.reload();
  dashboardPage.waitForDashboardLoad();
});

// ===== Then Steps =====

Then('I should see the dashboard page', () => {
  dashboardPage.verifyPageLoaded();
});

Then('I should see the side navigation', () => {
  dashboardPage.verifySideNavVisible();
});

Then('I should see my account balance', () => {
  dashboardPage.verifyBalanceDisplayed();
});

Then('I should see a personalized greeting', () => {
  dashboardPage.verifyElementVisible(dashboardPage.selectors.userGreeting);
});

Then('the greeting should contain my username', () => {
  // Get username from env or fixture and verify
  const username = Cypress.env('username') || 'testuser';
  dashboardPage.getUserGreeting().should('contain', username);
});

Then('I should be redirected to the login page', () => {
  cy.url().should('include', '/login');
});

Then('I should not be able to access the dashboard', () => {
  // Try to visit dashboard and verify redirect
  cy.visit('/dashboard');
  cy.url().should('include', '/login');
});

Then('I should be redirected to the settings page', () => {
  cy.url().should('include', '/settings');
});

Then('the notifications panel should open', () => {
  cy.get('[data-test="notifications-panel"]').should('be.visible');
});

Then('I should see my recent notifications', () => {
  cy.get('[data-test="notification-item"]').should('have.length.at.least', 1);
});

Then('I should see search results for {string}', (searchTerm) => {
  cy.get('[data-test="search-results"]').should('be.visible');
  cy.get('[data-test="search-results"]').should('contain', searchTerm);
});

Then('I should see the new transaction form', () => {
  cy.get('[data-test="transaction-form"]').should('be.visible');
});

Then('the form should have all required fields', () => {
  cy.get('[data-test="transaction-amount"]').should('exist');
  cy.get('[data-test="transaction-description"]').should('exist');
  cy.get('[data-test="transaction-recipient"]').should('exist');
});

Then('I should see a list of transactions', () => {
  dashboardPage.verifyTransactionsDisplayed();
});

Then('each transaction should have a date and amount', () => {
  dashboardPage.getTransactions().each(($transaction) => {
    cy.wrap($transaction).find('[data-test*="date"]').should('exist');
    cy.wrap($transaction).find('[data-test*="amount"]').should('exist');
  });
});

Then('I should see the transaction details', () => {
  cy.get('[data-test="transaction-detail"]').should('be.visible');
});

Then('the details should include sender and receiver information', () => {
  cy.get('[data-test="transaction-sender"]').should('exist');
  cy.get('[data-test="transaction-receiver"]').should('exist');
});

Then('the side navigation should collapse', () => {
  cy.get('[data-test="sidenav"]').should('have.class', 'collapsed');
});

Then('the side navigation should expand', () => {
  cy.get('[data-test="sidenav"]').should('not.have.class', 'collapsed');
});

Then('my account balance should be visible', () => {
  dashboardPage.verifyBalanceDisplayed();
});

Then('the balance should be a valid currency amount', () => {
  dashboardPage.getBalance().should('match', /\$[\d,]+\.\d{2}/);
});

Then('I should remain on the dashboard page', () => {
  dashboardPage.verifyUrlContains('/dashboard');
});

Then('the home link should be highlighted', () => {
  cy.get(dashboardPage.selectors.homeLink).should('have.class', 'active');
});

Then('I should still see my notifications badge', () => {
  dashboardPage.verifyElementVisible(dashboardPage.selectors.notificationBadge);
});

Then('the notification count should persist', () => {
  dashboardPage.getNotificationCount().should('be.greaterThan', 0);
});
