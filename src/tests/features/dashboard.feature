Feature: Dashboard Functionality
  As a logged-in user
  I want to interact with the dashboard
  So that I can manage my account and view transactions

  Background:
    Given I am logged in as a valid user
    And I am on the dashboard page

  @smoke
  Scenario: Dashboard loads successfully
    Then I should see the dashboard page
    And I should see the side navigation
    And I should see my account balance

  @smoke
  Scenario: View user greeting
    Then I should see a personalized greeting
    And the greeting should contain my username

  @smoke
  Scenario: Logout from dashboard
    When I click the logout button
    Then I should be redirected to the login page
    And I should not be able to access the dashboard

  @regression
  Scenario: Navigate to account settings
    When I click on the settings button
    Then I should be redirected to the settings page

  @regression
  Scenario: View notifications
    When I click on the notification bell
    Then the notifications panel should open
    And I should see my recent notifications

  @regression
  Scenario: Search functionality
    When I enter "transaction" in the search box
    And I press enter
    Then I should see search results for "transaction"

  @regression
  Scenario: Create new transaction
    When I click the create button
    Then I should see the new transaction form
    And the form should have all required fields

  @regression
  Scenario: View transaction list
    Then I should see a list of transactions
    And each transaction should have a date and amount

  @regression
  Scenario: Click on a transaction
    When I click on the first transaction
    Then I should see the transaction details
    And the details should include sender and receiver information

  @regression
  Scenario: Toggle side navigation
    When I click the menu toggle button
    Then the side navigation should collapse
    When I click the menu toggle button again
    Then the side navigation should expand

  @smoke
  Scenario: Verify account balance display
    Then my account balance should be visible
    And the balance should be a valid currency amount

  @regression
  Scenario: Navigate to home from dashboard
    When I click on the home link
    Then I should remain on the dashboard page
    And the home link should be highlighted

  @regression
  Scenario: Multiple user sessions
    Given I have notifications pending
    When I refresh the dashboard page
    Then I should still see my notifications badge
    And the notification count should persist
