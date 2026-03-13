package com.amalitech.qa.tests.search;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.pages.HomePage;
import com.amalitech.qa.pages.LoginPage;
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

import com.amalitech.qa.pages.PostModal;

@Epic("Search & Filtering")
@Feature("Post Discovery")
public class SearchFilterTests extends BaseTest {

    private HomePage homePage;
    private LoginPage loginPage;
    private PostModal postModal;
    private String seededPostTitle;

    @BeforeEach
    public void setupSearchTest() {
        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);
        postModal = new PostModal(driver);

        navigateTo("/login");
        loginPage.login("user@amalitech.com", "password123");

        // The dashboard can load while the URL still contains "/login",
        // so use dashboard UI visibility as the signal that we're logged in.
        waitForAuthenticated();

        // Seed a unique post to ensure search has results
        seededPostTitle = "Test automation post " + System.currentTimeMillis();
        homePage.clickCreatePost();
        postModal.fillPostDetails(seededPostTitle, "Discussion", "Content for search testing");
        postModal.submit();

        // `postModal.submit()` already waits for success toast or modal close.
        // Always navigate home so the seeded post appears in the list.
        navigateTo("/");

        new WebDriverWait(driver, Duration.ofSeconds(30))
                .until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), seededPostTitle));
    }

    static Stream<Map<String, Object>> searchDataProvider() throws IOException {
        String path = "src/test/resources/data/search/search_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("searchDataProvider")
    @Severity(SeverityLevel.NORMAL)
    @Description("Verifying search and filter capabilities for finding posts.")
    public void verifying_that_when_user_searches_for_items(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String keyword = (String) testData.get("keyword");
        String expectedResult = (String) testData.get("expectedResult");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        homePage = new HomePage(driver);
        navigateTo("/");

        homePage.search(keyword);

        if ("Matching results displayed".equals(expectedResult)) {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.presenceOfElementLocated(
                            By.xpath("//*[contains(text(), '" + keyword + "')] | //article")));
            assertFalse(
                    driver.getPageSource().contains("No posts match your filters"),
                    "Search results should be visible for: " + keyword);
        } else {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.presenceOfElementLocated(
                            By.xpath(
                                    "//*[contains(text(), 'No posts match your filters') or contains(text(), 'No posts have been made yet')]")));
            assertTrue(
                    driver.getPageSource().contains("No posts match your filters") ||
                            driver.getPageSource().contains("No posts have been made yet"),
                    "Actual Result: Empty state was not shown for nonexistent item: " + keyword);
        }
    }
}