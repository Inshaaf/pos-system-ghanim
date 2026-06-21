package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.TempWorker;
import com.ghanim.pos.repository.TempWorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/temp-workers")
@RequiredArgsConstructor
public class TempWorkerController {

    private final TempWorkerRepository repo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TempWorker>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByActiveTrue()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TempWorker>> create(@RequestBody Map<String, String> body) {
        TempWorker tw = repo.save(TempWorker.builder().name(body.get("name")).build());
        return ResponseEntity.ok(ApiResponse.ok(tw, "Created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TempWorker>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        TempWorker tw = repo.findById(id).orElseThrow();
        if (body.containsKey("name")) tw.setName((String) body.get("name"));
        if (body.containsKey("active")) tw.setActive((Boolean) body.get("active"));
        return ResponseEntity.ok(ApiResponse.ok(repo.save(tw)));
    }
}
