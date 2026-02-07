import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {

  const fetchDashboard = async () => {
    const res = await fetch("http://localhost:6124/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setDashboard(data);
    setLoading(false);
  };

  const fetchBudgets = async () => {
    const res = await fetch("http://localhost:6124/api/budgets", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("BUDGET RESPONSE:", data);
    setBudgets(Array.isArray(data) ? data : data.budgets || []);

  };

  fetchDashboard();
  fetchBudgets();
  

}, [token]);

    
    
    if (loading) return <p style={{ padding: 40 }}>Loading dashboard...</p>;


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

      {/* BUDGET SECTION */}
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
                  <span>₹{b.spent} / ₹{b.budget_amount}</span>
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
                  Remaining: ₹{b.remaining}
                </small>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* COMPONENT */
function SummaryCard({ title, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <h4>{title}</h4>
      <p style={{ fontSize: 22, fontWeight: "bold" }}>₹{value}</p>
    </div>
  );
}

/* STYLES */
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
