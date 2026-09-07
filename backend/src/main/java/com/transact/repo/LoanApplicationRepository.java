package com.transact.repo;

import com.transact.domain.LoanApplication;
import com.transact.domain.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, UUID> {
    List<LoanApplication> findByApplicantIdOrderBySubmittedAtDesc(UUID applicantId);
    List<LoanApplication> findByStatusOrderByAdminReviewDueAtAsc(LoanStatus status);
    long countByApplicantIdAndStatus(UUID applicantId, LoanStatus status);
    List<LoanApplication> findByStatusAndRepaymentDueAtBefore(LoanStatus status, Instant cutoff);
}
