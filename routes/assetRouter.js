import {Router} from 'express';
import {AssetController} from "../controllers/assetController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createAssetRouter = ({assetModel}) => {

    const assetRouter = Router();

    const assetController = new AssetController({assetModel});

    assetRouter.get('/', verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.getAll)
    assetRouter.post('/',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.create)
    assetRouter.get('/category/:id',requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getByCategory)
    assetRouter.get('/available/:assetCategory',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getFirstAvailableAsset)

    assetRouter.get('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes","Profesor"]),assetController.getById)
    assetRouter.delete('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.delete)
    assetRouter.patch('/:id',verifyToken,requireRole(["Administrador","AdministradorSolicitudes"]),assetController.update)

    return assetRouter;
}