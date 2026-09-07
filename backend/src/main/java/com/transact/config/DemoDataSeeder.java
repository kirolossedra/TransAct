package com.transact.config;

import com.transact.domain.*;
import com.transact.repo.*;
import com.transact.service.LedgerService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    private final AppUserRepository users;
    private final AccountRepository accounts;
    private final ProjectDealRepository deals;
    private final LoanApplicationRepository loans;
    private final LedgerService ledger;

    public DemoDataSeeder(AppUserRepository users, AccountRepository accounts, ProjectDealRepository deals,
                          LoanApplicationRepository loans, LedgerService ledger) {
        this.users = users;
        this.accounts = accounts;
        this.deals = deals;
        this.loans = loans;
        this.ledger = ledger;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) return;

        AppUser alice = users.save(new AppUser("Alice Morgan", "alice@transact.local", UserRole.DEVELOPER));
        AppUser bob = users.save(new AppUser("Bob Chen", "bob@transact.local", UserRole.DEVELOPER));
        AppUser carol = users.save(new AppUser("Carol Nassar", "carol@transact.local", UserRole.DEVELOPER));
        AppUser admin = users.save(new AppUser("TransAct Administrator", "admin@transact.local", UserRole.ADMIN));

        Account issuance = accounts.save(new Account(null, "Brain Coin Issuance", true));
        Account treasury = accounts.save(new Account(null, "Brain Coin Treasury", true));
        Account aliceAccount = accounts.save(new Account(alice, "Alice Brain Coin Account", false));
        Account bobAccount = accounts.save(new Account(bob, "Bob Brain Coin Account", false));
        Account carolAccount = accounts.save(new Account(carol, "Carol Brain Coin Account", false));
        accounts.save(new Account(admin, "Administrator Brain Coin Account", false));

        ledger.transfer(issuance, treasury, new BigDecimal("1000000.00"), TransactionType.INITIAL_GRANT, "Seed", "treasury", "Initial Brain Coin treasury capitalization");
        ledger.transfer(issuance, aliceAccount, new BigDecimal("5000.00"), TransactionType.INITIAL_GRANT, "Seed", "alice", "Demo starting balance");
        ledger.transfer(issuance, bobAccount, new BigDecimal("3000.00"), TransactionType.INITIAL_GRANT, "Seed", "bob", "Demo starting balance");
        ledger.transfer(issuance, carolAccount, new BigDecimal("2500.00"), TransactionType.INITIAL_GRANT, "Seed", "carol", "Demo starting balance");

        ProjectDeal completed = new ProjectDeal(carol, alice, "Review database migration plan",
                "Review the proposed PostgreSQL migration and identify rollback risks.", new BigDecimal("400.00"), LocalDate.now().minusDays(10));
        completed.accept();
        completed.complete();
        deals.save(completed);
        ledger.transfer(carolAccount, aliceAccount, completed.getAmount(), TransactionType.PROJECT_PAYMENT,
                "ProjectDeal", completed.getId().toString(), "Seeded completed project payment");

        LoanApplication repaid = new LoanApplication(alice, new BigDecimal("300.00"), "Short-term infrastructure support",
                "Completed several backend contributions and requested temporary Brain Coins for a testing environment.",
                "HEURISTIC_PLACEHOLDER", ReviewBand.STRONG, "Seeded historical payment review.",
                ReviewBand.MODERATE, "Seeded historical qualification review.",
                Instant.now().minus(Duration.ofDays(60)), Instant.now().minus(Duration.ofDays(57)));
        repaid.approve("Historical demo loan approved.", Instant.now().minus(Duration.ofDays(20)));
        loans.save(repaid);
        ledger.transfer(treasury, aliceAccount, repaid.getAmount(), TransactionType.LOAN_DISBURSEMENT,
                "LoanApplication", repaid.getId().toString(), "Historical demo loan");
        ledger.transfer(aliceAccount, treasury, repaid.getAmount(), TransactionType.LOAN_REPAYMENT,
                "LoanApplication", repaid.getId().toString(), "Historical demo repayment");
        repaid.repay(repaid.getAmount());

        LoanApplication pending = new LoanApplication(bob, new BigDecimal("850.00"), "Frontend accessibility sprint",
                "React developer with completed community contributions requesting working capital for a three-week accessibility sprint.",
                "HEURISTIC_PLACEHOLDER", ReviewBand.MODERATE, "Seeded review: no defaults; limited loan repayment history.",
                ReviewBand.MODERATE, "Seeded qualification review for administrator workflow demonstration.",
                Instant.now().minus(Duration.ofDays(5)), Instant.now().minus(Duration.ofDays(2)));
        loans.save(pending);
    }
}
