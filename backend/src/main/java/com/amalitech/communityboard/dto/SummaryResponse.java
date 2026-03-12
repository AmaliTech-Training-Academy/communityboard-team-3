package com.amalitech.communityboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SummaryResponse {
    private Long totalPosts;
    private Long totalComments;
}