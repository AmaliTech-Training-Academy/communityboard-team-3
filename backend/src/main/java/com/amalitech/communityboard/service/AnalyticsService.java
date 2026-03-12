package com.amalitech.communityboard.service;

import com.amalitech.communityboard.dto.DailyActivityResponse;
import com.amalitech.communityboard.dto.PostsPerCategoryResponse;
import com.amalitech.communityboard.dto.SummaryResponse;
import com.amalitech.communityboard.dto.TopContributorResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
public class AnalyticsService {

    private final JdbcTemplate analyticsJdbcTemplate;

    @Value("${analytics.encryption.key}")
    private String encryptionKey;

    // Explicitly inject analytics JdbcTemplate, not the primary one
    public AnalyticsService(@Qualifier("analyticsJdbcTemplate") JdbcTemplate analyticsJdbcTemplate) {
        this.analyticsJdbcTemplate = analyticsJdbcTemplate;
    }

    // Decrypts AES-256-GCM encrypted names from analytics DB
    // IV is prepended as first 12 bytes of the decoded ciphertext
    private String decrypt(String encryptedBase64) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(encryptedBase64);
            byte[] key = HexFormat.of().parseHex(encryptionKey);

            byte[] iv = Arrays.copyOfRange(decoded, 0, 12);
            byte[] ciphertext = Arrays.copyOfRange(decoded, 12, decoded.length);

            SecretKeySpec secretKey = new SecretKeySpec(key, "AES");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));

            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            // If decryption fails, return placeholder instead of crashing
            return "Unknown User";
        }
    }
    // Returns active post count per category from pre-aggregated table
    public List<PostsPerCategoryResponse> getPostsPerCategory() {
        String sql = "SELECT category_name, active_posts FROM analytics_posts_by_category";
        return analyticsJdbcTemplate.query(sql, (rs, rowNum) ->
                new PostsPerCategoryResponse(
                        rs.getString("category_name"),
                        rs.getLong("active_posts")
                ));
    }

    // Returns daily post and comment activity for the last N days
    public List<DailyActivityResponse> getDailyActivity(int days) {
        String sql = """
                SELECT activity_date, category_name, post_count, comment_count
                FROM analytics_daily_activity
                WHERE activity_date >= CURRENT_DATE - INTERVAL '1 day' * ?
                ORDER BY activity_date ASC
                """;
        return analyticsJdbcTemplate.query(sql, (rs, rowNum) ->
                new DailyActivityResponse(
                        rs.getDate("activity_date").toString(),
                        rs.getLong("post_count")
                ), days);
    }

    // Top contributors — names, returning rank and contribution

    public List<TopContributorResponse> getTopContributors(int limit) {
        String sql = """
                 SELECT encrypted_name, posts_created, contribution_rank
                FROM analytics_top_contributors
                ORDER BY contribution_rank ASC
                LIMIT ?
                """;
        return analyticsJdbcTemplate.query(sql, (rs, rowNum) ->
                new TopContributorResponse(
                        rs.getInt("contribution_rank"),
                    decrypt(rs.getString("encrypted_name")),
                       rs.getLong("posts_created")
                ), limit);
    }
    // Returns global summary — total posts and comments across the platform
    public SummaryResponse getSummary() {
        String sql = """
            SELECT total_posts, total_comments
            FROM analytics_summary
            WHERE metric_key = 'global'
            """;
        return analyticsJdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new SummaryResponse(
                        rs.getLong("total_posts"),
                        rs.getLong("total_comments")
                ));
    }
}