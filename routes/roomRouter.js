import {Router} from 'express';
import {RoomController} from "../controllers/roomController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createRoomRouter = ({roomModel}) => {

    const roomRouter = Router();

    const roomController = new RoomController({roomModel});

    roomRouter.get('/', roomController.getAll)
    roomRouter.get('/:id',roomController.getById)
    roomRouter.get('/getName/:id',roomController.getNameById)

    roomRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roomController.create)

    roomRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), roomController.delete)

    roomRouter.patch('/roomLock', verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roomController.lock)
    roomRouter.patch('/roomUnLock',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roomController.unLock)
    roomRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roomController.update)


    return roomRouter;
}