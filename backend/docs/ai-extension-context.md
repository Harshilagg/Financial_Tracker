PROJECT CONTEXT — READ BEFORE GENERATING CODE

This is an already working financial dashboard application with production-level functionality implemented. The goal is to ADD new intelligent features without modifying or breaking the existing database structure, business logic, API contracts, or frontend behavior.

IMPORTANT CONSTRAINTS:

* Existing database schema, table names, and column structures MUST NOT be changed.
* Existing API routes must continue to behave exactly the same.
* Existing authentication, budgeting, transaction management, notifications, and reporting logic must remain untouched.
* New features must be added as extensions or additional services/modules.
* Backward compatibility is mandatory.

---

EXISTING SYSTEM OVERVIEW

The system currently supports:

1. User Authentication

   * Email/password authentication
   * Google OAuth login
   * User profile management

2. Financial Data Management

   * Income and expense transactions
   * Categories (income and expense types)
   * Budgets per category per month
   * Transactions include:

     * date
     * amount
     * currency
     * base_amount (converted value)
     * base_currency
     * description
     * optional receipt reference

3. Multi-Currency Support

   * Each transaction has an original currency.
   * A normalized base currency amount is stored.
   * All analytics and reporting use base currency values.

4. Dashboard Analytics

   * Monthly income vs expense summaries
   * Expense by category
   * Savings calculation
   * Budget tracking and overrun detection

5. Notifications

   * Budget overrun notifications stored in database
   * Email notifications sent via Sendgrid

6. Receipt Uploads

   * Files stored in AWS
   * Linked to transactions via receipt ID

---

GOAL — PART B ADDITIONAL FEATURES

The following new features must be implemented WITHOUT modifying existing logic.

NEW FEATURES TO ADD:

A) BANK STATEMENT IMPORT (CSV/PDF)
B) ANOMALY DETECTION FOR SPENDING
C) OPENAI-BASED FINANCIAL INSIGHTS

---

FEATURE A — BANK STATEMENT IMPORT

Objective:
Allow users to upload bank statements and automatically create transactions.

Requirements:

1. Upload Support

   * Accept CSV initially (PDF parsing optional and modular).
   * Upload endpoint separate from manual transaction creation.
   * File stored temporarily or processed immediately.

2. Parsing Layer

   * Extract:
     transaction_date
     description
     debit/credit amount
   * Map into existing transaction format.
   * Do NOT change existing transaction schema.

3. Auto Categorization

   * Rule-based matching first:
     Example:
     "Swiggy", "Zomato" → Food
     "Uber", "Ola" → Transport
   * If no rule match, mark as Uncategorized.
   * Optional future extension: LLM-based classification.

4. Duplicate Detection
   Prevent importing existing transactions using:
   - same date
   - similar amount
   - similar description
   Implement fuzzy matching tolerance.

5. Transaction Creation
   Imported transactions must use the same internal service or function used by manual transaction creation to maintain consistency.

---

FEATURE B — ANOMALY DETECTION

Objective:
Identify unusual spending patterns using existing transaction data.

Requirements:

1. Detection must run as a background or post-transaction process.
2. Do NOT modify existing transaction logic.
3. Create a separate anomaly detection module/service.

Detection rules (initial version):

* Transaction amount > (mean + 2 * std deviation) for that category
* Sudden spike compared to last 30 days average
* Unusual category spending increase month-over-month

4. When anomaly detected:

   * Create a notification entry using existing notification system.
   * Optional email notification via existing Sendgrid flow.

5. Anomalies must NOT block transaction creation.

---

FEATURE C — OPENAI FINANCIAL INSIGHTS

Objective:
Generate human-readable financial insights from existing aggregated data.

Requirements:

1. LLM must NOT receive raw transaction tables.

2. Backend must first generate structured summaries:

   * monthly income
   * monthly expense
   * category trends
   * budget overruns
   * anomalies detected

3. Send only summarized JSON data to OpenAI API.

Example input to LLM:
{
"month": "Jan 2026",
"income": 120000,
"expense": 90000,
"top_category_changes": [...],
"budget_overruns": [...],
"anomalies": [...]
}

4. Output:

   * Short insight text for dashboard display.
   * Example:
     "Food spending increased by 18% compared to last month."

5. Insights generation must be asynchronous or cached to avoid blocking dashboard loading.

---

ARCHITECTURE RULES

* Follow existing project structure and naming conventions.
* Add new modules/services instead of modifying existing ones.
* Reuse existing transaction creation and notification services.
* Maintain base currency normalization for analytics.
* All new features must degrade gracefully if disabled.

---

EXPECTED OUTPUT FROM COPILOT

When generating code:

* Prefer modular services over inline logic.
* Avoid schema changes.
* Avoid breaking existing APIs.
* Add clear comments explaining integration points.
* Assume production-scale data growth.

END OF CONTEXT
