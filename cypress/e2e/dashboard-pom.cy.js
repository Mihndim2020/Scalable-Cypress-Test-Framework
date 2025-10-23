/**
 * Dashboard Tests using Page Object Model
 * Demonstrates the use of DashboardPage POM
 */

import { DashboardPage } from '../../src/pages';
import {
  stableClick,
  waitForElement,
  interceptEndpoint,
} from '../../src/utils';

describe('Dashboard Tests - Using POM', () => {
  let dashboardPage;

  beforeEach(() => {
    // Initialize page object
    dashboardPage = new DashboardPage();

    // Login before each test using custom command
    cy.loginUser();

    // Visit dashboard
    dashboardPage.load();
    dashboardPage.waitForDashboardLoad();
  });

  context('@smoke - Dashboard Core Features', () => {
    it('should load dashboard successfully', () => {
      // Assert
      dashboardPage.verifyPageLoaded();
      dashboardPage.verifyPageTitle('Dashboard');
    });

    it('should display user greeting', () => {
      // Assert
      dashboardPage.verifyUserLoggedIn();

      dashboardPage.getUserGreeting().then((greeting) => {
        expect(greeting).to.not.be.empty;
      });
    });

    it('should display account balance', () => {
      // Assert
      dashboardPage.verifyBalanceDisplayed();

      dashboardPage.getBalance().then((balance) => {
        expect(balance).to.match(/\$[\d,]+\.\d{2}/);
      });
    });

    it('should display side navigation', () => {
      // Assert
      dashboardPage.verifySideNavVisible();
      dashboardPage.verifyElementVisible(dashboardPage.selectors.homeLink);
      dashboardPage.verifyElementVisible(dashboardPage.selectors.logoutButton);
    });
  });

  context('@regression - Navigation Features', () => {
    it('should navigate to settings', () => {
      // Act
      dashboardPage.openSettings();

      // Assert
      cy.url().should('include', '/settings');
    });

    it('should navigate to account page', () => {
      // Act
      dashboardPage.navigateToAccount();

      // Assert
      cy.url().should('include', '/account');
    });

    it('should toggle side navigation menu', () => {
      // Act - collapse menu
      dashboardPage.toggleMenu();

      // Assert
      cy.get(dashboardPage.selectors.sideNav).should('have.class', 'collapsed');

      // Act - expand menu
      dashboardPage.toggleMenu();

      // Assert
      cy.get(dashboardPage.selectors.sideNav).should(
        'not.have.class',
        'collapsed'
      );
    });
  });

  context('@regression - Transaction Features', () => {
    beforeEach(() => {
      // Seed test transactions
      cy.seedTransactions(5);
      dashboardPage.reload();
      dashboardPage.waitForDashboardLoad();
    });

    it('should display list of transactions', () => {
      // Assert
      dashboardPage.verifyTransactionsDisplayed(5);

      dashboardPage.getTransactions().should('have.length.at.least', 5);
    });

    it('should click on a transaction to view details', () => {
      // Act
      dashboardPage.clickTransaction(0);

      // Assert
      cy.get('[data-test="transaction-detail"]').should('be.visible');
    });

    it('should create new transaction', () => {
      // Act
      dashboardPage.clickCreate();

      // Assert
      cy.get('[data-test="transaction-form"]').should('be.visible');
      cy.get('[data-test="transaction-amount"]').should('exist');
    });

    it('should filter transactions by type', () => {
      // Arrange - mock filtered transactions
      interceptEndpoint(
        'GET',
        '**/api/transactions?type=payment',
        {
          data: [
            { id: 1, type: 'payment', amount: 100 },
            { id: 2, type: 'payment', amount: 200 },
          ],
        },
        'filteredTransactions'
      );

      // Act
      cy.get('[data-test="filter-payment"]').click();

      // Assert
      cy.wait('@filteredTransactions');
      dashboardPage.verifyTransactionsDisplayed(2);
    });
  });

  context('@regression - Notifications', () => {
    beforeEach(() => {
      // Seed notifications
      cy.seedNotifications(3);
      dashboardPage.reload();
      dashboardPage.waitForDashboardLoad();
    });

    it('should display notification badge', () => {
      // Assert
      dashboardPage.verifyNotificationBadge(3);
    });

    it('should open notifications panel', () => {
      // Act
      dashboardPage.openNotifications();

      // Assert
      cy.get('[data-test="notifications-panel"]').should('be.visible');
      cy.get('[data-test="notification-item"]').should('have.length.at.least', 1);
    });

    it('should mark notification as read', () => {
      // Arrange
      dashboardPage.openNotifications();
      waitForElement('[data-test="notification-item"]');

      // Act
      cy.get('[data-test="notification-item"]').first().click();

      // Assert
      cy.get('[data-test="notification-item"]')
        .first()
        .should('have.class', 'read');
    });
  });

  context('@regression - Search Functionality', () => {
    it('should search for transactions', () => {
      // Act
      dashboardPage.search('payment');

      // Assert
      cy.get('[data-test="search-results"]').should('be.visible');
      cy.get('[data-test="search-results"]').should('contain', 'payment');
    });

    it('should show no results message for invalid search', () => {
      // Act
      dashboardPage.search('nonexistentterm12345');

      // Assert
      cy.get('[data-test="no-results"]').should('be.visible');
    });

    it('should clear search results', () => {
      // Arrange
      dashboardPage.search('payment');
      cy.get('[data-test="search-results"]').should('be.visible');

      // Act
      cy.get('[data-test="clear-search"]').click();

      // Assert
      cy.get('[data-test="search-results"]').should('not.exist');
    });
  });

  context('@smoke - User Menu', () => {
    it('should open user menu', () => {
      // Act
      dashboardPage.openUserMenu();

      // Assert
      cy.get('[data-test="user-menu"]').should('be.visible');
    });

    it('should logout from user menu', () => {
      // Act
      dashboardPage.logout();

      // Assert
      cy.url().should('include', '/login');
    });
  });

  context('@regression - Data Persistence', () => {
    it('should persist data after page reload', () => {
      // Arrange - get initial balance
      let initialBalance;
      dashboardPage.getBalance().then((balance) => {
        initialBalance = balance;
      });

      // Act - reload page
      dashboardPage.reload();
      dashboardPage.waitForDashboardLoad();

      // Assert - balance should be the same
      dashboardPage.getBalance().then((balance) => {
        expect(balance).to.equal(initialBalance);
      });
    });

    it('should update balance after transaction', () => {
      // Arrange - create transaction
      cy.seedData('/api/transactions', {
        amount: 100,
        type: 'payment',
        description: 'Test payment',
      });

      // Act - reload to see updated balance
      dashboardPage.reload();
      dashboardPage.waitForDashboardLoad();

      // Assert - balance should be updated
      dashboardPage.verifyBalanceDisplayed();
    });
  });

  context('@regression - Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      // Arrange - change viewport
      cy.viewport('iphone-x');

      // Act
      dashboardPage.reload();

      // Assert
      dashboardPage.verifyPageLoaded();
      dashboardPage.verifyElementVisible(dashboardPage.selectors.menuButton);
    });

    it('should display correctly on tablet viewport', () => {
      // Arrange
      cy.viewport('ipad-2');

      // Act
      dashboardPage.reload();

      // Assert
      dashboardPage.verifyPageLoaded();
    });
  });

  context('@smoke - Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Arrange - intercept with error
      cy.intercept('GET', '**/api/transactions', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('apiError');

      // Act
      dashboardPage.reload();

      // Assert
      cy.wait('@apiError');
      cy.get('[data-test="error-message"]').should('be.visible');
    });

    it('should retry failed requests', () => {
      // Arrange - fail first, succeed second
      let requestCount = 0;
      cy.intercept('GET', '**/api/transactions', (req) => {
        requestCount++;
        if (requestCount === 1) {
          req.reply({ statusCode: 500 });
        } else {
          req.reply({ statusCode: 200, body: { data: [] } });
        }
      }).as('retryRequest');

      // Act
      dashboardPage.reload();

      // Assert - should eventually succeed
      cy.wait('@retryRequest');
      dashboardPage.verifyPageLoaded();
    });
  });
});
