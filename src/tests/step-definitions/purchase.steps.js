/**
 * Step Definitions for Purchase Flow Feature
 *
 * Implements Gherkin steps for end-to-end purchase scenarios
 */

import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage, DashboardPage } from '../../pages';

// Shared state
let selectedProduct = null;
let cartTotal = 0;
let orderNumber = null;

// ============================================
// Background Steps
// ============================================

Given('I am logged in as a test user', () => {
  cy.loginUser();
});

Given('my cart is empty', () => {
  // Clear cart via API or UI
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl') || '/api'}/cart`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    },
    failOnStatusCode: false
  });

  // Or via UI
  cy.visit('/cart');
  cy.getByCy('cart-items', { timeout: 5000 })
    .then(($cart) => {
      if ($cart.find('[data-cy="cart-item"]').length > 0) {
        cy.getByCy('clear-cart-button').click();
      }
    });
});

Given('I have sufficient balance', () => {
  // Verify or seed balance
  cy.getByCy('user-balance').invoke('text').then((balanceText) => {
    const balance = parseFloat(balanceText.replace(/[^0-9.-]+/g, ''));
    if (balance < 1000) {
      cy.log('⚠️  Low balance, seeding funds via API');
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl') || '/api'}/users/balance`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`
        },
        body: { amount: 5000 },
        failOnStatusCode: false
      });
    }
  });
});

// ============================================
// Product Browsing Steps
// ============================================

Given('I am on the products page', () => {
  cy.visit('/products');
  cy.getByCy('products-page').should('be.visible');
});

When('I view the product catalog', () => {
  cy.getByCy('product-catalog').should('be.visible');
});

Then('I should see available products', () => {
  cy.getByCy('product-list').should('be.visible');
  cy.getByCy('product-item').should('have.length.greaterThan', 0);
});

When('I select a product {string}', (productName) => {
  selectedProduct = productName;

  cy.getByCy('product-list')
    .contains(productName)
    .closest('[data-cy="product-item"]')
    .click();
});

Then('I should see the product details', () => {
  cy.getByCy('product-details').should('be.visible');
  cy.getByCy('product-name').should('contain', selectedProduct);
});

Then('the product price should be displayed', () => {
  cy.getByCy('product-price')
    .should('be.visible')
    .invoke('text')
    .should('match', /\$\d+\.\d{2}/);
});

// ============================================
// Cart Management Steps
// ============================================

When('I click {string}', (buttonText) => {
  cy.contains('button', buttonText).click();
});

When('I click "Add to Cart"', () => {
  cy.getByCy('add-to-cart-button').should('be.visible').click();
  cy.wait(500); // Allow cart update
});

Then('the item should be added to my cart', () => {
  cy.getByCy('cart-notification', { timeout: 5000 })
    .should('be.visible')
    .and('contain', 'added to cart');
});

Then('the cart count should be {string}', (expectedCount) => {
  cy.getByCy('cart-count')
    .should('be.visible')
    .and('contain', expectedCount);
});

When('I navigate to the cart', () => {
  cy.getByCy('cart-icon').click();
  cy.url().should('include', '/cart');
  cy.getByCy('cart-page').should('be.visible');
});

Then('I should see {string} in my cart', (productName) => {
  cy.getByCy('cart-items')
    .should('contain', productName);
});

Then('the cart total should be calculated correctly', () => {
  cy.getByCy('cart-total').invoke('text').then((totalText) => {
    const total = parseFloat(totalText.replace(/[^0-9.-]+/g, ''));
    expect(total).to.be.greaterThan(0);
    cartTotal = total;
    cy.log(`Cart total: $${cartTotal}`);
  });
});

When('I add the following items to cart', (dataTable) => {
  const items = dataTable.hashes();

  items.forEach((item) => {
    cy.visit('/products');

    cy.getByCy('product-list')
      .contains(item.product)
      .closest('[data-cy="product-item"]')
      .within(() => {
        // Set quantity if not 1
        if (item.quantity !== '1') {
          cy.getByCy('product-quantity').clear().type(item.quantity);
        }
        cy.getByCy('add-to-cart-button').click();
      });

    cy.wait(500); // Allow cart update
  });
});

Then('I should see all items in my cart', () => {
  cy.getByCy('cart-item').should('have.length.greaterThan', 1);
});

