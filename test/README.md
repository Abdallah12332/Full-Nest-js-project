# Jest Testing Configuration

This directory contains the Jest testing configuration and setup files for the NestJS project.

## Files Overview

- `jest.config.ts` - Main Jest configuration file
- `setup.ts` - Global test setup file that runs before each test file
- `env-setup.ts` - Environment variable setup for tests
- `global-setup.ts` - Global setup that runs once before all tests (optional)
- `global-teardown.ts` - Global teardown that runs once after all tests (optional)
- `.jestignore` - Files and directories to ignore during testing

## Configuration Features

### Jest Configuration (`jest.config.ts`)

- **Test Environment**: Node.js environment
- **Coverage**: Comprehensive coverage reporting with thresholds
- **File Extensions**: Supports `.js`, `.json`, `.ts` files
- **Test Patterns**: Matches `*.spec.ts` files
- **Setup Files**: Automatic setup and environment configuration
- **Performance**: Optimized with caching and parallel execution
- **Timeouts**: 10-second timeout for individual tests

### Coverage Configuration

- **Thresholds**: 70% coverage for branches, functions, lines, and statements
- **Reporters**: Text, LCOV, HTML, and JSON coverage reports
- **Exclusions**: Excludes spec files, interfaces, DTOs, and entities from coverage

### Test Setup

- **Environment Variables**: Automatic setup of test environment variables
- **Global Utilities**: TestUtils class for common testing operations
- **Mocking**: Automatic mocking of external services (nodemailer)
- **Error Handling**: Global error handlers for unhandled rejections

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run tests in debug mode
npm run test:debug

# Run tests with no tests found (pass)
npm test -- --passWithNoTests
```

### Advanced Commands

```bash
# Run specific test file
npm test -- auth.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Run tests with verbose output
npm test -- --verbose

# Run tests in band (sequential)
npm test -- --runInBand

# Update snapshots
npm test -- --updateSnapshot
```

## Writing Tests

### Example Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  let repository: Repository<YourEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: getRepositoryToken(YourEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            // ... other repository methods
          },
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    repository = module.get<Repository<YourEntity>>(getRepositoryToken(YourEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const mockData = { id: '1', name: 'test' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockData);

      // Act
      const result = await service.methodName('1');

      // Assert
      expect(result).toEqual(mockData);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
```

### Test Utilities

The `TestUtils` class provides helper methods for common testing operations:

```typescript
import { TestUtils } from '../test/setup';

// Create a testing module
const module = await TestUtils.createTestingModule({
  providers: [YourService],
});

// Create an app with global pipes
const app = await TestUtils.createApp(module);

// Close the app
await TestUtils.closeApp(app);
```

## Environment Variables

Test environment variables are automatically set in `env-setup.ts`:

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key-for-testing-only`
- `Email=test@example.com`
- `password=test-password`
- `GOOGLE_CLIENT_ID=test-google-client-id`
- `GOOGLE_CLIENT_SECRET=test-google-client-secret`
- `GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback/google`
- `Pass=test-database-password`

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html` (open in browser)
- **LCOV Report**: `coverage/lcov.info` (for CI/CD)
- **JSON Report**: `coverage/coverage-final.json`
- **Text Report**: Displayed in terminal

## Best Practices

1. **Mock External Dependencies**: Always mock external services and repositories
2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **Clean Up**: Use `afterEach` to clean up mocks and state
5. **Test Edge Cases**: Test both success and failure scenarios
6. **Maintain Coverage**: Keep test coverage above the configured thresholds

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure your test files use proper TypeScript syntax
2. **Import Issues**: Check that all imports are correctly resolved
3. **Mock Issues**: Verify that mocks are properly configured
4. **Timeout Issues**: Increase timeout if tests are slow
5. **Memory Issues**: Use `--maxWorkers=1` for memory-intensive tests

### Debug Mode

Run tests in debug mode to step through code:

```bash
npm run test:debug
```

Then attach a debugger to the process (usually on port 9229).

## CI/CD Integration

For continuous integration, use these commands:

```bash
# Run tests with coverage for CI
npm run test:cov

# Run tests in band for stability
npm test -- --runInBand

# Run tests with no watch mode
npm test -- --watchAll=false
```
