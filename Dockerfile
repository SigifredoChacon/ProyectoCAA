# 1️⃣ Imagen base oficial de Node.js
FROM node:18-alpine

# 2️⃣ Directorio de trabajo dentro del contenedor
WORKDIR /backend

# 3️⃣ Copiamos package.json y package-lock.json
COPY package*.json ./

# 4️⃣ Instalamos SOLO dependencias de producción
RUN npm ci --only=production

# 5️⃣ Copiamos el resto del código
COPY . .

# 6️⃣Establecemos zona horaria
ENV TZ="America/Costa_Rica"

# 7️⃣ Exponemos el puerto del backend
EXPOSE 3000

# 8️⃣ Comando de inicio
CMD ["npm", "run", "start:mysql"]
