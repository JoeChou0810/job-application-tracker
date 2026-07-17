import { Router } from 'express';
import { getApplications, createApplication, updateApplication, deleteApplication } from '../controllers/applicationController';

const router = Router();

// GET /api/applications
router.get('/', getApplications);

// POST /api/applications
router.post('/', createApplication);

// PATCH /api/applications/:id
router.patch('/:id', updateApplication);

// DELETE /api/applications/:id
router.delete('/:id', deleteApplication);

export default router;
