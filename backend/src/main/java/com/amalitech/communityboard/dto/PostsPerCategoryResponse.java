package com.amalitech.communityboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PostsPerCategoryResponse {
    private String category;
    private Long count;
}

