import {Router} from 'express';
import {reservationController} from "../controllers/reservationController.js";



export const reservationRouter = Router();

reservationRouter.get('/', reservationController.getAll)
reservationRouter.get('/pending', reservationController.getAllPendingReservations)
reservationRouter.post('/',reservationController.create)
reservationRouter.get('/getbyDate/:date',reservationController.getByDate)
reservationRouter.get('/getbyRoomId/:roomId',reservationController.getByRoomId)
reservationRouter.get('/getbyCubicleId/:cubicleId',reservationController.getByCubicleId)
reservationRouter.get('/getbyUserId/:userId',reservationController.getByUserId)
reservationRouter.post('/shareReservation', reservationController.shareReservation)
reservationRouter.get('/getbyCubicleIdDate/:cubicleId', reservationController.getReservationsByCubicleIdAndWeek)
reservationRouter.get('/getbyRoomIdDate/:roomId', reservationController.getReservationsByRoomIdAndWeek)
reservationRouter.get('/year/:year', reservationController.getByYear);
reservationRouter.get('/month/:year/:month', reservationController.getByMonth);
reservationRouter.get('/range', reservationController.getByDateRange);
reservationRouter.get('/reservationsCompleted/:id', reservationController.getByUserIdComplete)

reservationRouter.get('/:id',reservationController.getById)
reservationRouter.delete('/deleteByDate/:date',reservationController.deleteByDate)
reservationRouter.delete('/:id',reservationController.delete)
reservationRouter.patch('/:id',reservationController.update)
