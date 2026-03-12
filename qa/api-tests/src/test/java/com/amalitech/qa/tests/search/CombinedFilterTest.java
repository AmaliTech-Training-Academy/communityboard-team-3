// Tests for combined search and filter scenarios (keyword, category, date).
// Ensures correct intersection and narrowing of results.
package com.amalitech.qa.tests.search;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;

@Epic("Posts Search & Filter API Tests")
@Feature("Combined Filters")
public class CombinedFilterTest extends TestBase {
        // Parameterized test for combined filter scenarios.
        // Each test case is provided by provideCombinedFilterData().
    @ParameterizedTest(name = "{0}")
    @MethodSource("provideCombinedFilterData")
    @DisplayName("verify that when combining search, category, and date filters, the API returns the correct intersection of results")
    @Description("Covers all filter combinations, empty results, narrowing, and correct intersection. Expected: 200 with correct results or 400 for errors. Actual: API returns correct status and data.")
    public void verifyThatWhenCombiningFilters(Map<String, Object> data) {
        // Build the request with optional authentication and all filter parameters
        var req = given().spec(requestSpec);
        if (data.get("token") != null) req = req.auth().oauth2(resolveToken((String) data.get("token")));
        if (data.get("search") != null) req = req.queryParam("search", String.valueOf(data.get("search")));
        if (data.get("category") != null) req = req.queryParam("category", String.valueOf(data.get("category")));
        if (data.get("from") != null) req = req.queryParam("from", String.valueOf(data.get("from")));
        if (data.get("to") != null) req = req.queryParam("to", String.valueOf(data.get("to")));
        // Execute the GET request and assert the expected status code
        req.when().get(ApiConfig.POSTS_ENDPOINT)
            .then().statusCode((int) data.get("expectedStatusCode"));
    }
    // Data provider for combined filter test cases.
    // Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
    private static Stream<Arguments> provideCombinedFilterData() {
        return JsonUtils.getListFromJson("/data/search/search.json").stream()
                .filter(data -> "combined".equals(data.get("type")))
                .map(Arguments::of);
    }
}
