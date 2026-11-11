// ResourceNotFoundException.java
package com.libraryGames.books.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}