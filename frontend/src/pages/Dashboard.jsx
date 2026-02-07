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
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense" });
  const [budgetForm, setBudgetForm] = useState({ category_id: "", amount: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, currency: "INR" });

  const [transactionForm, setTransactionForm] = useState({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    transaction_date: "",
    currency: "INR"
  });

  const formatCurrency = (v) => {
    const n = Number(v || 0);
    return `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch (e) {
      return d;
    }
  };

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

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.name) {
      alert("Please provide a category name");
      return;
    }

    // prevent obvious duplicates (client-side)
    const exists = categories.some(
      (c) => c.name.toLowerCase() === categoryForm.name.trim().toLowerCase() && c.type === categoryForm.type
    );

    if (exists) {
      alert("Category with this name and type already exists");
      return;
    }

    try {
      const res = await fetch("http://localhost:6124/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        alert(data.error || "Failed to add category");
        return;
      }

      alert("Category added");
      setCategoryForm({ name: "", type: "expense" });
      fetchCategories();
    } catch (err) {
      console.error("addCategory error", err);
      alert("Network error adding category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:6124/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
        return;
      }

      fetchCategories();
    } catch (err) {
      console.error("deleteCategory error", err);
      alert("Network error deleting category");
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();

    // parse month/year from input type=month value `YYYY-MM`
    if (!budgetForm.category_id || !budgetForm.amount || !budgetForm.month) {
      alert("Please select category, amount and month");
      return;
    }

    const [yearStr, monthStr] = budgetForm.month.split("-");
    const month = Number(monthStr);
    const year = Number(yearStr);

    // prevent obvious duplicate budget for same category+month+year
    const exists = budgets.some(
      (b) => b.category === (categories.find(c=>String(c.id)===String(budgetForm.category_id))?.name) && Number(b.month)===month && Number(b.year)===year
    );

    if (exists) {
      alert("Budget already exists for this category and month");
      return;
    }

    try {
      const body = {
        category_id: budgetForm.category_id,
        amount: budgetForm.amount,
        currency: budgetForm.currency,
        month,
        year
      };

      const res = await fetch("http://localhost:6124/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        alert(data.error || "Failed to create budget");
        return;
      }

      alert("Budget created");
      setBudgetForm({ category_id: "", amount: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, currency: "INR" });
      fetchBudgets();
    } catch (err) {
      console.error("addBudget error", err);
      alert("Network error creating budget");
    }
  };

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

  // group transactions by type and category for display
  const incomeByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const key = t.category_name || t.category || 'Uncategorized';
      acc[key] = acc[key] || [];
      acc[key].push(t);
      return acc;
    }, {});

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const key = t.category_name || t.category || 'Uncategorized';
      acc[key] = acc[key] || [];
      acc[key].push(t);
      return acc;
    }, {});

  const monthlySummary = dashboard.monthly_summary || [];

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
        <section style={styles.section}>
            <h3>Monthly Summary</h3>

            {monthlySummary.length === 0 ? (
                <p>No data</p>
            ) : (
                monthlySummary.map((m) => (
                <div key={m.month} style={styles.row}>
                    <span>{m.month}</span>
                    <span>
                    Income: ₹{Number(m.income).toFixed(2)} |
                    Expense: ₹{Number(m.expense).toFixed(2)}
                    </span>
                </div>
                ))
            )}
            </section>
      </div>

      {/* EXPENSE BY CATEGORY */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Expenses by Category</h3>

        {!dashboard.expense_by_category?.length ? (
          <p style={styles.emptyText}>No expenses yet</p>
        ) : (
          <div style={styles.categoryList}>
            {dashboard.expense_by_category.map((c) => (
              <div key={c.name} style={styles.categoryRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={styles.categoryBullet} />
                  <div>
                    <div style={styles.categoryName}>{c.name}</div>
                    <div style={styles.categorySub}>Category</div>
                  </div>
                </div>
                <div style={styles.categoryAmount}>{formatCurrency(c.total)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MANAGE CATEGORIES */}
      <section style={styles.section}>
        <h3>Manage Categories</h3>

        <form onSubmit={handleAddCategory} style={{ display: "grid", gap: "8px", maxWidth: 420 }}>
          <input
            placeholder="Category name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            style={styles.input}
          />

          <select
            value={categoryForm.type}
            onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
            style={styles.input}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button type="submit" style={styles.primaryBtn}>Add Category</button>
        </form>

        <div style={{ marginTop: 12 }}>
          {categories.length === 0 ? (
            <p>No categories yet</p>
          ) : (
            categories.map((c) => (
              <div key={c.id || c.name} style={styles.row}>
                <div>
                  <span>{c.name}</span>
                  <small style={{ color: "#666", marginLeft: 8 }}>{c.type}</small>
                </div>
                <div>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    style={styles.dangerBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Transactions</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Income */}
          <div>
            <h4 style={{ marginTop: 0 }}>Income</h4>
            {Object.keys(incomeByCategory).length === 0 ? (
              <p style={styles.emptyText}>No income transactions</p>
            ) : (
              Object.entries(incomeByCategory).map(([cat, items]) => (
                <div key={cat} style={styles.transCategory}>
                  <div style={styles.transCategoryHeader}>{cat} <small style={styles.categorySub}>({items.length})</small></div>
                  {items.map(t => (
                    <div key={t.id} style={styles.transRow}>
                      <div style={styles.transLeft}>
                        <div style={styles.transDesc}>{t.description || '-'}</div>
                        <div style={styles.transDate}>{formatDate(t.transaction_date)}</div>
                      </div>
                      <div style={{ ...styles.transAmount, color: '#2e7d32' }}>+{formatCurrency(t.amount)}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Expenses */}
          <div>
            <h4 style={{ marginTop: 0 }}>Expenses</h4>
            {Object.keys(expenseByCategory).length === 0 ? (
              <p style={styles.emptyText}>No expense transactions</p>
            ) : (
              Object.entries(expenseByCategory).map(([cat, items]) => (
                <div key={cat} style={styles.transCategory}>
                  <div style={styles.transCategoryHeader}>{cat} <small style={styles.categorySub}>({items.length})</small></div>
                  {items.map(t => (
                    <div key={t.id} style={styles.transRow}>
                      <div style={styles.transLeft}>
                        <div style={styles.transDesc}>{t.description || '-'}</div>
                        <div style={styles.transDate}>{formatDate(t.transaction_date)}</div>
                      </div>
                      <div style={{ ...styles.transAmount, color: '#c62828' }}>-{formatCurrency(t.amount)}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
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
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
          />

          <button type="submit" style={styles.primaryBtn}>Add Transaction</button>
        </form>
      </section>

      {/* BUDGETS */}
      <section style={styles.section}>
        <h3>Budgets</h3>

        {/* Create budget form */}
        <form onSubmit={handleAddBudget} style={{ display: "grid", gap: "8px", maxWidth: 420, marginBottom: 12 }}>
          <select
            value={budgetForm.category_id}
            onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
            style={styles.input}
          >
            <option value="">Select Expense Category</option>
            {categories.filter(c => c.type === 'expense').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            placeholder="Budget amount"
            type="number"
            value={budgetForm.amount}
            onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
            style={styles.input}
          />

          <input
            type="month"
            value={budgetForm.month}
            onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
            style={styles.input}
          />

          <select
            value={budgetForm.currency}
            onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
            style={styles.input}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>

          <button type="submit" style={styles.primaryBtn}>Create Budget</button>
        </form>

        {budgets.length === 0 ? (
          <p>No budgets set</p>
        ) : (
          budgets.map((b) => {
            // compute spent locally from transactions to ensure consistency
            const localSpent = transactions
              .filter(t => t.type === 'expense' && String(t.category_name) === String(b.category))
              .filter(t => {
                const d = new Date(t.transaction_date);
                return (d.getMonth() + 1) === Number(b.month) && d.getFullYear() === Number(b.year);
              })
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            const spentToShow = Number.isFinite(localSpent) ? localSpent : Number(b.spent || 0);
            const percent = (Number(spentToShow) / Number(b.budget_amount)) * 100;

            return (
              <div key={b.id} style={styles.budgetCard}>
                <div style={styles.row}>
                  <strong>{b.category} — {b.month}/{b.year}</strong>
                  <span>
                    ₹{formatCurrency(spentToShow)} / {formatCurrency(b.budget_amount)}
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

                <small>Remaining: ₹{(Number(b.budget_amount) - spentToShow).toFixed(2)}</small>
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
  const display = typeof value === 'number' || !isNaN(Number(value))
    ? `₹${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value;

  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <h4 style={{ margin: 0, color: '#333' }}>{title}</h4>
      <p style={{ fontSize: 22, fontWeight: "700", marginTop: 8 }}>{display}</p>
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
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    color: '#222'
  },
  emptyText: {
    color: '#666'
  },
  categoryList: {
    display: 'grid',
    gap: 10
  },
  categoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f1f1f1'
  },
  categoryBullet: {
    width: 10,
    height: 10,
    borderRadius: 6,
    background: '#4CAF50'
  },
  categoryName: {
    fontWeight: 600
  },
  categorySub: {
    fontSize: 12,
    color: '#777'
  },
  categoryAmount: {
    fontWeight: 700
  },
  input: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14
  },
  primaryBtn: {
    padding: '10px 14px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  dangerBtn: {
    padding: '6px 8px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    alignItems: 'start'
  },
  budgetList: {
    minWidth: 0
  },
  budgetFormCol: {
    minWidth: 0
  },
  smallCard: {
    background: '#fafafa',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #eee'
  },
  remaining: {
    color: '#333'
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
  ,
  transCategory: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    background: '#fff',
    border: '1px solid #f1f1f1'
  },
  transCategoryHeader: {
    fontWeight: 700,
    marginBottom: 8
  },
  transRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderTop: '1px dashed #f5f5f5'
  },
  transLeft: {
    display: 'flex',
    flexDirection: 'column'
  },
  transDesc: {
    fontSize: 14
  },
  transDate: {
    fontSize: 12,
    color: '#777'
  },
  transAmount: {
    fontWeight: 700
  }
};
