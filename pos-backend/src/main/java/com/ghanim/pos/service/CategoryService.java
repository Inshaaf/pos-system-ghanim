package com.ghanim.pos.service;

import com.ghanim.pos.entity.Category;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAll() {
        return categoryRepository.findByActiveTrue();
    }

    public Category create(String name) {
        Category category = Category.builder().name(name).build();
        return categoryRepository.save(category);
    }

    public Category update(Long id, String name) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        category.setName(name);
        return categoryRepository.save(category);
    }

    public Category updateSlug(Long id, String slug) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        category.setEcommerceSlug(slug == null || slug.isBlank() ? null : slug.trim());
        return categoryRepository.save(category);
    }
}
