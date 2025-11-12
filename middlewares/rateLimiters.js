import rateLimit, { ipKeyGenerator } from 'express-rate-limit';



export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',

    skipSuccessfulRequests: true,
    message: { message: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.' },
});

export const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',

    keyGenerator: (req) => {
        const email = (req.body?.email || '').toLowerCase().trim();
        const ipKey = ipKeyGenerator(req.ip, 56);
        return email ? `${ipKey}:${email}` : ipKey;
    },

    message: { message: 'Demasiadas solicitudes. Intenta más tarde.' },
});

export const mailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { message: 'Has alcanzado el límite de envíos. Intenta más tarde.' },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { message: 'Has superado el límite de peticiones. Intenta más tarde.' },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    keyGenerator: (req) => {
        const email = (req.body?.email || '').toLowerCase().trim();
        const ipKey = ipKeyGenerator(req.ip, 56);
        return email ? `${ipKey}:register:${email}` : `${ipKey}:register`;
    },
    message: { message: 'Demasiados registros desde este origen. Intenta más tarde.' },
});

export const perUserWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    keyGenerator: (req) => {

        const ipKey = ipKeyGenerator(req.ip, 56);
        const uid = req.user?.id ? String(req.user.id) : 'anon';
        return `${ipKey}:write:${uid}`;
    },
    message: { message: 'Has realizado demasiadas acciones en poco tiempo. Intenta de nuevo en breve.' },
});
