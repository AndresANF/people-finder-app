const express = require('express');
const prisma = require('../config/db');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Buscamos los mensajes ordenados del más nuevo al más viejo
    const messages = await prisma.message.findMany({
      where: { matchId: parseInt(matchId) },
      orderBy: { createdAt: 'desc' }, 
      include: {
        sender: { select: { id: true, name: true, profileImage: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    res.status(500).json({ error: 'Error al cargar el historial de mensajes' });
  }
});

module.exports = router;