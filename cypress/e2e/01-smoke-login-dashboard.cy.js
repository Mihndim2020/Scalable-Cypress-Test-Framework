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
      username: Cypress.env('TEST_USERNAME') || 'mihndim2016@gmail.com',
      fullName: Cypress.env('TEST_USERNAME') || 'Julius Ndim M',
      password: Cypress.env('TEST_PASSWORD') || '0123456789'
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
    dashboardPage.verifyUserLoggedIn(testUser.fullName);

    // Step 6: Verify key dashboard elements
    cy.log('🎯 Step 6: Verify key dashboard elements');
    cy.getByTest('app-name-logo').should('be.visible');
    cy.getByTestId('PersonIcon').should('be.visible');
    cy.getByTest('sidenav-home').should('be.visible');

    // Step 7: Take screenshot for visual verification
    cy.screenshot('smoke-login-dashboard-success');
  });

  it.only('should display correct user information on dashboard', { tags: ['@smoke'] }, () => {
    // Use custom command for quick login
    cy.loginUser();

    // Verify dashboard
    dashboardPage.verifyPageLoaded();

    // Check user info is displayed
    cy.getByTest('sidenav-user-full-name').should('be.visible').and('not.be.empty');
    cy.getByTest('sidenav-bankaccounts').should('be.visible');

    // Verify recent activity section exists
    cy.getByTest('recent-activity').should('exist');
  });

  it('should maintain session across page refresh', { tags: ['@smoke', '@session'] }, () => {
    // Login
    cy.loginUser();
    dashboardPage.verifyPageLoaded();

    // Get user info before refresh
    let userName;
    cy.getByCy('sidenav-username').invoke('text').then((text) => {
      userName = text;
    });

    cy.log(userName);

    // Refresh page
    cy.reload();

    // Verify still logged in
    dashboardPage.verifyPageLoaded();
    cy.getByCy('sidenav-username').should('contain', userName);
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
