import {validateRole, validateRoleUpdate} from '../schemas/roleSchema.js';



export class RoleController {

    constructor({roleModel}) {
        this.roleModel = roleModel
    }

     getAll = async (req, res) => {
        const roles = await this.roleModel.getAll()
        res.json(roles)
    }

     getById = async (req, res) =>{
        const {id} = req.params
        const role = await this.roleModel.getById({id})
        if(role) return res.json(role)
        res.status(404).json({message: 'Rol no encontrado'})
    }

     create = async(req, res) => {

        const result = validateRole(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newRole= await this.roleModel.create({input: req.body})
        if(newRole === false) return res.status(409).json({message: 'Rol con ese nombre ya existe'})
        res.status(201).json(newRole)
    }

     delete = async (req, res) => {
        const {id} = req.params
        const deletedRole = await this.roleModel.delete({id})

        if(deletedRole === false) return res.status(404).json({message: 'Rol no eliminado, se encuentra asignado a un usuario'})
        res.status(204).json({message: "Se elimino correctamente el Rol"})
    }

     update = async (req, res) => {
        const result = validateRoleUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedRole = await this.roleModel.update({id, input: req.body})
        if(updatedRole) return res.json(updatedRole)
        res.status(404).json({message: 'Rol no actualizado'})
    }

     getByRoleName = async (req, res) => {
        const {nombre} = req.params
        const role = await this.roleModel.getByRoleName({nombre})
        if(role) return res.json(role)
        res.status(404).json({message: 'Rol no encontrado'})
    }
}
