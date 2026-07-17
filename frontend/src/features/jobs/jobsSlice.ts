import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Job {
  id: string;
  company: string;
  title: string;
  status: 'Applied' | 'Interviewing' | 'Offered' | 'Rejected' | 'Pending';
  date: string;
  notes?: string;
}

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  items: [
    {
      id: '1',
      company: 'Example Corp',
      title: 'Software Engineer',
      status: 'Applied',
      date: '2026-07-14',
      notes: 'Initial application submitted.',
    },
  ],
  loading: false,
  error: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs(state, action: PayloadAction<Job[]>) {
      state.items = action.payload;
    },
    addJob(state, action: PayloadAction<Job>) {
      state.items.push(action.payload);
    },
    updateJobStatus(
      state,
      action: PayloadAction<{ id: string; status: Job['status'] }>
    ) {
      const job = state.items.find((item) => item.id === action.payload.id);
      if (job) {
        job.status = action.payload.status;
      }
    },
    deleteJob(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setJobs, addJob, updateJobStatus, deleteJob } = jobsSlice.actions;
export default jobsSlice.reducer;
