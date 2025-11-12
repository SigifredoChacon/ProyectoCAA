import express from 'express';
import { fileURLToPath } from 'url';
import { createRoomRouter } from "./routes/roomRouter.js";
import { createCubicleRouter } from "./routes/cubicleRouter.js";
import { createResourceRouter } from "./routes/resourceRouter.js";
import { createRoleRouter } from "./routes/roleRouter.js";
import { createCategoryRouter } from "./routes/categoryRouter.js";
import { createStateRouter } from "./routes/stateRouter.js";
import { createUserRouter } from "./routes/userRouter.js";
import { createAssetRouter } from "./routes/assetRouter.js";
import { createApplicationRouter } from "./routes/applicationRouter.js";
import { createReservationRouter } from "./routes/reservationRouter.js";
import cors from 'cors';
import multer from 'multer';
import cron from 'node-cron';
import {createNotificationService} from './services/notificationService.js';
import { createValorationRouter } from './routes/valorationRouter.js'
import { createUserCleanupService } from './services/userCleanupService.js';
import * as path from "node:path";
import {apiLimiter} from "./middlewares/rateLimiters.js";


export const createApp = ({
    roomModel,
    cubicleModel,
    roleModel,
    categoryModel,
    stateModel,
    userModel,
    assetModel,
    applicationModel,
    reservationModel,
    valorationModel,
    resourceModel
}) => {


    const app = express();
    app.set('trust proxy', 1);
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    });
    app.use(express.json({limit: '200kb'}));
    app.disable('x-powered-by');

    const storage = multer.memoryStorage();
    const upload = multer({storage});

    app.use(apiLimiter);

    app.use('/rooms', upload.single('imagen'), createRoomRouter({roomModel}));
    app.use('/cubicles', createCubicleRouter({cubicleModel}));
    app.use('/resources', createResourceRouter({resourceModel}));
    app.use('/roles', createRoleRouter({roleModel}));
    app.use('/categories', createCategoryRouter({categoryModel}));
    app.use('/states', createStateRouter({stateModel}));
    app.use('/users', createUserRouter({userModel, roleModel}));
    app.use('/assets', createAssetRouter({assetModel}));
    app.use('/applications', createApplicationRouter({applicationModel, userModel, assetModel}));
    app.use('/reservations', createReservationRouter({reservationModel, roomModel, cubicleModel}));
    app.use('/valorations', createValorationRouter({valorationModel, reservationModel}));

    const runNotifications = createNotificationService({
        reservationModel,
        userModel,
        roomModel,
        cubicleModel,
        timezone: 'America/Costa_Rica'
    });

    const runUserCleanup = createUserCleanupService({
        userModel,
        maxAgeDays: 7
    });


    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    cron.schedule('30 14 * * *', () => {
        runNotifications();
    }, {
        timezone: "America/Costa_Rica"
    });

    cron.schedule('15 3 * * *', () => {
        runUserCleanup();
    }, {
        timezone: "America/Costa_Rica"
    });



    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    const PORT = process.env.PORT ?? 3000;

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`http://localhost:${PORT}`);
    });

}
