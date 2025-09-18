import {Router} from 'express';
import {StateController} from "../controllers/stateController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const stateRouter = Router();

stateRouter.get('/', StateController.getAll)
stateRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),StateController.create)
stateRouter.get('/:nombre',StateController.getByStateName)

stateRouter.get('/:id',StateController.getById)
stateRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),StateController.delete)
stateRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),StateController.update)