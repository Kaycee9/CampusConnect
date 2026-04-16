import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const createMessageSocket = () => {
  const token = localStorage.getItem('accessToken');

  return io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket'],
    auth: {
      token,
    },
  });
};