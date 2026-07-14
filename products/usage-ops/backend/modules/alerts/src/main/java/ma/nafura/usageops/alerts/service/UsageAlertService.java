package ma.nafura.usageops.alerts.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.usageops.alerts.domain.UsageAlertDismissal;
import ma.nafura.usageops.alerts.domain.UsageAlertEvent;
import ma.nafura.usageops.alerts.repository.UsageAlertDismissalRepository;
import ma.nafura.usageops.alerts.repository.UsageAlertEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsageAlertService {

    private final UsageAlertEventRepository eventRepository;
    private final UsageAlertDismissalRepository dismissalRepository;

    public List<UsageAlertEvent> listEvents() {
        return eventRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<UsageAlertEvent> listActiveForUser(String userId) {
        Set<String> dismissed = dismissalRepository.findByUserId(userId).stream()
                .map(UsageAlertDismissal::getAlertKey)
                .collect(Collectors.toSet());
        return eventRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(event -> !dismissed.contains(event.getAlertKey()))
                .toList();
    }

    @Transactional
    public UsageAlertDismissal dismiss(String alertKey, String userId) {
        return dismissalRepository.findByAlertKeyAndUserId(alertKey, userId)
                .orElseGet(() -> {
                    UsageAlertDismissal dismissal = new UsageAlertDismissal();
                    dismissal.setAlertKey(alertKey);
                    dismissal.setUserId(userId);
                    return dismissalRepository.save(dismissal);
                });
    }

    public boolean alreadyFired(String alertKey, String windowKey) {
        return eventRepository.findByAlertKeyAndWindowKey(alertKey, windowKey).isPresent();
    }

    @Transactional
    public UsageAlertEvent save(UsageAlertEvent event) {
        return eventRepository.save(event);
    }

    public UsageAlertEvent requireEvent(String alertKey) {
        return eventRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(e -> alertKey.equals(e.getAlertKey()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
    }
}
