import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password, role: 'user' });
    res.status(201).json({ token: signToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({ token: signToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: serializeUser(req.user) });
}
