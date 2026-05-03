import { Router } from 'express'
import {
  listDocuments,
  getDocument,
  cancelDocument,
  sendReminder,
  exportSignedDocument,
  exportSignedByRecipient,
} from '../controllers/dashboardController.js'

const router = Router()

router.get('/documents',                                    listDocuments)
router.get('/documents/:id',                               getDocument)
router.post('/documents/:id/cancel',                       cancelDocument)
router.post('/documents/:id/remind/:recipientId',          sendReminder)
router.get('/documents/:id/export/:recipientId',           exportSignedByRecipient)
router.get('/documents/:id/export',                        exportSignedDocument)

export default router
