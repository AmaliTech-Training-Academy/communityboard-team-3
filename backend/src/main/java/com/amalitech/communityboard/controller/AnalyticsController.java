package com.amalitech.communityboard.controller;

import com.amalitech.communityboard.dto.DailyActivityResponse;
import com.amalitech.communityboard.dto.PostsPerCategoryResponse;
import com.amalitech.communityboard.dto.SummaryResponse;
import com.amalitech.communityboard.dto.TopContributorResponse;
import com.amalitech.communityboard.service.AnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics endpoints for the dashboard")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/posts-per-category")
    public ResponseEntity<List<PostsPerCategoryResponse>> getPostsPerCategory() {
        return ResponseEntity.ok(analyticsService.getPostsPerCategory());
    }

    @GetMapping("/daily-activity")
    public ResponseEntity<List<DailyActivityResponse>> getDailyActivity(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getDailyActivity(days));
    }

    @GetMapping("/top-contributors")
    public ResponseEntity<List<TopContributorResponse>> getTopContributors(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopContributors(limit));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }
}