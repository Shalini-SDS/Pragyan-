# Testing Framework for MediTriage

This document provides comprehensive guidance on running unit tests, integration tests, and end-to-end (E2E) tests for the MediTriage frontend application.

## Overview

The testing framework consists of three layers:

1. **Unit Tests** - Test individual services, utilities, and components
2. **Integration Tests** - Test multiple components working together
3. **E2E Tests** - Test complete user flows and critical workflows

## Setup

### Install Dependencies

```bash
npm install
```

### Configuration Files

- `jest.config.js` - Jest configuration for unit/integration tests
- `cypress.config.ts` - Cypress configuration for E2E tests
- `src/__tests__/setup.ts` - Test environment setup
- `src/__tests__/mocks.ts` - Mock data and utilities for testing

## Running Tests

### Unit Tests

Run unit tests in watch mode (auto-rerun on file changes):

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

Run tests in CI mode (single run, no watch):

```bash
npm run test:ci
```

### E2E Tests

Open Cypress interactive test runner:

```bash
npm run e2e
```

Run E2E tests in headless mode (CI):

```bash
npm run e2e:ci
```

## Test Structure

### Unit Tests

Located in `src/app/services/` and `src/app/context/` directories with `.test.ts` or `.test.tsx` extensions.

#### Example Test Files:

- **PatientService.test.ts** - Tests for patient data service
  - ✅ `getPatients()` - Fetching patient list
  - ✅ `getPatientById()` - Fetching single patient
  - ✅ `createPatient()` - Creating new patient
  - ✅ `updatePatient()` - Updating patient data
  - ✅ `deletePatient()` - Deleting patient
  - ✅ Authorization header injection
  - ✅ Error handling

- **AuthContext.test.tsx** - Tests for authentication context
  - ✅ Initial auth state
  - ✅ Login flow with token storage
  - ✅ Logout functionality
  - ✅ Error handling for invalid credentials
  - ✅ Token persistence in localStorage

- **TriageService.test.ts** - Tests for triage prediction service
  - ✅ Triage form submission
  - ✅ Risk prediction response handling
  - ✅ History retrieval
  - ✅ ML model integration

- **DoctorsPage.test.tsx** - Tests for doctors list component
  - ✅ Loading state
  - ✅ Data display after loading
  - ✅ Error handling
  - ✅ Search and filtering
  - ✅ Statistics cards
  - ✅ API service integration

### E2E Tests

Located in `cypress/e2e/` directory with `.cy.ts` extensions.

#### Test Suites:

1. **auth.cy.ts** - Authentication and login flows
   - Home page rendering
   - Hospital selection
   - Staff ID and password entry
   - Invalid credentials handling
   - Login persistence
   - Logout functionality

2. **doctors.cy.ts** - Doctors page interactions
   - List loading
   - Statistics display
   - Search and filtering
   - No results handling
   - Card navigation
   - Performance testing
   - Rapid filtering

3. **triage.cy.ts** - Patient triage workflow
   - Form loading
   - Complete form submission
   - Risk assessment display
   - Validation
   - Save functionality
   - Print feature

4. **hospital-overview.cy.ts** - Hospital dashboard
   - Metrics display
   - Chart rendering
   - Status indicators
   - Real-time updates
   - Error handling
   - Retry functionality

## Mock Data

Mock data is centralized in `src/__tests__/mocks.ts` for consistency across tests:

```typescript
// Available mocks
mockDoctor
mockDoctorList
mockPatient
mockPatientList
mockNurse
mockNurseList
mockHospitalOverview
mockTriagePrediction
mockAuthToken
```

## API Mocking

Tests mock API calls using Jest's `jest.fn()` and Cypress's `cy.intercept()`:

### Jest/Unit Tests:
```typescript
const mockFetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: async () => mockData,
});
global.fetch = mockFetch;
```

### Cypress/E2E Tests:
```typescript
cy.intercept('GET', '/api/doctors', { fixture: 'doctors' });
```

## Critical Test Coverage

### Priority 1 (Essential):
- ✅ Login/Logout flow
- ✅ Patient triage form submission
- ✅ API service CRUD operations
- ✅ Error handling
- ✅ Authorization header injection

### Priority 2 (Important):
- ✅ Page navigation
- ✅ Data filtering and search
- ✅ Loading states
- ✅ Form validation

### Priority 3 (Nice to Have):
- ✅ Performance testing
- ✅ Accessibility checks
- ✅ Visual regression tests

## Best Practices

### Writing Tests

1. **Use descriptive names**
   ```typescript
   it('should fetch patients and display them in list', () => {...})
   ```

2. **Follow AAA pattern (Arrange, Act, Assert)**
   ```typescript
   // Arrange
   const mockData = {...};
   
   // Act
   const result = await service.getData();
   
   // Assert
   expect(result).toEqual(mockData);
   ```

3. **Test behavior, not implementation**
   ```typescript
   // Good
   expect(screen.getByText('Loading')).toBeInTheDocument();
   
   // Bad
   expect(component.state.isLoading).toBe(true);
   ```

4. **Mock external dependencies**
   ```typescript
   jest.mock('./apiClient');
   ```

### Debugging Tests

```bash
# Run single test file
npm test -- PatientService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should fetch"

# Debug mode with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Cypress debug
DEBUG=cypress:* npm run e2e
```

### CI/CD Integration

```bash
# Run all tests for CI pipeline
npm run test:ci
npm run e2e:ci

# With coverage requirements
npm run test:coverage -- --coverageThreshold='
{
  "global": {
    "branches": 70,
    "functions": 70,
    "lines": 70,
    "statements": 70
  }
}
'
```

## Troubleshooting

### Jest Issues

**Module not found:**
```bash
# Clear cache
npm test -- --clearCache
```

**Timeout errors:**
```typescript
// Increase timeout for slow tests
jest.setTimeout(10000);
```

### Cypress Issues

**Element not found:**
- Add explicit waits: `cy.visit().then(() => cy.wait(1000));`
- Use data-testid attributes for reliable selection
- Check if element is in viewport: `cy.scrollIntoView()`

**Authentication issues:**
- Verify mock API responses match expected format
- Check localStorage for token persistence
- Use network interceptors to verify requests

## Coverage Goals

- **Statements:** 70%+
- **Branches:** 65%+
- **Functions:** 70%+
- **Lines:** 70%+

## Next Steps

1. Run `npm test` to execute unit tests
2. Run `npm run e2e` to open Cypress dashboard
3. Add required data-testid attributes to components
4. Create fixtures for common test data
5. Set up CI/CD pipeline with test automation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
