package com.amalitech.qa.tests.nav;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.pages.HomePage;
import com.amalitech.qa.pages.LoginPage;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.openqa.selenium.By;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Navigation")
@Feature("Navbar and Links")
public class NavigationTests extends BaseTest {
    private LoginPage loginPage;
    private HomePage homePage;

    static Stream<Map<String, Object>> navDataProvider() throws IOException {
        String path = "src/test/resources/data/nav/nav_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("navDataProvider")
    @Severity(SeverityLevel.NORMAL)
    @Description("Verifying navigation between different pages of the application.")
    public void verifying_that_when_user_navigates_through_links(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String startUrl = (String) testData.get("startUrl");
        String expectedUrl = (String) testData.get("expectedUrl");
        String clickElement = (String) testData.get("clickElement");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        homePage = new HomePage(driver);
        loginPage = new LoginPage(driver);
        
        if ("TC-NAV-002".equals(id)) {
            navigateTo("/login");
            loginPage.login("user@amalitech.com", "password123");
            
            // Consider login successful when dashboard UI is visible, not when URL changes.
            waitForAuthenticated();
        }
        
        navigateTo(startUrl);

        if ("TC-NAV-001".equals(id)) {
            homePage.clickLogo();
        } else if (clickElement != null) {
            driver.findElement(By.xpath("//button[contains(., '" + clickElement + "')]")).click();
        }

        String actualUrl = driver.getCurrentUrl();
        assertTrue(actualUrl.endsWith(expectedUrl) || actualUrl.contains(expectedUrl), 
            "Actual Result: User was not at " + expectedUrl + ". Currently at: " + actualUrl);
    }
}
