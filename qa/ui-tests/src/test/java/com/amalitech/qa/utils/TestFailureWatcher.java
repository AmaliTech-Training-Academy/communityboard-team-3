package com.amalitech.qa.utils;

import com.amalitech.qa.base.BaseTest;
import io.qameta.allure.Allure;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.ByteArrayInputStream;

public class TestFailureWatcher implements TestWatcher {

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        Object testInstance = context.getRequiredTestInstance();
        if (testInstance instanceof BaseTest) {
            WebDriver driver = getDriverFromBaseTest((BaseTest) testInstance);
            if (driver != null) {
                byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                Allure.addAttachment("Failure Screenshot", new ByteArrayInputStream(screenshot));
                
                String steps = generateStepsToReproduce(context);
                Allure.addAttachment("Steps to Reproduce", steps);
            }
        }
    }

    private WebDriver getDriverFromBaseTest(BaseTest baseTest) {
        try {
            java.lang.reflect.Field field = BaseTest.class.getDeclaredField("driver");
            field.setAccessible(true);
            return (WebDriver) field.get(baseTest);
        } catch (Exception e) {
            return null;
        }
    }

    private String generateStepsToReproduce(ExtensionContext context) {
        StringBuilder steps = new StringBuilder();
        steps.append("1. Open browser\n");
        steps.append("2. Navigate to application\n");
        steps.append("3. Execute test: ").append(context.getDisplayName()).append("\n");
        steps.append("4. See failure: ").append(context.getExecutionException().map(Throwable::getMessage).orElse("Unknown error")).append("\n");
        return steps.toString();
    }
}
