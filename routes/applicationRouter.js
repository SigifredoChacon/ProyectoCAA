import {Router} from 'express';
import {applicationController} from "../controllers/applicationController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";



export const applicationRouter = Router();

applicationRouter.get('/', verifyToken, requireRole(["Administrador","AdministradorSolicitudes"]),applicationController.getAll)
applicationRouter.post('/',verifyToken, requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),applicationController.create)
applicationRouter.get('/getbyUserId/:userId',verifyToken, requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),applicationController.getByUserId)
applicationRouter.post('/sendJustification',verifyToken, requireRole(["Administrador","AdministradorSolicitudes"]),applicationController.sendJustificationEmail)
applicationRouter.patch('/updateSignApplication/:id', verifyToken, requireRole(["Administrador"]),applicationController.updateSignApplication);

applicationRouter.get('/:id',applicationController.getById)
applicationRouter.delete('/:id',verifyToken, applicationController.delete)
applicationRouter.patch('/:id',verifyToken, requireRole(["Administrador","AdministradorSolicitudes"]),applicationController.update)