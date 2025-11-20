import { Component } from '@angular/core';
import { SocketService } from './socket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Material modules (the user should `ng add @angular/material` and install)
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatInputModule, MatListModule, MatCardModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      Angular Chat (roles + rooms + private + JWT)
    </mat-toolbar>

    <div style="display:flex; gap:16px; padding:16px;">
      <mat-card style="width:280px">
        <h3>Login (demo)</h3>
        <input matInput placeholder="username (alice|bob|carla)" [(ngModel)]="username" />
        <button mat-raised-button color="primary" (click)="login()">Login</button>
        <div *ngIf="me"><small>Conectado como: {{me.username}} ({{me.role}})</small></div>

        <hr />
        <h4>Salas</h4>
        <input matInput placeholder="nueva sala" [(ngModel)]="newRoom" />
        <button mat-button (click)="createOrJoin()">Crear/Entrar</button>
        <div>
          <h5>Rooms</h5>
          <mat-list>
            <mat-list-item *ngFor="let r of rooms">{{r}}</mat-list-item>
          </mat-list>
          <button mat-button color="warn" (click)="deleteRoom()">Eliminar sala seleccionada (admin)</button>
        </div>
      </mat-card>

      <mat-card style="flex:1;">
        <h3>Chat - Sala actual: <strong>{{currentRoom || 'Ninguna'}}</strong></h3>
        <div style="height:300px; overflow:auto; border:1px solid #eee; padding:8px; background:#fafafa;">
          <div *ngFor="let m of mensajes" style="margin:4px 0; padding:4px; background:white; border-radius:4px;">{{m}}</div>
        </div>

        <div style="margin-top:10px;">
          <input matInput placeholder="Escribe tu mensaje..." [(ngModel)]="msg" style="width:70%; padding:8px;" />
          <button mat-raised-button color="primary" (click)="sendRoom()" style="margin-left:8px;">Enviar a Sala</button>
          <button mat-raised-button color="accent" (click)="broadcast()" style="margin-left:8px;">📢 Global (admin)</button>
        </div>

        <hr />
        <h4>Privado</h4>
        <div>
          <label>To socket id:</label>
          <input matInput [(ngModel)]="toId" placeholder="socket id" />
          <button mat-button (click)="sendPrivate()">Enviar privado</button>
        </div>

      </mat-card>

      <mat-card style="width:240px">
        <h4>Usuarios conectados</h4>
        <mat-list>
          <mat-list-item *ngFor="let u of users">{{u.username}} ({{u.role}}) - {{u.id}}</mat-list-item>
        </mat-list>
      </mat-card>
    </div>
  `
})
export class AppComponent {
  username = '';
  me: any = null;
  token = '';
  rooms: string[] = [];
  currentRoom = '';
  newRoom = '';
  mensajes: string[] = [];
  msg = '';
  users: any[] = [];
  toId = '';

  constructor(private sock: SocketService) {
    // listeners will be set after connect
  }

  async login() {
    if (!this.username) return alert('Ingrese username (alice|bob|carla)');
    // call backend login
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username })
      });
      const data = await res.json();
      if (!res.ok) return alert(JSON.stringify(data));
      this.token = data.token;
      this.me = { username: data.username, role: data.role };
      this.sock.connect(this.token);

      // setup socket listeners
      this.sock.listen('rooms').subscribe((r:any)=> this.rooms = r);
      this.sock.listen('system').subscribe((d:any)=> this.mensajes.push('[SISTEMA] ' + d.msg));
      this.sock.listen('roomMessage').subscribe((d:any)=> {
        this.mensajes.push(`[SALA: ${d.room}] ${d.from}: ${d.message}`);
      });
      this.sock.listen('broadcast').subscribe((d:any)=> {
        this.mensajes.push(`[📢 MENSAJE GLOBAL A TODOS] ${d.from}: ${d.message}`);
      });
      this.sock.listen('privateMessage').subscribe((d:any)=> {
        this.mensajes.push(`[💬 PRIVADO de ${d.from}] ${d.message}`);
      });
      this.sock.listen('presence').subscribe((p:any)=> this.users = p.clients);
      this.sock.listen('error').subscribe((e:any)=> alert('Error: ' + e.msg));
      // request rooms list
      this.sock.emit('listRooms');
    } catch (err) {
      alert('Error al llamar login: ' + err);
    }
  }

  createOrJoin() {
    if (!this.newRoom) return;
    this.currentRoom = this.newRoom;
    this.sock.emit('createOrJoinRoom', this.newRoom);
    this.newRoom = '';
  }

  sendRoom() {
    if (!this.currentRoom) return alert('Selecciona o crea una sala');
    this.sock.emit('roomMessage', { room: this.currentRoom, message: this.msg });
    this.msg = '';
  }

  broadcast() {
    if (!this.me) return;
    this.sock.emit('broadcast', this.msg);
    this.msg = '';
  }

  sendPrivate() {
    if (!this.toId) return alert('Ingrese socket id del destinatario');
    this.sock.emit('privateMessage', { toSocketId: this.toId, message: this.msg });
    this.msg = '';
  }

  deleteRoom() {
    if (!this.currentRoom) return alert('Selecciona sala a eliminar');
    this.sock.emit('deleteRoom', this.currentRoom);
    this.currentRoom = '';
  }
}