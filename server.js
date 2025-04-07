import { WebSocketServer } from "ws";
import { createServer } from "http";

const server = createServer();
const wss = new WebSocketServer({ server });

let clients = [];

wss.on("connection", (socket) => {
    clients.push(socket);

    socket.on("message", (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString()); 
            console.log("Messaggio ricevuto:", parsedMessage);

            // Invia il messaggio SOLO all'altro client
            clients.forEach(client => {
                if (client !== socket && client.readyState === 1) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });
        } catch (error) {
            console.error("Errore parsing JSON WebSocket:", error);
        }
    });

    socket.on("close", () => {
        clients = clients.filter(client => client !== socket);
    });
});

server.listen(8085, () => {
    console.log("Server WebSocket in esecuzione su ws://localhost:8085");
});
