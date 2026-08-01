package com.blanner.controller;

import com.blanner.dto.CreateParticipationRequest;
import com.blanner.dto.ParticipationDto;
import com.blanner.service.ParticipationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/participations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Participations", description = "Participation management endpoints")
public class ParticipationController {

    private final ParticipationService participationService;

    @PostMapping
    @Operation(summary = "Create a new participation", description = "Create a new participation for a user in a blan")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Participation created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or participation already exists"),
            @ApiResponse(responseCode = "404", description = "Blan or User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ParticipationDto> createParticipation(@Valid @RequestBody CreateParticipationRequest request) {
        log.info("[CREATE PARTICIPATION] Received request to create participation");
        ParticipationDto createdParticipation = participationService.createParticipation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdParticipation);
    }
}

