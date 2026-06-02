require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, Role, User } = require('./models');

const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
  });
});

// Database sync and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync({ alter: false });
    console.log('Database synced successfully');

    // Create default roles if they don't exist
    const adminRole = await Role.findOrCreate({
      where: { name: 'Admin' },
      defaults: {
        description: 'Administrator with full access',
        permissions: ['all'],
      },
    });

    const supervisorRole = await Role.findOrCreate({
      where: { name: 'Supervisor' },
      defaults: {
        description: 'Supervisor with limited access',
        permissions: ['view_images', 'view_users'],
      },
    });

    const workerRole = await Role.findOrCreate({
      where: { name: 'Worker' },
      defaults: {
        description: 'Worker with basic access',
        permissions: ['capture_images', 'view_own_images'],
      },
    });

    // Create default admin user if it doesn't exist
    const adminUser = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        email: 'admin@robro.com',
        password: 'Admin@123', // Change this in production
        roleId: adminRole[0].id,
        isActive: true,
      },
    });

    if (adminUser[1]) {
      console.log('Default admin user created: admin / Admin@123');
    }

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
