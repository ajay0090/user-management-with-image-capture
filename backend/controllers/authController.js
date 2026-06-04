const { User, Role } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user, role) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: role.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// User Login
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Username/email and password required' });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: loginIdentifier },
          { email: loginIdentifier },
        ],
      },
      include: [{ model: Role }],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user, user.Role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Admin: Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, roleId, role } = req.body;
    const normalizedUsername = username || (email ? email.split('@')[0] : null);

    if (!normalizedUsername || !email || !password || (!roleId && !role)) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists by username or email
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: normalizedUsername },
          { email },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const roleRecord = roleId
      ? await Role.findByPk(roleId)
      : await Role.findOne({ where: { name: role } });

    if (!roleRecord) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const user = await User.create({
      username: normalizedUsername,
      email,
      password,
      roleId: roleRecord.id,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: roleRecord.name,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isActive', 'createdAt'],
      include: [{ model: Role, attributes: ['id', 'name'] }],
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Admin: Get available role options
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name', 'description'] });
    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Failed to fetch roles', error: error.message });
  }
};

// Admin: Assign role to user
exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId, role } = req.body;

    if (!userId || (!roleId && !role)) {
      return res.status(400).json({ message: 'User ID and Role ID or role name required' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleRecord = roleId
      ? await Role.findByPk(roleId)
      : await Role.findOne({ where: { name: role } });

    if (!roleRecord) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    await user.update({ roleId: roleRecord.id });

    res.json({
      message: 'Role assigned successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: roleRecord.name,
        roleId: roleRecord.id,
      },
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Failed to assign role', error: error.message });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Admin: Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Failed to deactivate user', error: error.message });
  }
};
