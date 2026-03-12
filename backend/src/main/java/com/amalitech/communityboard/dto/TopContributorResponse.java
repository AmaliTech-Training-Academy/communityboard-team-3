package com.amalitech.communityboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class TopContributorResponse {
    private Integer contributionRank;
    private String username;      // "User #1", "User #2" until Ernest provides decryption
    private Long postCount;
}
