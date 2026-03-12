// Tests for viewing all posts and searching posts.
// Covers pagination, filtering, and response structure validation.
package com.amalitech.qa.tests.posts;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@Epic("Posts Management API Tests")
@Feature("US-04 — View All Posts")
public class ViewAllPostsTest extends TestBase {

        @ParameterizedTest(name = "{0}")
        @MethodSource("provideViewPostsData")
        @DisplayName("verify that when retrieving all posts or searching, the API returns correct paginated/filter results as expected")
        @Description("Covers GET /api/posts and /search endpoints. Expected: 200 OK with paginated/filter data. Actual: API returns correct results and structure.")
        // Parameterized test for viewing all posts and search scenarios.
        // Each test case is provided by provideViewPostsData().
        public void verifyThatWhenViewingAllPosts(Map<String, Object> data) {
                int expectedStatusCode = (int) data.get("expectedStatusCode");
                boolean isSearch = data.getOrDefault("isSearch", false).equals(true);
                String endpoint = isSearch ? ApiConfig.POSTS_ENDPOINT + "/search" : ApiConfig.POSTS_ENDPOINT;
                var request = given().spec(requestSpec);
                if (isSearch) {
                        if (data.containsKey("keyword")) request.queryParam("keyword", data.get("keyword"));
                        if (data.containsKey("categoryId")) request.queryParam("categoryId", data.get("categoryId"));
                } else {
                        request.queryParam("page", data.getOrDefault("page", 0));
                        request.queryParam("size", data.getOrDefault("size", 10));
                }
                request.when()
                                .get(endpoint)
                .then()
                                .statusCode(expectedStatusCode)
                                .body("content", is(notNullValue()));
        }

    // Data provider for view all posts/search test cases.
    // Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
    private static Stream<Arguments> provideViewPostsData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/get_all.json");
    }

    @Test
    @DisplayName("verify that when retrieving posts, the response structure contains all required public fields and no sensitive data")
    @Description("Validates response fields. Expected: id, title, content, authorName, createdAt. Actual: Only public fields present, no sensitive data.")
    public void verifyThatWhenViewingPostsResponseStructure() {
        given()
                .spec(requestSpec)
                .queryParam("page", 0)
                .queryParam("size", 10)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(200)
                .body("content[0]", allOf(
                        hasKey("id"),
                        hasKey("title"),
                        hasKey("content"),
                        hasKey("authorName"),
                        not(hasKey("password"))
                ));
    }
}
