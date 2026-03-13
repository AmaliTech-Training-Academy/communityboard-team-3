package com.amalitech.qa.base;

import com.amalitech.qa.utils.TestFailureWatcher;
import io.github.bonigarcia.wdm.WebDriverManager;
import io.qameta.allure.Attachment;
import io.qameta.allure.Step;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.time.Duration;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(TestFailureWatcher.class)
public class BaseTest {
    protected WebDriver driver;
    protected WebDriverWait wait;
    protected static final String BASE_URL = "http://16.16.98.17:3000";

    @BeforeAll
    public void setup() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");

        driver = new ChromeDriver(options);
        // Removed implicitlyWait — conflicts with WebDriverWait/ExpectedConditions
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    @BeforeEach
    public void beforeTest() {
        if (driver != null) {
            try {
                // Navigate to the base URL first to establish domain context for storage clearing
                driver.get(BASE_URL);
                driver.manage().deleteAllCookies();
                executeScript("window.localStorage.clear();");
                executeScript("window.sessionStorage.clear();");
                // Refresh to ensure any in-memory state in the frontend is wiped
                driver.navigate().refresh();
            } catch (Exception e) {
                // Ignore if storage clearing fails (e.g. if page hasn't loaded yet)
            }
        }
    }

    @AfterEach
    public void afterTest() {
        // Here we could handle failures specifically if we used a TestWatcher,
        // but for now, we'll just ensure the state is clean.
    }

    @AfterAll
    public void teardown() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }

    @Attachment(value = "Screenshot on Failure", type = "image/png")
    public byte[] saveScreenshot() {
        if (driver == null)
            return new byte[0];
        return ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
    }

    @Step("Navigate to {url}")
    protected void navigateTo(String url) {
        driver.get(url.startsWith("http") ? url : BASE_URL + url);
    }

    @Step("Wait until user is authenticated (dashboard visible)")
    protected void waitForAuthenticated() {
        // Treat authentication as successful when either:
        // - The app navigates to the home route (BASE_URL + "/"), or
        // - Core dashboard UI elements are present (logout button or posts search bar).
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.or(
                        ExpectedConditions.urlToBe(BASE_URL + "/"),
                        ExpectedConditions.presenceOfElementLocated(
                                By.xpath("//button[contains(., 'Log out')]")),
                        ExpectedConditions.presenceOfElementLocated(
                                By.cssSelector("input[aria-label*='Search posts'], input[placeholder*='Search']"))));
    }

    protected Object executeScript(String script, Object... args) {
        return ((JavascriptExecutor) driver).executeScript(script, args);
    }
}