Then('the subtotal should be calculated correctly', () => {
  cy.getByCy('cart-subtotal').should('be.visible').invoke('text').should('match', /\$\d+\.\d{2}/);
});

Then('the tax should be calculated', () => {
  cy.getByCy('cart-tax').should('be.visible').invoke('text').should('match', /\$\d+\.\d{2}/);
});

Then('the total should include tax and shipping', () => {
  let subtotal, tax, shipping;

  cy.getByCy('cart-subtotal').invoke('text').then((text) => {
    subtotal = parseFloat(text.replace(/[^0-9.-]+/g, ''));
  });

  cy.getByCy('cart-tax').invoke('text').then((text) => {
    tax = parseFloat(text.replace(/[^0-9.-]+/g, ''));
  });

  cy.getByCy('cart-shipping').invoke('text').then((text) => {
    shipping = parseFloat(text.replace(/[^0-9.-]+/g, ''));
  });

  cy.getByCy('cart-total').invoke('text').then((text) => {
    const total = parseFloat(text.replace(/[^0-9.-]+/g, ''));
    const expectedTotal = subtotal + tax + shipping;
    expect(total).to.be.closeTo(expectedTotal, 0.01);
  });
});

// ============================================
// Checkout Steps
// ============================================

When('I proceed to checkout', () => {
  cy.getByCy('checkout-button').should('be.visible').click();
});

Then('I should be on the checkout page', () => {
  cy.url().should('include', '/checkout');
  cy.getByCy('checkout-page').should('be.visible');
});

When('I enter shipping information', (dataTable) => {
  const shippingInfo = dataTable.rowsHash();

  cy.getByCy('shipping-street').type(shippingInfo.street);
  cy.getByCy('shipping-city').type(shippingInfo.city);
  cy.getByCy('shipping-state').type(shippingInfo.state);
  cy.getByCy('shipping-zipcode').type(shippingInfo.zipCode);
  cy.getByCy('shipping-country').type(shippingInfo.country);
});

When('I select payment method {string}', (paymentMethod) => {
  cy.getByCy('payment-method-select').select(paymentMethod);
});

When('I enter payment details', (dataTable) => {
  const paymentInfo = dataTable.rowsHash();

  cy.getByCy('card-number').type(paymentInfo.cardNumber);
  cy.getByCy('card-expiry').type(paymentInfo.expiryDate);
  cy.getByCy('card-cvv').type(paymentInfo.cvv);
  cy.getByCy('card-holder').type(paymentInfo.cardHolder);
});

When('I complete the checkout process with saved payment method', () => {
  // Use saved payment method
  cy.getByCy('use-saved-payment').check();

  // Enter minimal shipping info
  cy.getByCy('shipping-street').type('123 Main St');
  cy.getByCy('shipping-city').type('San Francisco');
  cy.getByCy('shipping-state').type('CA');
  cy.getByCy('shipping-zipcode').type('94105');

  cy.getByCy('complete-purchase-button').click();
});

When('I complete the checkout process', () => {
  // Simplified checkout completion
  cy.getByCy('complete-purchase-button').click();
});

Then('I should see order confirmation', () => {
  cy.getByCy('order-confirmation', { timeout: 10000 }).should('be.visible');
  cy.contains('Order confirmed').should('be.visible');
});

Then('the order status should be {string}', (expectedStatus) => {
  cy.getByCy('order-status')
    .should('be.visible')
    .and('contain', expectedStatus);
});

Then('I should receive an order number', () => {
  cy.getByCy('order-number').should('be.visible').invoke('text').then((text) => {
    orderNumber = text.trim();
    expect(orderNumber).to.match(/^[A-Z0-9-]+$/);
    cy.log(`Order Number: ${orderNumber}`);
  });
});

Then('my cart should be empty', () => {
  cy.getByCy('cart-count').should('contain', '0').or('not.exist');
});

Then('the order should contain all purchased items', () => {
  cy.getByCy('order-items').should('be.visible');
  cy.getByCy('order-item').should('have.length.greaterThan', 1);
});

// ============================================
// Discount & Promo Steps
// ============================================

Given('I have a valid discount code {string}', (discountCode) => {
  cy.wrap(discountCode).as('discountCode');
});

When('I add {string} to cart', (productName) => {
  cy.visit('/products');
  cy.getByCy('product-list')
    .contains(productName)
    .closest('[data-cy="product-item"]')
    .within(() => {
      cy.getByCy('add-to-cart-button').click();
    });
});

