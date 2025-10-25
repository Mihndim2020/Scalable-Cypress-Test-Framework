/**
 * Test 1: Smoke Test - User Login and View Dashboard
 *
 * Purpose: Critical path validation for authentication and dashboard access
 * Tags: @smoke, @auth, @critical
 * Expected Duration: ~30 seconds
 *
 * This test verifies:
 * - User can successfully login
 * - Dashboard loads correctly
 * - User data is displayed
 * - Key dashboard elements are visible
 */

import { LoginPage, DashboardPage } from '../../src/pages/index.js';

describe('Smoke Test: Login and Dashboard', { tags: ['@smoke', '@auth', '@critical'] }, () => {
  let loginPage;
  let dashboardPage;

  beforeEach(() => {
    loginPage = new LoginPage();
    dashboardPage = new DashboardPage();
  });

  it('should allow user to login and view dashboard successfully', () => {
    // Step 1: Navigate to login page
    cy.log('📝 Step 1: Navigate to login page');
    loginPage.load();
    loginPage.verifyPageLoaded();

    // Step 2: Login with valid credentials
    cy.log('🔐 Step 2: Login with valid credentials');
    const testUser = {
      username: Cypress.env('TEST_USERNAME') || 'testuser',
      password: Cypress.env('TEST_PASSWORD') || 'Password123!'
    };

    loginPage.login(testUser.username, testUser.password);

    // Step 3: Verify successful login
    cy.log('✅ Step 3: Verify successful login');
    loginPage.verifyLoginSuccess();

    // Step 4: Verify dashboard loads
    cy.log('📊 Step 4: Verify dashboard loads');
    dashboardPage.verifyPageLoaded();

    // Step 5: Verify user is logged in
    cy.log('👤 Step 5: Verify user is logged in');
    dashboardPage.verifyUserLoggedIn(testUser.username);

    // Step 6: Verify key dashboard elements
    cy.log('🎯 Step 6: Verify key dashboard elements');
    cy.getByCy('dashboard-container').should('be.visible');
    cy.getByCy('user-avatar').should('be.visible');
    cy.getByCy('navigation-menu').should('be.visible');

    // Step 7: Take screenshot for visual verification
    cy.screenshot('smoke-login-dashboard-success');
  });

  it('should display correct user information on dashboard', { tags: ['@smoke'] }, () => {
    // Use custom command for quick login
    cy.loginUser();

    // Verify dashboard
    dashboardPage.verifyPageLoaded();

    // Check user info is displayed
    cy.getByCy('user-name').should('be.visible').and('not.be.empty');
    cy.getByCy('user-balance').should('be.visible');

    // Verify recent activity section exists
    cy.getByCy('recent-activity').should('exist');
  });

  it('should maintain session across page refresh', { tags: ['@smoke', '@session'] }, () => {
    // Login
    cy.loginUser();
    dashboardPage.verifyPageLoaded();

    // Get user info before refresh
    let userName;
    cy.getByCy('user-name').invoke('text').then((text) => {
      userName = text;
    });

    // Refresh page
    cy.reload();

    // Verify still logged in
    dashboardPage.verifyPageLoaded();
    cy.getByCy('user-name').should('contain', userName);
  });

  afterEach(function() {
    // Log test result
    if (this.currentTest.state === 'failed') {
      cy.log(`❌ Test failed: ${this.currentTest.title}`);
    } else {
      cy.log(`✅ Test passed: ${this.currentTest.title}`);
    }
  });
});
