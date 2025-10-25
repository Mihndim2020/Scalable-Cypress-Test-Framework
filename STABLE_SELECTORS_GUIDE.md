# Stable Selectors Guide

## Overview

This guide provides best practices for writing stable, reliable selectors in Cypress tests to reduce flakiness and improve test maintainability.

## Selector Priority Order

Use selectors in this order of preference:

### 1. data-cy Attributes (BEST)
```html
<button data-cy="submit-button">Submit</button>
```
```javascript
cy.getByCy('submit-button').click();
```

### 2. data-test Attributes (GOOD)
```html
<button data-test="submit-button">Submit</button>
```
```javascript
cy.getByTestId('submit-button').click();
```

### 3. ARIA Attributes (ACCEPTABLE)
```html
<button aria-label="Submit form">Submit</button>
```
```javascript
cy.get('[aria-label="Submit form"]').click();
```

### 4. Semantic HTML (ACCEPTABLE)
```html
<button type="submit">Submit</button>
```
```javascript
cy.get('button[type="submit"]').click();
```

### 5. Class/ID Selectors (AVOID)
```html
<button class="btn btn-primary" id="submitBtn">Submit</button>
```
```javascript
// FRAGILE - Classes change frequently
cy.get('.btn-primary').click();
cy.get('#submitBtn').click();
```

## Selector Anti-Patterns

### ❌ AVOID: Chaining Multiple Classes
```javascript
// FRAGILE - Breaks when CSS changes
cy.get('.container .form .button.primary').click();
```

### ✅ PREFER: Single Test Attribute
```javascript
// STABLE - Independent of styling
cy.getByCy('submit-button').click();
```

### ❌ AVOID: Text Content
```javascript
// FRAGILE - Breaks with text changes or i18n
cy.contains('Submit').click();
```

### ✅ PREFER: Test Attribute
```javascript
// STABLE - Independent of text
cy.getByCy('submit-button').click();
```

### ❌ AVOID: nth-child or Complex Selectors
```javascript
// FRAGILE - Breaks when DOM structure changes
cy.get('form > div:nth-child(3) > button').click();
```

### ✅ PREFER: Unique Identifiers
```javascript
// STABLE - Direct reference
cy.getByCy('payment-submit').click();
```

## Naming Conventions

### Good Names (Descriptive)
```javascript
cy.getByCy('login-submit-button');
cy.getByCy('user-email-input');
cy.getByCy('dashboard-welcome-message');
cy.getByCy('transaction-delete-confirm');
```

### Bad Names (Vague)
```javascript
cy.getByCy('button1');
cy.getByCy('field');
cy.getByCy('div2');
cy.getByCy('element');
```

## Component-Based Naming

Group selectors by component or feature:

```javascript
// Login Component
cy.getByCy('login-username-input');
cy.getByCy('login-password-input');
cy.getByCy('login-submit-button');
cy.getByCy('login-error-message');

// Dashboard Component
cy.getByCy('dashboard-greeting');
cy.getByCy('dashboard-balance');
cy.getByCy('dashboard-transactions-list');
```

## Dynamic Selectors

When you need to select from a list:

```html
<div data-cy="transaction-item" data-transaction-id="txn-123">
  <span data-cy="transaction-amount">$100</span>
</div>
```

```javascript
// Select specific transaction
cy.getByCy('transaction-item')
  .filter('[data-transaction-id="txn-123"]')
  .find('[data-cy="transaction-amount"]');

// Or use compound selector
cy.get('[data-cy="transaction-item"][data-transaction-id="txn-123"]')
  .find('[data-cy="transaction-amount"]');
```

## List Item Selectors

```html
<ul data-cy="user-list">
  <li data-cy="user-item" data-user-id="1">User 1</li>
  <li data-cy="user-item" data-user-id="2">User 2</li>
</ul>
```

```javascript
// Get all items
cy.getByCy('user-item').should('have.length', 2);

// Get specific item
cy.getByCy('user-item')
  .filter('[data-user-id="2"]')
  .click();

// Or by index (less stable)
cy.getByCy('user-item').eq(1).click();
```

## Form Selectors

```html
<form data-cy="login-form">
  <input data-cy="email-input" type="email" />
  <input data-cy="password-input" type="password" />
  <button data-cy="submit-button" type="submit">Login</button>
</form>
```

```javascript
cy.getByCy('login-form').within(() => {
  cy.getByCy('email-input').type('user@example.com');
  cy.getByCy('password-input').type('password123');
  cy.getByCy('submit-button').click();
});
```

## Conditional Elements

