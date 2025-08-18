import {roleModel} from '../models/postgresql/roleModel.js';
import {validateRole, validateRoleUpdate} from '../schemas/roleSchema.js';
export class roleController {

    static async getAll(req, res) {
        const roles = await roleModel.getAll()
        res.json(roles)
    }

    static async getById(req, res) {
        const {id} = req.params
        const role = await roleModel.getById({id})
        if(role) return res.json(role)
        res.status(404).json({message: 'Rol no encontrado'})
    }

    static async create(req, res) {

        const result = validateRole(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newRole= await roleModel.create({input: req.body})
        if(newRole === false) return res.status(409).json({message: 'Rol con ese nombre ya existe'})
        res.status(201).json(newRole)
    }

    static async delete(req, res) {
        const {id} = req.params
        const deletedRole = await roleModel.delete({id})

        if(deletedRole === false) return res.status(404).json({message: 'Rol no eliminado, se encuentra asignado a un usuario'})
        res.status(204).json({message: "Se elimino correctamente el Rol"})
    }

    static async update(req, res) {
        const result = validateRoleUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedRole = await roleModel.update({id, input: req.body})
        if(updatedRole) return res.json(updatedRole)
        res.status(404).json({message: 'Rol no actualizado'})
    }

    static async getByRoleName(req, res) {
        const {nombre} = req.params
        const role = await roleModel.getByRoleName({nombre})
        if(role) return res.json(role)
        res.status(404).json({message: 'Rol no encontrado'})
    }
}
