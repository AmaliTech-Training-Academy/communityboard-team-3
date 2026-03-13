package com.amalitech.qa.tests.form;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.pages.LoginPage;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Form Validation")
@Feature("Field Validations")
public class FormValidationTests extends BaseTest {

    private LoginPage loginPage;

    static Stream<Map<String, Object>> formDataProvider() throws IOException {
        String path = "src/test/resources/data/form/form_validation_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("formDataProvider")
    @Severity(SeverityLevel.CRITICAL)
    @Description("Verifying that all form fields have proper validation messages.")
    public void verifying_that_when_invalid_form_data_is_submitted(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String email = (String) testData.get("email");
        String password = (String) testData.get("password");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        loginPage = new LoginPage(driver);
        navigateTo("/login");

        if (email != null) {
            loginPage.login(email, "password123");
        } else if (password != null) {
            loginPage.login("valid@example.com", password);
        }

        String errorMessage = loginPage.getErrorMessage();
        assertNotNull(errorMessage, "Actual Result: Validation error was not displayed.");
    }
}
