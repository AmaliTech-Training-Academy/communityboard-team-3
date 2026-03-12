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
@Feature("US-05 — View Single Post")
public class ViewSinglePostTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideSinglePostData")
    @DisplayName("verify that when retrieving a single post by ID, the API returns the correct data or error as expected")
    @Description("Covers GET /api/posts/{id} for valid and invalid IDs. Expected: 200 for valid, 404 for missing. Actual: API returns correct status and data.")
    public void verifyThatWhenViewingSinglePost(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        Object postId = data.get("postId");
        given()
                .spec(requestSpec)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(expectedStatusCode);
    }

    private static Stream<Arguments> provideSinglePostData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/get_single.json");
    }

    @Test
    @DisplayName("verify that when retrieving a post with a malformed ID, the API returns a 400 error")
    @Description("Checks for non-numeric/invalid ID. Expected: 400 Bad Request. Actual: Application catches format error.")
    public void verifyThatWhenViewingPostWithMalformedId() {
        given()
                .spec(requestSpec)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT + "/not-a-number")
        .then()
                .statusCode(400);
    }
}
