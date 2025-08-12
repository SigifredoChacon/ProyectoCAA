import {categoryModel} from '../models/postgresql/categoryModel.js';
import {validateCategory, validateCategoryUpdate} from '../schemas/categorySchema.js';
import {roleModel} from "../models/postgresql/roleModel.js";
export class categoryController {

    static async getAll(req, res) {
        const categories = await categoryModel.getAll()
        res.json(categories)
    }

    static async getByCategoryName(req, res) {
        const {nombre} = req.params
        const role = await categoryModel.getByCategoryName({nombre})
        if(role) return res.json(role)
        res.status(404).json({message: 'Categoria no encontrada'})
    }

    static async getById(req, res) {
        const {id} = req.params
        const category = await categoryModel.getById({id})
        if(category) return res.json(category)
        res.status(404).json({message: 'Categoria no encontrada'})
    }

    static async create(req, res) {

        const result = validateCategory(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newCategory= await categoryModel.create({input: req.body})
        if(newCategory === false) return res.status(409).json({message: 'Categoria con ese nombre ya existe'})
        res.status(201).json(newCategory)
    }

    static async delete(req, res) {
        const {id} = req.params
        const deletedCategory = await categoryModel.delete({id})

        if(deletedCategory === false) return res.status(404).json({message: 'Categoria no eliminada, se encuentra asociada a un activo'})
        res.status(204).json({message: "Se elimino correctamente la categoria"})
    }

    static async update(req, res) {
        const result = validateCategoryUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedCategory = await categoryModel.update({id, input: req.body})
        if(updatedCategory) return res.json(updatedCategory)
        res.status(404).json({message: 'Categoria no actualizada'})
    }
}
