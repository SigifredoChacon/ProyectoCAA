import {Router} from 'express';
import {StateController} from "../controllers/stateController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createStateRouter = ({stateModel}) => {
    const stateRouter = Router();

    const stateController = new StateController({stateModel});
    stateRouter.get('/', stateController.getAll)
    stateRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),stateController.create)
    stateRouter.get('/:nombre',stateController.getByStateName)

    stateRouter.get('/:id',stateController.getById)
    stateRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),stateController.delete)
    stateRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),stateController.update)

    return stateRouter;
}