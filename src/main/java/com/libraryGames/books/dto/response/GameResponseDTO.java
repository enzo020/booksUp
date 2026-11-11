// GameResponseDTO.java
package com.libraryGames.books.dto.response;

public record GameResponseDTO(Long id, String title, String genre, String platform, Integer releaseYear) {}