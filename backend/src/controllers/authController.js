const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/auth');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Query user
    const result = await executeQuery(
      'SELECT UserId, Email, PasswordHash, Role FROM Users WHERE Email = @email',
      { email: email }
    );

    if (result.recordset.length === 0) {
      logger.warn(`Login failed for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.recordset[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      logger.warn(`Invalid password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.UserId, user.Email, user.Role);
    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.UserId,
        email: user.Email,
        role: user.Role,
      },
    });
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const checkUser = await executeQuery(
      'SELECT UserId FROM Users WHERE Email = @email',
      { email: email }
    );

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    await executeQuery(
      `INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, CreatedDate)
       VALUES (@email, @passwordHash, @firstName, @lastName, 'User', GETDATE())`,
      {
        email: email,
        passwordHash: passwordHash,
        firstName: firstName,
        lastName: lastName,
      }
    );

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    logger.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

module.exports = {
  login,
  register,
};
