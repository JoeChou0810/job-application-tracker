import { JobApplication } from '../types/application';

export const mockJobApplications: JobApplication[] = [
  {
    id: 'app-1',
    companyName: 'Google',
    position: 'Frontend Engineer',
    status: 'applied',
    appliedDate: '2026-07-10',
    note: 'Applied through referral. Waiting for HR response.'
  },
  {
    id: 'app-2',
    companyName: 'Meta',
    position: 'React Developer',
    status: 'interview',
    appliedDate: '2026-07-08',
    note: 'Passed OA. Tech screen scheduled for next Monday.'
  },
  {
    id: 'app-3',
    companyName: 'TSMC',
    position: 'Software Engineer',
    status: 'offer',
    appliedDate: '2026-07-01',
    note: 'Received official offer letter. Package under review.'
  },
  {
    id: 'app-4',
    companyName: 'Microsoft',
    position: 'Full Stack Developer',
    status: 'rejected',
    appliedDate: '2026-06-25',
    note: 'Resume screening rejected. Try again in 6 months.'
  },
  {
    id: 'app-5',
    companyName: 'Netflix',
    position: 'Senior UI Engineer',
    status: 'applied',
    appliedDate: '2026-07-12',
    note: 'Applied online via career portal.'
  }
];
