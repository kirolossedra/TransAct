CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    owner_id UUID UNIQUE REFERENCES app_users(id),
    name VARCHAR(160) NOT NULL UNIQUE,
    system_account BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY,
    transaction_type VARCHAR(40) NOT NULL,
    reference_type VARCHAR(80),
    reference_id VARCHAR(80),
    memo VARCHAR(280),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ledger_postings (
    id UUID PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(19,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_postings_account ON ledger_postings(account_id);
CREATE INDEX idx_postings_transaction ON ledger_postings(transaction_id);

CREATE TABLE project_deals (
    id UUID PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES app_users(id),
    developer_id UUID NOT NULL REFERENCES app_users(id),
    title VARCHAR(180) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    amount NUMERIC(19,2) NOT NULL,
    due_date DATE,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE loan_applications (
    id UUID PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES app_users(id),
    amount NUMERIC(19,2) NOT NULL,
    outstanding_amount NUMERIC(19,2) NOT NULL,
    purpose VARCHAR(1200) NOT NULL,
    qualification_summary VARCHAR(3000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    review_provider VARCHAR(80) NOT NULL,
    payment_review_band VARCHAR(20) NOT NULL,
    payment_history_review VARCHAR(3000) NOT NULL,
    qualification_review_band VARCHAR(20) NOT NULL,
    qualification_review VARCHAR(3000) NOT NULL,
    admin_notes VARCHAR(3000),
    submitted_at TIMESTAMPTZ NOT NULL,
    admin_review_due_at TIMESTAMPTZ NOT NULL,
    decision_at TIMESTAMPTZ,
    repayment_due_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE salary_agreements (
    id UUID PRIMARY KEY,
    payer_id UUID NOT NULL REFERENCES app_users(id),
    recipient_id UUID NOT NULL REFERENCES app_users(id),
    label VARCHAR(180) NOT NULL,
    amount NUMERIC(19,2) NOT NULL,
    interval_days INTEGER NOT NULL,
    next_payment_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor VARCHAR(120) NOT NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NOT NULL,
    detail VARCHAR(3000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
