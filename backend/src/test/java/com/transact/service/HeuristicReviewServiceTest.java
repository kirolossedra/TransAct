package com.transact.service;

import com.transact.domain.ReviewBand;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HeuristicReviewServiceTest {
    private final HeuristicReviewService service = new HeuristicReviewService();

    @Test
    void defaultHistoryIsFlaggedWeak() {
        var evidence = new TrustService.PaymentHistoryEvidence(2, 1, 5, 0, 0, 55);
        assertThat(service.reviewPaymentHistory(evidence).band()).isEqualTo(ReviewBand.WEAK);
    }

    @Test
    void substantialQualificationStatementCanBeStrong() {
        String text = "I have delivered backend systems using Java Spring PostgreSQL testing migrations observability security " +
                "and deployment workflows. I have also completed collaborative code reviews, API contracts, data modeling, " +
                "failure analysis, integration testing, production debugging, documentation, incident follow-up, and project handoffs " +
                "across several volunteer engineering efforts with clearly defined commitments and delivery checkpoints.";
        assertThat(service.reviewQualifications(text, "project").band()).isEqualTo(ReviewBand.STRONG);
    }
}
