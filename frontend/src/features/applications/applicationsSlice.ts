import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { JobApplication, ApplicationStatus } from '../../types/application';
import type { RootState } from '../../app/store';

// State interface
interface ApplicationsState {
  applications: JobApplication[];
  loading: boolean;
  error: string | null;
  searchKeyword: string;
  statusFilter: 'all' | ApplicationStatus;
}

const initialState: ApplicationsState = {
  applications: [],
  loading: false,
  error: null,
  searchKeyword: '',
  statusFilter: 'all',
};

// Statistics Interface
export interface ApplicationStats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

// Async Thunks
export const fetchApplications = createAsyncThunk<JobApplication[], void, { rejectValue: string }>(
  'applications/fetchApplications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/applications');
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || `HTTP 錯誤！狀態碼: ${response.status}`);
      }
      return data as JobApplication[];
    } catch (err: any) {
      return rejectWithValue(err.message || '連線後端伺服器失敗，請確認伺服器是否啟動。');
    }
  }
);

export const addApplication = createAsyncThunk<JobApplication, Omit<JobApplication, 'id'>, { rejectValue: string }>(
  'applications/addApplication',
  async (newApp, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApp),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || `HTTP 錯誤！狀態碼: ${response.status}`);
      }
      return data as JobApplication;
    } catch (err: any) {
      return rejectWithValue(err.message || '連線後端伺服器失敗');
    }
  }
);

export const updateApplication = createAsyncThunk<
  JobApplication,
  { id: string; updates: Omit<JobApplication, 'id'> },
  { rejectValue: string }
>(
  'applications/updateApplication',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || `HTTP 錯誤！狀態碼: ${response.status}`);
      }
      return data as JobApplication;
    } catch (err: any) {
      return rejectWithValue(err.message || '連線後端伺服器失敗');
    }
  }
);

export const deleteApplication = createAsyncThunk<string, string, { rejectValue: string }>(
  'applications/deleteApplication',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/applications/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || `HTTP 錯誤！狀態碼: ${response.status}`);
      }
      return id; // Return deleted ID on success
    } catch (err: any) {
      return rejectWithValue(err.message || '連線後端伺服器失敗');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setSearchKeyword(state, action: PayloadAction<string>) {
      state.searchKeyword = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<'all' | ApplicationStatus>) {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Applications
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '讀取資料失敗';
      })
      // Add Application
      .addCase(addApplication.fulfilled, (state, action) => {
        state.applications.push(action.payload);
      })
      // Update Application
      .addCase(updateApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex((app) => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      // Delete Application
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter((app) => app.id !== action.payload);
      });
  },
});

export const { setSearchKeyword, setStatusFilter } = applicationsSlice.actions;

// Selectors
export const selectApplications = (state: RootState) => state.applications.applications;
export const selectSearchKeyword = (state: RootState) => state.applications.searchKeyword;
export const selectStatusFilter = (state: RootState) => state.applications.statusFilter;
export const selectLoading = (state: RootState) => state.applications.loading;
export const selectError = (state: RootState) => state.applications.error;

// Memoized derived selector using createSelector for filtered applications
export const selectFilteredApplications = createSelector(
  [selectApplications, selectSearchKeyword, selectStatusFilter],
  (applications, searchKeyword, statusFilter) => {
    const trimmedKeyword = searchKeyword.trim().toLowerCase();

    return applications.filter((app) => {
      // 1. Keyword search (companyName OR position)
      const matchesKeyword =
        !trimmedKeyword ||
        app.companyName.toLowerCase().includes(trimmedKeyword) ||
        app.position.toLowerCase().includes(trimmedKeyword);

      // 2. Status filter
      const matchesStatus =
        statusFilter === 'all' || app.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }
);

// Memoized derived selector using createSelector for dashboard statistics (calculated from total applications)
export const selectApplicationStats = createSelector(
  [selectApplications],
  (applications): ApplicationStats => {
    const stats: ApplicationStats = {
      total: applications.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (app.status in stats) {
        stats[app.status as keyof Omit<ApplicationStats, 'total'>]++;
      }
    });

    return stats;
  }
);

export default applicationsSlice.reducer;
