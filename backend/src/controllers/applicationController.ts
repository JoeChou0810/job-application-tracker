import { Request, Response, NextFunction } from 'express';
import { mockJobApplications } from '../models/mockData';
import { JobApplication, ApplicationStatus } from '../types/application';

/**
 * GET /api/applications
 * Returns all job applications with basic error handling
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applications = mockJobApplications;
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/applications
 * Creates a new job application with input validation
 */
export const createApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyName, position, status, appliedDate, note } = req.body;

    // 1. Validation
    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      res.status(400).json({ status: 'error', message: '公司名稱 (companyName) 欄位不可為空且必須是字串。' });
      return;
    }

    if (!position || typeof position !== 'string' || !position.trim()) {
      res.status(400).json({ status: 'error', message: '職缺名稱 (position) 欄位不可為空且必須是字串。' });
      return;
    }

    if (!status || typeof status !== 'string') {
      res.status(400).json({ status: 'error', message: '狀態 (status) 欄位不可為空。' });
      return;
    }

    const validStatuses: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(status as ApplicationStatus)) {
      res.status(400).json({ 
        status: 'error', 
        message: `無效的狀態值。狀態必須是以下之一: ${validStatuses.join(', ')}。` 
      });
      return;
    }

    if (!appliedDate || typeof appliedDate !== 'string' || !appliedDate.trim()) {
      res.status(400).json({ status: 'error', message: '應徵日期 (appliedDate) 欄位不可為空。' });
      return;
    }

    // Basic date format check YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appliedDate)) {
      res.status(400).json({ status: 'error', message: '應徵日期格式必須為 YYYY-MM-DD。' });
      return;
    }

    // 2. Generate Application ID and construct item
    const newApplication: JobApplication = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName: companyName.trim(),
      position: position.trim(),
      status: status as ApplicationStatus,
      appliedDate: appliedDate.trim(),
      note: note && typeof note === 'string' ? note.trim() : undefined
    };

    // 3. Save to memory array
    mockJobApplications.push(newApplication);

    // 4. Return 201 Created with JSON representation of the new item
    res.status(201).json(newApplication);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/applications/:id
 * Updates an existing job application by ID
 */
export const updateApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { companyName, position, status, appliedDate, note } = req.body;

    // 1. Locate the application
    const application = mockJobApplications.find((app) => app.id === id);
    if (!application) {
      res.status(404).json({ status: 'error', message: '找不到指定的求職紀錄。' });
      return;
    }

    // 2. Validate and update input fields
    if (companyName !== undefined) {
      if (typeof companyName !== 'string' || !companyName.trim()) {
        res.status(400).json({ status: 'error', message: '公司名稱 (companyName) 必須是有效字串且不可為空。' });
        return;
      }
      application.companyName = companyName.trim();
    }

    if (position !== undefined) {
      if (typeof position !== 'string' || !position.trim()) {
        res.status(400).json({ status: 'error', message: '職缺名稱 (position) 必須是有效字串且不可為空。' });
        return;
      }
      application.position = position.trim();
    }

    if (status !== undefined) {
      if (typeof status !== 'string') {
        res.status(400).json({ status: 'error', message: '狀態 (status) 必須是字串。' });
        return;
      }
      const validStatuses: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];
      if (!validStatuses.includes(status as ApplicationStatus)) {
        res.status(400).json({ 
          status: 'error', 
          message: `無效的狀態值。狀態必須是以下之一: ${validStatuses.join(', ')}。` 
        });
        return;
      }
      application.status = status as ApplicationStatus;
    }

    if (appliedDate !== undefined) {
      if (typeof appliedDate !== 'string' || !appliedDate.trim()) {
        res.status(400).json({ status: 'error', message: '應徵日期 (appliedDate) 必須是有效字串。' });
        return;
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appliedDate)) {
        res.status(400).json({ status: 'error', message: '應徵日期格式必須為 YYYY-MM-DD。' });
        return;
      }
      application.appliedDate = appliedDate.trim();
    }

    if (note !== undefined) {
      application.note = note && typeof note === 'string' && note.trim() ? note.trim() : undefined;
    }

    // 3. Return 200 OK with the updated application
    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/applications/:id
 * Deletes an existing job application by ID
 */
export const deleteApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Locate the application index
    const index = mockJobApplications.findIndex((app) => app.id === id);
    if (index === -1) {
      res.status(404).json({ status: 'error', message: '找不到指定的求職紀錄。' });
      return;
    }

    // 2. Remove application from memory array
    const [deletedApplication] = mockJobApplications.splice(index, 1);

    // 3. Return 200 OK with the deleted application
    res.status(200).json(deletedApplication);
  } catch (error) {
    next(error);
  }
};
