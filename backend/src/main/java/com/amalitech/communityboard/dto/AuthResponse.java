package com.amalitech.communityboard.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private UserData data;

    @Getter @Setter @Builder
    public static class UserData {
        private String email;
        private String name;
        private String role;
    }

}
