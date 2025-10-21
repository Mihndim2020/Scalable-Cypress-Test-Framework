/**
 * Step definitions for example feature
 */

import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I visit the homepage', () => {
  cy.visit('/');
});

Then('the page should load successfully', () => {
  cy.url().should('include', Cypress.config().baseUrl);
});

Then('the page title should not be empty', () => {
  cy.title().should('not.be.empty');
});
