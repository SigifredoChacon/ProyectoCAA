import {createApp} from "./app.js";

import{applicationModel} from "./models/postgresql/applicationModel.js";
import{assetModel} from "./models/postgresql/assetModel.js";
import{categoryModel} from "./models/postgresql/categoryModel.js";
import{cubicleModel} from "./models/postgresql/cubicleModel.js";
import{reservationModel} from "./models/postgresql/reservationModel.js";
import{resourceModel} from "./models/postgresql/resourceModel.js";
import{roleModel} from "./models/postgresql/roleModel.js";
import{stateModel} from "./models/postgresql/stateModel.js";
import{userModel} from "./models/postgresql/userModel.js";
import{roomModel} from "./models/postgresql/roomModel.js";
import{valorationModel} from "./models/postgresql/valorationModel.js";

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