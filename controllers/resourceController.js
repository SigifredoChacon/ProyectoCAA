import {resourceModel} from '../models/postgresql/resourceModel.js';
import {validateResource, validateResourceUpdate} from '../schemas/resourceSchema.js';

export class resourceController {

    static async getAll(req, res) {
        const resource = await resourceModel.getAll()
        res.json(resource)
    }
    static async getById(req, res) {
        const {id} = req.params
        const resource = await resourceModel.getById({id})
        if(resource) return res.json(resource)
        res.status(404).json({message: 'Recurso no encontrado'})
    }

    static async create(req, res) {

        const result = validateResource(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newResource= await resourceModel.create({input: req.body})
        if(newResource === false) return res.status(409).json({message: 'Recurso con ese nombre ya existe'})
        res.status(201).json(newResource)
    }

    static async delete(req, res) {
        const {id} = req.params
        const deletedResource = await resourceModel.delete({id})

        if(deletedResource === false) return res.status(404).json({message: 'Recurso no eliminado'})
        res.status(204).json({message: "Se elimino correctamente el recurso"})
    }

    static async update(req, res) {
        const result = validateResourceUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedResource = await resourceModel.update({id, input: req.body})
        if(updatedResource) return res.json(updatedResource)
        res.status(404).json({message: 'Recurso existente con ese nombre'})
    }
}
