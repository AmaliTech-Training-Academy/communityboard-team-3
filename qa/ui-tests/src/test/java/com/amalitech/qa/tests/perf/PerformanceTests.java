package com.amalitech.qa.tests.perf;

import com.amalitech.qa.base.BaseTest;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Performance")
@Feature("Page Load & API Responsiveness")
public class PerformanceTests extends BaseTest {

    static Stream<Map<String, Object>> perfDataProvider() throws IOException {
        String path = "src/test/resources/data/perf/perf_data.json";
        List<Map<String, Object>> data = JsonUtils.readTestData(path);
        return data.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("perfDataProvider")
    @Severity(SeverityLevel.NORMAL)
    @Description("Verifying that the application maintains high performance under typical usage.")
    public void verifying_that_performance_metrics_are_within_limits(Map<String, Object> testData) {
        String id = (String) testData.get("id");
        String description = (String) testData.get("description");
        String url = (String) testData.get("url");
        Integer maxLoadTimeMs = (Integer) testData.get("maxLoadTimeMs");

        Allure.getLifecycle().updateTestCase(result -> result.setName(description));
        Allure.parameter("Test ID", id);

        long start = System.currentTimeMillis();
        navigateTo(url);
        long end = System.currentTimeMillis();
        long duration = end - start;

        Allure.addAttachment("Load Time", duration + " ms");
        
        if (maxLoadTimeMs != null) {
            assertTrue(duration <= maxLoadTimeMs, 
                "Actual Result: Page took " + duration + "ms to load. Expected max: " + maxLoadTimeMs + "ms");
        }
    }
}
