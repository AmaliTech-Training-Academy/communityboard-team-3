// Tests for updating/editing comments on posts.
// Covers valid, invalid, unauthorized, and edge case scenarios for comment updates.
package com.amalitech.qa.tests.comments;

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
import static org.hamcrest.Matchers.*;

@Epic("Comments Management API Tests")
@Feature("US-XX — Update Comment")
public class UpdateCommentTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideUpdateCommentData")
    @DisplayName("verify that when updating a comment with various data sets, the API behaves as expected")
    @Description("Validates the update comment functionality for different scenarios. Expected: 200 for valid, 400/403 for invalid or unauthorized. Actual: API returns correct status and updates content if allowed.")
    // Parameterized test for updating comments.
    // Each test case is provided by provideUpdateCommentData().
        public void verifying_that_when_updating_a_comment_with_valid_data_the_comment_is_updated(Map<String, Object> data) {
        Long postId = ((Number) data.get("postId")).longValue();
        Long commentId = ((Number) data.get("commentId")).longValue();
        String token = (String) data.get("token");
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        String newContent = (String) data.get("newContent");

        given()
                .spec(requestSpec)
                .auth().oauth2(resolveToken(token))
                .body(Map.of("content", newContent))
        .when()
                .put(String.format(ApiConfig.COMMENTS_ENDPOINT, postId) + "/" + commentId)
        .then()
                .statusCode(expectedStatusCode);
    }

    // Data provider for update comment test cases.
    // Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
    private static Stream<Arguments> provideUpdateCommentData() {
        return JsonUtils.getListFromJson("/data/comments/comments.json").stream()
                .filter(data -> data.get("testName").toString().startsWith("Update"))
                .map(Arguments::of);
    }
}
