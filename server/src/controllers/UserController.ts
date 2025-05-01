import { Request, Response, NextFunction } from 'express';
import * as DBServices from '../services/DBServices';
import UserModel from '../models/User';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

interface IUser extends Document {
    username: string;
    email: string;
    password_hash: string;
    role: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

class UserController {
    

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await DBServices.getDocuments(UserModel);
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error getting users');
        }
    }

    async signIn(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const user = await DBServices.getDocumentByQuery(UserModel, { 
                $or: [{ username: email }, { email: email }] 
            });
    
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
    
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
    
            const token = jwt.sign(
                { userId: user._id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: "1h", algorithm: "HS256" }
            );
    
            res.cookie("token", token, {
                httpOnly: false,  // Ngăn JavaScript truy cập (chống XSS)
                // secure: process.env.NODE_ENV === "production", 
                secure: true, 
                sameSite: "lax", // Ngăn CSRF
                maxAge: 3600000, // 1 giờ
            });
            res.status(200).json({ status: "OK"});
        } catch (error) {
            next(error);
        }
    }
    
    
    
    async createUser(req: Request, res: Response, next: NextFunction) {
        const { username, email, password, role } = req.body; // Use `password`, not `password_hash`
    
        try {
            // Hash the password before storing
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
    
            const user = new UserModel({
                username,
                email,
                password_hash: hashedPassword, // Store hashed password
                role,
            });
    
            await DBServices.createDocument(UserModel, user);
            res.status(201).send('User created');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error creating user');
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        const { token } = req.params;
        const { password } = req.body;
    
        try {
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);
            const user = await DBServices.updateDocument(UserModel, token, { password_hash });
            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating user');
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        const { token } = req.query;
        const { username, email, password, role } = req.body;
        const decoded = jwt.verify(token as string, SECRET_KEY) as { id: string };
        const id = decoded.id;
        try {
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);
            const user = await DBServices.updateDocument(UserModel, id, { username, email, password_hash, role });
            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating user');
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;

        try {
            await DBServices.deleteDocument(UserModel, id);
            res.status(200).send('User deleted');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error deleting user');
        }
    }

    async getJwt(req: Request, res: Response, next: NextFunction)
    {
        const {email} = req.body;
        try {
            const user = await DBServices.getDocumentByQuery(UserModel, { email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const token = jwt.sign(
                { id: user._id },
                SECRET_KEY,
                { expiresIn: "15m", algorithm: "HS256" }
            );
            res.status(200).json({ token: token });
        }
        catch (error) {
            next(error);
        }        
    }

    // Trong UserController.ts
    async googleLogin(req: Request, res: Response) {
        const { email, name } = req.body;

        try {
            // Tìm user theo email
            let user = await DBServices.getDocumentByQuery(UserModel, { email });

            // Nếu user chưa tồn tại, tạo mới
            if (!user) {
                user = new UserModel({
                    username: name,
                    email,
                    password_hash: '', // Google đăng nhập không cần mật khẩu
                    role: 'user',
                });
                await user.save();
            }

            // Tạo JWT token
            const token = jwt.sign(
                {
                    userId: user._id,
                    username: user.username,
                    role: user.role,
                },
                SECRET_KEY,
                {
                    expiresIn: '1h',
                    algorithm: 'HS256',
                }
            );

            // Set cookie chứa token
            res.cookie('token', token, {
                httpOnly: false, // Nếu muốn bảo mật hơn thì để true
                secure: false, // Chỉ dùng HTTPS mới hoạt động nếu true
                sameSite: 'lax',
                maxAge: 3600000, // 1 tiếng
            });

            // Trả về response
            res.status(200).json({
                status: 'OK',
                data: {
                    email: user.email,
                    name: user.username, // Trả lại để frontend lưu localStorage nếu muốn
                },
            });
        } catch (error) {
            console.error('Google login error:', error);
            res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
        }
    }
}

export default UserController;
function uuidv4() {
    throw new Error('Function not implemented.');
}

