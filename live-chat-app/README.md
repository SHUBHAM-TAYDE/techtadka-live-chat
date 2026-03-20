# 💬 Live Chat App
### Tech Tadka With Shubham — Utho Cloud Series

A production-ready real-time chat application built with Node.js, Socket.io, PostgreSQL, and Redis. Designed to be deployed on Utho Cloud with a highly available, auto-scaling setup.

---

## Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Backend     | Node.js 20 + Express                |
| Real-time   | Socket.io 4                         |
| Pub/Sub     | Redis + @socket.io/redis-adapter    |
| Database    | PostgreSQL 16 (Utho Managed DB)     |
| Auth        | JWT + bcryptjs                      |
| Process Mgr | PM2 (cluster mode)                  |
| Proxy       | Nginx                               |
| Containers  | Docker + Docker Compose (local dev) |

---

## Features

- User registration and login with JWT auth
- Multiple public chat rooms
- Real-time messaging via WebSockets
- Online presence indicator
- Message history with cursor-based pagination
- Typing indicators
- Scales horizontally via Redis pub/sub adapter

---

## Local Development (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/live-chat-app.git
cd live-chat-app

# 2. Copy and edit .env
cp server/.env.example server/.env
# Edit JWT_SECRET and CORS_ORIGINS at minimum

# 3. Start everything
docker-compose up --build

# 4. Server is running at http://localhost:5000
curl http://localhost:5000/health
```

---

## API Reference

### Auth
| Method | Endpoint             | Body                           | Auth |
|--------|----------------------|--------------------------------|------|
| POST   | /api/auth/register   | username, email, password      | No   |
| POST   | /api/auth/login      | email, password                | No   |
| GET    | /api/auth/me         | —                              | Yes  |

### Rooms
| Method | Endpoint                     | Auth |
|--------|------------------------------|------|
| GET    | /api/rooms                   | Yes  |
| POST   | /api/rooms                   | Yes  |
| GET    | /api/rooms/:id               | Yes  |
| GET    | /api/rooms/:id/members       | Yes  |

### Messages
| Method | Endpoint                                    | Auth |
|--------|---------------------------------------------|------|
| GET    | /api/rooms/:roomId/messages?before=&limit=  | Yes  |

### Health
| Method | Endpoint  | Auth |
|--------|-----------|------|
| GET    | /health   | No   |

---

## Socket.io Events

### Client → Server
| Event         | Payload                  |
|---------------|--------------------------|
| join_room     | { roomId }               |
| leave_room    | { roomId }               |
| send_message  | { roomId, content }      |
| typing_start  | { roomId }               |
| typing_stop   | { roomId }               |

### Server → Client
| Event            | Payload                            |
|------------------|------------------------------------|
| message_received | { message }                        |
| room_joined      | { roomId, members }                |
| user_joined      | { user, roomId }                   |
| user_left        | { userId, roomId }                 |
| online_users     | { users }                          |
| user_typing      | { userId, username, roomId }       |
| user_stop_typing | { userId, roomId }                 |
| error            | { message }                        |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete Utho Cloud setup guide.

---

## Project Structure

```
live-chat-app/
├── server/
│   ├── config/
│   │   ├── db.js           # PostgreSQL pool
│   │   ├── redis.js        # Redis pub/sub clients
│   │   └── logger.js       # Winston logger
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── roomController.js
│   │   └── messageController.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT (HTTP + Socket)
│   ├── models/
│   │   └── schema.sql          # PostgreSQL schema
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── room.routes.js
│   │   └── message.routes.js
│   ├── socket/
│   │   └── socket.js           # All Socket.io events
│   ├── index.js                # Entry point
│   ├── ecosystem.config.js     # PM2 config
│   └── Dockerfile
├── nginx/
│   └── default.conf
├── docker-compose.yml
├── DEPLOYMENT.md
└── README.md
```

---

Made with ❤️ for Tech Tadka With Shubham
