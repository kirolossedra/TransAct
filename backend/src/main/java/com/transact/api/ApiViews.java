package com.transact.api;

import com.transact.domain.*;
import com.transact.service.TrustService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ApiViews {
    private ApiViews() {}

    public record UserView(UUID id, String displayName, String email, String role) {
        public static UserView of(AppUser user) {
            return new UserView(user.getId(), user.getDisplayName(), user.getEmail(), user.getRole().name());
        }
    }

    public record DealView(UUID id, UserView requester, UserView developer, String title, String description,
                           BigDecimal amount, LocalDate dueDate, String status, Instant createdAt, Instant acceptedAt, Instant completedAt) {
        public static DealView of(ProjectDeal deal) {
            return new DealView(deal.getId(), UserView.of(deal.getRequester()), UserView.of(deal.getDeveloper()),
                    deal.getTitle(), deal.getDescription(), deal.getAmount(), deal.getDueDate(), deal.getStatus().name(),
                    deal.getCreatedAt(), deal.getAcceptedAt(), deal.getCompletedAt());
        }
    }

    public record LoanView(UUID id, UserView applicant, BigDecimal amount, BigDecimal outstandingAmount, String purpose,
                           String qualificationSummary, String status, String reviewProvider, String paymentReviewBand,
                           String paymentHistoryReview, String qualificationReviewBand, String qualificationReview,
                           String adminNotes, Instant submittedAt, Instant adminReviewDueAt, Instant decisionAt, Instant repaymentDueAt) {
        public static LoanView of(LoanApplication loan) {
            return new LoanView(loan.getId(), UserView.of(loan.getApplicant()), loan.getAmount(), loan.getOutstandingAmount(),
                    loan.getPurpose(), loan.getQualificationSummary(), loan.getStatus().name(), loan.getReviewProvider(),
                    loan.getPaymentReviewBand().name(), loan.getPaymentHistoryReview(), loan.getQualificationReviewBand().name(),
                    loan.getQualificationReview(), loan.getAdminNotes(), loan.getSubmittedAt(), loan.getAdminReviewDueAt(),
                    loan.getDecisionAt(), loan.getRepaymentDueAt());
        }
    }

    public record SalaryView(UUID id, UserView payer, UserView recipient, String label, BigDecimal amount, int intervalDays,
                             Instant nextPaymentAt, boolean active, Instant lastRunAt, String lastRunStatus) {
        public static SalaryView of(SalaryAgreement agreement) {
            return new SalaryView(agreement.getId(), UserView.of(agreement.getPayer()), UserView.of(agreement.getRecipient()),
                    agreement.getLabel(), agreement.getAmount(), agreement.getIntervalDays(), agreement.getNextPaymentAt(),
                    agreement.isActive(), agreement.getLastRunAt(), agreement.getLastRunStatus());
        }
    }

    public record TScoreView(int score, String band, List<TrustService.Component> components) {
        public static TScoreView of(TrustService.TScore score) {
            return new TScoreView(score.score(), score.band(), score.components());
        }
    }
}
