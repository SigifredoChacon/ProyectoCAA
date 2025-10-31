import {validateAsset, validateAssetUpdate} from '../schemas/assetSchema.js';


export class AssetController {

    constructor({assetModel}) {
        this.assetModel = assetModel
    }

    getAll = async (req, res) =>{
        const assets = await this.assetModel.getAll()
        res.json(assets)
    }
    getById = async (req, res) =>{
        const {id} = req.params
        const asset = await this.assetModel.getById({id})
        if(asset) return res.json(asset)
        res.status(404).json({message: 'Activo no encontrado'})
    }

    getByCategory = async (req, res) =>{
        const {id} = req.params
        const asset = await this.assetModel.getByCategory({id})
        if(asset) return res.json(asset)
        res.status(404).json({message: 'Activos con esa categoria no encontrados'})
    }

    getFirstAvailableAsset = async (req, res) =>{
        const {assetCategory} = req.params
        const asset = await this.assetModel.getFirstAvailableAsset({assetCategory})
        if(asset) return res.json(asset)
        res.status(404).json({message: 'No hay activos para disponibles para prestamo'})
    }

    create = async (req, res) =>{

        const result = validateAsset(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }
        const newAsset= await this.assetModel.create({input: req.body})
        if(typeof newAsset === 'string') return res.status(409).json({ message: newAsset });
        res.status(201).json(newAsset)
    }

    delete = async (req, res) =>{
        const {id} = req.params
        const deletedAsset = await this.assetModel.delete({id})

        if(deletedAsset === false) return res.status(404).json({message: 'Este Activo se encuentra vinculado con una solicitud, no se puede eliminar'})
        res.status(204).json({message: "Se elimino correctamente el Activo"})
    }

    update = async(req, res) =>{
        const result = validateAssetUpdate(req.body)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        const {id} = req.params
        const updatedAsset = await this.assetModel.update({id, input: req.body})
        if(updatedAsset) return res.json(updatedAsset)
        res.status(404).json({message: 'Activo no actualizado'})
    }
}
