const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
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
router.put("/:id/share", auth, shareNote);
router.put("/:id/toggle-access/:userId", auth, toggleAccess);
router.delete("/:id/revoke/:userId", auth, revokeAccess);



module.exports = router;
