package com.amalitech.qa.pages;

import io.qameta.allure.Step;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class HomePage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(css = "input[aria-label*='Search posts'], input[placeholder*='Search']")
    private WebElement searchInput;

    @FindBy(css = "button[aria-label='Search posts']")
    private WebElement searchButton;

    @FindBy(xpath = "//button[contains(., 'Create post')]")
    private WebElement createPostButton;

    @FindBy(css = "img[alt*='Ping']")
    private WebElement logo;

    @FindBy(xpath = "//button[contains(., 'Log out')]")
    private WebElement logoutButton;

    public HomePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    @Step("Search for keyword: {keyword}")
    public void search(String keyword) {
        wait.until(ExpectedConditions.visibilityOf(searchInput)).clear();
        searchInput.sendKeys(keyword);
        searchButton.click();
    }

    @Step("Click on Create Post button")
    public void clickCreatePost() {
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(createPostButton));
        try {
            btn.click();
        } catch (Exception e) {
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        }
    }

    @Step("Click on Logo")
    public void clickLogo() {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(logo));
        try {
            el.click();
        } catch (Exception e) {
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
    }

    @Step("Logout from application")
    public void logout() {
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(logoutButton));
        try {
            btn.click();
        } catch (Exception e) {
            // Fallback to JS click if intercepted or other issues
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        }
    }

    @Step("Get current URL")
    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    @Step("Check if logout button is visible")
    public boolean isLogoutVisible() {
        try {
            return logoutButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
