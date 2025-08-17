Feature: Listing Management
  As a system
  I want to manage rental listings
  So that users have access to accurate and up-to-date information

  Background:
    Given the database contains rental listings
    And the deduplication service is running

  Scenario: Create new listing from AI analysis
    Given an AI-analyzed post with complete rental information
    When a Listing is created
    Then the listing should contain:
      | field             | requirement                    |
      | id                | unique UUID                    |
      | telegram_post_id  | reference to source post       |
      | status            | active                         |
      | created_at        | current timestamp              |
      | updated_at        | current timestamp              |
    And the listing should be searchable immediately

  Scenario: Detect and merge duplicate listings
    Given two posts from different channels describe the same property:
      | channel | price | address         | contact         |
      | chan_1  | $800  | Vake, Abashidze | +995555123456  |
      | chan_2  | $800  | Abashidze St    | same phone     |
    When the deduplication algorithm runs
    Then the listings should be merged into one
    And both telegram_post_ids should be preserved
    And the most complete information should be retained

  Scenario: Update existing listing
    Given a listing exists with ID "123"
    When a new post updates the price from $800 to $750
    Then the listing price should be updated
    And a price history entry should be created
    And the updated_at timestamp should change

  Scenario: Mark outdated listings
    Given a listing was created 31 days ago
    And no updates have been received
    When the daily maintenance job runs
    Then the listing status should change to "potentially_outdated"
    And the listing should remain searchable
    But a warning should be shown to users

  Scenario: Archive old listings
    Given a listing has been "potentially_outdated" for 30 days
    When the archival job runs
    Then the listing status should change to "archived"
    And the listing should not appear in default searches
    But should be accessible via direct link

  Scenario: Handle price changes
    Given a listing with price history:
      | date       | price |
      | 2024-01-01 | $900  |
      | 2024-01-15 | $850  |
      | 2024-02-01 | $800  |
    When users view the listing
    Then the current price should show $800
    And price history should be available
    And a "price dropped" badge should be displayed

  Scenario: Validate listing data
    When a listing is created or updated
    Then the following validations should occur:
      | field        | validation                           |
      | price        | must be positive number              |
      | area_sqm     | must be between 10 and 1000         |
      | bedrooms     | must be between 0 and 10            |
      | district     | must be valid Tbilisi district       |
      | currency     | must be GEL, USD, or EUR            |

  Scenario: Track listing views
    Given a listing is displayed to users
    When a user views the listing details
    Then the view counter should increment
    And view statistics should be collected:
      | metric              |
      | total_views        |
      | unique_views       |
      | views_last_24h     |
      | views_last_7d      |

  Scenario: Flag suspicious listings
    Given a listing has characteristics:
      | indicator                    | value           |
      | price_below_market          | 70%             |
      | similar_listings_count      | 10              |
      | contact_info_changes        | 5 times         |
    When the fraud detection runs
    Then the listing should be flagged as suspicious
    And marked for manual review
    And temporarily hidden from public view

  Scenario: Manage listing media
    Given a listing has associated photos
    When media is processed
    Then photos should be:
      | action                  | specification           |
      | stored                 | in object storage       |
      | optimized             | webp format, multiple sizes |
      | watermarked           | with source channel     |
      | scanned               | for inappropriate content |
    And CDN URLs should be generated