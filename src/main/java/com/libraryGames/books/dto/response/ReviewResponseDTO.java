// ReviewResponseDTO.java
package com.libraryGames.books.dto.response;

import com.libraryGames.books.model.enums.GameStatus;
import java.time.LocalDateTime;

public record ReviewResponseDTO(
    Long id,
    Long userId,
    String userName,
    Long gameId,
    String gameTitle,
    Double rating,
    String comment,
    GameStatus status,
    Integer hoursPlayed,
    LocalDateTime createdAt
) {}