import {cubicleModel} from '../models/postgresql/cubicleModel.js';
import {validateCubicle, validateCubicleUpdate} from '../schemas/cubicleSchema.js';
import {RoomModel} from "../models/postgresql/roomModel.js";
export class cubicleController {

    static async getAll(req, res) {
        const cubicles = await cubicleModel.getAll()
        res.json(cubicles)
    }
    static async getById(req, res) {
        const {id} = req.params
        const cubicle = await cubicleModel.getById({id})
        if(cubicle) return res.json(cubicle)
        res.status(404).json({message: 'Cubiculo no encontrado'})
    }

    static async create(req, res) {

        const result = validateCubicle(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newCubicle= await cubicleModel.create({input: req.body})
        if(newCubicle === false) return res.status(409).json({message: 'Cubiculo con ese nombre ya existe'})
        res.status(201).json(newCubicle)
    }

    static async delete(req, res) {
        const {id} = req.params
        const deletedCubicle = await cubicleModel.delete({id})

        if(deletedCubicle === false) return res.status(404).json({message: 'Cubiculo asignado a una reservacion, cubiculo no eliminado'})
        res.status(204).json({message: "Se elimino correctamente el cubiculo"})
    }

    static async update(req, res) {

        const result = validateCubicleUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedCubicle = await cubicleModel.update({id, input: req.body})
        if(updatedCubicle) return res.json(updatedCubicle)
        res.status(404).json({message: 'Cubiculo no actualizado'})
    }

    static async lock(req, res) {
        const updatedCubicles = await cubicleModel.lock()
        if(updatedCubicles) return res.json(updatedCubicles)
        res.status(404).json({message: 'Cubiculos no actualizados'})
    }

    static async unLock(req, res) {
        const updatedCubicles = await cubicleModel.unLock()
        if(updatedCubicles) return res.json(updatedCubicles)
        res.status(404).json({message: 'Cubiculos no actualizados'})
    }
}
