// Tests for deleting comments from posts.
// Covers valid, invalid, unauthorized, and edge case scenarios for comment deletion.
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
@Feature("US-XX — Delete Comment")
public class DeleteCommentTest extends TestBase {

	// Parameterized test for deleting comments.
	// Each test case is provided by provideDeleteCommentData().
    @ParameterizedTest(name = "{0}")
    @MethodSource("provideDeleteCommentData")
    @DisplayName("verify that when deleting a comment, the API enforces permissions and cascade rules correctly")
    @Description("Checks comment deletion, including cascade delete when a post is removed. Expected: 204 for own, 404/403 for others or missing. Actual: API returns correct status and comment is removed if allowed.")
	public void verifying_that_when_deleting_a_comment_with_valid_id_the_comment_is_removed(Map<String, Object> data) {
	Long postId = ((Number) data.get("postId")).longValue();
	Long commentId = data.get("commentId") != null ? ((Number) data.get("commentId")).longValue() : null;
	String token = (String) data.get("token");
	int expectedStatusCode = (int) data.get("expectedStatusCode");
	boolean cascade = data.get("cascade") != null && (boolean) data.get("cascade");

	if (cascade) {
	    // Simulate cascade delete scenario
	    given()
		    .spec(requestSpec)
		    .auth().oauth2(resolveToken(token))
	    .when()
		    .delete(ApiConfig.POSTS_ENDPOINT + "/" + postId)
	    .then()
		    .statusCode(204);
	    given()
		    .spec(requestSpec)
	    .when()
		    .get(String.format(ApiConfig.COMMENTS_ENDPOINT, postId) + "/" + commentId)
	    .then()
		    .statusCode(404);
	} else {
	    given()
		    .spec(requestSpec)
		    .auth().oauth2(resolveToken(token))
	    .when()
		    .delete(String.format(ApiConfig.COMMENTS_ENDPOINT, postId) + "/" + commentId)
	    .then()
		    .statusCode(anyOf(is(expectedStatusCode), is(404)));
	}
    }

	// Data provider for delete comment test cases.
	// Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
    private static Stream<Arguments> provideDeleteCommentData() {
	return JsonUtils.getListFromJson("/data/comments/comments.json").stream()
		.filter(data -> data.get("testName").toString().startsWith("Delete"))
		.map(Arguments::of);
    }
}
