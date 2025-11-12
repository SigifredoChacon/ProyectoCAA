
export const createUserCleanupService = ({ userModel, maxAgeDays = 7 }) => {
    if (!userModel) {
        throw new Error('userModel es requerido en createUserCleanupService');
    }

    return async () => {
        try {
            const deletedCount = await userModel.deleteOldUnverified({ maxAgeDays });

            console.log(
                `[UserCleanup] Eliminados ${deletedCount} usuarios no verificados ` +
                `con más de ${maxAgeDays} días de antigüedad`
            );
        } catch (err) {
            console.error('[UserCleanup] Error al eliminar usuarios no verificados:', err);
        }
    };
};
