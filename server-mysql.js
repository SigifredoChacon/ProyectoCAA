import {createApp} from "./app.js";

import{applicationModel} from "./models/mysql/applicationModel.js";
import{assetModel} from "./models/mysql/assetModel.js";
import{categoryModel} from "./models/mysql/categoryModel.js";
import{cubicleModel} from "./models/mysql/cubicleModel.js";
import{reservationModel} from "./models/mysql/reservationModel.js";
import{resourceModel} from "./models/mysql/resourceModel.js";
import{roleModel} from "./models/mysql/roleModel.js";
import{stateModel} from "./models/mysql/stateModel.js";
import{userModel} from "./models/mysql/userModel.js";
import{roomModel} from "./models/mysql/roomModel.js";
import{valorationModel} from "./models/mysql/valorationModel.js";

createApp({
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
})