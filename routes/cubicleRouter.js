import {Router} from 'express';
import {CubicleController} from "../controllers/cubicleController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createCubicleRouter = ({cubicleModel}) => {

    const cubicleRouter = Router();

    const cubicleController = new CubicleController({cubicleModel});

    cubicleRouter.get('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones","Profesor"]), cubicleController.getAll)
    cubicleRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),cubicleController.create)

    cubicleRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones","Profesor"]),cubicleController.getById)
    cubicleRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),cubicleController.delete)

    cubicleRouter.patch('/cubicleLock',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),cubicleController.lock)
    cubicleRouter.patch('/cubicleUnLock',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),cubicleController.unLock)
    cubicleRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),cubicleController.update)

    return cubicleRouter;
}