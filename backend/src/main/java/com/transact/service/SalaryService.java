package com.transact.service;

import com.transact.domain.AppUser;
import com.transact.domain.SalaryAgreement;
import com.transact.domain.UserRole;
import com.transact.repo.AppUserRepository;
import com.transact.repo.SalaryAgreementRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SalaryService {
    private final SalaryAgreementRepository agreements;
    private final AppUserRepository users;
    private final SalaryPaymentProcessor processor;
    private final AuditService audit;

    public SalaryService(SalaryAgreementRepository agreements, AppUserRepository users,
                         SalaryPaymentProcessor processor, AuditService audit) {
        this.agreements = agreements;
        this.users = users;
        this.processor = processor;
        this.audit = audit;
    }

    @Transactional
    public SalaryAgreement create(AppUser payer, UUID recipientId, String label, BigDecimal amount, int intervalDays, Instant firstPaymentAt) {
        AppUser recipient = users.findById(recipientId).orElseThrow(() -> new BusinessRuleException("Recipient not found."));
        if (recipient.getRole() != UserRole.DEVELOPER) throw new BusinessRuleException("Salary recipient must be a developer.");
        if (recipient.getId().equals(payer.getId())) throw new BusinessRuleException("You cannot create a salary agreement with yourself.");
        if (label == null || label.isBlank()) throw new BusinessRuleException("Salary label is required.");
        if (amount == null || amount.signum() <= 0) throw new BusinessRuleException("Salary amount must be positive.");
        if (intervalDays < 1 || intervalDays > 365) throw new BusinessRuleException("Salary interval must be between 1 and 365 days.");
        Instant next = firstPaymentAt == null || firstPaymentAt.isBefore(Instant.now()) ? Instant.now() : firstPaymentAt;
        SalaryAgreement agreement = agreements.save(new SalaryAgreement(payer, recipient, label.trim(), amount, intervalDays, next));
        audit.record(payer.getEmail(), "SALARY_CREATED", "SalaryAgreement", agreement.getId().toString(), "Recurring Brain Coin direct deposit configured.");
        return agreement;
    }

    public List<SalaryAgreement> listFor(AppUser user) {
        return agreements.findByPayerIdOrRecipientIdOrderByCreatedAtDesc(user.getId(), user.getId());
    }

    @Transactional
    public SalaryAgreement deactivate(AppUser actor, UUID id) {
        SalaryAgreement agreement = agreements.findById(id).orElseThrow(() -> new BusinessRuleException("Salary agreement not found."));
        if (!agreement.getPayer().getId().equals(actor.getId())) throw new BusinessRuleException("Only the payer can deactivate a salary agreement.");
        agreement.deactivate();
        audit.record(actor.getEmail(), "SALARY_DEACTIVATED", "SalaryAgreement", id.toString(), "Recurring direct deposit stopped.");
        return agreement;
    }

    @Scheduled(fixedDelayString = "${transact.salary.scheduler-ms:60000}")
    public void runDuePayments() {
        for (SalaryAgreement agreement : agreements.findByActiveTrueAndNextPaymentAtLessThanEqual(Instant.now())) {
            processor.process(agreement.getId());
        }
    }
}
