const express = require('express');
const prisma = require('../config/db');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (matches.length === 0) {
      return res.json([]);
    }

    const otherUserIds = matches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    const matchedUsers = await prisma.user.findMany({
      where: {
        id: { in: otherUserIds }
      },
      select: {
        id: true,
        name: true,
        profileImage: true
      }
    });

    const formattedMatches = matchedUsers.map(user => {
      const matchRoom = matches.find(m => m.user1Id === user.id || m.user2Id === user.id);
      
      return {
        id: user.id, 
        matchId: matchRoom.id, 
        name: user.name,
        profileImage: user.profileImage
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error('Error al cargar matches:', error);
    res.status(500).json({ error: 'Error al cargar matches' });
  }
});

module.exports = router;