import{validateState, validateStateUpdate} from '../schemas/stateSchema.js'


export class StateController {

    constructor({stateModel}) {
        this.stateModel = stateModel
    }



    getAll = async (req, res) =>{
    const states = await this.stateModel.getAll()
    res.json(states)
  }
  getById = async (req, res) =>{
    const {id} = req.params
    const state = await this.stateModel.getById({id})
    if(state) return res.json(state)
    res.status(404).json({message: 'Estado no encontrado'})
  }

  create = async (req, res) =>{

    const result = validateState(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    const newState= await this.stateModel.create({input: req.body})
    if(newState === false) return res.status(409).json({message: 'Este estado ya existe'})
    res.status(201).json(newState)
  }

  delete = async (req, res) =>{
    const {id} = req.params
    const deletedState = await this.stateModel.delete({id})

    if(deletedState === false) return res.status(404).json({message: 'Estado no eliminado, algun activo esta asignado con este estado'})
    res.status(204).json({message: "Se elimino correctamente el estado"})
  }

  update = async (req, res) =>{
    const result = validateStateUpdate(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }

    const {id} = req.params
    const updatedState = await this.stateModel.update({id, input: req.body})
    if(updatedState) return res.json(updatedState)
    res.status(404).json({message: 'Estado no actualizado'})
  }

  getByStateName = async (req, res) =>{
    const {nombre} = req.params
    const state = await this.stateModel.getByStateName({nombre})
    if(state) return res.json(state)
    res.status(404).json({message: 'Estado no encontrado'})
  }
}