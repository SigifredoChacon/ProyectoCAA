import {Router} from 'express';
import {RoleController} from "../controllers/roleController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createRoleRouter = ({roleModel}) => {

    const roleRouter = Router();

    const roleController = new RoleController({roleModel});

    roleRouter.get('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.getAll)
    roleRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.create)
    roleRouter.get('/:nombre',roleController.getByRoleName)

    roleRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.getById)
    roleRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.delete)
    roleRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),roleController.update)

    return roleRouter;
}