package com.smartcampus.api.controller;

import com.smartcampus.api.model.CampusEvent;
import com.smartcampus.api.model.EventSquad;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.CampusEventRepository;
import com.smartcampus.api.repository.EventSquadRepository;
import com.smartcampus.api.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.smartcampus.api.event.CampusEventUpdatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class CampusEventController {

    private final CampusEventRepository eventRepository;
    private final EventSquadRepository squadRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public ResponseEntity<List<CampusEvent>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<CampusEvent> createEvent(@RequestBody CampusEvent event, @AuthenticationPrincipal User user) {
        event.setCreator(user);
        CampusEvent savedEvent = eventRepository.save(event);
        eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, savedEvent, user, "CREATED", "A new campus event has been created."));
        return ResponseEntity.ok(savedEvent);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampusEvent> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/squads")
    public ResponseEntity<List<EventSquad>> getEventSquads(@PathVariable Long id) {
        return ResponseEntity.ok(squadRepository.findByEventId(id));
    }

    @PostMapping("/{id}/squads")
    public ResponseEntity<?> createEventSquad(
            @PathVariable Long id,
            @RequestBody EventSquad squad,
            @AuthenticationPrincipal User user) {
        
        CampusEvent event = eventRepository.findById(id).orElseThrow();

        // Check if user is already in another squad for this event
        if (squadRepository.existsByEventIdAndMembersId(id, user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You are already a member of a squad for this event."));
        }

        squad.setEvent(event);
        squad.setCreator(user);
        
        if (squad.getMembers() == null) {
            squad.setMembers(new java.util.ArrayList<>());
        }
        squad.getMembers().add(user); // Creator is naturally a member
        
        EventSquad savedSquad = squadRepository.save(squad);
        eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, event, user, "SQUAD_CREATED", "A new squad has been created for the event."));
        return ResponseEntity.ok(savedSquad);
    }

    @PostMapping("/{id}/squads/{squadId}/join")
    public ResponseEntity<?> requestJoinSquad(
            @PathVariable Long id,
            @PathVariable Long squadId,
            @AuthenticationPrincipal User user) {
        
        EventSquad squad = squadRepository.findById(squadId).orElseThrow();
        
        // Check if user is already in another squad for this event
        if (squadRepository.existsByEventIdAndMembersId(id, user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You are already a member of a squad for this event."));
        }

        // Check if full
        if (squad.getMaxMembers() != null && squad.getMembers().size() >= squad.getMaxMembers()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Squad is full."));
        }
        
        if (squad.getPendingMembers() == null) {
            squad.setPendingMembers(new java.util.ArrayList<>());
        }

        if (squad.getMembers().contains(user)) {
             return ResponseEntity.badRequest().body(Map.of("message", "You are already in this squad."));
        }

        if (!squad.getPendingMembers().contains(user)) {
            squad.getPendingMembers().add(user);
            squadRepository.save(squad);
            eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, squad.getEvent(), squad.getCreator(), "JOIN_REQUESTED", user.getName() + " requested to join your squad."));
        }
        
        return ResponseEntity.ok(squad);
    }

    @PostMapping("/{id}/squads/{squadId}/approve/{userId}")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable Long id,
            @PathVariable Long squadId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        
        EventSquad squad = squadRepository.findById(squadId).orElseThrow();
        
        // Verify current user is creator
        if (!squad.getCreator().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Only the creator can approve requests."));
        }

        User userToApprove = userRepository.findById(userId).orElseThrow();

        // Check if user is already in another squad for this event
        if (squadRepository.existsByEventIdAndMembersId(id, userToApprove.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is already a member of another squad for this event."));
        }

        // Check if full
        if (squad.getMaxMembers() != null && squad.getMembers().size() >= squad.getMaxMembers()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Squad is full."));
        }

        if (squad.getPendingMembers().contains(userToApprove)) {
            squad.getPendingMembers().remove(userToApprove);
            if (!squad.getMembers().contains(userToApprove)) {
                squad.getMembers().add(userToApprove);
            }
            squadRepository.save(squad);
            eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, squad.getEvent(), userToApprove, "JOIN_APPROVED", "Your request to join the squad has been approved."));
        }
        
        return ResponseEntity.ok(squad);
    }

    @PutMapping("/{id}/squads/{squadId}")
    public ResponseEntity<?> updateEventSquad(
            @PathVariable Long id,
            @PathVariable Long squadId,
            @RequestBody EventSquad updatedSquad,
            @AuthenticationPrincipal User currentUser) {
        
        EventSquad squad = squadRepository.findById(squadId).orElseThrow();
        
        if (!squad.getCreator().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Only the creator can edit this squad."));
        }

        squad.setName(updatedSquad.getName());
        squad.setDescription(updatedSquad.getDescription());
        squad.setMaxMembers(updatedSquad.getMaxMembers());
        squad.setTargetYear(updatedSquad.getTargetYear());
        squad.setTargetSemester(updatedSquad.getTargetSemester());
        squad.setTargetMajor(updatedSquad.getTargetMajor());
        
        EventSquad savedSquad = squadRepository.save(squad);
        eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, squad.getEvent(), currentUser, "SQUAD_UPDATED", "The squad has been updated."));
        return ResponseEntity.ok(savedSquad);
    }

    @DeleteMapping("/{id}/squads/{squadId}")
    public ResponseEntity<?> deleteEventSquad(
            @PathVariable Long id,
            @PathVariable Long squadId,
            @AuthenticationPrincipal User currentUser) {
        
        EventSquad squad = squadRepository.findById(squadId).orElseThrow();
        
        if (!squad.getCreator().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Only the creator can delete this squad."));
        }

        squadRepository.delete(squad);
        eventPublisher.publishEvent(new CampusEventUpdatedEvent(this, squad.getEvent(), currentUser, "SQUAD_DELETED", "The squad has been deleted."));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/squads/{squadId}/leave")
    public ResponseEntity<?> leaveEventSquad(
            @PathVariable Long id,
            @PathVariable Long squadId,
            @AuthenticationPrincipal User currentUser) {
        
        EventSquad squad = squadRepository.findById(squadId).orElseThrow();
        
        if (squad.getCreator().getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Creator cannot leave the squad. Please delete it instead."));
        }

        if (squad.getMembers().contains(currentUser)) {
            squad.getMembers().remove(currentUser);
            squadRepository.save(squad);
        } else if (squad.getPendingMembers() != null && squad.getPendingMembers().contains(currentUser)) {
            squad.getPendingMembers().remove(currentUser);
            squadRepository.save(squad);
        }
        
        return ResponseEntity.ok().build();
    }
}
