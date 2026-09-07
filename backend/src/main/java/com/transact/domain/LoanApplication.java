package com.transact.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "loan_applications")
public class LoanApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private AppUser applicant;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "outstanding_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal outstandingAmount;

    @Column(nullable = false, length = 1200)
    private String purpose;

    @Column(name = "qualification_summary", nullable = false, length = 3000)
    private String qualificationSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LoanStatus status;

    @Column(name = "review_provider", nullable = false, length = 80)
    private String reviewProvider;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_review_band", nullable = false, length = 20)
    private ReviewBand paymentReviewBand;

    @Column(name = "payment_history_review", nullable = false, length = 3000)
    private String paymentHistoryReview;

    @Enumerated(EnumType.STRING)
    @Column(name = "qualification_review_band", nullable = false, length = 20)
    private ReviewBand qualificationReviewBand;

    @Column(name = "qualification_review", nullable = false, length = 3000)
    private String qualificationReview;

    @Column(name = "admin_notes", length = 3000)
    private String adminNotes;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "admin_review_due_at", nullable = false)
    private Instant adminReviewDueAt;

    @Column(name = "decision_at")
    private Instant decisionAt;

    @Column(name = "repayment_due_at")
    private Instant repaymentDueAt;

    @Version
    private long version;

    protected LoanApplication() {}

    public LoanApplication(AppUser applicant, BigDecimal amount, String purpose, String qualificationSummary,
                           String reviewProvider, ReviewBand paymentReviewBand, String paymentHistoryReview,
                           ReviewBand qualificationReviewBand, String qualificationReview,
                           Instant submittedAt, Instant adminReviewDueAt) {
        this.applicant = applicant;
        this.amount = amount;
        this.outstandingAmount = BigDecimal.ZERO;
        this.purpose = purpose;
        this.qualificationSummary = qualificationSummary;
        this.reviewProvider = reviewProvider;
        this.paymentReviewBand = paymentReviewBand;
        this.paymentHistoryReview = paymentHistoryReview;
        this.qualificationReviewBand = qualificationReviewBand;
        this.qualificationReview = qualificationReview;
        this.submittedAt = submittedAt;
        this.adminReviewDueAt = adminReviewDueAt;
        this.status = LoanStatus.ADMIN_REVIEW;
    }

    public void approve(String notes, Instant repaymentDueAt) {
        this.status = LoanStatus.APPROVED;
        this.adminNotes = notes;
        this.decisionAt = Instant.now();
        this.repaymentDueAt = repaymentDueAt;
        this.outstandingAmount = amount;
    }

    public void reject(String notes) { this.status = LoanStatus.REJECTED; this.adminNotes = notes; this.decisionAt = Instant.now(); }
    public void repay(BigDecimal amount) { this.outstandingAmount = this.outstandingAmount.subtract(amount); if (this.outstandingAmount.signum() == 0) this.status = LoanStatus.REPAID; }
    public void markDefaulted() { this.status = LoanStatus.DEFAULTED; }

    public UUID getId() { return id; }
    public AppUser getApplicant() { return applicant; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getOutstandingAmount() { return outstandingAmount; }
    public String getPurpose() { return purpose; }
    public String getQualificationSummary() { return qualificationSummary; }
    public LoanStatus getStatus() { return status; }
    public String getReviewProvider() { return reviewProvider; }
    public ReviewBand getPaymentReviewBand() { return paymentReviewBand; }
    public String getPaymentHistoryReview() { return paymentHistoryReview; }
    public ReviewBand getQualificationReviewBand() { return qualificationReviewBand; }
    public String getQualificationReview() { return qualificationReview; }
    public String getAdminNotes() { return adminNotes; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getAdminReviewDueAt() { return adminReviewDueAt; }
    public Instant getDecisionAt() { return decisionAt; }
    public Instant getRepaymentDueAt() { return repaymentDueAt; }
}
