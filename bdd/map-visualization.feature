Feature: Map Visualization
  As a rental seeker
  I want to see listings on an interactive map
  So that I can understand property locations visually

  Background:
    Given the Google Maps JavaScript API is loaded
    And the map is centered on Tbilisi
    And 200 listings have valid coordinates

  Scenario: Display map with listings
    When the map view is loaded
    Then the map should show:
      | element                  | specification                   |
      | Center point            | Tbilisi center (41.7151, 44.8271) |
      | Initial zoom            | Level 12                        |
      | Map type               | Roadmap (default)               |
      | Controls               | Zoom, fullscreen, map type     |
    And markers should appear for each listing with coordinates

  Scenario: Cluster nearby markers
    Given multiple listings at similar locations:
      | location          | count |
      | Vake center      | 15    |
      | Saburtalo metro  | 20    |
      | Rustaveli area   | 25    |
    When the map is at zoom level 12
    Then markers should be clustered
    And clusters should show the count
    And cluster color should indicate density:
      | count    | color   |
      | 1-10     | green   |
      | 11-50    | yellow  |
      | 51+      | red     |

  Scenario: Expand cluster on click
    Given a cluster with 10 listings
    When user clicks the cluster
    Then the map should zoom in to show individual markers
    Or show a list of all listings in the cluster
    And user should be able to navigate through them

  Scenario: Show listing details on marker click
    Given a marker on the map
    When user clicks the marker
    Then an info window should appear showing:
      | field         | format                    |
      | Photo        | Thumbnail if available    |
      | Price        | Bold, with currency       |
      | Bedrooms     | Icon + count             |
      | Area         | Square meters            |
      | District     | Location name            |
      | View button  | Link to full details     |

  Scenario: Dynamic clustering based on zoom
    Given the map with clustered markers
    When user zooms in/out
    Then clusters should dynamically update:
      | zoom_level | behavior                           |
      | 10-12     | Large clusters for districts       |
      | 13-14     | Medium clusters for neighborhoods  |
      | 15-16     | Small clusters for streets        |
      | 17+       | Individual markers                |

  Scenario: Filter markers on map
    Given filters are applied:
      | filter       | value    |
      | max_price   | $800     |
      | bedrooms    | 2        |
    When the map updates
    Then only markers matching filters should be visible
    And clusters should update counts
    And map bounds should adjust to visible markers

  Scenario: Draw search area
    When user clicks "Draw search area" tool
    Then user should be able to draw a polygon on map
    And only listings within the polygon should be shown
    And the area size should be displayed (km²)
    And user can edit or clear the polygon

  Scenario: Show district boundaries
    When user toggles "Show districts" option
    Then district boundaries should be overlaid on map
    And districts should be labeled
    And have different colors or patterns
    And be semi-transparent

  Scenario: Heat map view
    When user switches to "Heat map" mode
    Then the map should show:
      | visualization            | meaning                    |
      | Red areas               | High concentration/prices  |
      | Yellow areas            | Medium concentration       |
      | Green areas             | Low concentration         |
      | Gradient transitions    | Smooth color changes      |
    And user can toggle between density and price heat maps

  Scenario: Navigate from list to map
    Given a listing in list view
    When user clicks "Show on map"
    Then the view should switch to map
    And the map should center on that listing
    And the marker should be highlighted
    And info window should open automatically

  Scenario: Mobile responsive map
    Given user accesses map on mobile device
    When the map loads
    Then it should:
      | adaptation                    |
      | Fill screen width            |
      | Larger touch targets         |
      | Simplified controls          |
      | Bottom sheet for details     |
      | Gesture support (pinch zoom) |

  Scenario: Map performance optimization
    Given 500+ markers need to be displayed
    When rendering the map
    Then optimizations should include:
      | technique                      | purpose                    |
      | Viewport-based rendering      | Show only visible markers  |
      | Marker pooling               | Reuse marker instances     |
      | Debounced updates            | Limit re-renders           |
      | Progressive loading          | Load markers in batches    |
    And frame rate should stay above 30 FPS

  Scenario: Custom map styling
    When the map loads
    Then custom styling should be applied:
      | element              | style                      |
      | Water               | Light blue                 |
      | Parks               | Soft green                 |
      | Roads               | Subtle gray                |
      | Buildings           | Light gray                 |
      | Labels              | Clear, readable font       |
    And style should match the overall app theme