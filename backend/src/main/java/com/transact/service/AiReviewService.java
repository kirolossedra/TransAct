package com.transact.service;

import com.transact.domain.ReviewBand;

public interface AiReviewService {
    String providerName();
    Assessment reviewPaymentHistory(TrustService.PaymentHistoryEvidence evidence);
    Assessment reviewQualifications(String qualificationSummary, String purpose);

    record Assessment(ReviewBand band, String explanation) {}
}
