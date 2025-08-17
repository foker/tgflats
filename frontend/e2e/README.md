# E2E Testing with Playwright

This directory contains end-to-end tests for the TBI-Prop application using Playwright, following BDD scenarios defined in `/bdd/`.

## Structure

```
e2e/
├── fixtures/           # Test data and utilities
│   └── test-data.ts   # Mock data and helpers
├── helpers/           # BDD helpers and utilities
│   └── bdd-helpers.ts # Step definitions mapping
├── pages/             # Page Object Model
│   ├── BasePage.ts    # Base page class
│   ├── HomePage.ts    # Home page actions
│   ├── MapPage.ts     # Map view actions
│   └── ListingDetailPage.ts # Detail page actions
├── tests/             # Test specifications
│   ├── search-filtering.spec.ts # Search & filter tests
│   ├── map-visualization.spec.ts # Map feature tests
│   └── list-view.spec.ts # List view tests
├── global-setup.ts    # Test environment setup
└── global-teardown.ts # Test environment cleanup
```

## Running Tests

### Prerequisites

1. Install Playwright browsers:
```bash
npm run e2e:install
```

2. Ensure backend is running:
```bash
cd ../backend && npm run start:dev
```

### Test Commands

```bash
# Run all E2E tests
npm run e2e

# Run tests in headed mode (see browser)
npm run e2e:headed

# Debug tests interactively
npm run e2e:debug

# Open Playwright UI
npm run e2e:ui

# Run specific test suite
npm run e2e:search  # Search and filtering tests
npm run e2e:map     # Map visualization tests
npm run e2e:list    # List view tests

# Generate and view HTML report
npm run e2e:report
```

## Writing Tests

### Page Object Model

All page interactions should go through page objects:

```typescript
import { HomePage } from '../pages/HomePage';

test('example test', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.searchListings('Vake');
});
```

### BDD Helpers

Use BDD helpers for scenario-based testing:

```typescript
import { BDDHelpers } from '../helpers/bdd-helpers';

test('BDD scenario', async ({ page }) => {
  const bdd = new BDDHelpers(page);
  
  // Given
  await bdd.givenUserIsOnMainPage();
  
  // When
  await bdd.whenUserSetsFilters({ priceRange: { min: 500, max: 1000 } });
  
  // Then
  await bdd.thenOnlyListingsMatchingFiltersShouldBeShown({ priceRange: { min: 500, max: 1000 } });
});
```

### Test Data

Use fixtures for consistent test data:

```typescript
import { testData } from '../fixtures/test-data';

test('use test data', async ({ page }) => {
  const filters = testData.filters.priceRange.midRange;
  // Use filters in test...
});
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### GitHub Actions

The workflow:
1. Sets up test environment with PostgreSQL and Redis
2. Installs dependencies and Playwright browsers
3. Runs database migrations and seeds test data
4. Executes all E2E tests
5. Uploads test reports and videos (on failure)

### Environment Variables

Required for CI:
- `OPENAI_API_KEY` (optional, uses mock if not provided)
- `TELEGRAM_BOT_TOKEN` (optional)
- `GOOGLE_MAPS_API_KEY` (optional)

## Test Coverage

### Implemented BDD Scenarios

✅ **Search and Filtering** (`/bdd/search-filtering.feature`)
- Filter by price range with currency conversion
- Filter by districts
- Filter by property characteristics
- Text search in descriptions
- Combined filters
- Sort results
- Save searches
- No results handling
- Pagination
- Quick filters

✅ **Map Visualization** (`/bdd/map-visualization.feature`)
- Display map with markers
- Cluster nearby markers
- Show listing details on click
- Dynamic clustering by zoom
- Filter markers
- Draw search area
- District boundaries
- Heat map view
- Navigate from list to map
- Mobile responsive

✅ **List View** (`/bdd/list-view.feature`)
- Display in table format
- Responsive mobile cards
- Inline preview
- Bulk actions
- Compare listings
- Quick view modal
- Infinite scroll
- Customization
- Highlight new listings
- Price changes
- Favorites management
- Export options

## Best Practices

1. **Isolation**: Each test should be independent
2. **Selectors**: Use data-testid attributes for reliable selection
3. **Waits**: Use Playwright's built-in waiting mechanisms
4. **Assertions**: Use expect() for all verifications
5. **Screenshots**: Capture on failure for debugging
6. **Performance**: Monitor test execution time

## Debugging

### Local Debugging

```bash
# Run with debug UI
npm run e2e:debug

# Run specific test with verbose output
npx playwright test search-filtering.spec.ts --debug
```

### CI Debugging

- Check uploaded artifacts for screenshots/videos
- Review HTML report for detailed failure info
- Check console logs in test output

## Performance Testing

Monitor key metrics:
- Page load time < 3s
- Time to interactive < 2s
- FPS > 30 for animations
- Memory usage stable

## Accessibility Testing

Tests include basic accessibility checks:
- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Color contrast (manual verification)

## Maintenance

### Updating Tests

When UI changes:
1. Update page objects first
2. Update affected tests
3. Run tests locally before committing
4. Update BDD scenarios if business logic changes

### Adding New Tests

1. Create BDD scenario in `/bdd/`
2. Add page object methods if needed
3. Write test following existing patterns
4. Add to appropriate test suite
5. Update this README

## Troubleshooting

### Common Issues

**Tests fail locally but pass in CI:**
- Check environment variables
- Ensure database is seeded
- Clear browser cache

**Timeout errors:**
- Increase timeout in playwright.config.ts
- Check network conditions
- Verify backend is responding

**Element not found:**
- Update selectors in page objects
- Check if element is lazy-loaded
- Verify responsive breakpoints

**Flaky tests:**
- Add explicit waits
- Check for race conditions
- Ensure proper test isolation