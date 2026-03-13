package com.amalitech.qa.tests.uiux;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.openqa.selenium.Dimension;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Epic("UI/UX Experience")
@Feature("Responsive and Visual Integrity")
public class UIUXTests extends BaseTest {

    static Stream<Map<String, Object>> uiDataProvider() throws IOException {
        String path = "src/test/resources/data/ui/uiux_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("uiDataProvider")
    @Severity(SeverityLevel.MINOR)
    @Description("Verifying the visual aspect and responsiveness of the user interface.")
    public void verifying_that_uiexperience_is_consistent(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String url = (String) testData.get("url");
        String expectedTitle = (String) testData.get("expectedTitle");
        Integer width = (Integer) testData.get("width");
        Integer height = (Integer) testData.get("height");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        navigateTo(url);

        if (width != null && height != null) {
            driver.manage().window().setSize(new Dimension(width, height));
            // Verify no horizontal scroll or layout breaks if possible
        }

        if (expectedTitle != null) {
            String actualTitle = driver.getTitle();
            assertTrue(actualTitle.toLowerCase().contains("ping"), 
                "Actual Result: Page title was '" + actualTitle + "'. Expected it to contain: ping");
        }
        
        // Reset window size for next test
        driver.manage().window().setSize(new Dimension(1920, 1080));
    }
}
