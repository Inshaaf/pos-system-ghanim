package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.CreateUserRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.User;
import com.ghanim.pos.service.UserService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.createUser(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request,
            Authentication auth) {
        String callerUsername = auth.getName();
        User caller = userService.getByUsername(callerUsername);
        boolean ownerChangingOther = caller.getRole().equals("OWNER") && !caller.getId().equals(id);
        userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword(), ownerChangingOther);
        return ResponseEntity.ok(ApiResponse.ok("Password updated"));
    }

    @PatchMapping("/{id}/username")
    public ResponseEntity<ApiResponse<User>> changeUsername(
            @PathVariable Long id,
            @RequestBody ChangeUsernameRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.changeUsername(id, request.getNewUsername())));
    }

    @Data
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }

    @Data
    public static class ChangeUsernameRequest {
        private String newUsername;
    }
}
