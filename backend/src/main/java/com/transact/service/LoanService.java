package com.transact.service;

import com.transact.domain.*;
import com.transact.repo.LoanApplicationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class LoanService {
    private final LoanApplicationRepository loans;
    private final TrustService trust;
    private final AiReviewService reviewer;
    private final LedgerService ledger;
    private final AuditService audit;
    private final int reviewPeriodDays;

    public LoanService(LoanApplicationRepository loans, TrustService trust, AiReviewService reviewer,
                       LedgerService ledger, AuditService audit,
                       @Value("${transact.loans.review-period-days:3}") int reviewPeriodDays) {
        this.loans = loans;
        this.trust = trust;
        this.reviewer = reviewer;
        this.ledger = ledger;
        this.audit = audit;
        this.reviewPeriodDays = reviewPeriodDays;
    }

    @Transactional
    public LoanApplication apply(AppUser applicant, BigDecimal amount, String purpose, String qualifications) {
        if (amount == null || amount.signum() <= 0) throw new BusinessRuleException("Loan amount must be positive.");
        if (amount.compareTo(new BigDecimal("10000.00")) > 0) throw new BusinessRuleException("Current Brain Coin loan limit is 10,000 BC.");
        if (purpose == null || purpose.isBlank()) throw new BusinessRuleException("Loan purpose is required.");
        if (qualifications == null || qualifications.isBlank()) throw new BusinessRuleException("Qualification/context statement is required.");
        if (loans.countByApplicantIdAndStatus(applicant.getId(), LoanStatus.APPROVED) > 0) {
            throw new BusinessRuleException("An applicant cannot open a second loan while another approved loan is outstanding.");
        }

        TrustService.PaymentHistoryEvidence evidence = trust.paymentHistory(applicant);
        AiReviewService.Assessment paymentReview = reviewer.reviewPaymentHistory(evidence);
        AiReviewService.Assessment qualificationReview = reviewer.reviewQualifications(qualifications, purpose);
        Instant submitted = Instant.now();
        LoanApplication loan = loans.save(new LoanApplication(
                applicant, amount, purpose.trim(), qualifications.trim(), reviewer.providerName(),
                paymentReview.band(), paymentReview.explanation(), qualificationReview.band(), qualificationReview.explanation(),
                submitted, submitted.plus(Duration.ofDays(reviewPeriodDays))
        ));
        audit.record(applicant.getEmail(), "LOAN_APPLIED", "LoanApplication", loan.getId().toString(),
                "Application entered mandatory " + reviewPeriodDays + "-day administrator review window.");
        return loan;
    }

    @Transactional
    public LoanApplication approve(AppUser admin, UUID id, String notes) {
        LoanApplication loan = require(id);
        requireReviewable(loan);
        if (Instant.now().isBefore(loan.getAdminReviewDueAt())) {
            throw new BusinessRuleException("The mandatory administrator review period has not finished yet.");
        }
        Account treasury = ledger.systemAccount("Brain Coin Treasury");
        Account applicant = ledger.accountFor(loan.getApplicant());
        ledger.transfer(treasury, applicant, loan.getAmount(), TransactionType.LOAN_DISBURSEMENT,
                "LoanApplication", id.toString(), "Brain Coin loan disbursement");
        loan.approve(notes == null ? "Approved after administrator review." : notes.trim(), Instant.now().plus(Duration.ofDays(30)));
        audit.record(admin.getEmail(), "LOAN_APPROVED", "LoanApplication", id.toString(), "Human administrator approved and disbursed the loan.");
        return loan;
    }

    @Transactional
    public LoanApplication reject(AppUser admin, UUID id, String notes) {
        LoanApplication loan = require(id);
        requireReviewable(loan);
        if (Instant.now().isBefore(loan.getAdminReviewDueAt())) {
            throw new BusinessRuleException("The mandatory administrator review period has not finished yet.");
        }
        loan.reject(notes == null || notes.isBlank() ? "Rejected after administrator review." : notes.trim());
        audit.record(admin.getEmail(), "LOAN_REJECTED", "LoanApplication", id.toString(), "Human administrator rejected the application.");
        return loan;
    }

    @Transactional
    public LoanApplication repay(AppUser applicant, UUID id, BigDecimal amount) {
        LoanApplication loan = require(id);
        if (!loan.getApplicant().getId().equals(applicant.getId())) throw new BusinessRuleException("You can only repay your own loan.");
        if (loan.getStatus() != LoanStatus.APPROVED) throw new BusinessRuleException("Only approved outstanding loans can be repaid.");
        if (amount == null || amount.signum() <= 0) throw new BusinessRuleException("Repayment amount must be positive.");
        if (amount.compareTo(loan.getOutstandingAmount()) > 0) throw new BusinessRuleException("Repayment cannot exceed the outstanding amount.");

        ledger.transfer(ledger.accountFor(applicant), ledger.systemAccount("Brain Coin Treasury"), amount,
                TransactionType.LOAN_REPAYMENT, "LoanApplication", id.toString(), "Brain Coin loan repayment");
        loan.repay(amount);
        audit.record(applicant.getEmail(), "LOAN_REPAYMENT", "LoanApplication", id.toString(), "Repayment: " + amount + " BC");
        return loan;
    }

    public List<LoanApplication> listFor(AppUser applicant) {
        return loans.findByApplicantIdOrderBySubmittedAtDesc(applicant.getId());
    }

    public List<LoanApplication> adminReviewQueue() {
        return loans.findByStatusOrderByAdminReviewDueAtAsc(LoanStatus.ADMIN_REVIEW);
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void markOverdueLoansDefaulted() {
        for (LoanApplication loan : loans.findByStatusAndRepaymentDueAtBefore(LoanStatus.APPROVED, Instant.now())) {
            if (loan.getOutstandingAmount().signum() > 0) {
                loan.markDefaulted();
                audit.record("system", "LOAN_DEFAULTED", "LoanApplication", loan.getId().toString(), "Repayment deadline passed with outstanding balance.");
            }
        }
    }

    public LoanApplication require(UUID id) {
        return loans.findById(id).orElseThrow(() -> new BusinessRuleException("Loan application not found."));
    }

    private void requireReviewable(LoanApplication loan) {
        if (loan.getStatus() != LoanStatus.ADMIN_REVIEW) throw new BusinessRuleException("Loan is no longer in administrator review.");
    }
}
