// UserService.java
package com.libraryGames.books.service;

import com.libraryGames.books.dto.request.UserRequestDTO;
import com.libraryGames.books.dto.response.UserResponseDTO;
import com.libraryGames.books.exception.ConflictException;
import com.libraryGames.books.exception.ResourceNotFoundException;
import com.libraryGames.books.model.User;
import com.libraryGames.books.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponseDTO create(UserRequestDTO dto) {
        String email = normalizeEmail(dto.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Já existe um usuário com o e-mail: " + email);
        }
        User user = new User(null, dto.name(), email, dto.bio());
        user = userRepository.save(user);
        return toDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findAll() {
        return userRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public UserResponseDTO findById(Long id) {
        return toDTO(getUser(id));
    }

    @Transactional
    public UserResponseDTO update(Long id, UserRequestDTO dto) {
        User user = getUser(id);
        String email = normalizeEmail(dto.email());
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new ConflictException("Já existe um usuário com o e-mail: " + email);
        }
        user.setName(dto.name());
        user.setEmail(email);
        user.setBio(dto.bio());
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuário não encontrado com o ID: " + id);
        }
        userRepository.deleteById(id);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT);
    }

    private UserResponseDTO toDTO(User user) {
        return new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), user.getBio());
    }
}
