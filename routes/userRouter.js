import {Router} from 'express';
import {UserController} from "../controllers/userController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createUserRouter = ({userModel, roleModel}) => {

    const userRouter = Router();

    const userController = new UserController({userModel, roleModel});

    userRouter.get("/", verifyToken, requireRole(["Administrador","AdministradorReservaciones"]), userController.getAll);
    userRouter.post("/", verifyToken, requireRole(["Administrador", "AdministradorReservaciones"]), userController.create);
    userRouter.post('/login',userController.login)
    userRouter.post('/register',userController.register)
    userRouter.post('/generalEmails',verifyToken, requireRole(["Administrador","AdministradorReservaciones"]),userController.sendAllEmail)
    userRouter.post('/updatePassword/:id', userController.updatePassword)
    userRouter.post('/verifyRol',userController.sendAdminEmails)
    userRouter.get('/:id', verifyToken ,userController.getById)
    userRouter.patch('/:id', verifyToken, userController.update);

    return userRouter;
}