const Note = require('../models/Note');
const User = require("../models/User");

exports.createNote = async (req, res) => {
  const { title, content } = req.body;

  try {
    const note = await Note.create({ user: req.user, title, content });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { user: req.user },
        { sharedWith: { $elemMatch: { user: req.user } } }
      ]
    })
    .populate("sharedWith.user", "email") // <-- this line
    .sort({ updatedAt: -1 });

    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
};


exports.updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const userId = req.user;

    const isOwner = note.user.toString() === userId;

    const isEditor = note.sharedWith.some(
      (entry) => entry.user.toString() === userId && entry.canEdit
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: "You don't have permission to edit this note" });
    }

    note.title = title;
    note.content = content;
    await note.save();

    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to update note", error: err.message });
  }
};


exports.deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await Note.findOneAndDelete({ _id: id, user: req.user });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
};


exports.shareNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Only the owner can share
    if (note.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { email, canEdit } = req.body;

    const targetUser = await User.findOne({ email });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Check if already shared
    const alreadyShared = note.sharedWith.find((entry) =>
      entry.user.toString() === targetUser._id.toString()
    );

    if (alreadyShared) {
      alreadyShared.canEdit = canEdit; // update permission
    } else {
      note.sharedWith.push({
        user: targetUser._id,
        canEdit: !!canEdit,
      });
    }

    await note.save();
    res.json({ message: "Note shared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error sharing note", error: err.message });
  }
};

exports.toggleAccess = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.user.toString() !== req.user)
      return res.status(403).json({ message: "Not allowed" });

    const sharedUser = note.sharedWith.find((entry) =>
      entry.user.toString() === req.params.userId
    );

    if (!sharedUser)
      return res.status(404).json({ message: "Shared user not found" });

    sharedUser.canEdit = !sharedUser.canEdit;
    await note.save();

    res.json({ message: "Access toggled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle access", error: err.message });
  }
};


exports.revokeAccess = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const note = await Note.findById(id);
    if (!note || note.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not allowed" });
    }

    note.sharedWith = note.sharedWith.filter(entry => entry.user.toString() !== userId);
    await note.save();
    res.json({ message: "Access revoked" });
  } catch (err) {
    res.status(500).json({ message: "Failed to revoke access", error: err.message });
  }
};