```javascript
// Check if element exists before interacting
cy.get('body').then(($body) => {
  if ($body.find('[data-cy="modal-close"]').length > 0) {
    cy.getByCy('modal-close').click();
  }
});

// Or use conditional command
cy.getByCy('modal').then(($modal) => {
  if ($modal.is(':visible')) {
    cy.getByCy('modal-close').click();
  }
});
```

## Migration Strategy

### Step 1: Add data-cy to New Components
```html
<!-- Before -->
<button class="btn btn-primary">Submit</button>

<!-- After -->
<button class="btn btn-primary" data-cy="submit-button">Submit</button>
```

### Step 2: Update Tests Gradually
```javascript
// Before
cy.get('.btn-primary').click();

// After
cy.getByCy('submit-button').click();
```

### Step 3: Document in Component Library
```javascript
/**
 * Submit Button Component
 *
 * Selectors:
 * - data-cy="submit-button" - Main submit button
 * - data-cy="submit-loading" - Loading state indicator
 * - data-cy="submit-success" - Success message
 */
```

## Examples

### Example 1: Login Form
```html
<div data-cy="login-container">
  <h1 data-cy="login-title">Sign In</h1>
  <form data-cy="login-form">
    <input data-cy="login-username" type="text" />
    <input data-cy="login-password" type="password" />
    <label data-cy="login-remember">
      <input data-cy="login-remember-checkbox" type="checkbox" />
      Remember me
    </label>
    <button data-cy="login-submit" type="submit">Login</button>
  </form>
  <div data-cy="login-error" class="error"></div>
</div>
```

```javascript
class LoginPage {
  login(username, password) {
    cy.getByCy('login-username').type(username);
    cy.getByCy('login-password').type(password);
    cy.getByCy('login-submit').click();
  }

  verifyError(message) {
    cy.getByCy('login-error')
      .should('be.visible')
      .and('contain', message);
  }
}
```

### Example 2: Transaction List
```html
<div data-cy="transactions-container">
  <div data-cy="transactions-header">
    <button data-cy="transactions-filter">Filter</button>
    <button data-cy="transactions-export">Export</button>
  </div>
  <ul data-cy="transactions-list">
    <li data-cy="transaction-item" data-id="txn-1">
      <span data-cy="transaction-amount">$100</span>
      <span data-cy="transaction-date">2023-01-01</span>
      <button data-cy="transaction-view">View</button>
      <button data-cy="transaction-delete">Delete</button>
    </li>
  </ul>
</div>
```

```javascript
class TransactionsList {
  filterTransactions() {
    cy.getByCy('transactions-filter').click();
  }

  getTransaction(id) {
    return cy.getByCy('transaction-item').filter(`[data-id="${id}"]`);
  }

  viewTransaction(id) {
    this.getTransaction(id)
      .find('[data-cy="transaction-view"]')
      .click();
  }

  deleteTransaction(id) {
    this.getTransaction(id)
      .find('[data-cy="transaction-delete"]')
      .click();
  }
}
```

## Best Practices Summary

✅ **DO:**
- Use `data-cy` or `data-test` attributes
- Name selectors descriptively
- Group selectors by component
- Use `.within()` to scope selectors
- Document selectors in component code

❌ **DON'T:**
- Use class names as primary selectors
- Use nth-child or complex CSS selectors
- Use text content for selection
- Use IDs unless they're stable
- Chain multiple fragile selectors

## Selector Stability Checklist

- [ ] Does this selector use a test attribute (`data-cy` or `data-test`)?
- [ ] Is the selector name descriptive and clear?
- [ ] Will this selector survive CSS refactoring?
- [ ] Will this selector survive text changes or i18n?
- [ ] Is this selector scoped to avoid ambiguity?
- [ ] Have I documented this selector?

## Tools for Validation

### Cypress Selector Playground
Use the selector playground in Cypress to find best selectors:
1. Open Cypress Test Runner
2. Click the target icon
3. Click on element
4. Cypress suggests best selector

### ESLint Rule (Custom)
```javascript
// .eslintrc.js
rules: {
  'cypress/no-unnecessary-waiting': 'error',
  'cypress/no-force': 'warn',
  // Custom rule to warn about class selectors
  'no-restricted-syntax': [
    'warn',
    {
      'selector': 'CallExpression[callee.property.name="get"] > Literal[value=/^\\./]',
      'message': 'Avoid using class selectors. Use data-cy attributes instead.'
    }
  ]
}
```

## Resources

- [Cypress Best Practices - Selecting Elements](https://docs.cypress.io/guides/references/best-practices#Selecting-Elements)
- [Testing Library - Priority](https://testing-library.com/docs/queries/about/#priority)
- [Selenium - Locator Strategies](https://www.selenium.dev/documentation/webdriver/elements/locators/)
