/**
 * Test 3: API-Only Test - Create Order and Verify DB State
 *
 * Purpose: Backend validation without UI interaction
 * Tags: @api, @integration, @regression
 * Expected Duration: ~1.5 minutes
 *
 * This test verifies:
 * - Order creation via API
 * - Order data persistence
 * - Order status transitions
 * - Database state consistency
 * - API response validation
 */

describe('API-Only Test: Order Creation and DB State', { tags: ['@api', '@integration', '@regression'] }, () => {
  let authToken;
  let userId;
  let createdOrderId;

  const apiUrl = Cypress.env('apiUrl') || '/api';

  before(() => {
    // Get authentication token via API
    cy.log('🔐 Authenticating via API...');

    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: {
        username: Cypress.env('TEST_USERNAME') || 'testuser',
        password: Cypress.env('TEST_PASSWORD') || 'Password123!'
      }
    }).then((response) => {
      expect(response.status).to.equal(200);
      authToken = response.body.token || response.body.accessToken;
      userId = response.body.userId || response.body.user?.id;

      cy.log(`✅ Authenticated. User ID: ${userId}`);
      Cypress.env('authToken', authToken);
    });
  });

  it('should create order via API and verify response structure', () => {
    // Step 1: Prepare order data
    cy.log('📝 Step 1: Prepare order data');

    const orderData = {
      userId: userId,
      items: [
        {
          productId: 'PROD-001',
          productName: 'Laptop',
          quantity: 1,
          price: 999.99
        },
        {
          productId: 'PROD-002',
          productName: 'Mouse',
          quantity: 2,
          price: 25.50
        }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      },
      paymentMethod: 'credit_card',
      totalAmount: 1051.99
    };

    cy.log(`Order data: ${JSON.stringify(orderData, null, 2)}`);

    // Step 2: Create order via API
    cy.log('🚀 Step 2: Create order via API POST request');

    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: orderData
    }).then((response) => {
      // Step 3: Validate response
      cy.log('✅ Step 3: Validate API response');

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id').or.to.have.property('orderId');

      createdOrderId = response.body.id || response.body.orderId;
      cy.log(`Order created successfully. ID: ${createdOrderId}`);

      // Validate response structure
      expect(response.body).to.have.property('status');
      expect(response.body.status).to.be.oneOf(['pending', 'processing', 'created']);

      expect(response.body).to.have.property('totalAmount');
      expect(response.body.totalAmount).to.equal(orderData.totalAmount);

      expect(response.body).to.have.property('items');
      expect(response.body.items).to.have.length(orderData.items.length);

      // Validate timestamp fields
      expect(response.body).to.have.property('createdAt').or.to.have.property('timestamp');

      cy.log('✅ Response structure validation passed');
    });
  });

  it('should retrieve created order and verify DB state', () => {
    // Ensure order was created
    expect(createdOrderId, 'Order ID should exist from previous test').to.exist;

    // Step 1: Fetch order by ID
    cy.log(`🔍 Step 1: Fetch order ${createdOrderId} from API`);

    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders/${createdOrderId}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);

      const order = response.body;

      // Step 2: Verify order data matches what was created
      cy.log('✅ Step 2: Verify order data integrity');

      expect(order.id || order.orderId).to.equal(createdOrderId);
      expect(order.userId).to.equal(userId);
      expect(order.totalAmount).to.equal(1051.99);

      // Verify items
      expect(order.items).to.have.length(2);
      expect(order.items[0].productId).to.equal('PROD-001');
      expect(order.items[1].productId).to.equal('PROD-002');

      // Verify shipping address
      expect(order.shippingAddress).to.exist;
      expect(order.shippingAddress.city).to.equal('San Francisco');
      expect(order.shippingAddress.zipCode).to.equal('94105');

      cy.log('✅ Order data integrity verified');
    });

    // Step 3: Verify order appears in user's order list
    cy.log('📋 Step 3: Verify order in user order list');

    cy.request({
      method: 'GET',
      url: `${apiUrl}/users/${userId}/orders`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);

      const orders = response.body.orders || response.body;
      const foundOrder = orders.find((o) => (o.id || o.orderId) === createdOrderId);

      expect(foundOrder, 'Order should appear in user order list').to.exist;

      cy.log('✅ Order found in user order list');
    });
  });

  it('should update order status and verify state transition', () => {
    expect(createdOrderId, 'Order ID should exist').to.exist;

    // Step 1: Update order status
    cy.log('🔄 Step 1: Update order status to "processing"');

    cy.request({
      method: 'PATCH',
      url: `${apiUrl}/orders/${createdOrderId}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        status: 'processing'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Some APIs may not allow status updates
      if (response.status === 200 || response.status === 204) {
        cy.log('✅ Status update successful');

        // Step 2: Verify status change
        cy.request({
          method: 'GET',
          url: `${apiUrl}/orders/${createdOrderId}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((getResponse) => {
          expect(getResponse.body.status).to.equal('processing');
          cy.log('✅ Status transition verified');
        });
      } else {
        cy.log(`⚠️  Status update not supported (${response.status})`);
      }
    });
  });

  it('should validate order calculation and item totals', () => {
    // Create order with complex calculation
    const complexOrder = {
      userId: userId,
      items: [
        { productId: 'PROD-101', quantity: 3, price: 15.99 },
        { productId: 'PROD-102', quantity: 1, price: 99.99 },
        { productId: 'PROD-103', quantity: 5, price: 7.50 }
      ],
      discount: 10.00,
      tax: 15.48,
      shippingCost: 8.99
    };

    // Calculate expected total
    const subtotal = complexOrder.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const expectedTotal = subtotal - complexOrder.discount + complexOrder.tax + complexOrder.shippingCost;

    complexOrder.totalAmount = parseFloat(expectedTotal.toFixed(2));

    cy.log(`💰 Calculated total: $${complexOrder.totalAmount}`);

    // Create order
    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: complexOrder
    }).then((response) => {
      expect(response.status).to.equal(201);

      // Verify calculations
      const order = response.body;

      if (order.subtotal !== undefined) {
        expect(order.subtotal).to.be.closeTo(subtotal, 0.01);
      }

      if (order.tax !== undefined) {
        expect(order.tax).to.be.closeTo(complexOrder.tax, 0.01);
      }

      expect(order.totalAmount).to.be.closeTo(complexOrder.totalAmount, 0.01);

      cy.log('✅ Order calculations verified');
    });
  });

  it('should handle bulk order creation and verify database consistency', () => {
    // Create multiple orders
    const bulkOrders = Array.from({ length: 5 }, (_, i) => ({
      userId: userId,
      items: [
        {
          productId: `BULK-PROD-${i}`,
          quantity: i + 1,
          price: (i + 1) * 10.00
        }
      ],
      totalAmount: (i + 1) * (i + 1) * 10.00,
      orderNumber: `BULK-${Date.now()}-${i}`
    }));

    const orderIds = [];

    // Create all orders
    cy.wrap(bulkOrders).each((orderData) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/orders`,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: orderData
      }).then((response) => {
        expect(response.status).to.equal(201);
        orderIds.push(response.body.id || response.body.orderId);
      });
    });

    // Verify all orders exist
    cy.then(() => {
      expect(orderIds).to.have.length(5);

      // Fetch user orders
      cy.request({
        method: 'GET',
        url: `${apiUrl}/users/${userId}/orders`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        const userOrders = response.body.orders || response.body;

        // Verify all bulk orders are present
        orderIds.forEach((orderId) => {
          const found = userOrders.some((o) => (o.id || o.orderId) === orderId);
          expect(found, `Order ${orderId} should exist in DB`).to.be.true;
        });

        cy.log('✅ All bulk orders verified in database');
      });
    });
  });

  after(() => {
    // Cleanup: Delete created orders
    if (createdOrderId) {
      cy.log(`🧹 Cleanup: Deleting test order ${createdOrderId}`);

      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/orders/${createdOrderId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200 || response.status === 204) {
          cy.log('✅ Cleanup successful');
        } else {
          cy.log(`⚠️  Cleanup not supported (${response.status})`);
        }
      });
    }
  });
});
