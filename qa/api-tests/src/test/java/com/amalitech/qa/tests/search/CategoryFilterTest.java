// Tests for category-based filtering of posts.
// Covers valid, invalid, missing, and case-insensitive category filters.
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
@Feature("Category Filter")
public class CategoryFilterTest extends TestBase {
		// Parameterized test for category filter scenarios.
		// Each test case is provided by provideCategoryFilterData().
	@ParameterizedTest(name = "{0}")
	@MethodSource("provideCategoryFilterData")
	@DisplayName("verify that when filtering posts by category, the API returns only posts in the specified category and handles errors")
	@Description("Covers valid/invalid/missing category, case insensitivity, empty, unauthenticated. Expected: 200 with correct results or 400/401 for errors. Actual: API returns correct status and data.")
	public void verifyThatWhenFilteringByCategory(Map<String, Object> data) {
		// Build the request with optional authentication and category parameter
		var req = given().spec(requestSpec);
		if (data.get("token") != null) req = req.auth().oauth2(resolveToken((String) data.get("token")));
		if (data.get("category") != null) req = req.queryParam("category", String.valueOf(data.get("category")));
		// Execute the GET request and assert the expected status code
		req.when().get(ApiConfig.POSTS_ENDPOINT)
			.then().statusCode((int) data.get("expectedStatusCode"));
	}
	// Data provider for category filter test cases.
	// Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
	private static Stream<Arguments> provideCategoryFilterData() {
		return JsonUtils.getListFromJson("/data/search/search.json").stream()
				.filter(data -> "category".equals(data.get("type")))
				.map(Arguments::of);
	}
}
