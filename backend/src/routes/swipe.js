const express = require('express');
const prisma = require('../config/db');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('--- NUEVO SWIPE RECIBIDO ---');
    console.log('Datos recibidos del celular:', req.body);
    
    const { swipedId, isLike } = req.body;
    const swiperId = req.user.id;

    console.log(`El usuario (ID: ${swiperId}) le dio isLike=${isLike} al usuario (ID: ${swipedId})`);

    if (swiperId === swipedId) {
      console.log('Error: Se intentó evaluar a sí mismo.');
      return res.status(400).json({ error: 'No puedes evaluarte a ti mismo' });
    }

    if (typeof isLike === 'undefined' || !swipedId) {
      console.log('Error: Faltan datos (isLike o swipedId están vacíos).');
      return res.status(400).json({ error: 'Faltan datos para el swipe' });
    }

    // Usamos findFirst por si no tienes el índice único configurado
    const existingSwipe = await prisma.swipe.findFirst({
      where: {
        swiperId: swiperId,
        swipedId: swipedId
      }
    });

    if (existingSwipe) {
      console.log('Aviso: Este swipe ya existía en la base de datos.');
      return res.status(400).json({ error: 'Ya evaluaste a este usuario' });
    }

    const swipe = await prisma.swipe.create({
      data: {
        swiperId,
        swipedId,
        isLike,
      },
    });
    
    console.log('✅ Swipe guardado exitosamente en la DB:', swipe);

    // LÓGICA DE MATCH (Tu código original)
    if (isLike) {
      const reverseSwipe = await prisma.swipe.findFirst({
        where: {
          swiperId: swipedId,
          swipedId: swiperId,
          isLike: true,
        }
      });

      if (reverseSwipe) {
        console.log('🎉 ¡HAY UN MATCH MUTUO!');
        const match = await prisma.match.create({
          data: {
            user1Id: swiperId,
            user2Id: swipedId,
          }
        });

        console.log('✅ Match guardado en la DB:', match);
        return res.status(201).json({ message: '¡Es un Match!', match });
      }
    }

    res.status(201).json({ message: 'Swipe registrado exitosamente', swipe });
  } catch (error) {
    console.error('❌ ERROR GRAVE al guardar el swipe:', error);
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

module.exports = router;