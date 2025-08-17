Feature: List View Display
  As a rental seeker
  I want to see listings in a structured list format
  So that I can compare properties efficiently

  Background:
    Given the user is on the main search page
    And there are 100 active listings in the database

  Scenario: Display listings in table format
    When user selects "List view"
    Then listings should be displayed in a table with columns:
      | column          | sortable | responsive_priority |
      | Photo          | no       | high               |
      | Price          | yes      | high               |
      | District       | yes      | high               |
      | Bedrooms       | yes      | medium             |
      | Area (m²)      | yes      | medium             |
      | Pet-friendly   | yes      | low                |
      | Posted date    | yes      | low                |
      | Actions        | no       | high               |

  Scenario: Responsive list on mobile
    Given user accesses list view on mobile
    When the list is displayed
    Then it should show as cards with:
      | element         | position           |
      | Photo          | Top (full width)   |
      | Price          | Top right overlay  |
      | District       | Below photo        |
      | Key details    | Icon grid          |
      | Actions        | Bottom buttons     |

  Scenario: Inline preview on hover
    Given list view on desktop
    When user hovers over a listing row
    Then a preview should appear showing:
      | content                |
      | Additional photos      |
      | Full description       |
      | Amenities list        |
      | Contact information   |
    And preview should not block other content

  Scenario: Bulk actions
    When user selects multiple listings via checkboxes
    Then bulk actions should be available:
      | action              | icon        |
      | Compare selected   | chart       |
      | Export to PDF      | download    |
      | Share collection   | share       |
      | Save to favorites  | heart       |

  Scenario: Compare listings
    Given user selects 2-4 listings
    When clicking "Compare"
    Then a comparison view should open showing:
      | aspect                | display                    |
      | Layout               | Side-by-side columns       |
      | Differences          | Highlighted               |
      | Common features      | Grouped at top            |
      | Photos              | Carousel for each         |
      | Decision helpers     | Pros/cons for each        |

  Scenario: Quick view modal
    Given a listing in the list
    When user clicks "Quick view" button
    Then a modal should open with:
      | section              | content                    |
      | Photo gallery       | All photos with navigation |
      | Key information     | Price, area, bedrooms     |
      | Description         | Full text                 |
      | Location           | Mini map                  |
      | Contact            | Phone, messenger links    |
      | Actions            | Save, share, report       |

  Scenario: Infinite scroll
    Given list view with 100 results
    When user scrolls to bottom
    Then next 20 listings should load automatically
    And a loading indicator should show
    And scroll position should be maintained
    And URL should update with current page

  Scenario: List view customization
    When user clicks "Customize columns"
    Then they can:
      | action                      |
      | Show/hide columns          |
      | Reorder columns            |
      | Set default sort           |
      | Choose compact/normal view |
    And preferences should be saved

  Scenario: Highlight new listings
    Given listings posted in last 24 hours
    When displayed in list view
    Then new listings should have:
      | indicator           | style              |
      | "NEW" badge        | Bright color       |
      | Border highlight   | Subtle animation   |
      | Sort priority      | Top when relevant  |

  Scenario: Show price changes
    Given a listing with recent price change
    When displayed in list
    Then it should show:
      | indicator              | display            |
      | Old price             | Strikethrough      |
      | New price             | Bold, colored      |
      | Change percentage     | Green/red arrow    |
      | Change date          | Tooltip            |

  Scenario: Favorite listings management
    When user clicks heart icon on a listing
    Then the listing should be:
      | action                    |
      | Added to favorites       |
      | Heart icon fills         |
      | Counter updates          |
      | Accessible in profile    |
    And user can organize favorites into collections

  Scenario: Export listings
    Given filtered list of listings
    When user clicks "Export"
    Then export options should include:
      | format    | includes                        |
      | PDF      | Photos, formatted layout        |
      | Excel    | All data in spreadsheet        |
      | CSV      | Raw data for analysis          |
      | Link     | Shareable URL with filters     |