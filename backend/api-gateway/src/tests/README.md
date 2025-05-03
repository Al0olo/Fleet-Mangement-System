# API Gateway Tests

This directory contains tests for the API Gateway service.

## Structure

- **Unit Tests**: `src/tests/unit/` - Tests individual modules in isolation
- **Integration Tests**: `src/tests/integration/` - Tests API endpoints 

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run tests for CI with JUnit reporter
npm run test:ci
```

## Test Environment

For integration tests, you'll need:

1. Create a `.env.test` file in the root directory with:
   ```
   NODE_ENV=test
   PORT=8081
   LOG_LEVEL=error
   VEHICLE_SERVICE_URL=http://localhost:3000
   ENABLE_GLOBAL_RATE_LIMIT=false
   SERVER_TIMEOUT=5000
   ```

2. Make sure the test database is configured correctly if applicable

## Writing Tests

### Unit Tests

Unit tests should:
- Test a single function or module
- Mock all dependencies
- Be fast and deterministic

Example:
```typescript
import { myFunction } from '../../module';

describe('My Function', () => {
  test('should do something specific', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Tests

Integration tests should:
- Test API endpoints
- Verify HTTP status codes and response format
- Test error conditions

Example:
```typescript
import request from 'supertest';
import { app } from '../../server';

describe('API Endpoints', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});
```

## CI/CD Integration

These tests are automatically run as part of the GitHub Actions workflow in `.github/workflows/api-gateway-ci.yml`.

The workflow:
1. Runs linting
2. Builds the TypeScript code
3. Runs tests with coverage
4. Uploads test results and coverage reports as artifacts 