import React, { useState, useEffect } from 'react';

// --- STYLES OBJECT FOR EASY CUSTOM THEME ---
const styles = {
  container: { fontFamily: 'Segoe UI, Roboto, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', margin: 0 },
  navbar: { backgroundColor: '#4f46e5', color: '#ffffff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' },
  card: { backgroundColor: '#ffffff', padding: '35px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  input: { width: '100%', padding: '12px', margin: '10px 0 20px 0', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '15px' },
  btn: { width: '100%', backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },
  error: { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' },
  layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '30px', padding: '30px', maxWidth: '1400px', margin: '0 auto' },
  sidebar: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '10px', height: 'fit-content' },
  sideBtn: (active) => ({ width: '100%', textAlign: 'left', padding: '12px 15px', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: active ? '#e0e7ff' : 'transparent', color: active ? '#4338ca' : '#475569', transition: '0.2s' }),
  mainContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  gridForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' },
  th: { backgroundColor: '#f8fafc', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600' },
  td: { padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#334155' },
  badge: (status) => ({ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: status === 'Paid' || status === 'Present' ? '#dcfce7' : '#fee2e2', color: status === 'Paid' || status === 'Present' ? '#166534' : '#991b1b' }),
  actionBtn: (type) => ({ padding: '6px 12px', border: 'none', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginRight: '5px', backgroundColor: type === 'present' ? '#16a34a' : '#dc2626' }),
  // Added custom style configuration for the collection button interface
  payBtn: { backgroundColor: '#4f46e5', color: '#ffffff', padding: '6px 12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  // Business App States
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchFees();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  const fetchStudents = async () => {
    const res = await fetch('http://localhost:5000/api/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setStudents(data);
  };

  const fetchFees = async () => {
    const res = await fetch('http://localhost:5000/api/fees', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setFees(data);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roll_no: rollNo, name, grade, guardian_phone: phone })
    });
    if (res.ok) {
      fetchStudents();
      fetchFees();
      setRollNo(''); setName(''); setGrade(''); setPhone('');
    } else {
      alert("Error adding student. Ensure Roll No is unique.");
    }
  };

  const markAttendance = async (studentId, status) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('http://localhost:5000/api/attendance', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ student_id: studentId, date: today, status })
    });
    if (res.ok) {
      alert(`Successfully marked ${status} for today!`);
    }
  };

  // NEW FUNCTION: Sends the update request directly to your newly built backend endpoint
  const payFee = async (feeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/fees/${feeId}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Payment Processed Successfully!");
        fetchFees(); // Instantly update totals and tags right on screen
      } else {
        alert("Failed to record payment initialization.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDERING VIEWS ---
  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.loginWrapper}>
          <div style={styles.card}>
            <h2 style={{ textAlign: 'center', color: '#4f46e5', margin: '0 0 10px 0', fontSize: '28px' }}>ShikshaSoft</h2>
            <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 25px 0' }}>School Admin Portal</p>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleLogin}>
              <label style={{ fontWeight: '600', color: '#475569' }}>Admin Email</label>
              <input type="email" style={styles.input} placeholder="admin@shikshasoft.com" value={email} onChange={e => setEmail(e.target.value)} required />
              
              <label style={{ fontWeight: '600', color: '#475569' }}>Password</label>
              <input type="password" style={styles.input} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              
              <button type="submit" style={styles.btn}>Sign In</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>ShikshaSoft Management System</h1>
        <button onClick={handleLogout} style={{ ...styles.btn, width: 'auto', padding: '8px 16px', backgroundColor: '#ef4444' }}>Sign Out</button>
      </nav>

      <div style={styles.layout}>
        {/* Navigation Sidebar */}
        <div style={styles.sidebar}>
          <button onClick={() => setActiveTab('students')} style={styles.sideBtn(activeTab === 'students')}>👨‍🎓 Students Registry</button>
          <button onClick={() => setActiveTab('attendance')} style={styles.sideBtn(activeTab === 'attendance')}>📅 Take Attendance</button>
          <button onClick={() => setActiveTab('fees')} style={styles.sideBtn(activeTab === 'fees')}>💰 Fee Ledgers</button>
        </div>

        {/* Dashboard Panels */}
        <div style={styles.mainContent}>
          {activeTab === 'students' && (
            <div>
              <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Student Enrollment</h2>
              <form onSubmit={handleAddStudent} style={styles.gridForm}>
                <input type="text" placeholder="Roll Number (e.g. 101)" style={{...styles.input, margin: 0}} value={rollNo} onChange={e => setRollNo(e.target.value)} required />
                <input type="text" placeholder="Student Full Name" style={{...styles.input, margin: 0}} value={name} onChange={e => setName(e.target.value)} required />
                <input type="text" placeholder="Class / Grade (e.g. Class 10)" style={{...styles.input, margin: 0}} value={grade} onChange={e => setGrade(e.target.value)} required />
                <input type="text" placeholder="Guardian Phone Number" style={{...styles.input, margin: 0}} value={phone} onChange={e => setPhone(e.target.value)} required />
                <button type="submit" style={{ ...styles.btn, gridColumn: 'span 2', margin: '10px 0 0 0' }}>Register Student</button>
              </form>

              <h3 style={{ color: '#1e293b', margin: '30px 0 10px 0' }}>Registered Students ({students.length})</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Roll No</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Guardian Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={styles.td}><b>{s.roll_no}</b></td>
                      <td style={styles.td}>{s.name}</td>
                      <td style={styles.td}>{s.grade}</td>
                      <td style={styles.td}>{s.guardian_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h2 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Daily Attendance Log</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Mark daily logs directly into the system database.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{s.name}</strong>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{s.grade} | Roll No: {s.roll_no}</div>
                    </div>
                    <div>
                      <button onClick={() => markAttendance(s.id, 'Present')} style={styles.actionBtn('present')}>Present</button>
                      <button onClick={() => markAttendance(s.id, 'Absent')} style={styles.actionBtn('absent')}>Absent</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div>
              <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Financial Fee Ledger</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Billable Amt</th>
                    <th style={styles.th}>Cleared Amt</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th> {/* Added Header Column */}
                  </tr>
                </thead>
                <tbody>
                  {fees.length === 0 ? (
                    <tr><td colSpan="6" style={{...styles.td, textAlign: 'center', color: '#94a3b8'}}>No active invoices found. Register students to populate financial ledgers.</td></tr>
                  ) : (
                    fees.map(f => (
                      <tr key={f.id}>
                        <td style={styles.td}><b>{f.name}</b></td>
                        <td style={styles.td}>{f.grade}</td>
                        <td style={styles.td}>NPR {f.amount_due}</td>
                        <td style={{ ...styles.td, color: '#16a34a', fontWeight: 'bold' }}>NPR {f.amount_paid}</td>
                        <td style={styles.td}><span style={styles.badge(f.status)}>{f.status}</span></td>
                        <td style={styles.td}>
                          {/* Interactive Payment Switch Button */}
                          {f.status === 'Pending' ? (
                            <button onClick={() => payFee(f.id)} style={styles.payBtn}>Pay Fee</button>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>Completed ✓</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;