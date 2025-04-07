// resources/js/components/CallNotification.jsx

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

export default function CallNotification() {
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        socket.on('incoming_call', (callerInfo) => {
            setIncomingCall(callerInfo);
            // Mostra una notifica o un popup di chiamata in arrivo
        });
    }, []);

    const acceptCall = () => {
        // Logica per accettare la chiamata
        socket.emit('accept_call', { caller: incomingCall });
        setIncomingCall(null);
    };

    const rejectCall = () => {
        // Logica per rifiutare la chiamata
        setIncomingCall(null);
    };

    return (
        <div>
            {incomingCall && (
                <div>
                    <p>Chiamata in arrivo da: {incomingCall.name}</p>
                    <button onClick={acceptCall}>Accetta</button>
                    <button onClick={rejectCall}>Rifiuta</button>
                </div>
            )}
        </div>
    );
}
