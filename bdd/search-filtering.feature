Feature: Search and Filtering
  As a rental seeker
  I want to search and filter listings
  So that I can find properties matching my requirements

  Background:
    Given the database contains 500 active listings
    And listings have various prices, sizes, and locations

  Scenario: Filter by price range
    Given a user sets price filter:
      | min_price | max_price | currency |
      | 500       | 1000      | USD      |
    When the search is performed
    Then only listings with price between $500-$1000 should be shown
    And prices in other currencies should be converted using current rates
    And the result count should be displayed

  Scenario: Filter by district
    Given a user selects districts:
      | district    |
      | Vake       |
      | Saburtalo  |
      | Vera       |
    When the search is performed
    Then only listings in selected districts should be shown
    And districts should be matched regardless of spelling variations

  Scenario: Filter by property characteristics
    Given a user sets filters:
      | filter          | value        |
      | bedrooms        | 2-3          |
      | area_sqm        | 60-100       |
      | pets_allowed    | true         |
      | furnished       | true         |
    When the search is performed
    Then only matching listings should be shown
    And each listing should match ALL criteria

  Scenario: Text search in descriptions
    Given a user searches for "near metro"
    When the search is performed
    Then listings mentioning metro proximity should be returned
    And results should be ranked by relevance
    And search should work across multiple languages

  Scenario: Combined filters
    Given a user applies multiple filters:
      | filter_type     | value                |
      | price          | $400-$700           |
      | district       | Vake, Saburtalo     |
      | bedrooms       | 2                   |
      | text_search    | "newly renovated"   |
    When the search is performed
    Then results should match ALL filter criteria
    And the most relevant should appear first

  Scenario: Sort search results
    Given search results are displayed
    When user selects sort option:
      | sort_by              | order      |
      | price               | ascending  |
      | area                | descending |
      | date_posted         | newest     |
      | distance_from_point | nearest    |
    Then results should be reordered accordingly
    And sort preference should be saved for session

  Scenario: Save search preferences
    Given a user performs a search with specific filters
    When the user clicks "Save Search"
    Then the search criteria should be saved
    And user should be able to:
      | action                    |
      | Name the saved search    |
      | Set up email alerts      |
      | Quick-access saved search |

  Scenario: No results handling
    Given a search with very restrictive filters
    When no results are found
    Then a helpful message should be shown
    And suggestions should be provided:
      | suggestion                           |
      | Expand price range                  |
      | Include nearby districts            |
      | Remove some filters                 |
      | Show similar listings               |

  Scenario: Pagination
    Given a search returns 150 results
    And page size is set to 20
    When user navigates through pages
    Then pagination should show:
      | element              | behavior                    |
      | Current page        | highlighted                 |
      | Total pages         | 8 pages                    |
      | Items per page      | configurable (10/20/50)    |
      | Navigation          | first/prev/next/last       |
    And URL should update with page parameter

  Scenario: Quick filters
    Given the search interface is displayed
    When user views quick filters
    Then popular filters should be shown as chips:
      | quick_filter           |
      | Under $500            |
      | Pet-friendly          |
      | 2+ bedrooms           |
      | Furnished             |
      | Near metro            |
    And clicking a chip should instantly apply the filter

  Scenario: Filter by availability date
    Given listings have move-in dates
    When user filters by availability:
      | filter           | value        |
      | available_from   | 2024-02-01  |
      | available_to     | 2024-02-28  |
    Then only listings available in that period should show
    And immediately available should be highlighted

  Scenario: Currency conversion in filters
    Given listings with prices in different currencies:
      | listing | price | currency |
      | A       | 800   | USD      |
      | B       | 2400  | GEL      |
      | C       | 750   | EUR      |
    When user filters for $700-$900 USD
    Then the system should:
      | action                              |
      | Convert GEL and EUR to USD         |
      | Apply filter on converted amounts  |
      | Show original price and converted  |
      | Update conversions daily           |