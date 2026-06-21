package com.ghanim.pos.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService; // ← changed ✅
    private final CorsConfig corsConfig;
    // ← removed UserRepository (not needed here anymore) ✅

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService); // ← use impl ✅
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(
                        corsConfig.corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/upload").authenticated()
                        .requestMatchers(HttpMethod.POST,
                                "/api/categories",
                                "/api/suppliers",
                                "/api/salespersons").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/products").authenticated()
                        .requestMatchers(HttpMethod.PUT,
                                "/api/products/**",
                                "/api/categories/**",
                                "/api/suppliers/**",
                                "/api/salespersons/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/products/**").hasRole("OWNER")
                        .requestMatchers("/api/reports/**").hasRole("OWNER")
                        .requestMatchers(
                                "/api/stock/adjust",
                                "/api/stock/shop",
                                "/api/stock/low",
                                "/api/stock/adjustments").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/stock-requests").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/stock-requests").hasRole("OWNER")
                        .requestMatchers("/api/stock-requests/*/approve",
                                "/api/stock-requests/*/reject").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST,
                                "/api/sessions/*/close").hasRole("OWNER")
                        .requestMatchers(HttpMethod.GET,
                                "/api/sessions", "/api/sessions/*/reconciliation").hasRole("OWNER")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}