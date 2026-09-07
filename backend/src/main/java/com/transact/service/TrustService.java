package com.transact.service;

import com.transact.domain.*;
import com.transact.repo.LoanApplicationRepository;
import com.transact.repo.ProjectDealRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class TrustService {
    private final ProjectDealRepository deals;
    private final LoanApplicationRepository loans;

    public TrustService(ProjectDealRepository deals, LoanApplicationRepository loans) { this.deals = deals; this.loans = loans; }

    public TScore calculate(AppUser user) {
        long completedDeals = deals.countByDeveloperIdAndStatus(user.getId(), DealStatus.COMPLETED);
        long disputedDeals = deals.countByDeveloperIdAndStatus(user.getId(), DealStatus.DISPUTED);
        long overdueDeals = deals.countByDeveloperIdAndStatusAndDueDateBefore(user.getId(), DealStatus.ACCEPTED, LocalDate.now());
        long repaidLoans = loans.countByApplicantIdAndStatus(user.getId(), LoanStatus.REPAID);
        long defaultedLoans = loans.countByApplicantIdAndStatus(user.getId(), LoanStatus.DEFAULTED);

        int score = 50;
        List<Component> components = new ArrayList<>();
        components.add(new Component("Unestablished baseline", 50, "No reliability is assumed without transaction history; this is not a judgment of skill or personal worth."));
        int completedImpact = (int) Math.min(24, completedDeals * 3);
        if (completedImpact != 0) components.add(new Component("Completed project commitments", completedImpact, completedDeals + " completed"));
        score += completedImpact;
        int repaidImpact = (int) Math.min(18, repaidLoans * 6);
        if (repaidImpact != 0) components.add(new Component("Repaid Brain Coin loans", repaidImpact, repaidLoans + " repaid"));
        score += repaidImpact;
        int disputeImpact = (int) Math.max(-30, disputedDeals * -10);
        if (disputeImpact != 0) components.add(new Component("Disputed project commitments", disputeImpact, disputedDeals + " disputed"));
        score += disputeImpact;
        int overdueImpact = (int) Math.max(-20, overdueDeals * -5);
        if (overdueImpact != 0) components.add(new Component("Overdue accepted commitments", overdueImpact, overdueDeals + " overdue"));
        score += overdueImpact;
        int defaultImpact = (int) Math.max(-60, defaultedLoans * -20);
        if (defaultImpact != 0) components.add(new Component("Defaulted Brain Coin loans", defaultImpact, defaultedLoans + " defaulted"));
        score += defaultImpact;
        score = Math.max(0, Math.min(100, score));
        String band = score >= 85 ? "HIGH" : score >= 65 ? "ESTABLISHED" : score >= 50 ? "UNESTABLISHED_OR_DEVELOPING" : "CONCERNS_PRESENT";
        return new TScore(score, band, components);
    }

    public PaymentHistoryEvidence paymentHistory(AppUser user) {
        return new PaymentHistoryEvidence(
                loans.countByApplicantIdAndStatus(user.getId(), LoanStatus.REPAID),
                loans.countByApplicantIdAndStatus(user.getId(), LoanStatus.DEFAULTED),
                deals.countByDeveloperIdAndStatus(user.getId(), DealStatus.COMPLETED),
                deals.countByDeveloperIdAndStatus(user.getId(), DealStatus.DISPUTED),
                deals.countByDeveloperIdAndStatusAndDueDateBefore(user.getId(), DealStatus.ACCEPTED, LocalDate.now()),
                calculate(user).score());
    }

    public record TScore(int score, String band, List<Component> components) {}
    public record Component(String name, int impact, String explanation) {}
    public record PaymentHistoryEvidence(long repaidLoans, long defaultedLoans, long completedDeals, long disputedDeals, long overdueCommitments, int currentTScore) {}
}
