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
@Feature("US-07 — Delete Post")
public class DeletePostTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideDeletePostData")
    @DisplayName("verify that when deleting a post, the API enforces ownership and existence rules as expected")
    @Description("Covers post deletion for valid, non-existent, and unauthorized cases. Expected: 204 for own, 404 for missing, 403 for others. Actual: API enforces ownership and existence.")
    public void verifyThatWhenDeletingPost(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        Object postId = data.get("postId");
        if (expectedStatusCode == 204 && postId.equals(2)) {
            postId = createPost("user-token", "Delete Me", "Temporary content");
        }
        given()
                .spec(requestSpec)
                .auth().oauth2(resolveToken("user-token"))
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(expectedStatusCode);
    }

    private static Stream<Arguments> provideDeletePostData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/delete.json");
    }

        @Test
        @DisplayName("verify that when a post is deleted, it is no longer accessible")
        @Description("Confirms deletion by attempting to fetch the post. Expected: 404 after delete. Actual: Post is removed from view.")
        public void verifyThatWhenPostDeletedItIsInaccessible() {
                Long postId = createPost("user-token", "Deletable Post", "Will be gone soon");
                // ...existing code...
        given()
                .spec(requestSpec)
                .auth().oauth2(resolveToken("user-token"))
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(204);

        // Verify 404 on GET
        given()
                .spec(requestSpec)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("verifying that unauthenticated requests to delete a post are rejected")
    @Description("Security check for the deletion endpoint. " +
            "Expected Outcome: Returns 401 or 403. " +
            "Actual Result: Blocked by security filters.")
    public void verifyDeleteUnauthenticated() {
        given()
                .spec(requestSpec)
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/1")
        .then()
                .statusCode(anyOf(is(401), is(403)));
    }
}
