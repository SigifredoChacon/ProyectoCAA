

export class ValorationController {

    constructor({valorationModel, reservationModel}) {
        this.valorationModel = valorationModel
        this.reservationModel = reservationModel
    }

  // Crear una nueva valoración
  create = async (req, res) =>{
    try {
        const requester = req.user.id;
        const encuestasPendientes = await this.reservationModel.getByUserIdCompleted({id: requester});
        if(encuestasPendientes.length === 0){
            return res.status(400).json({ message: 'No tienes reservas completadas para valorar.' });
        }
        const idEncuesta = await this.valorationModel.create({ input: req.body });
        return res.status(201).json({ message: 'Valoración creada con éxito', idEncuesta });
    } catch (error) {
        return res.status(404).json(error);
    }
  }

  // Obtener todas las valoraciones
  getAll = async(req, res) =>{
    try {
      const valoraciones = await this.valorationModel.getAll();
      return res.status(200).json(valoraciones);
    } catch (error) {

      return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
  }

  // Obtener valoraciones por Sala
  getBySala = async (req, res) =>{
    const { idSala } = req.params;
    try {
      const valoraciones = await this.valorationModel.getByRoomId(idSala);
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
  getByCubiculo = async (req, res) =>{
    const { idCubiculo } = req.params;
    try {
      const valoraciones = await this.valorationModel.getByCubicleId(idCubiculo);
      if (valoraciones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron valoraciones para este cubículo' });
      }
      return res.status(200).json(valoraciones);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
  }

  // Obtener una valoración por ID
  getById = async (req, res) =>{
    const { idEncuesta } = req.params;
    try {
      const valoracion = await this.valorationModel.getById(idEncuesta);
      if (!valoracion) {
        return res.status(404).json({ message: 'Valoración no encontrada' });
      }
      return res.status(200).json(valoracion);
    } catch (error) {

      return res.status(500).json({ message: 'Error al obtener la valoración' });
    }
  }

  // Eliminar una valoración
  delete = async (req, res) =>{
    const { idEncuesta } = req.params;
    const deleted = await this.valorationModel.delete(idEncuesta);
    if (deleted) {
      return res.status(204).json({ message: 'Valoración eliminada correctamente' });
    }
    return res.status(404).json({ message: 'Valoración no encontrada' });

  }
}
