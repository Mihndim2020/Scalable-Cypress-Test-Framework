Feature: User Login
  As a registered user
  I want to log in to the application
  So that I can access my dashboard and account features

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter valid username and password
    And I click the submit button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  @smoke
  Scenario: Login with remember me option
    When I enter valid username and password
    And I check the remember me checkbox
    And I click the submit button
    Then I should be redirected to the dashboard
    And the remember me option should be saved

  @regression
  Scenario: Failed login with invalid credentials
    When I enter invalid username and password
    And I click the submit button
    Then I should see an error message
    And I should remain on the login page

  @regression
  Scenario: Failed login with empty credentials
    When I leave username and password fields empty
    And I click the submit button
    Then the submit button should be disabled

  @regression
  Scenario: Failed login with invalid username
    When I enter invalid username "wronguser@test.com"
    And I enter valid password
    And I click the submit button
    Then I should see an error message "Username or password is invalid"

  @regression
  Scenario: Failed login with invalid password
    When I enter valid username
    And I enter invalid password "wrongpassword"
    And I click the submit button
    Then I should see an error message "Username or password is invalid"

  @regression
  Scenario: Navigation to signup page
    When I click on the signup link
    Then I should be redirected to the signup page

  @regression
  Scenario: Navigation to forgot password page
    When I click on the forgot password link
    Then I should be redirected to the forgot password page

  @smoke
  Scenario Outline: Login with different user types
    When I enter username "<username>" and password "<password>"
    And I click the submit button
    Then I should be redirected to the dashboard
    And I should see greeting for "<userType>"

    Examples:
      | username    | password     | userType |
      | testuser    | Password123! | Standard |
      | admin       | Admin123!    | Admin    |
