function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Total Sales</h3>
          <p className="value">$0</p>
        </div>
        <div className="card">
          <h3>Total Inventory</h3>
          <p className="value">0 Units</p>
        </div>
        <div className="card">
          <h3>Pending Orders</h3>
          <p className="value">0</p>
        </div>
        <div className="card">
          <h3>Active Projects</h3>
          <p className="value">0</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
