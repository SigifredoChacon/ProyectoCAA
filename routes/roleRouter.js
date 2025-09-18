import {Router} from 'express';
import {roleController} from "../controllers/roleController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";



export const roleRouter = Router();

roleRouter.get('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.getAll)
roleRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.create)
roleRouter.get('/:nombre',roleController.getByRoleName)

roleRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.getById)
roleRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.delete)
roleRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.update)