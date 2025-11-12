import {Router} from 'express';
import {ReservationController} from "../controllers/reservationController.js";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";
import {perUserWriteLimiter} from "../middlewares/rateLimiters.js";



export const createReservationRouter = ({reservationModel,roomModel, cubicleModel}) => {

    const reservationRouter = Router();

    const reservationController = new ReservationController({reservationModel, roomModel, cubicleModel});

    reservationRouter.get('/', reservationController.getAll)
    reservationRouter.get('/pending', verifyToken, requireRole(["Administrador","AdministradorReservaciones"]), reservationController.getAllPendingReservations)
    reservationRouter.post('/',verifyToken, perUserWriteLimiter, reservationController.create)
    reservationRouter.get('/getbyDate/:date',reservationController.getByDate)
    reservationRouter.get('/getbyRoomId/:roomId',reservationController.getByRoomId)
    reservationRouter.get('/getbyCubicleId/:cubicleId',reservationController.getByCubicleId)
    reservationRouter.get('/getbyUserId/:userId',verifyToken,reservationController.getByUserId)
    reservationRouter.post('/shareReservation', verifyToken, reservationController.shareReservation)
    reservationRouter.get('/getbyCubicleIdDate/:cubicleId', reservationController.getReservationsByCubicleIdAndWeek)
    reservationRouter.get('/getbyRoomIdDate/:roomId', reservationController.getReservationsByRoomIdAndWeek)
    reservationRouter.get('/year/:year', reservationController.getByYear);
    reservationRouter.get('/month/:year/:month', reservationController.getByMonth);
    reservationRouter.get('/range', reservationController.getByDateRange);
    reservationRouter.get('/reservationsCompleted/:id', reservationController.getByUserIdComplete)

    reservationRouter.get('/:id',reservationController.getById)
    reservationRouter.delete('/deleteByDate/:date',verifyToken,requireRole(["Administrador","AdministradorReservaciones"]), reservationController.deleteByDate)
    reservationRouter.delete('/:id',verifyToken, perUserWriteLimiter, reservationController.delete)
    reservationRouter.patch('/:id',verifyToken, perUserWriteLimiter, reservationController.update)

    return reservationRouter;
}