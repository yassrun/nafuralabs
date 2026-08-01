package com.blanner.categories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByActiveTrueOrderByOrderIndexAsc();
    boolean existsById(String id);
    long count();
    java.util.Optional<Category> findByName(String name);
}

