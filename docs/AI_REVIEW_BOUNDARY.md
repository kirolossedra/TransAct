# AI Review Boundary

TransAct deliberately keeps probabilistic model output outside the authoritative financial path.

The review component may summarize payment history, identify anomalies, compare requested amounts with prior obligations, and summarize applicant-provided qualifications. It may not directly approve a loan, reject a loan, mutate a T-score, move Brain Coins, or rewrite historical ledger evidence.

Every stored review should retain provider/model provenance and a human-readable explanation. The current implementation stores the provider name and review text. `HEURISTIC_PLACEHOLDER` is not represented as AI; it exists to make the workflow executable before credentials are configured.

A later AI integration should use structured outputs, input minimization, explicit prompt versioning, timeouts, retry limits, and an administrator-visible distinction between source evidence and model interpretation.
