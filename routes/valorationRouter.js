import { Router } from 'express';
import { ValorationController } from '../controllers/valorationController.js';
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";


export const createValorationRouter = ({valorationModel, reservationModel}) => {

    const valorationRouter = Router();

    const valorationController = new ValorationController({valorationModel, reservationModel});

    // Crear una nueva valoración
    valorationRouter.post('/',verifyToken, valorationController.create);

    // Obtener todas las valoraciones
    valorationRouter.get('/', verifyToken,requireRole(["Administrador","AdministradorReservaciones"]),valorationController.getAll);

    // Obtener valoraciones por ID de Sala
    valorationRouter.get('/sala/:idSala',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), valorationController.getBySala);

    // Obtener valoraciones por ID de Cubículo
    valorationRouter.get('/cubiculo/:idCubiculo',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), valorationController.getByCubiculo);

    // Obtener una valoración por ID de Encuesta
    valorationRouter.get('/:idEncuesta',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), valorationController.getById);

    // Eliminar una valoración por ID
    valorationRouter.delete('/:idEncuesta',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), valorationController.delete);

    return valorationRouter;
}
