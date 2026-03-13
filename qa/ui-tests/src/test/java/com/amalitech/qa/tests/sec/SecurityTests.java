package com.amalitech.qa.tests.sec;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.openqa.selenium.JavascriptExecutor;


import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("Security")
@Feature("Access Control")
@Tag("security")
@Tag("regression")
public class SecurityTests extends BaseTest {

    @BeforeEach
    void ensureUnauthenticated() {
        // Clear cookies and storage so every test starts with no active session.
        // Some environments can restrict direct access to localStorage/sessionStorage,
        // so swallow those errors instead of failing the test setup.
        driver.manage().deleteAllCookies();
        driver.navigate().to(BASE_URL);
        try {
            ((JavascriptExecutor) driver)
                    .executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
        } catch (Exception ignored) {
            // If storage cannot be cleared (e.g., security restrictions), continue anyway.
        }
    }


    static Stream<Arguments> secDataProvider() throws java.io.IOException {
        String path = "src/test/resources/data/sec/security_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream()
                .filter(d -> d.get("id") != null && d.get("route") != null)
                .map(d -> Arguments.of(d, d.get("description").toString()));
    }

    @ParameterizedTest(name = "{index} - {1}")
    @MethodSource("secDataProvider")
    @DisplayName("Verify that restricted routes are inaccessible to unauthenticated users")
    @Severity(SeverityLevel.BLOCKER)
    @Description("Navigates directly to each restricted route without authentication and verifies the user is denied access via redirect to login or an error page.")
    public void verifyThatSecurityIsEnforced(Map<String, Object> testData, String testName) {
        String id = String.valueOf(testData.get("id"));
        String description = String.valueOf(testData.get("description"));
        String route = String.valueOf(testData.get("route"));

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);
        Allure.parameter("Route", route);

        // Navigate directly to the restricted route as an unauthenticated user
        driver.navigate().to(BASE_URL + route);

        String currentUrl = driver.getCurrentUrl();
        String pageSource = driver.getPageSource().toLowerCase();

        boolean isDenied = currentUrl.contains("/login")
                || currentUrl.equals(BASE_URL + "/")
                || currentUrl.contains("/unauthorized")
                || pageSource.contains("not found")
                || pageSource.contains("404")
                || pageSource.contains("403")
                || pageSource.contains("access denied")
                || pageSource.contains("unauthorized");

        assertTrue(isDenied,
                String.format("[%s] User accessed restricted route '%s'. Current URL: %s", id, route, currentUrl));
    }
}

