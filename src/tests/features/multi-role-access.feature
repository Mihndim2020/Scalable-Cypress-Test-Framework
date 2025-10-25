Feature: Multi-Role Access Control
  As a system administrator
  I want different user roles to have appropriate access levels
  So that the application maintains proper security and permissions

  Background:
    Given the application is running
    And test data is seeded for all roles

  @smoke
  Scenario Outline: Users with different roles can login successfully
    Given I am on the login page
    When I login as a "<role>" user
    Then I should be redirected to the dashboard
    And I should see a personalized greeting for "<role>" role
    And I should see my account balance

    Examples:
      | role     |
      | standard |
      | premium  |
      | admin    |

  @smoke
  Scenario Outline: Role-based dashboard access
    Given I am logged in as a "<role>" user
    When I navigate to the dashboard
    Then I should see the dashboard page
    And I should see features appropriate for "<role>" role
    And the page title should reflect my "<role>" access level

    Examples:
      | role     |
      | standard |
      | premium  |
      | manager  |
      | admin    |

  @regression
  Scenario Outline: Export functionality based on role permissions
    Given I am logged in as a "<role>" user
    And I am on the dashboard page
    When I look for the export functionality
    Then the export button should be "<exportVisible>"

    Examples:
      | role     | exportVisible |
      | standard | hidden        |
      | premium  | visible       |
      | manager  | visible       |
      | admin    | visible       |
      | readonly | hidden        |

  @regression
  Scenario Outline: Delete functionality based on role permissions
    Given I am logged in as a "<role>" user
    And there are existing transactions
    When I view a transaction detail
    Then the delete button should be "<deleteVisible>"

    Examples:
      | role     | deleteVisible |
      | standard | hidden        |
      | premium  | hidden        |
      | manager  | hidden        |
      | admin    | visible       |
      | readonly | hidden        |

  @regression
  Scenario Outline: Transaction amount limits by role
    Given I am logged in as a "<role>" user
    When I attempt to create a transaction of "<amount>" dollars
    Then the transaction should be "<outcome>"

    Examples:
      | role     | amount | outcome  |
      | standard | 500    | accepted |
      | standard | 1500   | rejected |
      | premium  | 5000   | accepted |
      | premium  | 15000  | rejected |
      | admin    | 50000  | accepted |
      | admin    | 100000 | accepted |

  @regression
  Scenario Outline: API access based on role
    Given I am logged in as a "<role>" user
    When I check my API access permissions
    Then API access should be "<apiAccess>"
    And my rate limit should be "<rateLimit>" requests per hour

    Examples:
      | role     | apiAccess | rateLimit |
      | standard | denied    | 100       |
      | premium  | granted   | 500       |
      | manager  | granted   | 1000      |
      | admin    | granted   | unlimited |
      | readonly | denied    | 50        |

  @regression
  Scenario Outline: Report viewing permissions
    Given I am logged in as a "<role>" user
    When I navigate to the reports section
    Then I should "<reportAccess>" the reports page
    And I should "<reportCreate>" create new reports

    Examples:
      | role     | reportAccess | reportCreate |
      | standard | not access   | not be able to |
      | premium  | access       | not be able to |
      | manager  | access       | be able to     |
      | admin    | access       | be able to     |
      | readonly | not access   | not be able to |

  @smoke
  Scenario Outline: User can view transactions based on role
    Given I am logged in as a "<role>" user
    And there are 10 transactions in the system
    When I navigate to the transactions page
    Then I should see "<visibleTransactions>" transactions
    And each transaction should show "<transactionDetails>"

    Examples:
      | role     | visibleTransactions | transactionDetails |
      | standard | only my own        | basic info         |
      | premium  | only my own        | detailed info      |
      | manager  | all transactions   | detailed info      |
      | admin    | all transactions   | full details       |
      | readonly | only my own        | basic info         |

  @regression
  Scenario: Admin can manage all user roles
    Given I am logged in as an "admin" user
    And there are users with roles "standard", "premium", and "manager"
    When I navigate to user management
    Then I should see all users listed
    And I should be able to edit each user's role
    And I should be able to deactivate user accounts
    And I should be able to reactivate suspended accounts

  @regression
  Scenario: Non-admin users cannot access user management
    Given I am logged in as a "standard" user
    When I attempt to navigate to user management
    Then I should see an access denied message
    And I should be redirected to the dashboard

  @smoke
  Scenario: Readonly user has limited permissions
    Given I am logged in as a "readonly" user
    When I am on the dashboard
    Then I should not see any action buttons
    And I should only see read-only information
    And all forms should be disabled
    And I should see a "Read Only Access" indicator
