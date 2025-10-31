import {validateResource, validateResourceUpdate} from '../schemas/resourceSchema.js';

export class ResourceController {

    constructor({resourceModel}) {
        this.resourceModel = resourceModel
    }

    getAll = async (req, res) => {
        const resource = await this.resourceModel.getAll()
        res.json(resource)
    }
    getById = async (req, res) => {
        const {id} = req.params
        const resource = await this.resourceModel.getById({id})
        if(resource) return res.json(resource)
        res.status(404).json({message: 'Recurso no encontrado'})
    }

    create = async (req, res) => {

        const result = validateResource(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newResource= await this.resourceModel.create({input: req.body})
        if(newResource === false) return res.status(409).json({message: 'Recurso con ese nombre ya existe'})
        res.status(201).json(newResource)
    }

    delete = async (req, res) =>{
        const {id} = req.params
        const deletedResource = await this.resourceModel.delete({id})

        if(deletedResource === false) return res.status(404).json({message: 'Recurso no eliminado'})
        res.status(204).json({message: "Se elimino correctamente el recurso"})
    }

    update = async (req, res) =>{
        const result = validateResourceUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedResource = await this.resourceModel.update({id, input: req.body})
        if(updatedResource) return res.json(updatedResource)
        res.status(404).json({message: 'Recurso existente con ese nombre'})
    }
}
