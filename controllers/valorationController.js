import { valorationModel } from '../models/postgresql/valorationModel.js';

export class valorationController {

  // Crear una nueva valoración
  static async create(req, res) {
    try {
      const idEncuesta = await valorationModel.create({ input: req.body });
      return res.status(201).json({ message: 'Valoración creada con éxito', idEncuesta });
    } catch (error) {
      return res.status(404).json(error);
    }
  }

  // Obtener todas las valoraciones
  static async getAll(req, res) {
    try {
      const valoraciones = await valorationModel.getAll();
      return res.status(200).json(valoraciones);
    } catch (error) {

      return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
  }

  // Obtener valoraciones por Sala
  static async getBySala(req, res) {
    const { idSala } = req.params;
    try {
      const valoraciones = await valorationModel.getByRoomId(idSala);
      if (valoraciones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron valoraciones para esta sala' });
      }
      return res.status(200).json(valoraciones);
    } catch (error) {
      console.error('Error al obtener valoraciones:', error);
      return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
  }

  // Obtener valoraciones por Cubículo
  static async getByCubiculo(req, res) {
    const { idCubiculo } = req.params;
    try {
      const valoraciones = await valorationModel.getByCubicleId(idCubiculo);
      if (valoraciones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron valoraciones para este cubículo' });
      }
      return res.status(200).json(valoraciones);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
  }

  // Obtener una valoración por ID
  static async getById(req, res) {
    const { idEncuesta } = req.params;
    try {
      const valoracion = await valorationModel.getById(idEncuesta);
      if (!valoracion) {
        return res.status(404).json({ message: 'Valoración no encontrada' });
      }
      return res.status(200).json(valoracion);
    } catch (error) {

      return res.status(500).json({ message: 'Error al obtener la valoración' });
    }
  }

  // Eliminar una valoración
  static async delete(req, res) {
    const { idEncuesta } = req.params;
    const deleted = await valorationModel.delete(idEncuesta);
    if (deleted) {
      return res.status(204).json({ message: 'Valoración eliminada correctamente' });
    }
    return res.status(404).json({ message: 'Valoración no encontrada' });

  }
}
