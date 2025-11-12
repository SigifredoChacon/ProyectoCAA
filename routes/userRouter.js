import {Router} from 'express';
import {UserController} from "../controllers/userController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";
import {loginLimiter, forgotLimiter, mailLimiter, registerLimiter} from "../middlewares/rateLimiters.js";


export const createUserRouter = ({userModel, roleModel}) => {

    const userRouter = Router();

    const userController = new UserController({userModel, roleModel});

    userRouter.get("/", verifyToken, requireRole(["Administrador","AdministradorReservaciones"]), userController.getAll);
    userRouter.post("/", verifyToken, requireRole(["Administrador", "AdministradorReservaciones"]), userController.create);
    userRouter.post('/login', loginLimiter, userController.login)
    userRouter.post('/register',registerLimiter, userController.register)
    userRouter.post('/generalEmails', mailLimiter,verifyToken, requireRole(["Administrador","AdministradorReservaciones"]),userController.sendAllEmail)
    userRouter.post('/updatePassword/:id', forgotLimiter, userController.updatePassword)
    userRouter.post('/verifyRol', mailLimiter, userController.sendAdminEmails)
    userRouter.get('/:id', verifyToken ,userController.getById)
    userRouter.patch('/:id', verifyToken, userController.update);
    userRouter.post('/verify-email', forgotLimiter, userController.verifyEmail);
    userRouter.post('/resend-verification', forgotLimiter, userController.resendVerificationCode);


    return userRouter;
}