import { Server, Socket } from 'socket.io';

const socketIO = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`ID: ${socket.id} just connected`);

    socket.on('join-room', (data: { roomId?: string }, callback: (response: string) => void) => {
      if (data?.roomId) {
        socket.join('room' + data.roomId);
        callback('Join room successful');
      } else {
        callback('Must provide a valid user id');
      }
    });

    socket.on('leave-room', (data: { roomId?: string }) => {
      if (data?.roomId) {
        socket.leave('room' + data.roomId);
      }
    });

    // Subscribe to a bazar's price feed
    socket.on('join-bazar', (data: { bazarId?: string }, callback: (response: string) => void) => {
      if (data?.bazarId) {
        socket.join('bazar:' + data.bazarId);
        callback('Joined bazar feed: ' + data.bazarId);
      } else {
        callback('Must provide a valid bazarId');
      }
    });

    socket.on('leave-bazar', (data: { bazarId?: string }) => {
      if (data?.bazarId) {
        socket.leave('bazar:' + data.bazarId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`ID: ${socket.id} disconnected`);
    });
  });
};

// Helper: emit price:new to a bazar room
export const emitNewPrice = (io: Server, bazarId: string, priceData: any) => {
  io.to('bazar:' + bazarId).emit('price:new', priceData);
};

// Helper: emit price:verified globally
export const emitPriceVerified = (io: Server, priceData: any) => {
  io.emit('price:verified', priceData);
};

// Helper: emit alert:new globally
export const emitNewAlert = (io: Server, alertData: any) => {
  io.emit('alert:new', alertData);
};

export default socketIO;
