# Test 4: BDD Scenario - End-to-End Purchase Flow
#
# Purpose: Validate complete user journey from browsing to purchase
# Tags: @e2e, @regression, @purchase
# Expected Duration: ~3 minutes
#
# This scenario verifies:
# - User can browse products
# - User can add items to cart
# - User can proceed through checkout
# - User can complete purchase
# - Order confirmation is displayed

@e2e @regression @purchase
Feature: End-to-End Purchase Flow
  As a customer
  I want to browse and purchase items
  So that I can complete a transaction successfully

  Background:
    Given I am logged in as a test user
    And my cart is empty
    And I have sufficient balance

  @smoke @critical
  Scenario: Customer successfully purchases a single item
    Given I am on the products page
    When I view the product catalog
    Then I should see available products

    When I select a product "Laptop Computer"
    Then I should see the product details
    And the product price should be displayed

    When I click "Add to Cart"
    Then the item should be added to my cart
    And the cart count should be "1"

    When I navigate to the cart
    Then I should see "Laptop Computer" in my cart
    And the cart total should be calculated correctly

    When I proceed to checkout
    Then I should be on the checkout page

    When I enter shipping information
      | field         | value              |
      | street        | 123 Main Street    |
      | city          | San Francisco      |
      | state         | CA                 |
      | zipCode       | 94105              |
      | country       | USA                |

    And I select payment method "Credit Card"
    And I enter payment details
      | field         | value              |
      | cardNumber    | 4111111111111111   |
      | expiryDate    | 12/25              |
      | cvv           | 123                |
      | cardHolder    | Test User          |

    When I click "Complete Purchase"
    Then I should see order confirmation
    And the order status should be "Processing"
    And I should receive an order number
    And my cart should be empty

  @regression
  Scenario: Customer purchases multiple items with different quantities
    Given I am on the products page
    When I add the following items to cart
      | product           | quantity |
      | Laptop Computer   | 1        |
      | Wireless Mouse    | 2        |
      | USB Cable         | 3        |
    Then the cart count should be "6"

    When I navigate to the cart
    Then I should see all items in my cart
    And the subtotal should be calculated correctly
    And the tax should be calculated
    And the total should include tax and shipping

    When I proceed to checkout
    And I complete the checkout process with saved payment method
    Then I should see order confirmation
    And the order should contain all purchased items

  @regression @promo
  Scenario: Customer applies discount code during checkout
    Given I am on the products page
    And I have a valid discount code "SAVE10"

    When I add "Laptop Computer" to cart
    And I navigate to the cart
    And I apply discount code "SAVE10"
    Then I should see "Discount applied: 10% off"
    And the total should reflect the discount

    When I proceed to checkout
    And I complete the checkout process
    Then the order total should include the discount

  @regression @edge-case
  Scenario: Customer modifies cart before checkout
    Given I am on the products page

    When I add "Laptop Computer" to cart
    And I add "Wireless Mouse" to cart
    And I navigate to the cart
    Then the cart count should be "2"

    When I change the quantity of "Wireless Mouse" to "3"
    Then the cart count should be "4"
    And the cart total should be updated

    When I remove "Laptop Computer" from cart
    Then the cart count should be "3"
    And "Laptop Computer" should not be in my cart

    When I proceed to checkout
    And I complete the checkout process
    Then the order should only contain "Wireless Mouse"
    And the quantity should be "3"

  @smoke @guest
  Scenario: Guest user must login before checkout
    Given I am not logged in
    And I am on the products page

    When I add "Laptop Computer" to cart
    And I navigate to the cart
    Then I should see "Laptop Computer" in my cart

    When I proceed to checkout
    Then I should be redirected to the login page

    When I login with valid credentials
    Then I should be redirected to the checkout page
    And my cart items should be preserved

  @regression @validation
  Scenario: Checkout validation prevents invalid submissions
    Given I am on the products page
    When I add "Laptop Computer" to cart
    And I navigate to the cart
    And I proceed to checkout

    When I click "Complete Purchase" without entering details
    Then I should see validation errors
    And I should see "Shipping address is required"
    And I should see "Payment method is required"

    When I enter invalid shipping information
      | field   | value |
      | zipCode | ABC   |
    Then I should see "Invalid ZIP code format"

    When I enter invalid payment details
      | field      | value    |
      | cardNumber | 1234     |
    Then I should see "Invalid card number"

    When I correct all validation errors
    And I click "Complete Purchase"
    Then the order should be created successfully
