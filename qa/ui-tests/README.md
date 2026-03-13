# UI Test Automation Framework

This folder contains the Selenium UI automation suite for the Community Board application.

## Tech Stack
- **Language**: Java 17
- **Test Framework**: JUnit 5
- **Automation Tool**: Selenium WebDriver
- **Reporting**: Allure Reports
- **Design Pattern**: Page Object Model (POM)
- **Data-Driven**: Parameterized tests using JSON data files

## Project Structure
- `src/test/java/com/amalitech/qa/base`: Base classes for setup and teardown.
- `src/test/java/com/amalitech/qa/pages`: Page Object classes for UI components.
- `src/test/java/com/amalitech/qa/tests`: Test classes categorized by features.
- `src/test/java/com/amalitech/qa/utils`: Utilities like JSON reading and Allure listeners.
- `src/test/resources/data`: JSON files containing test data for parameterized tests.

## Running Tests
To run all UI tests:
```bash
mvn test
```

To generate and view Allure Report:
```bash
mvn allure:report
mvn allure:serve
```

## Features Implemented
- **Screenshots on Failure**: Automatically captured and attached to Allure reports.
- **Detailed Steps**: Logged for every failure to aid in reproduction.
- **Naming Convention**: All tests follow the `verifying_that_when...` pattern.
- **Locators**: Primarily use IDs (proactively added to the frontend where missing).

## Categorized Tests
1. **Authentication**: Login, Logout, Valid/Invalid scenarios.
2. **Navigation**: Navbar links, Logo redirection.
3. **... (More being added)**
