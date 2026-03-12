package com.amalitech.communityboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter
@AllArgsConstructor
public class DailyActivityResponse {
    private String date;
    private Long count;
}
