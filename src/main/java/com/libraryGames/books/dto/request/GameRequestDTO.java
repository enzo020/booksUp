// GameRequestDTO.java
package com.libraryGames.books.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GameRequestDTO(
    @NotBlank(message = "é obrigatório")
    @Size(max = 150, message = "deve ter no máximo 150 caracteres")
    String title,

    @Size(max = 100, message = "deve ter no máximo 100 caracteres")
    String genre,

    @Size(max = 100, message = "deve ter no máximo 100 caracteres")
    String platform,

    @Min(value = 1950, message = "deve ser 1950 ou posterior")
    @Max(value = 2100, message = "deve ser 2100 ou anterior")
    Integer releaseYear
) {}
