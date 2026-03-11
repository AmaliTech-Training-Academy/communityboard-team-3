package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.model.User;

public abstract class BaseSecurityService {

    protected void verifyOwnerOrAdmin(Long resourceOwnerId, User currentUser) {
        if (!resourceOwnerId.equals(currentUser.getId())
                && !currentUser.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("You do not have permission to perform this action");
        }
    }
}