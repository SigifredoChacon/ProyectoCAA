import {cubicleModel} from '../models/postgresql/cubicleModel.js';
import {validateCubicle, validateCubicleUpdate} from '../schemas/cubicleSchema.js';


export class CubicleController {

    constructor({cubicleModel}) {
        this.cubicleModel = cubicleModel
    }

    getAll = async (req, res) =>{
        const cubicles = await this.cubicleModel.getAll()
        res.json(cubicles)
    }
    getById = async (req, res) =>{
        const {id} = req.params
        const cubicle = await this.cubicleModel.getById({id})
        if(cubicle) return res.json(cubicle)
        res.status(404).json({message: 'Cubiculo no encontrado'})
    }

    create = async (req, res) =>{

        const result = validateCubicle(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newCubicle= await this.cubicleModel.create({input: req.body})
        if(newCubicle === false) return res.status(409).json({message: 'Cubiculo con ese nombre ya existe'})
        res.status(201).json(newCubicle)
    }

    delete = async (req, res) =>{
        const {id} = req.params
        const deletedCubicle = await this.cubicleModel.delete({id})

        if(deletedCubicle === false) return res.status(404).json({message: 'Cubiculo asignado a una reservacion, cubiculo no eliminado'})
        res.status(204).json({message: "Se elimino correctamente el cubiculo"})
    }

    update = async (req, res) =>{

        const result = validateCubicleUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedCubicle = await this.cubicleModel.update({id, input: req.body})
        if(updatedCubicle) return res.json(updatedCubicle)
        res.status(404).json({message: 'Cubiculo no actualizado'})
    }

    lock = async (req, res) =>{
        const updatedCubicles = await this.cubicleModel.lock()
        if(updatedCubicles) return res.json(updatedCubicles)
        res.status(404).json({message: 'Cubiculos no actualizados'})
    }

    unLock = async (req, res) =>{
        const updatedCubicles = await this.cubicleModel.unLock()
        if(updatedCubicles) return res.json(updatedCubicles)
        res.status(404).json({message: 'Cubiculos no actualizados'})
    }
}
