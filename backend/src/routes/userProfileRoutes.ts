import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserProfileService } from '../services/UserProfileService';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validate';
import { updateSecuritySchema } from '../schemas/userProfile';
import { changePasswordAltSchema } from '../schemas/auth';

import logger from '../config/logger';
import { MulterRequest, getErrorMessage } from '../types/routeTypes'
const log = logger.child({ module: 'user_profile_routes' });

const router = Router();
router.use(authenticate);

const userProfileService = new UserProfileService();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: MulterRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/user-profile/profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const profile = await userProfileService.getProfile(userId, userType);
    res.json({ success: true, data: profile });
  } catch (err) {
    log.error({ err: err }, 'Error fetching profile:');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/user-profile/avatar
router.post('/avatar', upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!(req as MulterRequest).file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${(req as MulterRequest).file!.filename}`;
    await userProfileService.updateAvatar(userId, userType, avatarUrl);
    res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err) {
    log.error({ err: err }, 'Error uploading avatar:');
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/user-profile/avatar
router.delete('/avatar', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await userProfileService.updateAvatar(userId, userType, '');
    res.json({ success: true, message: 'Avatar removed' });
  } catch (err) {
    log.error({ err: err }, 'Error removing avatar:');
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

// GET /api/user-profile/security
router.get('/security', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const settings = await userProfileService.getSecuritySettings(userId, userType);
    res.json({ success: true, data: settings });
  } catch (err) {
    log.error({ err: err }, 'Error fetching security settings:');
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

// PUT /api/user-profile/security
router.put('/security', validate(updateSecuritySchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { login_notifications } = req.body;
    await userProfileService.updateSecuritySettings(userId, userType, { login_notifications });
    res.json({ success: true, message: 'Security settings updated' });
  } catch (err) {
    log.error({ err: err }, 'Error updating security settings:');
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// POST /api/user-profile/change-password
router.post('/change-password', validate(changePasswordAltSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    await userProfileService.changePassword(userId, userType, current_password, new_password);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: unknown) {
    log.error({ err: err }, 'Error changing password:');
    if (getErrorMessage(err) === 'Current password is incorrect') {
      return res.status(400).json({ error: getErrorMessage(err) });
    }
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// DELETE /api/user-profile/account
router.delete('/account', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    if (!userId || !userType) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await userProfileService.deleteAccount(userId, userType);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    log.error({ err: err }, 'Error deleting account:');
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
