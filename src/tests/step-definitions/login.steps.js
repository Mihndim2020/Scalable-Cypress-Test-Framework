/**
 * Step definitions for Login feature
 */

import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage } from '../../pages';

// Create page instance
const loginPage = new LoginPage();

// ===== Given Steps =====

Given('I am on the login page', () => {
  loginPage.load();
  loginPage.verifyPageLoaded();
});

// ===== When Steps =====

When('I enter valid username and password', () => {
  cy.fixture('users').then((users) => {
    const user = users.validUser;
    loginPage.enterUsername(user.username);
    loginPage.enterPassword(user.password);
  });
});

When('I enter invalid username and password', () => {
  cy.fixture('users').then((users) => {
    const user = users.invalidUser;
    loginPage.enterUsername(user.username);
    loginPage.enterPassword(user.password);
  });
});

When('I click the submit button', () => {
  loginPage.clickSubmit();
});

When('I check the remember me checkbox', () => {
  loginPage.toggleRememberMe(true);
});

When('I leave username and password fields empty', () => {
  loginPage.clearForm();
});

When('I enter invalid username {string}', (username) => {
  loginPage.enterUsername(username);
});

When('I enter valid username', () => {
  cy.fixture('users').then((users) => {
    loginPage.enterUsername(users.validUser.username);
  });
});

When('I enter valid password', () => {
  cy.fixture('users').then((users) => {
    loginPage.enterPassword(users.validUser.password);
  });
});

When('I enter invalid password {string}', (password) => {
  loginPage.enterPassword(password);
});

When('I click on the signup link', () => {
  loginPage.clickSignup();
});

When('I click on the forgot password link', () => {
  loginPage.clickForgotPassword();
});

When('I enter username {string} and password {string}', (username, password) => {
  loginPage.enterUsername(username);
  loginPage.enterPassword(password);
});

// ===== Then Steps =====

Then('I should be redirected to the dashboard', () => {
  loginPage.verifyLoginSuccess('/dashboard');
});

Then('I should see a welcome message', () => {
  // This would check for a welcome message on the dashboard
  cy.url().should('include', '/dashboard');
});

Then('the remember me option should be saved', () => {
  // Verify remember me is checked
  cy.get(loginPage.selectors.rememberMeCheckbox).should('be.checked');
});

Then('I should see an error message', () => {
  loginPage.verifyErrorMessage();
});

Then('I should remain on the login page', () => {
  loginPage.verifyUrlContains('/login');
});

Then('the submit button should be disabled', () => {
  loginPage.verifySubmitDisabled();
});

Then('I should see an error message {string}', (errorMessage) => {
  loginPage.verifyErrorMessage(errorMessage);
});

Then('I should be redirected to the signup page', () => {
  cy.url().should('include', '/signup');
});

Then('I should be redirected to the forgot password page', () => {
  cy.url().should('include', '/forgot-password');
});

Then('I should see greeting for {string}', (userType) => {
  // Verify user type specific greeting
  cy.url().should('include', '/dashboard');
});
