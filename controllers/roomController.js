import {validateRoom, validateRoomUpdate} from '../schemas/roomSchema.js';


export class RoomController {


    constructor({roomModel}) {
        this.roomModel = roomModel
    }


    getAll = async (req, res) =>{
        try {
            const rooms = await this.roomModel.getAll();


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

    getById = async (req, res) =>{
        const {id} = req.params
        const room = await this.roomModel.getById({id})
        if(room) return res.json(room)
        res.status(404).json({message: 'Sala no encontrada'})
    }

    getNameById = async (req, res) =>{
        const {id} = req.params
        const room = await this.roomModel.getNameById({id})
        if(room) return res.json(room)
        res.status(404).json({message: 'Sala no encontrada'})
    }

    create = async (req, res) =>{


        const imagen = req.file ? req.file.buffer : null;


        const newRoom = await this.roomModel.create({
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


    delete = async (req, res) =>{
        const {id} = req.params
        const deletedRoom = await this.roomModel.delete({id})

        if(deletedRoom === false) return res.status(404).json({message: 'Sala no eliminada, alguna reservacion posee esta sala'})
        res.status(204).json({message: "Se elimino correctamente la sala"})
    }

    update = async (req, res) =>{
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


            const updatedRoom = await this.roomModel.update({ id, input: updateData });
            if (updatedRoom) {
                return res.json(updatedRoom);
            }

            res.status(404).json({ message: 'Sala no actualizada' });
        } catch (error) {
            console.error('Error al actualizar la sala:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    lock = async (req, res) =>{
        const updatedRooms = await this.roomModel.lock()
        if(updatedRooms) return res.json(updatedRooms)
        res.status(404).json({message: 'Salas no actualizadas'})
    }

    unLock = async (req, res) =>{
        const updatedRooms = await this.roomModel.unLock()
        if(updatedRooms) return res.json(updatedRooms)
        res.status(404).json({message: 'Salas no actualizadas'})
    }

}
