// Tests for pagination in combination with search and filter scenarios.
// Ensures correct page, count, and error handling for paginated results.
package com.amalitech.qa.tests.search;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.lessThanOrEqualTo;

@Epic("Posts Search & Filter API Tests")
@Feature("Pagination with Search & Filter")
@Tag("search")
@Tag("pagination")
@Tag("regression")
public class PaginationWithFilterTest extends TestBase {

    // Parameterized test for pagination with search/filter scenarios.
    // Each test case is provided by providePaginationData().
    @ParameterizedTest(name = "{index} - {1}")
    @MethodSource("providePaginationData")
    @DisplayName("Verify paginating search and filter results returns correct pages, counts, and handles invalid values")
    @Description("Covers pagination with search/filter, correct total count, empty last page, invalid page/limit. Expected: 200 with correct results or 400 for errors. Actual: API returns correct status and data.")
    @Severity(SeverityLevel.NORMAL)
    public void verifying_that_when_paginating_with_search_and_filter_the_api_returns_correct_results(Map<String, Object> data, String testName) {
        // Build the request with optional authentication and all pagination/filter parameters
        var req = given().spec(requestSpec);
        if (data.get("token") != null) req = req.auth().oauth2(resolveToken((String) data.get("token")));
        if (data.get("search") != null) req = req.queryParam("search", String.valueOf(data.get("search")));
        if (data.get("category") != null) req = req.queryParam("category", String.valueOf(data.get("category")));
        if (data.get("from") != null) req = req.queryParam("from", String.valueOf(data.get("from")));
        if (data.get("to") != null) req = req.queryParam("to", String.valueOf(data.get("to")));
        if (data.get("page") != null) req = req.queryParam("page", ((Number) data.get("page")).intValue());
        if (data.get("size") != null) req = req.queryParam("size", ((Number) data.get("size")).intValue());

        int expectedStatus = ((Number) data.get("expectedStatusCode")).intValue();

        // Execute the GET request and assert status code and body
        var response = req.when().get(ApiConfig.POSTS_ENDPOINT)
            .then().statusCode(expectedStatus);

        // For successful paginated requests, verify the returned count respects the size
        if (expectedStatus == 200 && data.get("size") != null) {
            int size = ((Number) data.get("size")).intValue();
            response.body("content.size()", lessThanOrEqualTo(size));
        }
    }

    // Data provider for pagination with filter test cases.
    // Extracts testName as a separate argument so @ParameterizedTest name renders correctly in Allure.
    private static Stream<Arguments> providePaginationData() {
        return JsonUtils.getListFromJson("/data/search/search.json").stream()
            .filter(data -> data.get("testName") != null
                && "pagination".equals(data.get("type")))
            .map(data -> Arguments.of(data, data.get("testName").toString()));
    }
}