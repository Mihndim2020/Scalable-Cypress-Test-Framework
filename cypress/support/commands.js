// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

/**
 * Custom command to log in a user
 * @example cy.login('user@example.com', 'password123')
 */
Cypress.Commands.add('login', (username, password) => {
  cy.session([username, password], () => {
    cy.visit('/');
    cy.get('[data-test="username"]').type(username);
    cy.get('[data-test="password"]').type(password);
    cy.get('[data-test="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

/**
 * Custom command to get element by data-test attribute
 * @example cy.getByTestId('submit-button')
 */
Cypress.Commands.add('getByTestId', (selector) => {
  return cy.get(`[data-test="${selector}"]`);
});

/**
 * Custom command to get element by data-cy attribute
 * @example cy.getByCy('submit-button')
 */
Cypress.Commands.add('getByCy', (selector) => {
  return cy.get(`[data-cy="${selector}"]`);
});

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
