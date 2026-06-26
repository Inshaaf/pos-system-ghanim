package com.ghanim.pos.service;

import com.ghanim.pos.entity.AppSetting;
import com.ghanim.pos.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShopCodeService {

    static final String SETTING_KEY = "shop_code_cipher";

    private final AppSettingRepository settingRepository;

    private Map<Character, Character> buildCipher(String key) {
        Map<Character, Character> map = new HashMap<>();
        if (key == null || key.isBlank()) return map;
        String k = key.toUpperCase().replaceAll("[^A-Z]", "");
        for (int i = 0; i < k.length() && i < 10; i++) {
            map.put(k.charAt(i), (char) ('0' + (i < 9 ? i + 1 : 0)));
        }
        return map;
    }

    public BigDecimal decode(String code) {
        if (code == null || code.isBlank()) return null;
        String cipherKey = settingRepository.findById(SETTING_KEY)
                .map(AppSetting::getValue).orElse(null);
        Map<Character, Character> cipher = buildCipher(cipherKey);
        if (cipher.isEmpty()) return null;

        StringBuilder digits = new StringBuilder();
        for (char c : code.toUpperCase().toCharArray()) {
            if (c == 'X') continue;
            Character digit = cipher.get(c);
            if (digit == null) return null;
            digits.append(digit);
        }
        return digits.isEmpty() ? null : new BigDecimal(digits.toString());
    }

    public String getCipherKey() {
        return settingRepository.findById(SETTING_KEY)
                .map(AppSetting::getValue).orElse("");
    }

    public void setCipherKey(String key) {
        settingRepository.save(new AppSetting(SETTING_KEY, key == null ? "" : key.toUpperCase()));
    }
}
