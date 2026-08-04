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

  // Form toggling state (will be displayed as Modal overlay)
  const [showForm, setShowForm] = useState<boolean>(false);
  // Mode state: null represents "Create Mode", string represents "Edit Mode" with target ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form input states (temporary component local states)
  const [companyName, setCompanyName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [status, setStatus] = useState<JobApplication['status']>('applied');
  const [appliedDate, setAppliedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  // Frontend field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    companyName?: string;
    position?: string;
    appliedDate?: string;
    status?: string;
  }>({});

  // Submit status states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Custom Deletion Confirmation Modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Success Notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const showSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleCreateClick = () => {
    setCompanyName('');
    setPosition('');
    setStatus('applied');
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setEditingId(null);
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
  };

  const handleEditClick = (app: JobApplication) => {
    setCompanyName(app.companyName);
    setPosition(app.position);
    setStatus(app.status);
    setAppliedDate(app.appliedDate);
    setNote(app.note || '');
    setEditingId(app.id);
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
  };

  const handleCancelClick = () => {
    setShowForm(false);
    setEditingId(null);
    setSubmitError(null);
    setFieldErrors({});
  };

  const handleStartDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
    setDeleteError(null);
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    const trimmedCompany = companyName.trim();
    const trimmedPosition = position.trim();
    const trimmedDate = appliedDate.trim();

    if (!trimmedCompany) {
      errors.companyName = '公司名稱不可為空。';
    }

    if (!trimmedPosition) {
      errors.position = '職缺名稱不可為空。';
    }

    if (!trimmedDate) {
      errors.appliedDate = '應徵日期不可為空。';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmedDate)) {
        errors.appliedDate = '日期格式必須為 YYYY-MM-DD。';
      }
    }

    const validStatuses: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(status)) {
      errors.status = '無效的進度狀態選項。';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        companyName: companyName.trim(),
        position: position.trim(),
        status,
        appliedDate: appliedDate.trim(),
        note: note.trim() || undefined,
      };

      if (editingId !== null) {
        await dispatch(updateApplication({ id: editingId, updates: payload })).unwrap();
        showSuccessToast('修改求職紀錄成功！');
      } else {
        await dispatch(addApplication(payload)).unwrap();
        showSuccessToast('新增求職紀錄成功！');
      }

      setCompanyName('');
      setPosition('');
      setStatus('applied');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setShowForm(false);
      setEditingId(null);
      setFieldErrors({});
    } catch (err: any) {
      console.error('Submit application error:', err);
      setSubmitError(err || '儲存失敗，請檢查網路連線或稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    try {
      setDeletingId(id);
      setDeleteError(null);

      await dispatch(deleteApplication(id)).unwrap();
      showSuccessToast('刪除求職紀錄成功！');
      setDeleteConfirmId(null); // Close confirm modal
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
      {/* Toast Success Notification */}
      {successMessage && (
        <div className="alert alert-success toast-notification">
          ✨ {successMessage}
        </div>
      )}

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

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={handleCancelClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? '編輯求職紀錄' : '新增求職紀錄'}</h2>
                <button className="btn-close-modal" onClick={handleCancelClick} disabled={submitting}>&times;</button>
              </div>
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
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (fieldErrors.companyName) {
                          setFieldErrors(prev => ({ ...prev, companyName: undefined }));
                        }
                      }}
                      placeholder="例如: Google, TSMC..."
                      required
                      disabled={submitting}
                    />
                    {fieldErrors.companyName && (
                      <span className="field-error-text">{fieldErrors.companyName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="position">職缺名稱 *</label>
                    <input
                      id="position"
                      type="text"
                      value={position}
                      onChange={(e) => {
                        setPosition(e.target.value);
                        if (fieldErrors.position) {
                          setFieldErrors(prev => ({ ...prev, position: undefined }));
                        }
                      }}
                      placeholder="例如: 前端工程師, 軟體實習生..."
                      required
                      disabled={submitting}
                    />
                    {fieldErrors.position && (
                      <span className="field-error-text">{fieldErrors.position}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">進度狀態 *</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as JobApplication['status']);
                        if (fieldErrors.status) {
                          setFieldErrors(prev => ({ ...prev, status: undefined }));
                        }
                      }}
                      disabled={submitting}
                    >
                      <option value="applied">已投遞</option>
                      <option value="interview">面試中</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">未錄取</option>
                    </select>
                    {fieldErrors.status && (
                      <span className="field-error-text">{fieldErrors.status}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="appliedDate">應徵日期 *</label>
                    <input
                      id="appliedDate"
                      type="date"
                      value={appliedDate}
                      onChange={(e) => {
                        setAppliedDate(e.target.value);
                        if (fieldErrors.appliedDate) {
                          setFieldErrors(prev => ({ ...prev, appliedDate: undefined }));
                        }
                      }}
                      required
                      disabled={submitting}
                    />
                    {fieldErrors.appliedDate && (
                      <span className="field-error-text">{fieldErrors.appliedDate}</span>
                    )}
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
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ 確定刪除紀錄？</h2>
                <button className="btn-close-modal" onClick={() => setDeleteConfirmId(null)} disabled={deletingId !== null}>&times;</button>
              </div>
              {deleteError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <strong>刪除失敗：</strong> {deleteError}
                </div>
              )}
              <p>
                您即將刪除「<strong>{deleteConfirmName}</strong>」的求職紀錄。此操作無法復原，是否確定？
              </p>
              <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-cancel" 
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deletingId !== null}
                >
                  取消
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDeleteClick(deleteConfirmId)}
                  disabled={deletingId !== null}
                >
                  {deletingId ? '刪除中...' : '確定刪除'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        <section className="list-card">
          <div className="list-header">
            <h2>求職進度清單</h2>
            <div className="list-actions">
              <button className="btn-add" onClick={handleCreateClick}>
                ➕ 新增求職紀錄
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

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>資料載入中，請稍候...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <strong>連線錯誤：</strong> {error} <br />
              請確認後端伺服器已啟動且網路連線正常。
              <div style={{ marginTop: '12px' }}>
                <button className="btn-retry" onClick={() => dispatch(fetchApplications())}>
                  🔄 重新載入
                </button>
              </div>
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
                        <td data-label="公司名稱" className="font-bold">{app.companyName}</td>
                        <td data-label="職缺名稱">{app.position}</td>
                        <td data-label="狀態">
                          <span className={`status-badge badge-${app.status}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </td>
                        <td data-label="應徵日期">{app.appliedDate}</td>
                        <td data-label="備註" className="text-muted">{app.note || '-'}</td>
                        <td data-label="操作">
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
                              onClick={() => handleStartDelete(app.id, app.companyName)}
                              disabled={deletingId !== null}
                            >
                              🗑️ 刪除
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
