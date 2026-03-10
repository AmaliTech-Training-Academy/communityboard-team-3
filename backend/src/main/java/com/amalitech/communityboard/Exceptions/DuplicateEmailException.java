package com.amalitech.communityboard.Exceptions;


public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}