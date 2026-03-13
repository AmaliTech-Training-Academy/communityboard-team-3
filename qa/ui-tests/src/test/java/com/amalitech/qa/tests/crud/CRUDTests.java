package com.amalitech.qa.tests.crud;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.pages.HomePage;
import com.amalitech.qa.pages.LoginPage;
import com.amalitech.qa.pages.PostModal;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Epic("CRUD Operations")
@Feature("Post Management")
public class CRUDTests extends BaseTest {

    private LoginPage loginPage;
    private HomePage homePage;
    private PostModal postModal;

    @BeforeEach
    public void loginBeforeCrud() {
        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);
        postModal = new PostModal(driver);

        navigateTo("/login");
        loginPage.login("user@amalitech.com", "password123");

        // The dashboard can load without the URL changing away from "/login",
        // so consider login successful when dashboard UI becomes visible.
        waitForAuthenticated();
    }

    static Stream<Map<String, Object>> crudDataProvider() throws IOException {
        String path = "src/test/resources/data/crud/crud_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("crudDataProvider")
    @Severity(SeverityLevel.CRITICAL)
    @Description("Verifying that users can Create, Read, Update, and Delete posts.")
    public void verifying_that_when_user_manages_posts(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String title = (String) testData.get("title");
        String category = (String) testData.get("category");
        String content = (String) testData.get("content");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        if ("TC-CRUD-001".equals(id)) {
            homePage.clickCreatePost();
            postModal.fillPostDetails(title, category, content);
            postModal.submit();

            // `postModal.submit()` already waits for success toast or modal close.
            // Now navigate home and wait for the new post to appear in the list.
            navigateTo("/");
            new WebDriverWait(driver, Duration.ofSeconds(30))
                    .until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), title));

            assertTrue(
                    driver.getPageSource().contains(title),
                    "Actual Result: Post title '" + title + "' was not found on the page.");
        }
    }
}