package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.CreateUserRequest;
import com.ghanim.pos.entity.User;
import com.ghanim.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest req) {
        User user = User.builder()
                .name(req.getName())
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .active(true)
                .build();
        return userRepository.save(user);
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void changePassword(Long id, String currentPassword, String newPassword, boolean isOwnerChangingOther) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isOwnerChangingOther) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User changeUsername(Long id, String newUsername) {
        if (newUsername == null || newUsername.isBlank()) {
            throw new RuntimeException("Username cannot be empty");
        }
        String trimmed = newUsername.trim().toLowerCase();
        userRepository.findByUsername(trimmed).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Username already taken");
            }
        });
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(trimmed);
        return userRepository.save(user);
    }
}
