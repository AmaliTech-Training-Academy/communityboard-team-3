package com.amalitech.qa.pages;

import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PostModal {
    private WebDriverWait wait;

    @FindBy(css = "#post-title")
    private WebElement titleField;

    @FindBy(css = "#post-category button")
    private WebElement categoryDropdown;

    @FindBy(css = "#post-content")
    private WebElement contentField;

    @FindBy(xpath = "//button[contains(., 'Cancel')]")
    private WebElement cancelButton;

    public PostModal(WebDriver driver) {
        this.wait = new WebDriverWait(driver, java.time.Duration.ofSeconds(15));
        org.openqa.selenium.support.PageFactory.initElements(driver, this);
    }

    @Step("Fill post details - Title: {title}, Category: {category}, Content: {content}")
    public void fillPostDetails(String title, String category, String content) {
        // Fill like a real user; JS value injection can fail with controlled inputs.
        WebElement titleEl = wait.until(ExpectedConditions.visibilityOf(titleField));
        titleEl.clear();
        titleEl.sendKeys(title != null ? title : "");

        WebElement dropdown = wait.until(ExpectedConditions.elementToBeClickable(categoryDropdown));
        dropdown.click();

        // Wait for categories panel and click the category button inside it
        By categoryOptionLocator = By.xpath(
                "//*[@id='post-category']//button[contains(@class,'hover:bg-overlay') and contains(normalize-space(.), '" + category + "')]");
        WebElement categoryBtn = wait.until(ExpectedConditions.elementToBeClickable(categoryOptionLocator));
        categoryBtn.click();

        WebElement contentEl = wait.until(ExpectedConditions.visibilityOf(contentField));
        contentEl.clear();
        contentEl.sendKeys(content != null ? content : "");
    }

    @Step("Click submit button")
    public void submit() {
        // Scope submit to the modal form (the one that contains the post title field)
        By submitInModal = By.xpath(
                "//*[@id='post-title']/ancestor::form//button[@type='submit']");
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(submitInModal));
        btn.click();

        // Wait for either a success toast or the modal to close
        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.id("success-toast")),
                ExpectedConditions.invisibilityOfElementLocated(By.id("post-title"))));
    }

    @Step("Click cancel button")
    public void cancel() {
        cancelButton.click();
    }

}