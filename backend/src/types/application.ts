export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  appliedDate: string; // Format: YYYY-MM-DD
  note?: string;
}
