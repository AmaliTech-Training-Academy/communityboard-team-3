package com.amalitech.communityboard.config;

import com.amalitech.communityboard.Exceptions.TokenExpiredException;
import com.amalitech.communityboard.model.User;
import com.amalitech.communityboard.model.UserPrincipal;
import com.amalitech.communityboard.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Optional;

/**
 * JWT authentication filter that runs once per request.
 * Extracts and validates the Bearer token from the Authorization header,
 * then sets the authenticated user in the Spring Security context.
 * <p>
 * Handles token expiry explicitly to return a clear 401 instead of a generic 403.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Skip filter if no Bearer token is present — let Spring Security handle it
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the token from the Authorization header
        String token = authHeader.substring(7);

        try {
            if (jwtService.isTokenValid(token)) {
                String email = jwtService.extractEmail(token);

                // Load user and set authentication in the security context
                // so downstream filters and controllers can access the principal

                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    UserPrincipal principal = new UserPrincipal(userOpt.get());
                    var auth = new UsernamePasswordAuthenticationToken(
                            principal, null,
                            principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }else{
                    // Token valid but user not found — reject early
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"User not found\"}");
                    return;
                }
            }
        } catch (TokenExpiredException e) {
            // Return 401 with a clear message instead of falling through to a generic 403
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"" + e.getMessage() + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}