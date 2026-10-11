package com.ghanim.pos.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ManagerPinService {

    @Value("${pos.manager.pin:1234}")
    private String managerPin;

    public void verify(String pin) {
        if (pin == null || !managerPin.equals(pin)) {
            throw new IllegalArgumentException("Incorrect manager PIN");
        }
    }
}
