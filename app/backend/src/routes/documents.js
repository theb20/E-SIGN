import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import {
  createDocument,
  saveFields,
  sendDocument,
  serveFile,
} from '../controllers/documentController.js'

const router = Router()

router.post('/',                upload.single('file'), createDocument)
router.put('/:id/fields',       saveFields)
router.post('/:id/send',        sendDocument)
router.get('/:id/file',         serveFile)

export default router
