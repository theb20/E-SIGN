import { Router } from 'express'
import {
  getSigningSession,
  submitSignature,
  completeDocument,
  refuseDocument,
  exportSignedByToken,
} from '../controllers/signingController.js'

const router = Router()

router.get('/:token',            getSigningSession)
router.post('/:token/signature', submitSignature)
router.post('/:token/complete',  completeDocument)
router.post('/:token/refuse',    refuseDocument)
router.get('/:token/export',     exportSignedByToken)

export default router
