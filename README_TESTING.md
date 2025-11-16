# Testing Documentation

## Overview

This project uses a comprehensive testing stack to ensure code quality and reliability:

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Testing React components  
- **Playwright** - End-to-end testing
- **Sentry** - Production error monitoring

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific browser
npm run test:e2e -- --project=chromium

# Debug E2E tests
npm run test:e2e:debug
```

## Writing Tests

### Unit Tests

Unit tests are colocated with the code they test in `__tests__` directories:

```
src/
  hooks/
    __tests__/
      useAuth.test.ts
    useAuth.ts
  store/
    __tests__/
      useJubeeStore.test.ts
    useJubeeStore.ts
```

Example unit test:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJubeeStore } from '../useJubeeStore'

describe('useJubeeStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    expect(result.current.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(result.current.isVisible).toBe(true)
  })

  it('should update position', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.updatePosition({ x: 1, y: 2, z: 0 })
    })

    expect(result.current.position.x).toBeCloseTo(1)
  })
})
```

### E2E Tests

E2E tests are in the `e2e/` directory:

```
e2e/
  navigation.spec.ts
  parent-hub.spec.ts
  jubee-interaction.spec.ts
```

Example E2E test:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JubeeLove/);
  });

  test('should show Jubee mascot', async ({ page }) => {
    await page.goto('/');
    const jubee = page.locator('[data-testid="jubee-mascot"]');
    await expect(jubee).toBeVisible({ timeout: 5000 });
  });
});
```

## Test Utilities

### Test Setup

Global test setup is in `src/test/setup.ts` and includes:

- Mocked Supabase client
- Mocked Web APIs (IntersectionObserver, ResizeObserver, etc.)
- Global test configuration

### Custom Render

Use the custom render from `src/test/utils.tsx` for React component tests:

```typescript
import { render, screen } from '@/test/utils'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### Mocks

Reusable mocks are in `src/test/mocks/`:

```typescript
import { mockSupabaseClient, createMockSession } from '@/test/mocks/supabase'

// Use in tests
mockSupabaseClient.auth.getSession.mockResolvedValue({
  data: { session: createMockSession() },
  error: null,
})
```

## Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

View the HTML report at `coverage/index.html`

Coverage targets:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## CI Integration

Tests run automatically in CI on:
- Every push to main
- Every pull request

See `.github/workflows/ci.yml` for configuration.

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test useAuth.test.ts

# Debug with VS Code
# Add breakpoint and use "JavaScript Debug Terminal"
```

### E2E Tests

```bash
# Run with headed browser
npm run test:e2e:headed

# Debug with Playwright Inspector
npm run test:e2e:debug

# Run specific test
npm run test:e2e navigation.spec.ts
```

## Best Practices

1. **Test Behavior, Not Implementation** - Focus on what users see and do
2. **Use Testing Library Queries** - Prefer semantic queries (getByRole, getByLabelText)
3. **Avoid Implementation Details** - Don't test internal state or private methods
4. **Write Descriptive Test Names** - "should [expected behavior] when [condition]"
5. **Keep Tests Isolated** - Each test should be independent
6. **Mock External Dependencies** - Supabase, APIs, etc.
7. **Test Edge Cases** - Loading states, errors, empty states
8. **Use Data Test IDs Sparingly** - Only when semantic queries aren't possible

## Error Monitoring

Production errors are tracked with Sentry. To test locally:

1. Add `VITE_SENTRY_DSN` to `.env`
2. Trigger an error in the app
3. Check Sentry dashboard for report

User feedback is collected via the FeedbackWidget component.

## Progressive TypeScript Strict Mode

To enable strict mode checking:

```bash
# Check with strict mode
npx tsc --project tsconfig.strict.json --noEmit
```

Gradually migrate files to strict mode by fixing errors in `tsconfig.strict.json`.
