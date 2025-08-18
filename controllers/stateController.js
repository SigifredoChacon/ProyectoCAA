import {StateModel} from '../models/postgresql/stateModel.js'
import{validateState, validateStateUpdate} from '../schemas/stateSchema.js'
import {roleModel} from "../models/postgresql/roleModel.js";

export class StateController {

  static async getAll(req, res) {
    const states = await StateModel.getAll()
    res.json(states)
  }
  static async getById(req, res) {
    const {id} = req.params
    const state = await StateModel.getById({id})
    if(state) return res.json(state)
    res.status(404).json({message: 'Estado no encontrado'})
  }

  static async create(req, res) {

    const result = validateState(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    const newState= await StateModel.create({input: req.body})
    if(newState === false) return res.status(409).json({message: 'Este estado ya existe'})
    res.status(201).json(newState)
  }

  static async delete(req, res) {
    const {id} = req.params
    const deletedState = await StateModel.delete({id})

    if(deletedState === false) return res.status(404).json({message: 'Estado no eliminado, algun activo esta asignado con este estado'})
    res.status(204).json({message: "Se elimino correctamente el estado"})
  }

  static async update(req, res) {
    const result = validateStateUpdate(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }

    const {id} = req.params
    const updatedState = await StateModel.update({id, input: req.body})
    if(updatedState) return res.json(updatedState)
    res.status(404).json({message: 'Estado no actualizado'})
  }

  static async getByStateName(req, res) {
    const {nombre} = req.params
    const state = await StateModel.getByStateName({nombre})
    if(state) return res.json(state)
    res.status(404).json({message: 'Estado no encontrado'})
  }
}