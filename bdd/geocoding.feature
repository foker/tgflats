Feature: Address Geocoding
  As a system
  I want to convert addresses to geographic coordinates
  So that listings can be displayed on a map

  Background:
    Given the Google Maps Geocoding API is configured
    And the geocoding service has a valid API key
    And the rate limit is 50 requests per second

  Scenario: Geocode complete address
    Given a listing with address "Chavchavadze Avenue 37, Tbilisi, Georgia"
    When geocoding is performed
    Then the coordinates should be approximately:
      | field     | value     |
      | latitude  | 41.7107   |
      | longitude | 44.7783   |
    And the confidence score should be > 0.9
    And the formatted address should be saved

  Scenario: Geocode partial address
    Given a listing with address "Near Rustaveli Metro"
    When geocoding is performed
    Then multiple possible locations should be returned
    And the most likely match within Tbilisi should be selected
    And the confidence score should be between 0.5 and 0.9

  Scenario: Handle ambiguous locations
    Given a listing mentions "Near University"
    And there are multiple universities in Tbilisi
    When geocoding is performed
    Then all possible coordinates should be stored
    And the listing should be marked as "multiple_locations"
    And user should see a clarification request

  Scenario: Geocode with landmarks
    Given a listing mentions:
      | address_part                 | type        |
      | Saburtalo district          | district    |
      | near Carrefour              | landmark    |
      | 5 min from Medical Metro    | proximity   |
    When composite geocoding is performed
    Then the algorithm should:
      | step                          | action                           |
      | 1                            | Geocode district center          |
      | 2                            | Find Carrefour in Saburtalo     |
      | 3                            | Calculate area near Medical Metro |
      | 4                            | Find intersection of all areas   |
    And provide estimated coordinates with medium confidence

  Scenario: Cache geocoding results
    Given the address "Rustaveli Avenue 1" was previously geocoded
    When the same address appears in a new listing
    Then the cached coordinates should be used
    And no API request should be made
    And the cache hit rate should be tracked

  Scenario: Handle API failures
    Given the Geocoding API is temporarily unavailable
    When a listing needs geocoding
    Then the job should be queued for retry
    And retry with exponential backoff (1, 2, 4, 8 minutes)
    And after 5 failures, mark for manual geocoding

  Scenario: Validate coordinates within Tbilisi
    Given coordinates are returned from geocoding
    When validation is performed
    Then verify coordinates are within Tbilisi boundaries:
      | boundary    | min      | max      |
      | latitude    | 41.6300  | 41.7700  |
      | longitude   | 44.6900  | 44.9000  |
    And reject coordinates outside these boundaries
    And flag for manual review if outside but address mentions Tbilisi

  Scenario: Reverse geocoding for validation
    Given a listing has coordinates but unclear address
    When reverse geocoding is performed
    Then the address components should be extracted:
      | component      | example           |
      | street_number  | 37               |
      | street_name    | Chavchavadze Ave |
      | district       | Vake             |
      | city           | Tbilisi          |
    And the district should be verified against known districts

  Scenario: Handle Georgian address formats
    Given addresses in Georgian script:
      | georgian                  | transliterated        |
      | ჭავჭავაძის გამზირი       | Chavchavadze Avenue   |
      | რუსთაველის გამზირი       | Rustaveli Avenue      |
    When geocoding is performed
    Then both scripts should be tried
    And the best match should be selected
    And both versions should be stored for search

  Scenario: Batch geocoding optimization
    Given 100 new listings need geocoding
    When the geocoding job runs
    Then requests should be batched efficiently
    And similar addresses should be grouped
    And rate limits should be respected
    And progress should be reported