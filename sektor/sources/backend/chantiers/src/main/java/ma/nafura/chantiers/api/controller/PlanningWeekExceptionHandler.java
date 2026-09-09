package ma.nafura.chantiers.api.controller;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice(assignableTypes=PlanningWeekController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PlanningWeekExceptionHandler {
    @ExceptionHandler({OptimisticLockingFailureException.class,CannotSerializeTransactionException.class,DataIntegrityViolationException.class})
    public ResponseEntity<Map<String,String>> concurrent(RuntimeException error){
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","La semaine a été modifiée simultanément. Actualisez avant de recommencer."));
    }
}
