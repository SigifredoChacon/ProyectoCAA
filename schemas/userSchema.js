import z from 'zod'

const userSchema = z.object({
    cedulaCarnet: z.number().int({
        invalid_type_error: 'La cedula o carnet debe ser un numero entero',
        required_error: 'La cedula o carnet es requerida'
    }).positive(),
    nombre: z.string({
        invalid_type_error: 'El nombre debe ser un string',
        required_error: 'El nombre es requerido'
    }).min(1).max(45),
    correoEmail: z.string({
        invalid_type_error: 'El correo email debe ser un string',
        required_error: 'El correo email es requerido'
    }).min(1).max(100),
    correoInstitucional: z.string({
        invalid_type_error: 'El correo institucional debe ser un string',
    }).max(100).nullable().optional(),
    contrasena: z.string({
        invalid_type_error: 'La contraseña debe ser un string',
        required_error: 'La contraseña es requerida'
    }).min(4).max(250),
    telefono: z.string({
        invalid_type_error: 'El telefono debe ser un numero entero',
    }).max(12).nullable().optional(),
    telefono2: z.string({
        invalid_type_error: 'La cedula o carnet debe ser un numero entero',
    }).max(12).nullable().optional(),
    direccion: z.string({
        invalid_type_error: 'La direccion debe ser un string',
    }).max(200).nullable().optional(),
    idRol:  z.number().int({
        invalid_type_error: 'El idRol debe ser un numero entero',
        required_error: 'El idRol es requerido'
    }).positive()
})

export function validateUser(input) {
    return userSchema.safeParse(input)
}

export function validateUserUpdate(input) {
    return userSchema.partial().safeParse(input)
}