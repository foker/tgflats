Feature: AI-Powered Listing Analysis
  As a system
  I want to analyze Telegram posts using AI
  So that rental listings are automatically identified and structured

  Background:
    Given the AI service is configured and available
    And the confidence threshold is set to 80%

  Scenario: Identify rental listing from post
    Given a TelegramPost with text:
      """
      🏠 For Rent in Vake
      2-bedroom apartment, 75m²
      $800/month, pets allowed
      Near metro station
      Contact: +995 555 123456
      """
    When the AI analysis is performed
    Then the post should be classified as "rental_listing" with confidence > 80%
    And a Listing entity should be created

  Scenario: Extract structured data from listing
    Given a post identified as rental listing
    When the AI extracts structured data
    Then the following fields should be populated:
      | field          | extracted_value        |
      | district       | Vake                  |
      | bedrooms       | 2                     |
      | area_sqm       | 75                    |
      | price          | 800                   |
      | currency       | USD                   |
      | pets_allowed   | true                  |
      | address        | Near metro station    |
      | contact_info   | +995 555 123456      |

  Scenario: Handle multi-language posts
    Given posts in different languages:
      | language | text_sample                    |
      | en       | For rent in Saburtalo          |
      | ka       | ქირავდება საბურთალოზე         |
      | ru       | Сдается квартира в Сабуртало   |
    When each post is analyzed
    Then the AI should correctly identify listings regardless of language
    And extracted data should be normalized to English

  Scenario: Reject non-rental posts
    Given a TelegramPost with text:
      """
      Looking for apartment in Tbilisi
      Budget up to $600
      Need 2 bedrooms
      """
    When the AI analysis is performed
    Then the post should be classified as "rental_wanted" with high confidence
    And no Listing entity should be created

  Scenario: Handle ambiguous posts
    Given a post with unclear rental information
    When the AI confidence is between 60% and 80%
    Then the post should be flagged for manual review
    And stored in a review queue
    And admin should be notified about pending reviews

  Scenario: Extract price ranges
    Given a post mentions "Price: $600-800 per month"
    When the AI extracts pricing
    Then the Listing should have:
      | field         | value |
      | price_min     | 600   |
      | price_max     | 800   |
      | currency      | USD   |
      | price_period  | month |

  Scenario: Parse complex addresses
    Given a post mentions:
      """
      Location: Chavchavadze Ave 37, near University,
      5 min walk from Medical University metro
      """
    When the AI extracts location
    Then the address field should contain "Chavchavadze Ave 37"
    And landmarks should include ["University", "Medical University metro"]
    And the full text should be preserved in description

  Scenario: Identify listing updates
    Given an existing Listing from channel X with specific details
    When a new post from the same channel matches 90% of details
    Then the AI should flag it as potential update
    And link it to the existing Listing
    And update changed fields only

  Scenario: Extract amenities
    Given a post mentions various amenities:
      """
      Furnished, AC, washing machine, dishwasher,
      parking, balcony, newly renovated
      """
    When the AI processes amenities
    Then the amenities array should contain:
      | amenity              |
      | furnished           |
      | air_conditioning    |
      | washing_machine     |
      | dishwasher         |
      | parking            |
      | balcony            |
      | renovated          |

  Scenario: Handle missing required fields
    Given a post is identified as listing but lacks price information
    When the AI analysis completes
    Then the Listing should be created with status "incomplete"
    And missing_fields should list ["price"]
    And the listing should be marked for follow-up