When('I apply discount code {string}', (discountCode) => {
  cy.getByCy('discount-code-input').type(discountCode);
  cy.getByCy('apply-discount-button').click();
});

Then('I should see {string}', (message) => {
  cy.contains(message).should('be.visible');
});

Then('the total should reflect the discount', () => {
  cy.getByCy('discount-amount')
    .invoke('text')
    .then((discountText) => {
      const discount = parseFloat(discountText.replace(/[^0-9.-]+/g, ''));
      expect(discount).to.be.greaterThan(0);
    });
});

Then('the order total should include the discount', () => {
  cy.getByCy('order-discount').should('exist');
});

// ============================================
// Cart Modification Steps
// ============================================

When('I change the quantity of {string} to {string}', (productName, newQuantity) => {
  cy.getByCy('cart-items')
    .contains(productName)
    .closest('[data-cy="cart-item"]')
    .within(() => {
      cy.getByCy('item-quantity').clear().type(newQuantity);
      cy.getByCy('update-quantity').click();
    });

  cy.wait(500); // Allow update
});

Then('the cart total should be updated', () => {
  cy.getByCy('cart-total').should('be.visible');
});

When('I remove {string} from cart', (productName) => {
  cy.getByCy('cart-items')
    .contains(productName)
    .closest('[data-cy="cart-item"]')
    .within(() => {
      cy.getByCy('remove-item-button').click();
    });

  cy.wait(500); // Allow removal
});

Then('{string} should not be in my cart', (productName) => {
  cy.getByCy('cart-items').should('not.contain', productName);
});

Then('the order should only contain {string}', (productName) => {
  cy.getByCy('order-items').should('contain', productName);
  cy.getByCy('order-item').should('have.length', 1);
});

Then('the quantity should be {string}', (expectedQuantity) => {
  cy.getByCy('order-item-quantity').should('contain', expectedQuantity);
});

// ============================================
// Guest User Steps
// ============================================

Given('I am not logged in', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit('/');
});

Then('I should be redirected to the login page', () => {
  cy.url().should('include', '/login');
});

When('I login with valid credentials', () => {
  const loginPage = new LoginPage();
  loginPage.login(
    Cypress.env('TEST_USERNAME') || 'testuser',
    Cypress.env('TEST_PASSWORD') || 'Password123!'
  );
});

Then('I should be redirected to the checkout page', () => {
  cy.url().should('include', '/checkout');
});

Then('my cart items should be preserved', () => {
  cy.getByCy('cart-items').should('exist');
  cy.getByCy('cart-item').should('have.length.greaterThan', 0);
});

// ============================================
// Validation Steps
// ============================================

When('I click "Complete Purchase" without entering details', () => {
  cy.visit('/checkout');
  cy.getByCy('complete-purchase-button').click();
});

Then('I should see validation errors', () => {
  cy.getByCy('validation-errors').should('be.visible');
});

When('I enter invalid shipping information', (dataTable) => {
  const invalidData = dataTable.rowsHash();

  Object.entries(invalidData).forEach(([field, value]) => {
    cy.getByCy(`shipping-${field.toLowerCase()}`).clear().type(value);
  });

  cy.getByCy('validate-shipping-button').click();
});

Then('I should see {string}', (errorMessage) => {
  cy.contains(errorMessage).should('be.visible');
});

When('I enter invalid payment details', (dataTable) => {
  const invalidData = dataTable.rowsHash();

  Object.entries(invalidData).forEach(([field, value]) => {
    cy.getByCy(`card-${field.toLowerCase()}`).clear().type(value);
  });
});

When('I correct all validation errors', () => {
  // Enter valid shipping
  cy.getByCy('shipping-street').clear().type('123 Main St');
  cy.getByCy('shipping-city').clear().type('San Francisco');
  cy.getByCy('shipping-state').clear().type('CA');
  cy.getByCy('shipping-zipcode').clear().type('94105');

  // Enter valid payment
  cy.getByCy('card-number').clear().type('4111111111111111');
  cy.getByCy('card-expiry').clear().type('12/25');
  cy.getByCy('card-cvv').clear().type('123');
  cy.getByCy('card-holder').clear().type('Test User');
});

Then('the order should be created successfully', () => {
  cy.getByCy('order-confirmation', { timeout: 10000 }).should('be.visible');
});
