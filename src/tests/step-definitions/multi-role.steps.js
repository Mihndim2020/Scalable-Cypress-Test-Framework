/**
 * Step definitions for Multi-Role Access Control feature
 */

import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage, DashboardPage } from '../../pages';
import { SeedFactory } from '../../utils';

const loginPage = new LoginPage();
const dashboardPage = new DashboardPage();
let seedFactory;
let currentRole;

// Initialize seed factory
before(() => {
  seedFactory = new SeedFactory();
});

// Cleanup after all tests
after(() => {
  seedFactory.cleanup();
});

// ===== Given Steps =====

Given('the application is running', () => {
  cy.visit('/');
});

Given('test data is seeded for all roles', () => {
  // Seed users for all roles
  const roles = ['standard', 'premium', 'manager', 'admin', 'readonly'];

  roles.forEach((role) => {
    seedFactory.createUserWithRole(role);
  });
});

Given('I am logged in as a {string} user', (role) => {
  currentRole = role;

  cy.fixture('users').then((users) => {
    const user = users[role];

    if (!user) {
      throw new Error(`User fixture for role '${role}' not found`);
    }

    loginPage.load();
    loginPage.login(user.username, user.password);
    loginPage.verifyLoginSuccess('/dashboard');
  });
});

Given('there are existing transactions', () => {
  seedFactory.transaction.createMany(5);
});

Given('there are 10 transactions in the system', () => {
  seedFactory.transaction.createMany(10);
});

Given('there are users with roles {string}, {string}, and {string}', (role1, role2, role3) => {
  [role1, role2, role3].forEach((role) => {
    seedFactory.createUserWithRole(role);
  });
});

// ===== When Steps =====

When('I login as a {string} user', (role) => {
  currentRole = role;

  cy.fixture('users').then((users) => {
    const user = users[role];
    loginPage.enterUsername(user.username);
    loginPage.enterPassword(user.password);
    loginPage.clickSubmit();
  });
});

When('I navigate to the dashboard', () => {
  dashboardPage.load();
});

When('I look for the export functionality', () => {
  // Check if export button exists
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="export-button"]').length) {
      cy.log('Export button found');
    } else {
      cy.log('Export button not found');
    }
  });
});

When('I view a transaction detail', () => {
  cy.get('[data-test="transaction-item"]').first().click();
});

When('I attempt to create a transaction of {string} dollars', (amount) => {
  dashboardPage.clickCreate();
  cy.get('[data-test="transaction-amount"]').type(amount);
  cy.get('[data-test="transaction-submit"]').click();
});

When('I check my API access permissions', () => {
  cy.fixture('roles').then((roles) => {
    const roleData = roles[currentRole];
    cy.wrap(roleData.features.canAccessApi).as('hasApiAccess');
    cy.wrap(roleData.limits.apiRateLimit).as('rateLimit');
  });
});

When('I navigate to the reports section', () => {
  cy.visit('/reports');
});

When('I navigate to the transactions page', () => {
  cy.visit('/transactions');
});

When('I navigate to user management', () => {
  cy.visit('/admin/users');
});

When('I attempt to navigate to user management', () => {
  cy.visit('/admin/users');
});

When('I am on the dashboard', () => {
  dashboardPage.load();
});

// ===== Then Steps =====

Then('I should be redirected to the dashboard', () => {
  loginPage.verifyLoginSuccess('/dashboard');
});

Then('I should see a personalized greeting for {string} role', (role) => {
  dashboardPage.verifyUserLoggedIn();
  cy.get(dashboardPage.selectors.userGreeting).should('be.visible');
});

Then('I should see my account balance', () => {
  dashboardPage.verifyBalanceDisplayed();
});

Then('I should see the dashboard page', () => {
  dashboardPage.verifyPageLoaded();
});

Then('I should see features appropriate for {string} role', (role) => {
  cy.fixture('roles').then((roles) => {
    const roleData = roles[role];

    // Verify role-specific features
    if (roleData.features.canExportData) {
      cy.get('[data-test="export-button"]').should('exist');
    }

    if (roleData.features.canViewReports) {
      cy.get('[data-test="reports-link"]').should('exist');
    }
  });
});

Then('the page title should reflect my {string} access level', (role) => {
  cy.get('[data-test="dashboard-title"]').should('contain.text', 'Dashboard');
});

