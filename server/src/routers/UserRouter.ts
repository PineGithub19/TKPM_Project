import express from 'express';
import UserController from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';

const userController = new UserController();
const router = express.Router();

// GET all users
router.get('/', (req, res, next) => userController.getUsers(req, res, next));

// POST - Sign in a user
router.post('/signin', (req, res, next) => {
    userController.signIn(req, res, next);
});

// POST - Create a new user
router.post('/signup', (req, res, next) => userController.createUser(req, res, next));

router.post('/google-login', userController.googleLogin);

//PUT - Reset password
router.put('/resetpassword/:token', (req, res, next) => userController.resetPassword(req, res, next));

router.get('/test', authMiddleware, (req, res, next) => {
    res.status(200).json({ message: 'You are authorized' });
});

router.post('/getJwt', (req, res, next) => {
    userController.getJwt(req, res, next);
});

// PUT - Update an existing user
router.put('/resetpassword', (req, res, next) => userController.updateUser(req, res, next));

// DELETE - Delete a user
router.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export default router;
