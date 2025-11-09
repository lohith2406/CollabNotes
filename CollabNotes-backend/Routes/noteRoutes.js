const express = require('express');
const router = express.Router();
const auth = require('../Middleware/authMiddleware');
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  shareNote,
  toggleAccess,
  revokeAccess
} = require('../controllers/noteController');

router.use(auth); // protect all note routes

router.post('/', createNote);
router.get('/', getNotes);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.put("/:id/share", shareNote);
router.put("/:id/toggle-access/:userId", toggleAccess);
router.delete("/:id/revoke/:userId", revokeAccess);



module.exports = router;
