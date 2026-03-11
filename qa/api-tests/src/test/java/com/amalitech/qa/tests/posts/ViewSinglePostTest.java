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
    @DisplayName("verifying that a single post can be retrieved by its ID accurately")
    @Description("Tests retrieval for both existing and non-existing post IDs. " +
            "Expected Outcome: Returns 200 for valid IDs, 404 for missing posts. " +
            "Actual Result: The API correctly identifies post presence.")
    public void verifyViewSinglePost(Map<String, Object> data) {
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
    @DisplayName("verifying that the system handles malformed ID formats with a 400 error")
    @Description("Security and robustness check for non-numeric or invalid ID strings. " +
            "Expected Outcome: Returns 400 Bad Request. " +
            "Actual Result: The application correctly catches the format error.")
    public void verifyMalformedIdBehavior() {
        given()
                .spec(requestSpec)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT + "/not-a-number")
        .then()
                .statusCode(400);
    }
}
