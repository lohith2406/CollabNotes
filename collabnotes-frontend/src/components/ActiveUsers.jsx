import React, { useState, useEffect } from 'react';

const ActiveUsers = ({ socketService }) => {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const handleActiveUsers = (data) => {
      setActiveUsers(data.users || []);
    };

    const handleUserJoined = (data) => {
      setActiveUsers((prev) => {
        if (!prev.find((u) => u.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    };

    const handleUserLeft = (data) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== data.user.id));
    };

    socketService.onActiveUsers(handleActiveUsers);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);

    return () => {
      socketService.offActiveUsers(handleActiveUsers);
      socketService.offUserJoined(handleUserJoined);
      socketService.offUserLeft(handleUserLeft);
    };
  }, [socketService]);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span className="font-medium">Active users:</span>
      <div className="flex space-x-2">
        {activeUsers.map((user) => (
          <span
            key={user.id}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            title={user.email}
          >
            {user.name || user.email}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ActiveUsers;

