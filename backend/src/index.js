const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const swipeRoutes = require('./routes/swipe');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const matchesRoutes = require('./routes/matches');
const prisma = require('./config/db'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matches', matchesRoutes);

io.on('connection', (socket) => {
  console.log('🟢 Usuario conectado:', socket.id);

  socket.on('join_chat', (matchId) => {
    socket.join(`chat_${matchId}`);
    console.log(`Usuario unido a la sala chat_${matchId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { matchId, senderId, text } = data;

      const newMessage = await prisma.message.create({
        data: {
          matchId,
          senderId,
          text,
        },
        include: {
          sender: { select: { id: true, name: true, profileImage: true } }
        }
      });

      io.to(`chat_${matchId}`).emit('receive_message', newMessage);
    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo de forma organizada en el puerto ${PORT}`);
});