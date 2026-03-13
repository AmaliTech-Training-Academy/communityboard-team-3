package com.amalitech.qa.pages;

import io.qameta.allure.Step;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class RegisterPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(id = "register-fullname")
    private WebElement fullNameField;

    @FindBy(id = "register-email")
    private WebElement emailField;

    @FindBy(id = "register-password")
    private WebElement passwordField;

    @FindBy(id = "register-confirm-password")
    private WebElement confirmPasswordField;

    @FindBy(id = "register-submit")
    private WebElement registerButton;

    public RegisterPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    @Step("Register with Name: {name}, Email: {email}")
    public void register(String name, String email, String password, String confirmPassword) {
        wait.until(ExpectedConditions.visibilityOf(fullNameField)).sendKeys(name);
        emailField.sendKeys(email);
        passwordField.sendKeys(password);
        confirmPasswordField.sendKeys(confirmPassword);
        registerButton.click();
    }
}
