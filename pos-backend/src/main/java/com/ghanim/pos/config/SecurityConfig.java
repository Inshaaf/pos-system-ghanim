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
                        .requestMatchers(HttpMethod.GET, "/api/demand-products/suggestions")
                                .hasAnyRole("OWNER", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/demand-products").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/demand-products")
                                .hasAnyRole("OWNER", "CASHIER")
                        .requestMatchers(HttpMethod.DELETE, "/api/demand-products/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/manual-products").hasRole("OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/manual-products/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/quick-sales/*/cancel").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/app-settings/verify-manager-pin").hasRole("OWNER")
                        .requestMatchers(HttpMethod.GET, "/api/app-settings/shop-code-cipher").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/app-settings/shop-code-cipher").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/cancellation-requests").hasRole("CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/cancellation-requests").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PATCH, "/api/cancellation-requests/*/approve",
                                "/api/cancellation-requests/*/reject").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/sales/*/cancel").hasRole("OWNER")
                        .requestMatchers(HttpMethod.GET, "/api/purchase-needs")
                                .hasAnyRole("OWNER", "CASHIER", "SALESPERSON", "STORE_PERSON")
                        .requestMatchers(HttpMethod.POST, "/api/purchase-needs")
                                .hasAnyRole("OWNER", "CASHIER", "SALESPERSON", "STORE_PERSON")
                        .requestMatchers(HttpMethod.PATCH, "/api/purchase-needs/*/status",
                                "/api/purchase-needs/*/category").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PATCH, "/api/purchase-needs/*/re-request")
                                .hasAnyRole("OWNER", "SALESPERSON")
                        .requestMatchers(HttpMethod.PATCH, "/api/purchase-needs/*/store-status")
                                .hasAnyRole("OWNER", "STORE_PERSON")
                        .requestMatchers(HttpMethod.DELETE, "/api/purchase-needs/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.POST,
                                "/api/categories",
                                "/api/suppliers",
                                "/api/salespersons").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PATCH, "/api/salespersons/*/deactivate")
                                .hasAnyRole("OWNER", "CASHIER")
                        .requestMatchers(HttpMethod.PATCH, "/api/salespersons/*/activate")
                                .hasAnyRole("OWNER", "CASHIER")
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
