// Tests for keyword-based search functionality on posts.
// Covers title, body, case-insensitivity, special characters, and error handling.
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
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.containsStringIgnoringCase;
import static org.hamcrest.Matchers.anyOf;

@Epic("Posts Search & Filter API Tests")
@Feature("Keyword Search")
@Tag("search")
@Tag("regression")
public class KeywordSearchTest extends TestBase {

    // Parameterized test for keyword search scenarios.
    // Each test case is provided by provideKeywordSearchData().
    @ParameterizedTest(name = "{index} - {1}")
    @MethodSource("provideKeywordSearchData")
    @DisplayName("Verify keyword search returns correct results for title, body, case, and special characters")
    @Description("Covers keyword search in title/body, case insensitivity, special chars, long strings, empty/no match, and unauthenticated. Expected: 200 with correct results or 400/401 for errors. Actual: API returns correct status and data.")
    @Severity(SeverityLevel.NORMAL)
    public void verifying_that_when_searching_by_keyword_the_api_returns_matching_results(Map<String, Object> data, String testName) {
        // Build the request with optional authentication and search parameter
        var req = given().spec(requestSpec);
        if (data.get("token") != null) req = req.auth().oauth2(resolveToken((String) data.get("token")));
        if (data.get("search") != null) req = req.queryParam("search", String.valueOf(data.get("search")));

        int expectedStatus = ((Number) data.get("expectedStatusCode")).intValue();

        // Execute the GET request and assert status code and body
        var response = req.when().get(ApiConfig.POSTS_ENDPOINT)
            .then().statusCode(expectedStatus);

        // For successful search requests with a keyword, verify results actually contain the keyword
        if (expectedStatus == 200 && data.get("search") != null) {
            String keyword = String.valueOf(data.get("search"));
            response.body("content.collect { it.title + ' ' + it.body }",
                everyItem(containsStringIgnoringCase(keyword))
            );
        }
    }

    // Data provider for keyword search test cases.
    // Extracts testName as a separate argument so @ParameterizedTest name renders correctly in Allure.
    private static Stream<Arguments> provideKeywordSearchData() {
        return JsonUtils.getListFromJson("/data/search/search.json").stream()
            .filter(data -> data.get("testName") != null
                && "keyword".equals(data.get("type")))
            .map(data -> Arguments.of(data, data.get("testName").toString()));
    }
}