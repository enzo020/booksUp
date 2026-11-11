// UserRequestDTO.java
package com.libraryGames.books.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequestDTO(
    @NotBlank(message = "é obrigatório")
    @Size(max = 100, message = "deve ter no máximo 100 caracteres")
    String name,

    @NotBlank(message = "é obrigatório")
    @Email(message = "deve ser um e-mail válido")
    @Size(max = 100, message = "deve ter no máximo 100 caracteres")
    String email,

    @Size(max = 255, message = "deve ter no máximo 255 caracteres")
    String bio
) {}
