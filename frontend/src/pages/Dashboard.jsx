import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState({
    total_income: 0,
    total_expense: 0,
    savings: 0,
    expense_by_category: []
  });

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [transactionForm, setTransactionForm] = useState({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    transaction_date: "",
    currency: "INR"
  });

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  /* ================= FETCH FUNCTIONS ================= */

  const fetchDashboard = useCallback(async () => {
  try {
    const res = await fetch("http://localhost:6124/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    const data = await res.json();

    setDashboard({
      total_income: data.total_income || 0,
      total_expense: data.total_expense || 0,
      savings: data.savings || 0,
      expense_by_category: data.expense_by_category || []
    });

  } catch (err) {
    console.error("Dashboard fetch failed:", err);
  } finally {
    // IMPORTANT — always stop loading
    setLoading(false);
  }
}, [token, logout, navigate]);


  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:6124/api/budgets", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : data.budgets || []);
    } catch (err) {
      console.error("fetchBudgets error", err);
    }
  }, [token, logout, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:6124/api/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      console.error("fetchCategories error", err);
    }
  }, [token, logout, navigate]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:6124/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (err) {
      console.error("fetchTransactions error", err);
    }
  }, [token, logout, navigate]);

  /* ================= ADD TRANSACTION ================= */

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    // basic validation
    if (!transactionForm.amount || !transactionForm.transaction_date) {
      alert("Please provide amount and date");
      return;
    }

    try {
      const res = await fetch("http://localhost:6124/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(transactionForm)
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        alert(data.error || "Transaction failed");
        return;
      }

      alert("Transaction added successfully");

      // clear form
      setTransactionForm({
        type: "expense",
        category_id: "",
        amount: "",
        description: "",
        transaction_date: "",
        currency: "INR"
      });

      // refresh all relevant data
      fetchDashboard();
      fetchBudgets();
      fetchTransactions();
    } catch (err) {
      console.error("add transaction error", err);
      alert("Transaction failed: network error");
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!token) return;
    fetchDashboard();
    fetchBudgets();
    fetchCategories();
    fetchTransactions();
  }, [token, fetchDashboard, fetchBudgets, fetchCategories, fetchTransactions]);

  if (!token) return null;

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard...</p>;
  }

  /* ================= UI ================= */

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1>Financial Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.summary}>
        <SummaryCard title="Income" value={dashboard.total_income} color="#4CAF50" />
        <SummaryCard title="Expense" value={dashboard.total_expense} color="#F44336" />
        <SummaryCard title="Savings" value={dashboard.savings} color="#2196F3" />
      </div>

      {/* EXPENSE BY CATEGORY */}
      <section style={styles.section}>
        <h3>Expenses by Category</h3>

        {!dashboard.expense_by_category?.length ? (
          <p>No expenses yet</p>
        ) : (
          dashboard.expense_by_category.map((c) => (
            <div key={c.name} style={styles.row}>
              <span>{c.name}</span>
              <span>₹{c.total}</span>
            </div>
          ))
        )}
      </section>

      {/* TRANSACTIONS LIST */}
      <section style={styles.section}>
        <h3>Recent Transactions</h3>

        {transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} style={styles.row}>
              <div>
                <strong>{t.type}</strong> - {t.description || "-"}
                <div style={{ fontSize: 12, color: "#666" }}>{t.transaction_date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>₹{t.amount}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{t.category || t.category_name || "-"}</div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ADD TRANSACTION */}
      <section style={styles.section}>
        <h3>Add Transaction</h3>

        <form onSubmit={handleAddTransaction} style={{ display: "grid", gap: "10px" }}>
          <select
            value={transactionForm.type}
            onChange={(e) =>
              setTransactionForm({ ...transactionForm, type: e.target.value })
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <select
            value={transactionForm.category_id}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                category_id: e.target.value
              })
            }
          >
            <option value="">Select Category</option>

            {categories
              .filter((c) => c.type === transactionForm.type)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <input
            placeholder="Amount"
            type="number"
            value={transactionForm.amount}
            onChange={(e) =>
              setTransactionForm({ ...transactionForm, amount: e.target.value })
            }
          />

          <input
            placeholder="Description"
            value={transactionForm.description}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                description: e.target.value
              })
            }
          />

          <input
            type="date"
            value={transactionForm.transaction_date}
            onChange={(e) =>
              setTransactionForm({
                ...transactionForm,
                transaction_date: e.target.value
              })
            }
          />

          <button type="submit">Add Transaction</button>
        </form>
      </section>

      {/* BUDGETS */}
      <section style={styles.section}>
        <h3>Budgets</h3>

        {budgets.length === 0 ? (
          <p>No budgets set</p>
        ) : (
          budgets.map((b) => {
            const percent =
              (Number(b.spent) / Number(b.budget_amount)) * 100;

            return (
              <div key={b.id} style={styles.budgetCard}>
                <div style={styles.row}>
                  <strong>{b.category}</strong>
                  <span>
                    ₹{b.spent} / ₹{b.budget_amount}
                  </span>
                </div>

                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min(percent, 100)}%`,
                      background: percent > 100 ? "#F44336" : "#4CAF50"
                    }}
                  />
                </div>

                <small>Remaining: ₹{b.remaining}</small>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* ================= COMPONENT ================= */

function SummaryCard({ title, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <h4>{title}</h4>
      <p style={{ fontSize: 22, fontWeight: "bold" }}>₹{value}</p>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "40px",
    maxWidth: "1000px",
    margin: "auto",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },
  logoutBtn: {
    padding: "8px 14px",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  summary: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px"
  },
  card: {
    flex: 1,
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  section: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0"
  },
  budgetCard: {
    marginBottom: "15px"
  },
  progressBar: {
    height: "8px",
    background: "#eee",
    borderRadius: "4px",
    margin: "6px 0"
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px"
  }
};
