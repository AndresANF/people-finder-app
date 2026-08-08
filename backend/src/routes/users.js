const express = require('express');
const prisma = require('../config/db');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads')); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const swipedUsers = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { swipedId: true }
    });

    const swipedUserIds = swipedUsers.map(swipe => swipe.swipedId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: swipedUserIds } }
        ]
      },
      select: {
        id: true,
        name: true,
        bio: true,
        profileImage: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor al cargar el perfil' });
  }
});

router.put('/:id', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio } = req.body;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    
    if (req.file) {
      updateData.profileImage = req.file.filename;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permiso para borrar este perfil' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

module.exports = router;