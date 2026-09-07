package com.transact.api;

import com.transact.service.BusinessRuleException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(BusinessRuleException.class)
    ResponseEntity<?> business(BusinessRuleException ex) {
        return ResponseEntity.badRequest().body(error("BUSINESS_RULE", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(e -> e.getField() + ": " + e.getDefaultMessage()).orElse("Validation failed.");
        return ResponseEntity.badRequest().body(error("VALIDATION", message));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<?> conflict(OptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error("CONCURRENT_UPDATE", "The record changed while you were editing it. Refresh and retry."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("INTERNAL", "Unexpected server error."));
    }

    private Map<String, Object> error(String code, String message) {
        return Map.of("code", code, "message", message, "timestamp", Instant.now().toString());
    }
}
