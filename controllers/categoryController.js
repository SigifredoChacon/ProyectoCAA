import {validateCategory, validateCategoryUpdate} from '../schemas/categorySchema.js';


export class CategoryController {

    constructor({categoryModel}) {
        this.categoryModel = categoryModel
    }

    getAll = async (req, res) =>{
        const categories = await this.categoryModel.getAll()
        res.json(categories)
    }

    getByCategoryName = async (req, res) =>{
        const {nombre} = req.params
        const role = await this.categoryModel.getByCategoryName({nombre})
        if(role) return res.json(role)
        res.status(404).json({message: 'Categoria no encontrada'})
    }

    getById = async (req, res) =>{
        const {id} = req.params
        const category = await this.categoryModel.getById({id})
        if(category) return res.json(category)
        res.status(404).json({message: 'Categoria no encontrada'})
    }

    create = async (req, res) =>{

        const result = validateCategory(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newCategory= await this.categoryModel.create({input: req.body})
        if(newCategory === false) return res.status(409).json({message: 'Categoria con ese nombre ya existe'})
        res.status(201).json(newCategory)
    }

    delete = async(req, res) =>{
        const {id} = req.params
        const deletedCategory = await this.categoryModel.delete({id})

        if(deletedCategory === false) return res.status(404).json({message: 'Categoria no eliminada, se encuentra asociada a un activo'})
        res.status(204).json({message: "Se elimino correctamente la categoria"})
    }

    update = async (req, res) =>{
        const result = validateCategoryUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedCategory = await this.categoryModel.update({id, input: req.body})
        if(updatedCategory) return res.json(updatedCategory)
        res.status(404).json({message: 'Categoria no actualizada'})
    }
}
