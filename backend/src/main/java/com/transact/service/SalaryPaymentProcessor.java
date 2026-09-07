package com.transact.service;

import com.transact.domain.SalaryAgreement;
import com.transact.domain.TransactionType;
import com.transact.repo.SalaryAgreementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SalaryPaymentProcessor {
    private final SalaryAgreementRepository agreements;
    private final LedgerService ledger;
    private final AuditService audit;

    public SalaryPaymentProcessor(SalaryAgreementRepository agreements, LedgerService ledger, AuditService audit) {
        this.agreements = agreements;
        this.ledger = ledger;
        this.audit = audit;
    }

    @Transactional
    public void process(UUID id) {
        SalaryAgreement agreement = agreements.findLockedById(id).orElse(null);
        if (agreement == null || !agreement.isActive() || agreement.getNextPaymentAt().isAfter(Instant.now())) return;
        try {
            ledger.transfer(agreement.getPayer(), agreement.getRecipient(), agreement.getAmount(),
                    TransactionType.SALARY_DIRECT_DEPOSIT, "SalaryAgreement", id.toString(), agreement.getLabel());
            agreement.recordSuccess();
            audit.record("system", "SALARY_DEPOSIT", "SalaryAgreement", id.toString(), "Scheduled Brain Coin salary deposited.");
        } catch (BusinessRuleException ex) {
            agreement.recordFailure(ex.getMessage());
            audit.record("system", "SALARY_DEPOSIT_FAILED", "SalaryAgreement", id.toString(), ex.getMessage());
        }
    }
}
