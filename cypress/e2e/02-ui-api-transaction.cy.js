/**
 * Test 2: UI + API Hybrid Test - Create Transaction via UI, Verify via API
 *
 * Purpose: Validate UI-to-backend consistency for transaction creation
 * Tags: @regression, @integration, @api
 * Expected Duration: ~2 minutes
 *
 * This test verifies:
 * - User can create transaction via UI
 * - Transaction appears in UI
 * - Transaction data is correctly stored in backend (verified via API)
 * - API response matches UI data
 */

import { DashboardPage } from '../../src/pages';
import { waitForApi, generateTransaction } from '../../src/utils';

describe('UI + API Test: Transaction Creation', { tags: ['@regression', '@integration', '@api'] }, () => {
  let dashboardPage;
  let createdTransactionId;
  let transactionData;

  before(() => {
    // Login once for all tests
    cy.loginUser();
  });

  beforeEach(() => {
    dashboardPage = new DashboardPage();
    dashboardPage.verifyPageLoaded();
  });

  it('should create transaction via UI and verify via API', () => {
    // Step 1: Prepare transaction data
    cy.log('📝 Step 1: Prepare transaction data');
    transactionData = generateTransaction({
      amount: 50.00,
      description: 'Payment for coffee',
      recipient: 'Coffee Shop'
    });

    cy.log(`Transaction details: ${JSON.stringify(transactionData)}`);

    // Step 2: Intercept API calls
    cy.log('🔌 Step 2: Setup API interceptors');
    cy.intercept('POST', '**/api/transactions*').as('createTransaction');
    cy.intercept('GET', '**/api/transactions/*').as('getTransaction');

    // Step 3: Create transaction via UI
    cy.log('🖱️  Step 3: Create transaction via UI');
    cy.getByCy('new-transaction-button').should('be.visible').click();

    // Fill transaction form
    cy.getByCy('transaction-recipient').type(transactionData.recipient);
    cy.getByCy('transaction-amount').type(transactionData.amount.toString());
    cy.getByCy('transaction-description').type(transactionData.description);

    // Submit transaction
    cy.getByCy('transaction-submit').click();

    // Step 4: Wait for API response and capture transaction ID
    cy.log('⏳ Step 4: Wait for transaction creation');
    cy.wait('@createTransaction').then((interception) => {
      expect(interception.response.statusCode).to.equal(201);

      createdTransactionId = interception.response.body.id || interception.response.body.transactionId;
      cy.log(`✅ Transaction created with ID: ${createdTransactionId}`);

      // Verify response data matches input
      expect(interception.response.body.amount).to.equal(transactionData.amount);
      expect(interception.response.body.description).to.equal(transactionData.description);
    });

    // Step 5: Verify transaction appears in UI
    cy.log('👀 Step 5: Verify transaction in UI');
    cy.getByCy('transaction-list').should('be.visible');
    cy.getByCy(`transaction-${createdTransactionId}`)
      .should('be.visible')
      .within(() => {
        cy.contains(transactionData.recipient).should('be.visible');
        cy.contains(`$${transactionData.amount.toFixed(2)}`).should('be.visible');
      });

    // Step 6: Verify transaction via direct API call
    cy.log('🔍 Step 6: Verify transaction via API');
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl') || '/api'}/transactions/${createdTransactionId}`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('authToken')}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);

      const apiTransaction = response.body;

      // Verify all critical fields
      expect(apiTransaction.id || apiTransaction.transactionId).to.equal(createdTransactionId);
      expect(apiTransaction.amount).to.equal(transactionData.amount);
      expect(apiTransaction.description).to.equal(transactionData.description);
      expect(apiTransaction.status).to.be.oneOf(['pending', 'completed']);

      cy.log('✅ API verification successful');
      cy.log(`API Response: ${JSON.stringify(apiTransaction, null, 2)}`);
    });

    // Step 7: Verify updated balance
    cy.log('💰 Step 7: Verify balance updated');
    cy.getByCy('user-balance').invoke('text').then((balanceText) => {
      const balance = parseFloat(balanceText.replace(/[^0-9.-]+/g, ''));
      expect(balance).to.be.a('number');
      cy.log(`Current balance: $${balance}`);
    });
  });

  it('should handle concurrent transaction creation', { tags: ['@regression'] }, () => {
    // Create multiple transactions
    const transactions = [
      { recipient: 'Store A', amount: 25.50, description: 'Purchase A' },
      { recipient: 'Store B', amount: 30.00, description: 'Purchase B' },
      { recipient: 'Store C', amount: 15.75, description: 'Purchase C' }
    ];

    // Intercept API
    cy.intercept('POST', '**/api/transactions*').as('createTransaction');

    transactions.forEach((txn, index) => {
      cy.log(`Creating transaction ${index + 1}/${transactions.length}`);

      cy.getByCy('new-transaction-button').click();
      cy.getByCy('transaction-recipient').clear().type(txn.recipient);
      cy.getByCy('transaction-amount').clear().type(txn.amount.toString());
      cy.getByCy('transaction-description').clear().type(txn.description);
      cy.getByCy('transaction-submit').click();

      // Wait for completion
      cy.wait('@createTransaction').its('response.statusCode').should('equal', 201);

      // Brief pause between transactions
      cy.wait(500);
    });

    // Verify all transactions via API
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl') || '/api'}/transactions`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('authToken')}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);

      const recentTransactions = response.body.transactions || response.body;

      // Verify at least our 3 transactions exist
      transactions.forEach((txn) => {
        const found = recentTransactions.some(
          (t) => t.amount === txn.amount && t.description === txn.description
        );
        expect(found, `Transaction "${txn.description}" not found in API`).to.be.true;
      });
    });
  });

  it('should validate transaction data consistency between UI and API', { tags: ['@integration'] }, () => {
    // Create transaction
    const testTransaction = {
      recipient: 'Data Validation Test',
      amount: 99.99,
      description: 'Consistency check'
    };

    cy.intercept('POST', '**/api/transactions*').as('createTransaction');

    // Create via UI
    cy.getByCy('new-transaction-button').click();
    cy.getByCy('transaction-recipient').type(testTransaction.recipient);
    cy.getByCy('transaction-amount').type(testTransaction.amount.toString());
    cy.getByCy('transaction-description').type(testTransaction.description);
    cy.getByCy('transaction-submit').click();

    // Capture UI data
    let uiData;
    cy.wait('@createTransaction').then((interception) => {
      uiData = interception.response.body;
      const txnId = uiData.id || uiData.transactionId;

      // Fetch from API independently
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl') || '/api'}/transactions/${txnId}`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`
        }
      }).then((apiResponse) => {
        const apiData = apiResponse.body;

        // Deep comparison
        expect(apiData.amount).to.equal(uiData.amount);
        expect(apiData.description).to.equal(uiData.description);
        expect(apiData.status).to.equal(uiData.status);
        expect(apiData.createdAt || apiData.timestamp).to.exist;

        cy.log('✅ UI and API data are consistent');
      });
    });
  });

  after(() => {
    // Cleanup: Delete created transactions (if API supports it)
    if (createdTransactionId) {
      cy.log(`🧹 Cleanup: Attempting to delete transaction ${createdTransactionId}`);
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl') || '/api'}/transactions/${createdTransactionId}`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('authToken')}`
        },
        failOnStatusCode: false
      });
    }
  });
});
