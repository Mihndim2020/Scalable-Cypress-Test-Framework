Feature: Example Feature
  As a user
  I want to see example tests
  So that I can understand the project structure

  @smoke
  Scenario: Homepage loads successfully
    Given I visit the homepage
    Then the page should load successfully

  @regression
  Scenario: Page has correct title
    Given I visit the homepage
    Then the page title should not be empty
