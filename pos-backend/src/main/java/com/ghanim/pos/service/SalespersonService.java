package com.ghanim.pos.service;

import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.SalespersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalespersonService {

    private final SalespersonRepository salespersonRepository;

    public List<Salesperson> getAll() {
        return salespersonRepository.findAllByOrderByNameAsc();
    }

    public Salesperson create(String name) {
        return salespersonRepository.save(Salesperson.builder().name(name).build());
    }

    public Salesperson update(Long id, String name, boolean active) {
        Salesperson sp = salespersonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found: " + id));
        sp.setName(name);
        sp.setActive(active);
        return salespersonRepository.save(sp);
    }

    public Salesperson deactivate(Long id) {
        Salesperson sp = salespersonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found: " + id));
        sp.setActive(false);
        return salespersonRepository.save(sp);
    }

    public Salesperson activate(Long id) {
        Salesperson sp = salespersonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found: " + id));
        sp.setActive(true);
        return salespersonRepository.save(sp);
    }
}
