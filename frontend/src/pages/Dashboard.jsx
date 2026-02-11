import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Legend} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState({
    total_income: 0,
    total_expense: 0,
    savings: 0,
    expense_by_category: [],
    monthly_summary: []
  });

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense" });
  const [budgetForm, setBudgetForm] = useState({ category_id: "", amount: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, currency: "INR" });

  const [primaryCurrency, setPrimaryCurrency] = useState('INR');

  const [transactionForm, setTransactionForm] = useState({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    transaction_date: "",
    currency: "INR"
  });

  const [transactionReceipt, setTransactionReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [receiptModal, setReceiptModal] = useState({ open: false, url: null, filename: null });

  const formatCurrency = (value, currency) => {
  const safeCurrency =
    currency && currency.length === 3 ? currency : "INR";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: safeCurrency
  }).format(Number(value || 0));
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
    const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/dashboard", {
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
      expense_by_category: data.expense_by_category || [],
      monthly_summary: data.monthly_summary || []
    });
    if (data.base_currency) setPrimaryCurrency(data.base_currency);

  } catch (err) {
    console.error("Dashboard fetch failed:", err);
  } finally {
    // IMPORTANT — always stop loading
    setLoading(false);
  }
}, [token, logout, navigate]);


  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/budgets", {
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

  const handlePrimaryCurrencyChange = async (val) => {
    if (!val) return;
    try {
      const res = await fetch('https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/users/primary-currency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ primary_currency: val })
      });

      if (res.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update primary currency');
        return;
      }

      setPrimaryCurrency(data.primary_currency || val);
      fetchDashboard();
      fetchBudgets();
      fetchTransactions();
    } catch (e) {
      console.error('update primary currency failed', e);
      alert('Network error while updating primary currency');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    const previous = budgets;
    setBudgets(prev => prev.filter(b => b.id !== id));
    try {
      const res = await fetch(`https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        alert(data.error || 'Failed to delete budget');
        setBudgets(previous);
        return;
      }
      fetchBudgets();
      fetchDashboard();
    } catch (e) {
      console.error('delete budget failed', e);
      alert('Network error deleting budget');
      setBudgets(previous);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/categories", {
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
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/transactions", {
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("fetchNotifications error", err);
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
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/categories", {
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
      const res = await fetch(`https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/categories/${id}`, {
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

      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/budgets", {
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
      const res = await fetch("https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/transactions", {
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

      // if a receipt file is attached, upload it
      if (transactionReceipt && data && data.id) {
        try {
          const fd = new FormData();
          fd.append('receipt', transactionReceipt);

          const up = await fetch(`https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/transactions/${data.id}/receipts`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd
          });

          if (!up.ok) {
            console.warn('Receipt upload failed');
          } else {
            // optionally refresh transactions to show receipt link
            fetchTransactions();
          }
        } catch (err) {
          console.error('Receipt upload error', err);
        }
      }

      setTransactionReceipt(null);

      // refresh all relevant data
      fetchDashboard();
      fetchBudgets();
      fetchTransactions();
      // refresh notifications and show toast if budget_overrun created very recently
      await fetchNotifications();
      // find any recent budget_overrun within last 10 seconds
      const now = Date.now();
      const recent = notifications.find(n => n.type === 'budget_overrun' && !n.is_read && (now - new Date(n.created_at).getTime()) < 10000);
      if (recent) {
        setToastMessage('Budget exceeded. Email sent.');
        setTimeout(() => setToastMessage(null), 5000);
      }
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
    fetchNotifications();
  }, [token, fetchDashboard, fetchBudgets, fetchCategories, fetchTransactions, fetchNotifications]);

  // keep forms default currency in sync with user's selected primary currency
  useEffect(() => {
    if (!primaryCurrency) return;
    setTransactionForm((f) => ({ ...f, currency: primaryCurrency }));
    setBudgetForm((b) => ({ ...b, currency: primaryCurrency }));
  }, [primaryCurrency]);

  if (!token) return null;

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard...</p>;
  }

  // toast banner
  const Toast = ({ message }) => (
    <div style={{ position: 'fixed', top: 20, right: 20, background: '#323232', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>{message}</div>
  );

  const ReceiptModal = ({ open, url, filename, onClose }) => {
    if (!open) return null;

    const isPdf = filename && filename.toLowerCase().endsWith('.pdf');

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div style={{ width: '90%', height: '90%', background: '#fff', borderRadius: 8, overflow: 'hidden', position: 'relative' }} onClick={(e)=>e.stopPropagation()}>
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2010 }}>
            <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' }}>Close</button>
          </div>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
            {isPdf ? (
              <iframe src={url} title={filename} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : (
              <img src={url} alt={filename} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            )}
          </div>
        </div>
      </div>
    );
  };

  function ImportStatementSection() {
    const [file, setFile] = useState(null);
    const [loadingImport, setLoadingImport] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleUpload = async () => {
      if (!file) return setError('Please select a CSV file');
      setLoadingImport(true);
      setError(null);
      setResult(null);
      try {
        const fd = new FormData();
        fd.append('statement', file);

        const res = await fetch('https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/imports/statements', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || data.message || 'Import failed');
        } else {
          setResult(data);
          // refresh data per requirements
          fetchDashboard();
          fetchBudgets();
          fetchTransactions();
          // if import created new categories, refresh category list so UI dropdowns update
          if (data && data.new_categories_count && data.new_categories_count > 0) {
            fetchCategories();
          }
        }
      } catch (e) {
        console.error('import failed', e);
        setError('Network error during import');
      } finally {
        setLoadingImport(false);
      }
    };

    return (
      <section style={styles.section}>
        <h3>Import Bank Statement</h3>

        <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
          <input
            type="file"
            accept="text/csv,application/csv,text/plain"
            onChange={(e) => setFile(e.target.files && e.target.files[0])}
            style={styles.input}
          />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleUpload} style={styles.primaryBtn} disabled={loadingImport}>{loadingImport ? 'Uploading...' : 'Upload CSV'}</button>
            {loadingImport && <div style={{ color: '#666' }}>Processing...</div>}
          </div>

          {error && <div style={{ color: '#c62828' }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 8, background: '#fafafa', padding: 10, borderRadius: 6 }}>
              <div><strong>Imported:</strong> {result.created_count ?? 0}</div>
              <div><strong>Duplicates skipped:</strong> {result.skipped_count ?? 0}</div>
              <div><strong>New categories created:</strong> {result.new_categories_count ?? 'N/A'}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Notifications panel (simple)
  const handleNotificationClick = async (n) => {
    try {
      // mark read
          await fetch(`https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      // optimistic update
      setNotifications((prev) => prev.map(p => p.id === n.id ? { ...p, is_read: true } : p));
    } catch (e) {
      console.error('mark notification read failed', e);
    }
  };

  const handleViewReceipt = async (receiptId) => {
    try {
      const res = await fetch(`https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/receipts/${receiptId}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        alert(err.error || 'Could not get receipt URL');
        return;
      }
      const data = await res.json();
      if (data.url) {
        setReceiptModal({ open: true, url: data.url, filename: data.filename || '' });
      }
    } catch (e) {
      console.error('fetch receipt url failed', e);
      alert('Failed to open receipt');
    }
  };

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

    const unreadNotifications = notifications.filter(n => !n.is_read);

    const monthlySummary = dashboard.monthly_summary || [];
    const monthlyChartData = monthlySummary.map((m) => ({
        month: m.month,
        income: Number(m.income),
        expense: Number(m.expense)
    }));

        // GROUP BUDGETS BY MONTH
        const groupedBudgets = budgets.reduce((acc, b) => {
        const key = `${b.year}-${String(b.month).padStart(2, "0")}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
        }, {});

        // SORT MONTHS DESC (latest first)
        const sortedBudgetMonths = Object.keys(groupedBudgets)
        .sort((a, b) => new Date(b) - new Date(a));

        // SORT BUDGETS INSIDE MONTH (highest spent first)
        sortedBudgetMonths.forEach((key) => {
        groupedBudgets[key].sort(
            (a, b) => Number(b.spent || 0) - Number(a.spent || 0)
        );
        });

  /* ================= UI ================= */

  return (
    <div style={styles.container}>
      {/* HEADER */}
      {/* HEADER */}
        <div style={styles.header}>
        <div>
            <h1 style={styles.headerTitle}>Financial Dashboard</h1>
            <p style={styles.headerSubtitle}>
            Track your income, expenses & savings
            </p>
        </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {unreadNotifications.length > 0 && (
                <div style={{ background: '#fff8e1', padding: '6px 10px', borderRadius: 8, color: '#8a6d00' }}>
                   🔔 ({unreadNotifications.length}) new
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#fff', fontSize: 13 }}>Primary:</label>
                <select
                  value={primaryCurrency}
                  onChange={(e) => handlePrimaryCurrencyChange(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: 'none' }}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <button style={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </div>
    </div>


      {/* SUMMARY CARDS */}
    <div style={styles.summary}>
        <SummaryCard
            title="Income"
            value={dashboard.total_income}
            color="#4CAF50"
        />
        <SummaryCard
            title="Expense"
            value={dashboard.total_expense}
            color="#F44336"
        />
        <SummaryCard
            title="Savings"
            value={dashboard.savings}
            color="#2196F3"
        />
    </div>

    {/* MONTHLY BAR CHART */}
    <section style={styles.section}>
        <h3>Monthly Income vs Expense</h3>

        {monthlyChartData.length === 0 ? (
            <p>No monthly data yet</p>
        ) : (
            <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
                <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v, dashboard.base_currency)} />
                <Legend />

                <Bar dataKey="income" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#F44336" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        )}
    </section>

    {/* NOTIFICATIONS PANEL */}
    {notifications.length > 0 && (
      <section style={{ ...styles.section, marginTop: 0 }}>
        <h3>Notifications</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: n.is_read ? '#fafafa' : '#fff8e1', borderRadius: 6 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
                <div style={{ fontWeight: n.is_read ? 500 : 700 }}>{n.type.replace('_',' ')}</div>
                <div style={{ fontSize: 13, color: '#333' }}>{n.message}</div>
                <div style={{ fontSize: 12, color: '#777' }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.is_read && <button style={{ ...styles.primaryBtn, padding: '6px 8px' }} onClick={() => handleNotificationClick(n)}>Mark read</button>}
            </div>
          ))}
        </div>
      </section>
    )}

    <ReceiptModal open={receiptModal.open} url={receiptModal.url} filename={receiptModal.filename} onClose={() => setReceiptModal({ open: false, url: null, filename: null })} />

    {toastMessage && <Toast message={toastMessage} />}


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
                      <div style={{ ...styles.transAmount, color: '#2e7d32' }}>
                        +{formatCurrency(t.amount, t.currency)}
                        <span style={{ fontSize: 12, color: "#777", marginLeft: 6 }}>
                          ({formatCurrency(t.base_amount, "INR")})
                        </span>
                        {t.receipt_id && (
                          <div style={{ marginTop: 6 }}>
                            <button onClick={() => handleViewReceipt(t.receipt_id)} style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0 }}>View Receipt</button>
                          </div>
                        )}
                      </div>
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
                      <div style={{ ...styles.transAmount, color: '#c62828' }}>
                        -{formatCurrency(t.amount, t.currency)}
                        <span style={{ fontSize: 12, color: "#777", marginLeft: 6 }}>
                          ({formatCurrency(t.base_amount, "INR")})
                        </span>
                        {t.receipt_id && (
                          <div style={{ marginTop: 6 }}>
                            <button onClick={() => handleViewReceipt(t.receipt_id)} style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0 }}>View Receipt</button>
                          </div>
                        )}
                      </div>
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

            <select
                value={transactionForm.currency}
                onChange={(e) =>
                    setTransactionForm({
                    ...transactionForm,
                    currency: e.target.value
                    })
                }
                style={styles.input}
                >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
            </select>

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

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setTransactionReceipt(e.target.files && e.target.files[0])}
            style={{ marginTop: 6 }}
          />

          <button type="submit" style={styles.primaryBtn}>Add Transaction</button>
        </form>
      </section>

      <ImportStatementSection />

      {/* BUDGETS */}
        <section style={styles.section}>
        <h3>Budgets</h3>

        {/* Create budget form */}
        <form
            onSubmit={handleAddBudget}
            style={{
            display: "grid",
            gap: "8px",
            maxWidth: 420,
            marginBottom: 12
            }}
        >
            <select
            value={budgetForm.category_id}
            onChange={(e) =>
                setBudgetForm({ ...budgetForm, category_id: e.target.value })
            }
            style={styles.input}
            >
            <option value="">Select Expense Category</option>
            {categories
                .filter((c) => c.type === "expense")
                .map((c) => (
                <option key={c.id} value={c.id}>
                    {c.name}
                </option>
                ))}
            </select>

            <input
            placeholder="Budget amount"
            type="number"
            value={budgetForm.amount}
            onChange={(e) =>
                setBudgetForm({ ...budgetForm, amount: e.target.value })
            }
            style={styles.input}
            />

            <input
            type="month"
            value={budgetForm.month}
            onChange={(e) =>
                setBudgetForm({ ...budgetForm, month: e.target.value })
            }
            style={styles.input}
            />

            <select
            value={budgetForm.currency}
            onChange={(e) =>
                setBudgetForm({ ...budgetForm, currency: e.target.value })
            }
            style={styles.input}
            >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            </select>

            <button type="submit" style={styles.primaryBtn}>
            Create Budget
            </button>
        </form>

        {budgets.length === 0 ? (
            <p>No budgets set</p>
            ) : (
            sortedBudgetMonths.map((monthKey) => {
                const monthBudgets = groupedBudgets[monthKey];

                const [year, month] = monthKey.split("-");
                const monthLabel = new Date(year, month - 1).toLocaleString(
                "default",
                { month: "long", year: "numeric" }
                );

                // MONTH SUMMARY
                const totalBudget = monthBudgets.reduce(
                (sum, b) => sum + Number(b.base_amount || 0),
                0
                );

                const totalSpent = monthBudgets.reduce(
                (sum, b) => sum + Number(b.spent || 0),
                0
                );

                return (
                <div
                    key={monthKey}
                    style={{
                    marginBottom: 28,
                    paddingBottom: 16,
                    borderBottom: "1px solid #eee"
                    }}
                >
                    {/* MONTH HEADER */}
                    <div style={{ marginBottom: 10 }}>
                    <h4 style={{ margin: 0 }}>{monthLabel}</h4>

                    <small style={{ color: "#666" }}>
                        {formatCurrency(totalSpent, monthBudgets[0].base_currency)}
                        {" / "}
                        {formatCurrency(totalBudget, monthBudgets[0].base_currency)}
                        {" • Remaining "}
                        {formatCurrency(
                        totalBudget - totalSpent,
                        monthBudgets[0].base_currency
                        )}
                    </small>
                    </div>

                    {monthBudgets.map((b) => {
                    const spentToShow = Number(b.spent || 0);
                    const percent =
                        (spentToShow / Number(b.base_amount || 1)) * 100;

                    return (
                        <div key={b.id} style={styles.budgetCard}>
                        <div style={styles.row}>
                            <strong>{b.category}</strong>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>
                                {formatCurrency(spentToShow, b.base_currency)} /{" "}
                                {formatCurrency(b.base_amount, b.base_currency)}
                              </span>
                              <button onClick={() => handleDeleteBudget(b.id)} style={styles.dangerBtn}>Delete</button>
                            </div>
                        </div>

                        <div style={{ fontSize: 12, color: "#777" }}>
                            Budget:{" "}
                            {formatCurrency(b.budget_amount, b.currency)} (
                            {formatCurrency(b.base_amount, b.base_currency)})
                        </div>

                        <div style={styles.progressBar}>
                            <div
                            style={{
                                ...styles.progressFill,
                                width: `${Math.min(percent, 100)}%`,
                                background:
                                percent > 100 ? "#F44336" : "#4CAF50"
                            }}
                            />
                        </div>

                        <small>
                            Remaining:{" "}
                            {formatCurrency(
                            Number(b.base_amount) - spentToShow,
                            b.base_currency
                            )}
                        </small>
                        </div>
                    );
                    })}
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
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
        }).format(Number(value))
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
  maxWidth: "1400px",
  margin: "auto",
  fontFamily: "Inter, Arial, sans-serif",
  background: "#f5f5dc",
  minHeight: "100vh"
  },

  header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 28px",
  borderRadius: "12px",
  marginBottom: "30px",
  background: "linear-gradient(135deg, #1976d2, #42a5f5)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
  },
    headerTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "0.3px"
    },

    headerSubtitle: {
    margin: "4px 0 0 0",
    opacity: 0.9,
    fontSize: "14px"
    },

  logoutBtn: {
  padding: "10px 16px",
  background: "#ffffff",
  color: "#1976d2",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.2s",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
  },

  summary: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "20px"
  },
  card: {
    flex: 1,
    background: "#fff",
    padding: "15px",
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
