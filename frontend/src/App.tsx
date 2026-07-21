import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  fetchApplications,
  addApplication,
  updateApplication,
  deleteApplication,
  setSearchKeyword,
  setStatusFilter,
  selectApplications,
  selectSearchKeyword,
  selectStatusFilter,
  selectLoading,
  selectError,
  selectFilteredApplications,
  selectApplicationStats,
} from './features/applications/applicationsSlice';
import type { JobApplication, ApplicationStatus } from './types/application';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const filteredApplications = useAppSelector(selectFilteredApplications);
  const stats = useAppSelector(selectApplicationStats);
  const searchKeyword = useAppSelector(selectSearchKeyword);
  const statusFilter = useAppSelector(selectStatusFilter);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);

  // Form toggling state
  const [showForm, setShowForm] = useState<boolean>(false);
  // Mode state: null represents "Create Mode", string represents "Edit Mode" with target ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form input states (temporary component local states)
  const [companyName, setCompanyName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [status, setStatus] = useState<JobApplication['status']>('applied');
  const [appliedDate, setAppliedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  // Submit status states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Deletion status states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const handleCreateClick = () => {
    // Reset inputs and set to Create Mode
    setCompanyName('');
    setPosition('');
    setStatus('applied');
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setEditingId(null);
    setSubmitError(null);
    setShowForm(true);
  };

  const handleEditClick = (app: JobApplication) => {
    // Prefill inputs and set to Edit Mode
    setCompanyName(app.companyName);
    setPosition(app.position);
    setStatus(app.status);
    setAppliedDate(app.appliedDate);
    setNote(app.note || '');
    setEditingId(app.id);
    setSubmitError(null);
    setShowForm(true);
    
    // Smooth scroll to form card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelClick = () => {
    setShowForm(false);
    setEditingId(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !position.trim() || !appliedDate.trim()) {
      setSubmitError('請填寫所有必要欄位。');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        companyName: companyName.trim(),
        position: position.trim(),
        status,
        appliedDate,
        note: note.trim() || undefined,
      };

      if (editingId !== null) {
        await dispatch(updateApplication({ id: editingId, updates: payload })).unwrap();
      } else {
        await dispatch(addApplication(payload)).unwrap();
      }

      // Reset form fields and close
      setCompanyName('');
      setPosition('');
      setStatus('applied');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      console.error('Submit application error:', err);
      setSubmitError(err || '儲存失敗，請檢查網路連線或稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string, companyName: string) => {
    const confirmed = window.confirm(`確定要刪除「${companyName}」的求職紀錄嗎？`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setDeleteError(null);

      await dispatch(deleteApplication(id)).unwrap();
    } catch (err: any) {
      console.error('Delete application error:', err);
      setDeleteError(err || '刪除失敗，請檢查網路連線。');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusLabel = (status: JobApplication['status']) => {
    switch (status) {
      case 'applied': return '已投遞';
      case 'interview': return '面試中';
      case 'offer': return 'Offer';
      case 'rejected': return '未錄取';
      default: return status;
    }
  };

  const hasActiveFilter = searchKeyword.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="tracker-container">
      <header className="tracker-header">
        <div className="logo-section">
          <span className="logo-badge">🎯</span>
          <h1>求職進度管理系統</h1>
        </div>
        <div className={`status-indicator ${error ? 'disconnected' : 'connected'}`}>
          <span className="status-dot"></span>
          <span>後端狀態: {error ? '未連線' : '已連線 (Port 5000)'}</span>
        </div>
      </header>

      <main className="tracker-main">
        {/* Dashboard Statistics Overview Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card card-total">
              <span className="stat-icon">📊</span>
              <div className="stat-info">
                <span className="stat-label">全部應徵數</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            <div className="stat-card card-applied">
              <span className="stat-icon">📩</span>
              <div className="stat-info">
                <span className="stat-label">已投遞</span>
                <span className="stat-value">{stats.applied}</span>
              </div>
            </div>
            <div className="stat-card card-interview">
              <span className="stat-icon">💬</span>
              <div className="stat-info">
                <span className="stat-label">面試中</span>
                <span className="stat-value">{stats.interview}</span>
              </div>
            </div>
            <div className="stat-card card-offer">
              <span className="stat-icon">🎉</span>
              <div className="stat-info">
                <span className="stat-label">Offer</span>
                <span className="stat-value">{stats.offer}</span>
              </div>
            </div>
            <div className="stat-card card-rejected">
              <span className="stat-icon">📁</span>
              <div className="stat-info">
                <span className="stat-label">未錄取</span>
                <span className="stat-value">{stats.rejected}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Shared Form Card (Create or Edit Mode) */}
        {showForm && (
          <section className="form-card">
            <h2>{editingId ? '編輯求職紀錄' : '新增求職紀錄'}</h2>
            {submitError && (
              <div className="alert alert-error">
                <strong>儲存失敗：</strong> {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="job-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="companyName">公司名稱 *</label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="例如: Google, TSMC..."
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="position">職缺名稱 *</label>
                  <input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="例如: 前端工程師, 軟體實習生..."
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">進度狀態 *</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobApplication['status'])}
                    disabled={submitting}
                  >
                    <option value="applied">已投遞</option>
                    <option value="interview">面試中</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">未錄取</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="appliedDate">應徵日期 *</label>
                  <input
                    id="appliedDate"
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="note">備註說明</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="面試細節、聯絡窗口等備註..."
                  rows={2}
                  disabled={submitting}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancelClick} disabled={submitting}>
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '儲存中...' : (editingId ? '儲存修改' : '確認新增')}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Applications List */}
        <section className="list-card">
          <div className="list-header">
            <h2>求職進度清單</h2>
            <div className="list-actions">
              <button className="btn-add" onClick={showForm && editingId === null ? handleCancelClick : handleCreateClick}>
                {showForm && editingId === null ? '取消新增' : '➕ 新增求職紀錄'}
              </button>
              {!loading && !error && (
                <span className="badge-count">
                  {hasActiveFilter
                    ? `顯示 ${filteredApplications.length} / 共 ${applications.length} 筆`
                    : `共 ${applications.length} 筆資料`}
                </span>
              )}
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="filter-bar">
            <div className="search-box">
              <input
                id="searchKeyword"
                type="text"
                value={searchKeyword}
                onChange={(e) => dispatch(setSearchKeyword(e.target.value))}
                placeholder="🔍 搜尋公司名稱或職缺名稱..."
                className="search-input"
              />
            </div>

            <div className="filter-box">
              <label htmlFor="statusFilter">狀態篩選：</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => dispatch(setStatusFilter(e.target.value as 'all' | ApplicationStatus))}
                className="filter-select"
              >
                <option value="all">全部</option>
                <option value="applied">已投遞</option>
                <option value="interview">面試中</option>
                <option value="offer">Offer</option>
                <option value="rejected">未錄取</option>
              </select>
            </div>
          </div>

          {deleteError && (
            <div className="alert alert-error">
              <strong>刪除失敗：</strong> {deleteError}
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>資料載入中，請稍候...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <strong>連線錯誤：</strong> {error} <br />
              請確認後端伺服器已啟動於 `http://localhost:5000`。
            </div>
          )}

          {!loading && !error && (
            <div className="table-responsive">
              {applications.length === 0 ? (
                <div className="empty-state">
                  <p>目前沒有求職紀錄</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="empty-state">
                  <p>找不到符合條件的求職紀錄</p>
                </div>
              ) : (
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>公司名稱</th>
                      <th>職缺名稱</th>
                      <th>狀態</th>
                      <th>應徵日期</th>
                      <th>備註</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className={`status-row-${app.status}`}>
                        <td className="font-bold">{app.companyName}</td>
                        <td>{app.position}</td>
                        <td>
                          <span className={`status-badge badge-${app.status}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </td>
                        <td>{app.appliedDate}</td>
                        <td className="text-muted">{app.note || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn-edit-row" 
                              onClick={() => handleEditClick(app)}
                              disabled={deletingId !== null}
                            >
                              ✏️ 編輯
                            </button>
                            <button 
                              className="btn-delete-row" 
                              onClick={() => handleDeleteClick(app.id, app.companyName)}
                              disabled={deletingId === app.id}
                            >
                              {deletingId === app.id ? '刪除中...' : '🗑️ 刪除'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="tracker-footer">
        <p>求職進度管理系統 © 2026 - 前後端 RESTful API 串接驗證</p>
      </footer>
    </div>
  );
}

export default App;
