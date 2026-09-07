package com.transact.service;

import com.transact.domain.AuditEvent;
import com.transact.repo.AuditEventRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) { this.repository = repository; }

    public void record(String actor, String action, String entityType, String entityId, String detail) {
        repository.save(new AuditEvent(actor, action, entityType, entityId, detail));
    }
}
