package com.ghanim.pos.config;

import com.ghanim.pos.entity.User;
import com.ghanim.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedIfMissing("Ghanim Owner",  "owner",       "owner123",       "OWNER");
        seedIfMissing("Cashier One",   "cashier",     "cashier123",     "CASHIER");
        seedIfMissing("Salesperson",   "salesperson", "salesperson123", "SALESPERSON");
        seedIfMissing("Store Person",  "storeperson", "storeperson123", "STORE_PERSON");
    }

    private void seedIfMissing(String name, String username, String password, String role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.save(User.builder()
                    .name(name)
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .active(true)
                    .build());
            log.info("Seeded user: {} ({})", username, role);
        }
    }
}
