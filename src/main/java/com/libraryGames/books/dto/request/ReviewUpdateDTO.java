// ReviewUpdateDTO.java
package com.libraryGames.books.dto.request;

import com.libraryGames.books.model.enums.GameStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Dados editáveis de uma review. O usuário e o jogo não mudam depois da criação. */
public record ReviewUpdateDTO(
    @DecimalMin(value = "0.0", message = "deve ser no mínimo 0")
    @DecimalMax(value = "10.0", message = "deve ser no máximo 10")
    Double rating,

    @Size(max = 5000, message = "deve ter no máximo 5000 caracteres")
    String comment,

    @NotNull(message = "é obrigatório")
    GameStatus status,

    @PositiveOrZero(message = "não pode ser negativo")
    Integer hoursPlayed
) {}
