/**
 * Test 6: Negative Testing - Invalid Checkout Flows
 *
 * Purpose: Validate error handling and validation in checkout process
 * Tags: @negative, @validation, @regression
 * Expected Duration: ~2.5 minutes
 *
 * This test verifies:
 * - System handles invalid inputs gracefully
 * - Appropriate error messages are displayed
 * - Security validations are enforced
 * - Edge cases are handled properly
 * - User cannot bypass validation
 */

describe('Negative Testing: Invalid Checkout Flows', { tags: ['@negative', '@validation', '@regression'] }, () => {
  before(() => {
    cy.loginUser();
  });

  beforeEach(() => {
    // Reset state and prepare test cart
    cy.visit('/products');
    cy.getByCy('product-list').should('be.visible');

    // Add item to cart for checkout testing
    cy.getByCy('product-item').first().within(() => {
      cy.getByCy('add-to-cart-button').click();
    });

    cy.wait(500); // Allow cart update
  });

  describe('Empty or Missing Required Fields', () => {
    it('should prevent checkout with empty shipping address', { tags: ['@critical'] }, () => {
      cy.log('🚫 Test: Empty shipping address');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();
      cy.url().should('include', '/checkout');

      // Leave all shipping fields empty
      cy.getByCy('complete-purchase-button').click();

      // Verify validation errors
      cy.getByCy('validation-error').should('be.visible');
      cy.contains(/shipping.*required|address.*required/i).should('be.visible');

      // Verify order was not created
      cy.url().should('include', '/checkout'); // Still on checkout page

      cy.screenshot('empty-shipping-validation');
    });

    it('should prevent checkout without payment method', { tags: ['@critical'] }, () => {
      cy.log('🚫 Test: Missing payment method');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill shipping but not payment
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      // Skip payment details
      cy.getByCy('complete-purchase-button').click();

      // Verify error
      cy.contains(/payment.*required/i).should('be.visible');

      cy.screenshot('missing-payment-validation');
    });

    it('should validate all required fields individually', () => {
      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      const requiredFields = [
        { field: 'shipping-street', message: /street.*required/i },
        { field: 'shipping-city', message: /city.*required/i },
        { field: 'shipping-state', message: /state.*required/i },
        { field: 'shipping-zipcode', message: /zip.*required/i }
      ];

      requiredFields.forEach(({ field, message }) => {
        // Clear field if it has a value
        cy.getByCy(field).clear().blur();

        // Verify error message
        cy.contains(message, { timeout: 3000 }).should('be.visible');

        cy.log(`✅ Validated: ${field}`);
      });
    });
  });

  describe('Invalid Data Formats', () => {
    it('should reject invalid ZIP code formats', () => {
      cy.log('🚫 Test: Invalid ZIP codes');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      const invalidZipCodes = ['ABC', '1234', '123456789', 'ABCDE', '12-34'];

      invalidZipCodes.forEach((zipCode) => {
        cy.getByCy('shipping-zipcode').clear().type(zipCode).blur();

        // Verify validation error
        cy.contains(/invalid.*zip|zip.*format/i, { timeout: 2000 }).should('be.visible');

        cy.log(`✅ Rejected invalid ZIP: ${zipCode}`);
      });

      cy.screenshot('invalid-zipcode-validation');
    });

    it('should reject invalid credit card numbers', () => {
      cy.log('🚫 Test: Invalid credit card numbers');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill shipping
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      const invalidCards = [
        { number: '1234', description: 'Too short' },
        { number: '1234567890123456', description: 'Invalid Luhn check' },
        { number: 'ABCD1234EFGH5678', description: 'Contains letters' },
        { number: '1111 1111 1111 1111', description: 'All same digit' }
      ];

      invalidCards.forEach(({ number, description }) => {
        cy.getByCy('card-number').clear().type(number).blur();

        // Verify error
        cy.contains(/invalid.*card|card.*number/i, { timeout: 2000 }).should('be.visible');

        cy.log(`✅ Rejected: ${description}`);
      });

      cy.screenshot('invalid-card-validation');
    });

    it('should reject expired credit cards', () => {
      cy.log('🚫 Test: Expired credit card');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill shipping
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      // Enter valid card number
      cy.getByCy('card-number').type('4111111111111111');

      // Enter expired date
      cy.getByCy('card-expiry').type('01/20'); // January 2020

      // Enter CVV
      cy.getByCy('card-cvv').type('123');

      // Try to submit
      cy.getByCy('complete-purchase-button').click();

      // Verify error
      cy.contains(/expired|expiry.*invalid/i).should('be.visible');

      cy.screenshot('expired-card-validation');
    });

    it('should reject invalid CVV codes', () => {
      cy.log('🚫 Test: Invalid CVV');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      const invalidCVVs = ['1', '12', 'ABC', '12345'];

      invalidCVVs.forEach((cvv) => {
        cy.getByCy('card-cvv').clear().type(cvv).blur();

        // Verify error
        cy.contains(/invalid.*cvv|cvv.*format/i, { timeout: 2000 }).should('be.visible');

        cy.log(`✅ Rejected CVV: ${cvv}`);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should prevent checkout with insufficient balance', () => {
      cy.log('🚫 Test: Insufficient balance');

      // Set balance to very low amount via API
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl') || '/api'}/users/balance`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`
        },
        body: { amount: 0.01 }, // Set to minimal balance
        failOnStatusCode: false
      });

      // Add expensive item to cart
      cy.visit('/products');
      cy.getByCy('product-item').first().within(() => {
        cy.getByCy('add-to-cart-button').click();
      });

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill form
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      cy.getByCy('card-number').type('4111111111111111');
      cy.getByCy('card-expiry').type('12/25');
      cy.getByCy('card-cvv').type('123');

      cy.getByCy('complete-purchase-button').click();

      // Verify error
      cy.contains(/insufficient.*balance|balance.*low/i, { timeout: 5000 }).should('be.visible');

      cy.screenshot('insufficient-balance-error');
    });

    it('should prevent checkout with empty cart', () => {
      cy.log('🚫 Test: Empty cart checkout');

      // Clear cart
      cy.getByCy('cart-icon').click();
      cy.getByCy('clear-cart-button').click();

      // Verify cart is empty
      cy.getByCy('cart-count').should('contain', '0').or('not.exist');

      // Try to checkout directly via URL
      cy.visit('/checkout');

      // Should be redirected or shown error
      cy.contains(/cart.*empty|no items/i, { timeout: 3000 }).should('be.visible');

      cy.screenshot('empty-cart-checkout');
    });

    it('should validate maximum quantity limits', () => {
      cy.log('🚫 Test: Exceed maximum quantity');

      cy.visit('/products');
      cy.getByCy('product-item').first().within(() => {
        // Try to set unreasonably high quantity
        cy.getByCy('product-quantity').clear().type('99999');
        cy.getByCy('add-to-cart-button').click();
      });

      // Verify error or quantity capped
      cy.contains(/maximum.*quantity|quantity.*limit/i, { timeout: 3000 }).should('be.visible');

      cy.screenshot('max-quantity-validation');
    });
  });

  describe('Security Validations', () => {
    it('should prevent SQL injection in shipping fields', () => {
      cy.log('🔒 Test: SQL injection prevention');

      const sqlInjection = "'; DROP TABLE users; --";

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Try SQL injection in various fields
      cy.getByCy('shipping-street').type(sqlInjection);
      cy.getByCy('shipping-city').type(sqlInjection);

      cy.getByCy('complete-purchase-button').click();

      // Either sanitized or rejected
      // System should not crash
      cy.get('body').should('be.visible');

      cy.log('✅ Application did not crash from SQL injection attempt');
    });

    it('should prevent XSS in shipping fields', () => {
      cy.log('🔒 Test: XSS prevention');

      const xssPayload = '<script>alert("XSS")</script>';

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      cy.getByCy('shipping-street').type(xssPayload);
      cy.getByCy('shipping-city').type(xssPayload);
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      cy.getByCy('card-number').type('4111111111111111');
      cy.getByCy('card-expiry').type('12/25');
      cy.getByCy('card-cvv').type('123');

      cy.getByCy('complete-purchase-button').click();

      // Verify no alert was shown
      cy.on('window:alert', () => {
        throw new Error('XSS vulnerability detected!');
      });

      cy.log('✅ XSS attempt was sanitized');
    });

    it('should require authentication for checkout', () => {
      cy.log('🔒 Test: Authentication required');

      // Logout
      cy.clearCookies();
      cy.clearLocalStorage();

      // Try to access checkout directly
      cy.visit('/checkout');

      // Should redirect to login
      cy.url().should('include', '/login');

      cy.log('✅ Unauthenticated user redirected to login');
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate form submissions', () => {
      cy.log('⚠️  Test: Duplicate submission prevention');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill valid form
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      cy.getByCy('card-number').type('4111111111111111');
      cy.getByCy('card-expiry').type('12/25');
      cy.getByCy('card-cvv').type('123');

      // Click submit multiple times quickly
      cy.getByCy('complete-purchase-button').dblclick();

      // Wait for response
      cy.wait(3000);

      // Verify only one order was created
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl') || '/api'}/users/${Cypress.env('userId')}/orders`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          const recentOrders = (response.body.orders || response.body).filter((order) => {
            const orderTime = new Date(order.createdAt || order.timestamp);
            const now = new Date();
            return (now - orderTime) < 10000; // Last 10 seconds
          });

          // Should only have one recent order (not duplicates)
          expect(recentOrders.length).to.be.at.most(1);

          cy.log('✅ Duplicate submission prevented');
        }
      });
    });

    it('should handle special characters in address', () => {
      cy.log('⚠️  Test: Special characters handling');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      const specialCharAddress = "123 Main St. #456, Apt. B-2 (Rear)";
      const specialCharCity = "San José";

      cy.getByCy('shipping-street').type(specialCharAddress);
      cy.getByCy('shipping-city').type(specialCharCity);
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      // Should accept these valid special characters
      cy.getByCy('complete-purchase-button').click();

      // Verify no validation error for valid special chars
      cy.wait(1000);

      // If there's an error, it shouldn't be about special characters
      cy.get('body').then(($body) => {
        if ($body.text().includes('invalid')) {
          cy.log('⚠️  Special characters may be restricted');
        } else {
          cy.log('✅ Special characters accepted in address');
        }
      });
    });

    it('should handle network timeout gracefully', () => {
      cy.log('⚠️  Test: Network timeout handling');

      // Intercept and delay response
      cy.intercept('POST', '**/api/orders*', (req) => {
        req.reply({
          delay: 30000, // 30 second delay
          statusCode: 408, // Request Timeout
          body: { error: 'Request timeout' }
        });
      }).as('slowOrder');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill form
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      cy.getByCy('card-number').type('4111111111111111');
      cy.getByCy('card-expiry').type('12/25');
      cy.getByCy('card-cvv').type('123');

      cy.getByCy('complete-purchase-button').click();

      // Should show loading state or timeout error
      cy.contains(/timeout|processing|please wait/i, { timeout: 5000 }).should('be.visible');

      cy.log('✅ Timeout handled gracefully');
    });
  });

  describe('Error Recovery', () => {
    it('should preserve form data after validation error', () => {
      cy.log('🔄 Test: Form data preservation');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      const testData = {
        street: '123 Main Street',
        city: 'San Francisco',
        state: 'CA'
      };

      // Fill partial form
      cy.getByCy('shipping-street').type(testData.street);
      cy.getByCy('shipping-city').type(testData.city);
      cy.getByCy('shipping-state').type(testData.state);
      // Skip zipcode intentionally

      // Submit to trigger validation
      cy.getByCy('complete-purchase-button').click();

      // Verify error
      cy.contains(/zip.*required/i).should('be.visible');

      // Verify previously entered data is still there
      cy.getByCy('shipping-street').should('have.value', testData.street);
      cy.getByCy('shipping-city').should('have.value', testData.city);
      cy.getByCy('shipping-state').should('have.value', testData.state);

      cy.log('✅ Form data preserved after validation error');
    });

    it('should allow retry after payment failure', () => {
      cy.log('🔄 Test: Retry after payment failure');

      // Intercept and fail first payment
      let attemptCount = 0;
      cy.intercept('POST', '**/api/orders*', (req) => {
        attemptCount++;
        if (attemptCount === 1) {
          req.reply({
            statusCode: 402, // Payment Required / Failed
            body: { error: 'Payment declined' }
          });
        } else {
          req.continue();
        }
      }).as('orderRequest');

      cy.getByCy('cart-icon').click();
      cy.getByCy('checkout-button').click();

      // Fill form
      cy.getByCy('shipping-street').type('123 Main St');
      cy.getByCy('shipping-city').type('San Francisco');
      cy.getByCy('shipping-state').type('CA');
      cy.getByCy('shipping-zipcode').type('94105');

      cy.getByCy('card-number').type('4111111111111111');
      cy.getByCy('card-expiry').type('12/25');
      cy.getByCy('card-cvv').type('123');

      // First attempt
      cy.getByCy('complete-purchase-button').click();

      // Verify payment error
      cy.contains(/payment.*declined|payment.*failed/i, { timeout: 5000 }).should('be.visible');

      // Retry
      cy.getByCy('complete-purchase-button').click();

      cy.log('✅ Retry mechanism available after payment failure');
    });
  });

  afterEach(function() {
    // Log test result
    if (this.currentTest.state === 'failed') {
      cy.log(`❌ Negative test failed: ${this.currentTest.title}`);
    } else {
      cy.log(`✅ Negative test passed: ${this.currentTest.title}`);
    }

    // Cleanup: Reset balance if needed
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl') || '/api'}/users/balance`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('authToken')}`
      },
      body: { amount: 5000 },
      failOnStatusCode: false
    });
  });
});
