package com.blanner.repository;

import com.blanner.model.entity.PlaceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlaceTypeRepository extends JpaRepository<PlaceType, UUID> {
    List<PlaceType> findByIsActiveTrue();
}
