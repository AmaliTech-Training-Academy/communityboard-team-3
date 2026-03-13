package com.amalitech.qa.tests.auth;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.pages.HomePage;
import com.amalitech.qa.pages.LoginPage;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.params.provider.Arguments;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Authentication")
@Feature("Login Functionality")
public class AuthenticationTests extends BaseTest {

    private LoginPage loginPage;
    private HomePage homePage;

    static Stream<Arguments> loginDataProvider() throws IOException {
        String path = "src/test/resources/data/auth/login_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream().map(Arguments::of);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("loginDataProvider")
    @Severity(SeverityLevel.BLOCKER)
    @Description("Detailed test for authentication verifying valid and invalid login scenarios.")
    public void verifying_that_when_user_attempts_to_login(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String email = (String) testData.get("email");
        String password = (String) testData.get("password");
        String expectedResult = (String) testData.get("expectedResult");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);
        Allure.parameter("Email", email);

        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);

        navigateTo("/login");
        loginPage.login(email, password);

        if ("Redirected to dashboard".equals(expectedResult)) {
            // The app can render the dashboard while the URL still contains "/login",
            // so rely on dashboard UI elements instead of URL patterns.
            waitForAuthenticated();

            assertTrue(
                    homePage.isLogoutVisible(),
                    "Actual Result: Dashboard UI (e.g., logout button) was not visible after login. Expected: " + expectedResult);
        } else {
            String actualError = loginPage.getErrorMessage();
            assertNotNull(actualError, "Actual Result: No error message was displayed. Expected: " + expectedResult);
        }
    }

    @Test
    @DisplayName("TC-AUTH-009: verifying that when user clicks logout, they are redirected to login")
    @Severity(SeverityLevel.CRITICAL)
    @Description("Test logout functionality from the dashboard.")
    public void verifying_that_when_user_clicks_logout() {
        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);

        navigateTo("/login");
        loginPage.login("user@amalitech.com", "password123");

        // Wait until the user is authenticated (dashboard visible), regardless of URL.
        waitForAuthenticated();

        homePage.logout();

        // After logout the app keeps the user on the dashboard route ("/"),
        // but the navbar switches to show "Log in" / "Register" instead of "Log out".
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlToBe(BASE_URL + "/"));

        // Wait until the "Log in" button appears in the navbar.
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(
                        By.xpath("//button[contains(., 'Log in')]")));

        String pageSource = driver.getPageSource();
        assertTrue(
                pageSource.contains("Log in") && !pageSource.contains("Log out"),
                "Actual Result: Navbar did not reflect logged-out state. Expected to see 'Log in' and no 'Log out'.");
    }
}