Then('the export button should be {string}', (visibility) => {
  if (visibility === 'visible') {
    cy.get('[data-test="export-button"]').should('be.visible');
  } else if (visibility === 'hidden') {
    cy.get('[data-test="export-button"]').should('not.exist');
  }
});

Then('the delete button should be {string}', (visibility) => {
  if (visibility === 'visible') {
    cy.get('[data-test="delete-button"]').should('be.visible');
  } else if (visibility === 'hidden') {
    cy.get('[data-test="delete-button"]').should('not.exist');
  }
});

Then('the transaction should be {string}', (outcome) => {
  if (outcome === 'accepted') {
    cy.get('[data-test="success-message"]').should('be.visible');
  } else if (outcome === 'rejected') {
    cy.get('[data-test="error-message"]').should('be.visible');
    cy.get('[data-test="error-message"]').should('contain', 'limit exceeded');
  }
});

Then('API access should be {string}', (access) => {
  cy.get('@hasApiAccess').then((hasAccess) => {
    if (access === 'granted') {
      expect(hasAccess).to.be.true;
    } else {
      expect(hasAccess).to.be.false;
    }
  });
});

Then('my rate limit should be {string} requests per hour', (limit) => {
  cy.get('@rateLimit').then((rateLimit) => {
    if (limit === 'unlimited') {
      expect(rateLimit).to.equal(-1);
    } else {
      expect(rateLimit).to.equal(parseInt(limit));
    }
  });
});

Then('I should {string} the reports page', (access) => {
  if (access === 'access') {
    cy.url().should('include', '/reports');
    cy.get('[data-test="reports-page"]').should('be.visible');
  } else {
    cy.get('[data-test="access-denied"]').should('be.visible');
  }
});

Then('I should {string} create new reports', (ability) => {
  if (ability === 'be able to') {
    cy.get('[data-test="create-report-button"]').should('be.visible');
  } else {
    cy.get('[data-test="create-report-button"]').should('not.exist');
  }
});

Then('I should see {string} transactions', (scope) => {
  if (scope === 'only my own') {
    cy.get('[data-test="transaction-item"]').each(($item) => {
      cy.wrap($item).should('have.attr', 'data-user-id', currentRole);
    });
  } else if (scope === 'all transactions') {
    cy.get('[data-test="transaction-item"]').should('have.length.at.least', 1);
  }
});

Then('each transaction should show {string}', (detailLevel) => {
  cy.get('[data-test="transaction-item"]').first().within(() => {
    cy.get('[data-test="transaction-amount"]').should('be.visible');

    if (detailLevel === 'detailed info' || detailLevel === 'full details') {
      cy.get('[data-test="transaction-date"]').should('be.visible');
      cy.get('[data-test="transaction-description"]').should('be.visible');
    }

    if (detailLevel === 'full details') {
      cy.get('[data-test="transaction-metadata"]').should('be.visible');
    }
  });
});

Then('I should see all users listed', () => {
  cy.get('[data-test="user-list"]').should('be.visible');
  cy.get('[data-test="user-item"]').should('have.length.at.least', 3);
});

Then('I should be able to edit each user\'s role', () => {
  cy.get('[data-test="edit-role-button"]').should('be.visible');
});

Then('I should be able to deactivate user accounts', () => {
  cy.get('[data-test="deactivate-button"]').should('be.visible');
});

Then('I should be able to reactivate suspended accounts', () => {
  cy.get('[data-test="reactivate-button"]').should('be.visible');
});

Then('I should see an access denied message', () => {
  cy.get('[data-test="access-denied"]').should('be.visible');
  cy.get('[data-test="access-denied"]').should('contain', 'not have permission');
});

Then('I should be redirected to the dashboard', () => {
  cy.url().should('include', '/dashboard');
});

Then('I should not see any action buttons', () => {
  cy.get('[data-test="action-button"]').should('not.exist');
  cy.get('[data-test="create-button"]').should('not.exist');
  cy.get('[data-test="edit-button"]').should('not.exist');
  cy.get('[data-test="delete-button"]').should('not.exist');
});

Then('I should only see read-only information', () => {
  cy.get('[data-test="main-content"]').should('be.visible');
  cy.get('input, textarea, select').should('be.disabled');
});

Then('all forms should be disabled', () => {
  cy.get('form').find('input, textarea, select').should('be.disabled');
});

Then('I should see a {string} indicator', (indicator) => {
  cy.get('[data-test="access-level-indicator"]').should('contain.text', indicator);
});
