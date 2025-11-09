import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinNote(noteId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-note', noteId);
    }
  }

  leaveNote(noteId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-note', noteId);
    }
  }

  onContentChange(handler) {
    if (this.socket) {
      this.socket.on('content-updated', handler);
    }
  }

  offContentChange(handler) {
    if (this.socket) {
      this.socket.off('content-updated', handler);
    }
  }

  onTitleChange(handler) {
    if (this.socket) {
      this.socket.on('title-updated', handler);
    }
  }

  offTitleChange(handler) {
    if (this.socket) {
      this.socket.off('title-updated', handler);
    }
  }

  onUserJoined(handler) {
    if (this.socket) {
      this.socket.on('user-joined', handler);
    }
  }

  offUserJoined(handler) {
    if (this.socket) {
      this.socket.off('user-joined', handler);
    }
  }

  onUserLeft(handler) {
    if (this.socket) {
      this.socket.on('user-left', handler);
    }
  }

  offUserLeft(handler) {
    if (this.socket) {
      this.socket.off('user-left', handler);
    }
  }

  onActiveUsers(handler) {
    if (this.socket) {
      this.socket.on('active-users', handler);
    }
  }

  offActiveUsers(handler) {
    if (this.socket) {
      this.socket.off('active-users', handler);
    }
  }

  onError(handler) {
    if (this.socket) {
      this.socket.on('error', handler);
    }
  }

  offError(handler) {
    if (this.socket) {
      this.socket.off('error', handler);
    }
  }

  emitContentChange(noteId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit('content-change', { noteId, content });
    }
  }

  emitTitleChange(noteId, title) {
    if (this.socket && this.isConnected) {
      this.socket.emit('title-change', { noteId, title });
    }
  }
}

const socketService = new SocketService();
export default socketService;

