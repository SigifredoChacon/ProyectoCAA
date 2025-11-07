export function validatePassword(pwd) {
    const errores = [];
    if (typeof pwd !== 'string') errores.push('Debe ser texto.');
    if (!pwd || pwd.length < 8) errores.push('Mínimo 8 caracteres.');
    if (!/[A-Z]/.test(pwd)) errores.push('Al menos una letra mayúscula.');
    if (!/[a-z]/.test(pwd)) errores.push('Al menos una letra minúscula.');
    if (!/\d/.test(pwd)) errores.push('Al menos un número.');
    if (!/[^A-Za-z0-9]/.test(pwd)) errores.push('Al menos un carácter especial.');
    if (/\s/.test(pwd)) errores.push('No debe contener espacios.');
    if (Buffer.byteLength(pwd, 'utf8') > 72) errores.push('Máximo 72 bytes (límite de bcrypt).');
    return { ok: errores.length === 0, errores };
}
