package com.blanner.blan;

import com.blanner.dto.CreateBlanRequest;
import com.blanner.dto.ReactionResponse;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/blans")
@RequiredArgsConstructor
@Tag(name = "Blans", description = "Blan management endpoints")
public class BlanController {
    
    private final BlanService blanService;
    
    @GetMapping("/feed")
    @Operation(summary = "Get blans feed", description = "Retrieve paginated feed of blans with user-contextualized data (reactions, participation, distance)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feed retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<BlanFeedItemDto>> getFeed(
            @RequestParam UUID userId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("[GET FEED] Received request for userId: {}, lat: {}, lng: {}, page: {}, size: {}", 
                userId, lat, lng, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<BlanFeedItemDto> feed = blanService.getFeed(userId, lat, lng, pageable);
        return ResponseEntity.ok(feed);
    }
    
    @GetMapping("/created")
    @Operation(summary = "Get created blans", description = "Retrieve paginated list of blans created by the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Created blans retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<BlanFeedItemDto>> getCreatedBlans(
            @RequestParam UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("[GET CREATED BLANS] Received request for userId: {}, page: {}, size: {}", 
                userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<BlanFeedItemDto> createdBlans = blanService.getCreatedBlans(userId, pageable);
        return ResponseEntity.ok(createdBlans);
    }
    
    @GetMapping("/participating")
    @Operation(summary = "Get participating blans", description = "Retrieve paginated list of blans where the user is participating (status: ACCEPTED)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Participating blans retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<BlanFeedItemDto>> getParticipatingBlans(
            @RequestParam UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("[GET PARTICIPATING BLANS] Received request for userId: {}, page: {}, size: {}", 
                userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<BlanFeedItemDto> participatingBlans = blanService.getParticipatingBlans(userId, pageable);
        return ResponseEntity.ok(participatingBlans);
    }
    
    @GetMapping("/requests")
    @Operation(summary = "Get requested blans", description = "Retrieve paginated list of blans created by the user that have pending requests from other users (status: REQUESTED)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Requested blans retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<BlanFeedItemDto>> getRequestedBlans(
            @RequestParam UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("[GET REQUESTED BLANS] Received request for userId: {}, page: {}, size: {}", 
                userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<BlanFeedItemDto> requestedBlans = blanService.getRequestedBlans(userId, pageable);
        return ResponseEntity.ok(requestedBlans);
    }

    
    @PostMapping
    @Operation(summary = "Create a new blan", description = "Create a new social planning event (blan)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Blan created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<BlanDto> createBlan(@Valid @RequestBody CreateBlanRequest request) {
        log.info("[CREATE BLAN] Received request to create blan");
        BlanDto createdBlan = blanService.createBlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBlan);
    }
    
    @PostMapping("/{id}/like")
    @Operation(summary = "Toggle like on a blan", description = "Like or unlike a blan. Returns updated userLiked status and like count")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Like toggled successfully"),
            @ApiResponse(responseCode = "404", description = "Blan not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ReactionResponse> toggleLike(@PathVariable UUID id) {
        log.info("[TOGGLE LIKE] Received request to toggle like for blan id: {}", id);
        ReactionResponse response = blanService.toggleLike(id);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/save")
    @Operation(summary = "Toggle save on a blan", description = "Save or unsave a blan. Returns updated userSaved status and save count")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Save toggled successfully"),
            @ApiResponse(responseCode = "404", description = "Blan not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ReactionResponse> toggleSave(@PathVariable UUID id) {
        log.info("[TOGGLE SAVE] Received request to toggle save for blan id: {}", id);
        ReactionResponse response = blanService.toggleSave(id);
        return ResponseEntity.ok(response);
    }
}

