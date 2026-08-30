export default function SuperAdminDashboard() {
  return (
    <div className="sa-content">
      <div className="sa-page-head">
        <div>
          <h1 className="sa-page-title">Welcome back, Super Admin</h1>
          <p className="sa-page-sub">Here's what's happening in your system today.</p>
        </div>
        <div className="sa-head-actions">
          <select className="sa-select">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="sa-btn-primary">Export Report</button>
        </div>
      </div>

      <div className="sa-stats">
        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-teal">&#128101;</span>
            <span className="sa-stat-label">Total Users</span>
          </div>
          <div className="sa-stat-value">1,342</div>
          <div className="sa-stat-delta">+32 this month</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-blue">&#127760;</span>
            <span className="sa-stat-label">Domains / Customers</span>
          </div>
          <div className="sa-stat-value">128</div>
          <div className="sa-stat-delta">+18 this month</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-teal">&#128203;</span>
            <span className="sa-stat-label">Subscribers</span>
          </div>
          <div className="sa-stat-value">214</div>
          <div className="sa-stat-delta">+11 this month</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-amber">&#128196;</span>
            <span className="sa-stat-label">Pending Credit Papers</span>
          </div>
          <div className="sa-stat-value">23</div>
          <div className="sa-stat-delta">+6 this month</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-teal">&#129302;</span>
            <span className="sa-stat-label">AI Credits Used</span>
          </div>
          <div className="sa-stat-value">3.42 TB</div>
          <div className="sa-stat-delta">+7% this month</div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-header">
            <span className="sa-stat-icon sa-stat-green">&#10004;</span>
            <span className="sa-stat-label">System Health</span>
          </div>
          <div className="sa-stat-value" style={{ color: '#059669', fontSize: '1.25rem' }}>Healthy</div>
          <div className="sa-stat-delta" style={{ color: '#94a3b8' }}>All systems operational</div>
        </div>
      </div>

      <div className="sa-cards-row">
        <div className="sa-card">
          <div className="sa-card-head">
            <h3 className="sa-card-title">Pending Credit Papers</h3>
          </div>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Deal Name</th>
                  <th>Company</th>
                  <th>Paper Type</th>
                  <th>Stage</th>
                  <th>Pending With</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sa-strong">Harbor Hotel Project</td>
                  <td>Harbor Ventures</td>
                  <td><span className="sa-badge sa-badge-blue">Construction Loan</span></td>
                  <td>Checker Review</td>
                  <td>Michael Brown</td>
                  <td><span className="sa-badge sa-badge-red">High</span></td>
                </tr>
                <tr>
                  <td className="sa-strong">Metro Apartments</td>
                  <td>Metro Developers</td>
                  <td><span className="sa-badge sa-badge-violet">Bridge Loan</span></td>
                  <td>Maker Review</td>
                  <td>David Lee</td>
                  <td><span className="sa-badge sa-badge-amber">Medium</span></td>
                </tr>
                <tr>
                  <td className="sa-strong">Riverisle Retail Center</td>
                  <td>Riverisle Group</td>
                  <td><span className="sa-badge sa-badge-blue">Construction Loan</span></td>
                  <td>Checker Review</td>
                  <td>Sarah Chen</td>
                  <td><span className="sa-badge sa-badge-red">High</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
