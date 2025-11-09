const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Note = require('./Models/Note');
const User = require('./Models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Store active users per note room
const activeUsers = new Map(); // noteId -> Set of userIds

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      
      // Fetch user details
      const user = await User.findById(decoded.id).select('name email');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = { id: user._id.toString(), name: user.name, email: user.email };
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.user.id})`);

    // Join a note room
    socket.on('join-note', async (noteId) => {
      try {
        // Verify user has access to this note
        const note = await Note.findById(noteId);
        if (!note) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }

        const userId = socket.userId;
        const isOwner = note.user.toString() === userId;
        const hasAccess = note.sharedWith.some(
          (entry) => entry.user.toString() === userId
        );

        if (!isOwner && !hasAccess) {
          socket.emit('error', { message: 'You do not have access to this note' });
          return;
        }

        // Join the room
        socket.join(`note:${noteId}`);

        // Track active user
        if (!activeUsers.has(noteId)) {
          activeUsers.set(noteId, new Map());
        }
        activeUsers.get(noteId).set(socket.id, socket.user);

        // Notify others in the room
        socket.to(`note:${noteId}`).emit('user-joined', {
          user: socket.user,
          noteId
        });

        // Send current active users to the new joiner
        const users = Array.from(activeUsers.get(noteId).values());
        socket.emit('active-users', { users, noteId });

        console.log(`User ${socket.user.email} joined note ${noteId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join note', error: err.message });
      }
    });

    // Leave a note room
    socket.on('leave-note', (noteId) => {
      socket.leave(`note:${noteId}`);
      
      // Remove from active users
      if (activeUsers.has(noteId)) {
        activeUsers.get(noteId).delete(socket.id);
        if (activeUsers.get(noteId).size === 0) {
          activeUsers.delete(noteId);
        } else {
          // Notify others
          socket.to(`note:${noteId}`).emit('user-left', {
            user: socket.user,
            noteId
          });
        }
      }

      console.log(`User ${socket.user.email} left note ${noteId}`);
    });

    // Handle content changes
    let saveTimeouts = new Map(); // noteId -> timeout

    socket.on('content-change', async (data) => {
      const { noteId, content } = data;

      try {
        // Verify user has edit permission
        const note = await Note.findById(noteId);
        if (!note) return;

        const userId = socket.userId;
        const isOwner = note.user.toString() === userId;
        const isEditor = note.sharedWith.some(
          (entry) => entry.user.toString() === userId && entry.canEdit
        );

        if (!isOwner && !isEditor) {
          socket.emit('error', { message: 'You do not have permission to edit this note' });
          return;
        }

        // Broadcast to others in the room (excluding sender)
        socket.to(`note:${noteId}`).emit('content-updated', {
          noteId,
          content,
          updatedBy: socket.user
        });

        // Debounce database save (save after 2 seconds of inactivity)
        if (saveTimeouts.has(noteId)) {
          clearTimeout(saveTimeouts.get(noteId));
        }

        const timeout = setTimeout(async () => {
          try {
            note.content = content;
            await note.save();
            console.log(`Note ${noteId} content saved to database`);
          } catch (err) {
            console.error(`Error saving note ${noteId}:`, err);
          }
          saveTimeouts.delete(noteId);
        }, 2000);

        saveTimeouts.set(noteId, timeout);
      } catch (err) {
        socket.emit('error', { message: 'Failed to update content', error: err.message });
      }
    });

    // Handle title changes
    socket.on('title-change', async (data) => {
      const { noteId, title } = data;

      try {
        const note = await Note.findById(noteId);
        if (!note) return;

        const userId = socket.userId;
        const isOwner = note.user.toString() === userId;
        const isEditor = note.sharedWith.some(
          (entry) => entry.user.toString() === userId && entry.canEdit
        );

        if (!isOwner && !isEditor) {
          socket.emit('error', { message: 'You do not have permission to edit this note' });
          return;
        }

        // Broadcast to others
        socket.to(`note:${noteId}`).emit('title-updated', {
          noteId,
          title,
          updatedBy: socket.user
        });

        // Save to database immediately for title (less frequent)
        note.title = title;
        await note.save();
        console.log(`Note ${noteId} title saved to database`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to update title', error: err.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
      
      // Clean up active users
      activeUsers.forEach((users, noteId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) {
            activeUsers.delete(noteId);
          } else {
            // Notify others
            socket.to(`note:${noteId}`).emit('user-left', {
              user: socket.user,
              noteId
            });
          }
        }
      });

      // Clear any pending save timeouts
      saveTimeouts.forEach((timeout) => clearTimeout(timeout));
      saveTimeouts.clear();
    });
  });

  return io;
}

module.exports = initializeSocket;

