import {Router} from 'express';
import {resourceController} from "../controllers/resourceController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const resourceRouter = Router();

resourceRouter.get('/', resourceController.getAll)
resourceRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.create)

resourceRouter.get('/:id',resourceController.getById)
resourceRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.delete)
resourceRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.update)