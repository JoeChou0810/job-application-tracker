import { Request, Response, NextFunction } from 'express';
import { query, get, run } from '../config/db';
import { JobApplication, ApplicationStatus } from '../types/application';

// Database row structure
interface DBApplication {
  id: string;
  company_name: string;
  position: string;
  status: string;
  applied_date: string;
  note: string | null;
}

// Convert DB schema format (snake_case) to client/frontend API format (camelCase)
const mapToClient = (dbApp: DBApplication): JobApplication => {
  return {
    id: dbApp.id,
    companyName: dbApp.company_name,
    position: dbApp.position,
    status: dbApp.status as ApplicationStatus,
    appliedDate: dbApp.applied_date,
    note: dbApp.note === null ? undefined : dbApp.note,
  };
};

/**
 * GET /api/applications
 * Returns all job applications from SQLite
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await query<DBApplication>('SELECT * FROM applications');
    const applications = rows.map(mapToClient);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/applications
 * Creates a new job application in SQLite
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

    // 2. Generate ID and parse inputs
    const newId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const companyVal = companyName.trim();
    const positionVal = position.trim();
    const statusVal = status as ApplicationStatus;
    const appliedDateVal = appliedDate.trim();
    const noteVal = note && typeof note === 'string' ? note.trim() : null;

    // 3. Save to SQLite
    await run(
      `INSERT INTO applications (id, company_name, position, status, applied_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId, companyVal, positionVal, statusVal, appliedDateVal, noteVal]
    );

    const newApp: JobApplication = {
      id: newId,
      companyName: companyVal,
      position: positionVal,
      status: statusVal,
      appliedDate: appliedDateVal,
      note: noteVal === null ? undefined : noteVal
    };

    // 4. Return 201 Created
    res.status(201).json(newApp);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/applications/:id
 * Updates an existing job application in SQLite
 */
export const updateApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { companyName, position, status, appliedDate, note } = req.body;

    // 1. Find original row
    const row = await get<DBApplication>('SELECT * FROM applications WHERE id = ?', [id]);
    if (!row) {
      res.status(404).json({ status: 'error', message: '找不到指定的求職紀錄。' });
      return;
    }

    let companyVal = row.company_name;
    let positionVal = row.position;
    let statusVal = row.status as ApplicationStatus;
    let appliedDateVal = row.applied_date;
    let noteVal = row.note;

    // 2. Validate and update fields
    if (companyName !== undefined) {
      if (typeof companyName !== 'string' || !companyName.trim()) {
        res.status(400).json({ status: 'error', message: '公司名稱 (companyName) 必須是有效字串且不可為空。' });
        return;
      }
      companyVal = companyName.trim();
    }

    if (position !== undefined) {
      if (typeof position !== 'string' || !position.trim()) {
        res.status(400).json({ status: 'error', message: '職缺名稱 (position) 必須是有效字串且不可為空。' });
        return;
      }
      positionVal = position.trim();
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
      statusVal = status as ApplicationStatus;
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
      appliedDateVal = appliedDate.trim();
    }

    if (note !== undefined) {
      noteVal = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    }

    // 3. Update database
    await run(
      `UPDATE applications 
       SET company_name = ?, position = ?, status = ?, applied_date = ?, note = ?
       WHERE id = ?`,
      [companyVal, positionVal, statusVal, appliedDateVal, noteVal, id]
    );

    const updatedApp: JobApplication = {
      id,
      companyName: companyVal,
      position: positionVal,
      status: statusVal,
      appliedDate: appliedDateVal,
      note: noteVal === null ? undefined : noteVal
    };

    res.status(200).json(updatedApp);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/applications/:id
 * Deletes an existing job application by ID from SQLite
 */
export const deleteApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Find original row
    const row = await get<DBApplication>('SELECT * FROM applications WHERE id = ?', [id]);
    if (!row) {
      res.status(404).json({ status: 'error', message: '找不到指定的求職紀錄。' });
      return;
    }

    // 2. Delete from database
    await run('DELETE FROM applications WHERE id = ?', [id]);

    const deletedApp = mapToClient(row);
    res.status(200).json(deletedApp);
  } catch (error) {
    next(error);
  }
};
