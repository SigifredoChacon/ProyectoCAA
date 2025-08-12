import {RoomModel} from '../models/postgresql/roomModel.js';
import {validateRoom, validateRoomUpdate} from '../schemas/roomSchema.js';
export class RoomController {

    static async getAll(req, res) {
        try {
            const rooms = await RoomModel.getAll();


            const roomsWithBase64Images = rooms.map((room) => {
                if (room.Imagen) {

                    const base64Image = room.Imagen.toString('base64');
                    return {
                        ...room,
                        Imagen: base64Image
                    };
                } else {
                    return room;
                }
            });

            res.json(roomsWithBase64Images);
        } catch (error) {
            console.error('Error al obtener las salas:', error);
            res.status(500).json({ message: 'Error al obtener las salas' });
        }
    }

    static async getById(req, res) {
        const {id} = req.params
        const room = await RoomModel.getById({id})
        if(room) return res.json(room)
        res.status(404).json({message: 'Sala no encontrada'})
    }

    static async getNameById(req, res) {
        const {id} = req.params
        const room = await RoomModel.getNameById({id})
        if(room) return res.json(room)
        res.status(404).json({message: 'Sala no encontrada'})
    }

    static async create(req, res) {


        const imagen = req.file ? req.file.buffer : null;


        const newRoom = await RoomModel.create({
            input: {
                imagen,
                nombre: req.body.nombre,
                descripcion: req.body.descripcion,
                restricciones: req.body.restricciones,
                estado: req.body.estado === 'true' || req.body.estado === '1',
            }
        });

        const result = validateRoomUpdate(newRoom)
        if (result.success === false) {
            return res.status(400).json({error: JSON.parse(result.error.message)})
        }

        if (newRoom === false) return res.status(409).json({message: 'Sala con ese nombre ya existe'});
        res.status(201).json(newRoom);
    }


    static async delete(req, res) {
        const {id} = req.params
        const deletedRoom = await RoomModel.delete({id})

        if(deletedRoom === false) return res.status(404).json({message: 'Sala no eliminada, alguna reservacion posee esta sala'})
        res.status(204).json({message: "Se elimino correctamente la sala"})
    }

    static async update(req, res) {
        try {

            let updateData = req.body;
            if (req.file) {
                updateData.imagen = req.file.buffer;
            }

            if (updateData.estado !== undefined) {
                updateData.estado = updateData.estado === 'true' || updateData.estado === '1';
            }


            const result = validateRoomUpdate(updateData);
            if (result.success === false) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }

            const { id } = req.params;


            const updatedRoom = await RoomModel.update({ id, input: updateData });
            if (updatedRoom) {
                return res.json(updatedRoom);
            }

            res.status(404).json({ message: 'Sala no actualizada' });
        } catch (error) {
            console.error('Error al actualizar la sala:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    static async lock(req, res) {
        const updatedRooms = await RoomModel.lock()
        if(updatedRooms) return res.json(updatedRooms)
        res.status(404).json({message: 'Salas no actualizadas'})
    }

    static async unLock(req, res) {
        const updatedRooms = await RoomModel.unLock()
        if(updatedRooms) return res.json(updatedRooms)
        res.status(404).json({message: 'Salas no actualizadas'})
    }

}
