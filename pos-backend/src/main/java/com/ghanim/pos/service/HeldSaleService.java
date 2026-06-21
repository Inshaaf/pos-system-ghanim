package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.HoldSaleRequest;
import com.ghanim.pos.entity.HeldSale;
import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.HeldSaleRepository;
import com.ghanim.pos.repository.SalespersonRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HeldSaleService {

    private final HeldSaleRepository heldSaleRepository;
    private final SessionRepository sessionRepository;
    private final SalespersonRepository salespersonRepository;

    public HeldSale hold(HoldSaleRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        Salesperson sp = null;
        if (request.getSalespersonId() != null) {
            sp = salespersonRepository.findById(request.getSalespersonId()).orElse(null);
        }

        return heldSaleRepository.save(HeldSale.builder()
                .session(session)
                .salesperson(sp)
                .saleType(request.getSaleType())
                .customerName(request.getCustomerName())
                .items(request.getItems())
                .note(request.getNote())
                .build());
    }

    public List<HeldSale> getBySession(Long sessionId) {
        return heldSaleRepository.findBySessionId(sessionId);
    }

    public HeldSale getById(Long id) {
        return heldSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Held sale not found: " + id));
    }

    public void delete(Long id) {
        heldSaleRepository.deleteById(id);
    }
}
