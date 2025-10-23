/**
 * Login Tests using Page Object Model
 * Demonstrates the use of LoginPage POM
 */

import { LoginPage, DashboardPage } from '../../src/pages';
import { interceptAuth, waitForApi } from '../../src/utils';

describe('Login Tests - Using POM', () => {
  let loginPage;
  let dashboardPage;

  beforeEach(() => {
    // Initialize page objects
    loginPage = new LoginPage();
    dashboardPage = new DashboardPage();

    // Reset state before each test
    cy.resetState();

    // Load login page
    loginPage.load();
  });

  context('@smoke - Critical Login Flows', () => {
    it('should login successfully with valid credentials', () => {
      // Arrange - intercept auth API
      interceptAuth(true);

      // Act - perform login
      loginPage.loginWithFixture('validUser');

      // Wait for auth request
      waitForApi('authRequest', 200);

      // Assert - verify redirect to dashboard
      loginPage.verifyLoginSuccess('/dashboard');
      dashboardPage.verifyPageLoaded();
    });

    it('should login and remain logged in with remember me', () => {
      // Arrange
      cy.fixture('users').then((users) => {
        const user = users.validUser;

        // Act - login with remember me
        loginPage
          .enterUsername(user.username)
          .enterPassword(user.password)
          .toggleRememberMe(true)
          .clickSubmit();

        // Assert
        loginPage.verifyLoginSuccess();

        // Verify remember me is checked
        cy.get(loginPage.selectors.rememberMeCheckbox).should('be.checked');
      });
    });

    it('should display user greeting after successful login', () => {
      // Act
      loginPage.loginWithEnv();

      // Assert
      dashboardPage.load();
      dashboardPage.verifyUserLoggedIn();
    });
  });

  context('@regression - Login Error Handling', () => {
    it('should show error with invalid credentials', () => {
      // Arrange - intercept auth to return error
      interceptAuth(false);

      // Act
      loginPage.loginWithFixture('invalidUser');

      // Wait for failed auth
      waitForApi('authRequest', 401);

      // Assert
      loginPage.verifyErrorMessage('Username or password is invalid');
      loginPage.verifyUrlContains('/login');
    });

    it('should disable submit button with empty fields', () => {
      // Act
      loginPage.clearForm();

      // Assert
      loginPage.verifySubmitDisabled();
    });

    it('should clear error message when typing', () => {
      // Arrange - trigger error first
      loginPage.loginWithFixture('invalidUser');
      loginPage.verifyErrorMessage();

      // Act - start typing
      loginPage.enterUsername('newuser');

      // Assert - error should disappear
      cy.get(loginPage.selectors.errorMessage).should('not.exist');
    });

    it('should handle network errors gracefully', () => {
      // Arrange - simulate network error
      cy.intercept('POST', '**/api/auth/login', {
        forceNetworkError: true,
      }).as('networkError');

      // Act
      loginPage.loginWithEnv();

      // Assert
      cy.wait('@networkError');
      loginPage.verifyErrorMessage();
    });
  });

  context('@regression - Login Navigation', () => {
    it('should navigate to signup page', () => {
      // Act
      loginPage.clickSignup();

      // Assert
      cy.url().should('include', '/signup');
    });

    it('should navigate to forgot password page', () => {
      // Act
      loginPage.clickForgotPassword();

      // Assert
      cy.url().should('include', '/forgot-password');
    });

    it('should show login form with correct elements', () => {
      // Assert
      loginPage.verifyPageLoaded();
      loginPage.verifyFormTitle('Sign In');
      loginPage.verifyElementVisible(loginPage.selectors.usernameInput);
      loginPage.verifyElementVisible(loginPage.selectors.passwordInput);
      loginPage.verifyElementVisible(loginPage.selectors.submitButton);
    });
  });

  context('@regression - Session Management', () => {
    it('should maintain session across page reloads', () => {
      // Act - login
      loginPage.loginWithEnv();
      dashboardPage.load();

      // Reload page
      dashboardPage.reload();

      // Assert - should still be logged in
      dashboardPage.verifyPageLoaded();
      dashboardPage.verifyUserLoggedIn();
    });

    it('should logout and clear session', () => {
      // Arrange - login first
      loginPage.loginWithEnv();
      dashboardPage.load();

      // Act - logout
      dashboardPage.logout();

      // Assert
      cy.url().should('include', '/login');

      // Try to access dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  context('@smoke - Different User Types', () => {
    it('should login as standard user', () => {
      loginPage.loginWithFixture('validUser');
      loginPage.verifyLoginSuccess();
    });

    it('should login as admin user', () => {
      loginPage.loginWithFixture('adminUser');
      loginPage.verifyLoginSuccess();
    });
  });
});
