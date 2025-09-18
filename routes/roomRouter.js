import {Router} from 'express';
import {RoomController} from "../controllers/roomController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const roomRouter = Router();

roomRouter.get('/', RoomController.getAll)
roomRouter.get('/:id',RoomController.getById)
roomRouter.get('/getName/:id',RoomController.getNameById)

roomRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),RoomController.create)

roomRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), RoomController.delete)

roomRouter.patch('/roomLock', verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),RoomController.lock)
roomRouter.patch('/roomUnLock',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),RoomController.unLock)
roomRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),RoomController.update)

