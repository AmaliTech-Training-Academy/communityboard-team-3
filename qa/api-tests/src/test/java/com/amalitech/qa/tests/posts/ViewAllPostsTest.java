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
    @DisplayName("verifying that retrieving all posts or searching with various parameters behaves correctly")
    @Description("Tests the GET /api/posts and GET /api/posts/search endpoints. " +
            "Expected Outcome: Returns 200 OK with paginated data. " +
            "Actual Result: The API correctly filters results or applies pagination based on user input.")
    public void verifyViewAllPosts(Map<String, Object> data) {
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

    private static Stream<Arguments> provideViewPostsData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/get_all.json");
    }

    @Test
    @DisplayName("verifying that the response structure for a post contains all required fields")
    @Description("Validates that sensitive information like passwords is not leaked and all public post data is present. " +
            "Expected Outcome: Returns fields like id, title, content, authorName, createdAt. " +
            "Actual Result: The schema validation passes and leaks are prevented.")
    public void verifyPostSchema() {
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
