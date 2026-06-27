package com.ghanim.pos.service;

import com.ghanim.pos.entity.PurchaseNeed;
import com.ghanim.pos.entity.ShopSupply;
import com.ghanim.pos.repository.PurchaseNeedRepository;
import com.ghanim.pos.repository.ShopSupplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PurchaseNeedService {

    private final PurchaseNeedRepository repo;
    private final ShopSupplyRepository supplyRepo;

    public List<PurchaseNeed> getAll() {
        return repo.findAllByOrderByStatusAscRequestedAtDesc();
    }

    public List<PurchaseNeed> search(String query) {
        return repo.searchByName(query);
    }

    public List<PurchaseNeed> getByStatus(PurchaseNeed.Status status) {
        return repo.findByStatusOrderByRequestedAtDesc(status);
    }

    @Transactional
    public PurchaseNeed create(Map<String, Object> body) {
        PurchaseNeed.PurchaseNeedBuilder builder = PurchaseNeed.builder()
                .name((String) body.get("name"))
                .requestedBy((String) body.get("requestedBy"))
                .notes((String) body.get("notes"))
                .unit((String) body.get("unit"));

        if (body.get("quantity") != null) {
            builder.quantity(new BigDecimal(body.get("quantity").toString()));
        }

        if (body.get("category") != null) {
            try { builder.category(PurchaseNeed.Category.valueOf(body.get("category").toString().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }

        if (body.get("supplyItemId") != null) {
            Long supplyId = Long.parseLong(body.get("supplyItemId").toString());
            supplyRepo.findById(supplyId).ifPresent(builder::supplyItem);
        }

        return repo.save(builder.build());
    }

    @Transactional
    public PurchaseNeed updateStatus(Long id, PurchaseNeed.Status status, String resolvedBy) {
        PurchaseNeed need = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Need not found: " + id));
        need.setStatus(status);
        if (status == PurchaseNeed.Status.PURCHASED || status == PurchaseNeed.Status.DISMISSED) {
            need.setResolvedBy(resolvedBy);
            need.setResolvedAt(LocalDateTime.now());
        }
        return repo.save(need);
    }

    @Transactional
    public PurchaseNeed updateCategory(Long id, PurchaseNeed.Category category) {
        PurchaseNeed need = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Need not found: " + id));
        need.setCategory(category);
        return repo.save(need);
    }

    @Transactional
    public PurchaseNeed reRequest(Long id, String requestedBy) {
        PurchaseNeed need = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Need not found: " + id));
        need.setStatus(PurchaseNeed.Status.NEEDED);
        need.setRequestedBy(requestedBy);
        need.setRequestedAt(LocalDateTime.now());
        need.setResolvedBy(null);
        need.setResolvedAt(null);
        return repo.save(need);
    }

    @Transactional
    public PurchaseNeed updateStoreStatus(Long id, PurchaseNeed.StoreStatus storeStatus, String markedBy) {
        PurchaseNeed need = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Need not found: " + id));
        need.setStoreStatus(storeStatus);
        need.setMarkedAvailableBy(storeStatus == PurchaseNeed.StoreStatus.AVAILABLE ? markedBy : null);
        return repo.save(need);
    }

    public List<PurchaseNeed> getStoreNeeds() {
        return repo.findByCategoryOrderByStatusAscRequestedAtDesc(PurchaseNeed.Category.STORE);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
