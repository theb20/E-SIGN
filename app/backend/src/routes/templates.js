import { Router } from 'express'
import { listTemplates, createTemplate, deleteTemplate } from '../controllers/templateController.js'

const router = Router()

router.get('/',      listTemplates)
router.post('/',     createTemplate)
router.delete('/:id', deleteTemplate)

export default router
