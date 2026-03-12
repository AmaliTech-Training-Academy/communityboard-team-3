package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.model.User;

/**
 * Base service class providing reusable security checks for resource ownership.
 * Extend this class in any service that needs to verify ownership before
 * allowing mutations (e.g. PostService, CommentService).
 */
public abstract class BaseSecurityService {

    /**
     * Verifies that the current user is either the owner of the resource or an ADMIN.
     * Throws UnauthorizedException if neither condition is met.
     *
     * @param resourceOwnerId the ID of the user who owns the resource
     * @param currentUser     the currently authenticated user
     */
    protected void verifyOwnerOrAdmin(Long resourceOwnerId, User currentUser) {
        if (!resourceOwnerId.equals(currentUser.getId())
                && !currentUser.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("You do not have permission to perform this action");
        }
    }
}
