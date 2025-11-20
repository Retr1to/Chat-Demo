Angular 18 + Node.js Chat (Full example)
---------------------------------------

Contenido:
- server/    -> Servidor Express + Socket.IO + JWT (demo)
- client/    -> Cliente Angular (standalone AppComponent + SocketService)

Instrucciones servidor:
1) cd server
2) npm install
3) npm start
El servidor escuchará en http://localhost:3000

Instrucciones cliente (skeleton):
Este cliente es un ejemplo minimal. Se asume que tienes Angular CLI instalado.
1) cd client
2) npm install
3) ng add @angular/material   <-- opcional pero recomendado para que los imports de Material funcionen
4) ng serve --open

Login demo:
Usa username: alice, bob o carla
- alice = admin (puede eliminar salas y hacer broadcast)
- bob, carla = user

Notas:
- Cambia SECRET en server/server.js antes de usar en producción.
- Este proyecto usa almacenamiento en memoria (no persistente) para simplicidad.
- Si prefieres, puedo generar un proyecto Angular real completo (con angular.json, tsconfig y estructura) en el ZIP.