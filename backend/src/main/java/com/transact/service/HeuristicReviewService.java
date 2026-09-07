package com.transact.service;

import com.transact.domain.ReviewBand;
import org.springframework.stereotype.Service;

@Service
public class HeuristicReviewService implements AiReviewService {
    private static final String PREFIX = "Pre-AI heuristic placeholder (no model/API key configured): ";

    @Override public String providerName() { return "HEURISTIC_PLACEHOLDER"; }

    @Override
    public Assessment reviewPaymentHistory(TrustService.PaymentHistoryEvidence e) {
        ReviewBand band;
        if (e.defaultedLoans() > 0 || e.disputedDeals() > 1) band = ReviewBand.WEAK;
        else if (e.repaidLoans() > 0 || e.completedDeals() >= 2) band = ReviewBand.STRONG;
        else band = ReviewBand.MODERATE;
        String explanation = PREFIX + "T-score=" + e.currentTScore()
                + ", repaid loans=" + e.repaidLoans()
                + ", defaults=" + e.defaultedLoans()
                + ", completed commitments=" + e.completedDeals()
                + ", disputes=" + e.disputedDeals()
                + ", overdue commitments=" + e.overdueCommitments() + ".";
        return new Assessment(band, explanation);
    }

    @Override
    public Assessment reviewQualifications(String qualificationSummary, String purpose) {
        int words = qualificationSummary == null || qualificationSummary.isBlank() ? 0 : qualificationSummary.trim().split("\\s+").length;
        ReviewBand band = words >= 40 ? ReviewBand.STRONG : words >= 15 ? ReviewBand.MODERATE : ReviewBand.WEAK;
        return new Assessment(band, PREFIX + "qualification statement contains " + words + " words. This is only a deterministic stand-in so the workflow can be exercised before a real AI reviewer is configured.");
    }
}
