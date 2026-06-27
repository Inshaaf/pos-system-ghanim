package com.ghanim.pos.service;

import com.ghanim.pos.config.JwtConfig;
import com.ghanim.pos.dto.request.LoginRequest;
import com.ghanim.pos.dto.response.LoginResponse;
import com.ghanim.pos.entity.User;
import com.ghanim.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final JwtConfig jwtConfig;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtConfig.generateToken(userDetails, user.getRole(), user.getName());
        return new LoginResponse(token, user.getRole(), user.getName(), user.getId());
    }
}
