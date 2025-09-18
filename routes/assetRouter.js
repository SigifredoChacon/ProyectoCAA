import {Router} from 'express';
import {assetController} from "../controllers/assetController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const assetRouter = Router();

assetRouter.get('/', verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.getAll)
assetRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.create)
assetRouter.get('/category/:id',requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getByCategory)
assetRouter.get('/available/:assetCategory',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getFirstAvailableAsset)

assetRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getById)
assetRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.delete)
assetRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.update)