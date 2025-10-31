import {Router} from 'express';
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";
import {ResourceController} from "../controllers/resourceController.js";


export const createResourceRouter = ({resourceModel}) => {

    const resourceRouter = Router();

    const resourceController = new ResourceController({resourceModel});

    resourceRouter.get('/', resourceController.getAll)
    resourceRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.create)

    resourceRouter.get('/:id',resourceController.getById)
    resourceRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.delete)
    resourceRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),resourceController.update)

    return resourceRouter;
}