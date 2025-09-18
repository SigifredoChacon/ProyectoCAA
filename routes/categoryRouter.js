import {Router} from 'express';
import {categoryController} from "../controllers/categoryController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";



export const categoryRouter = Router();

categoryRouter.get('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]), categoryController.getAll)
categoryRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),categoryController.create)
categoryRouter.get('/:nombre',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),categoryController.getByCategoryName)

categoryRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),categoryController.getById)
categoryRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),categoryController.delete)
categoryRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),categoryController.update)