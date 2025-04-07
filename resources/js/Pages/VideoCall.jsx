import React, { useState, useEffect,useRef } from 'react';
import { 
    PhoneIcon, 
    PhoneXMarkIcon, 
    MicrophoneIcon, 
    CameraIcon, 
} from '@heroicons/react/24/solid';

const VideoCall = () => {
    const [pin, setPin] = useState('');
    const [isPinValid, setIsPinValid] = useState(false);
    const [pinError, setPinError] = useState('');
    const [localStream, setLocalStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isCallEnded, setIsCallEnded] = useState(false);
    const [socket, setSocket] = useState(null);

    const userXVideoRef = useRef(null);
    const userYVideoRef = useRef(null);

    // Gestione PIN
    const handlePinChange = (event) => {
        const value = event.target.value;
        if (value.length <= 5 && !isNaN(value)) {
            setPin(value);
        }
    };

    const handlePinSubmit = () => {
        if (pin.length !== 5) {
            setPinError('Il PIN deve essere di 5 cifre!');
            return;
        }

        if (pin === '12345') {
            setIsPinValid(true);
            setPinError('');
            startCall();
        } else {
            setPinError('PIN errato. Riprova.');
        }
    };

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8085");
    
        ws.onopen = () => console.log("Connesso al WebSocket");
        
        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log("Messaggio ricevuto:", data);
    
            if (data.type === "offer") {
                console.log("Ricevuta offerta SDP:", data.offer);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: "answer", answer }));
    
            } else if (data.type === "answer") {
                console.log("Ricevuta risposta SDP:", data.answer);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    
            } else if (data.type === "candidate") {
                console.log("Ricevuto ICE candidate:", data.candidate);
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };
    
        ws.onclose = () => console.log("WebSocket chiuso");
        setSocket(ws);
    
        return () => ws.close();
    }, []);

    const startCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (userXVideoRef.current) {
                userXVideoRef.current.srcObject = stream;
            }
    
            const peer = new RTCPeerConnection();
            setPeerConnection(peer);
    
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
    
            peer.ontrack = (event) => {
                if (userYVideoRef.current) {
                    userYVideoRef.current.srcObject = event.streams[0];
                }
            };
    
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                }
            };
    
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            
            socket.send(JSON.stringify({ type: "offer", offer })); // Invia offerta via WebSocket
        } catch (error) {
            console.error("Errore durante l'accesso alla webcam:", error);
        }
    };
    
    
    // Gestione dei segnali WebSocket
    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    };
    
    const handleSocketMessage = (message) => {
        const data = JSON.parse(message.data);
    
        if (data.type === "offer") {
            handleOffer(data.offer);
        } else if (data.type === "answer") {
            handleAnswer(data.answer);
        } else if (data.type === "candidate") {
            handleCandidate(data.candidate);
        }
    };
    
    // Gestione dell'offerta ricevuta
    const handleOffer = async (offer) => {
        const peer = new RTCPeerConnection();
        setPeerConnection(peer);
    
        // Aggiungere la gestione dei track locali
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
    
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
    
        sendMessage({ type: "answer", answer });
    
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({ type: "candidate", candidate: event.candidate });
            }
        };
    
        peer.ontrack = (event) => {
            if (userYVideoRef.current) {
                userYVideoRef.current.srcObject = event.streams[0];
            }
        };
    };
    
    // Gestione della risposta
    const handleAnswer = (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    };
    
    // Gestione dei candidati ICE
    const handleCandidate = (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };
    
    // WebSocket listener
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8085");
    
        ws.onopen = () => {
            console.log("Connesso al server WebSocket");
        };
    
        ws.onmessage = handleSocketMessage;
    
        ws.onclose = () => {
            console.log("Connessione WebSocket chiusa");
        };
    
        setSocket(ws);
    
        return () => {
            ws.close();
        };
    }, []);
    

    // Funzione per silenziare / attivare il microfono
    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    // Funzione per disattivare / attivare la webcam
    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    // Funzione per chiudere la chiamata
    const endCall = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setIsCallEnded(true);
    };

    // Funzione per riattivare la chiamata
    const resumeCall = () => {
        setIsCallEnded(false);
        startCall();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
                {!isPinValid ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Inserisci il PIN per avviare la chiamata</h2>
                        <input
                            type="text"
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="PIN (5 cifre)"
                            maxLength="5"
                            className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-center text-lg"
                        />
                        <button
                            onClick={handlePinSubmit}
                            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Avvia Chiamata
                        </button>
                        {pinError && <p className="mt-2 text-red-500">{pinError}</p>}
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Videochiamata in corso...</h2>

                        {/* Video display area */}
                        <div className="flex justify-center space-x-4 mb-4">
                            <div className="w-48 h-48 bg-gray-300 rounded-full overflow-hidden">
                                <video ref={userXVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            </div>
                            <div className="w-48 h-48 bg-gray-300 rounded-full overflow-hidden">
                                <video ref={userYVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Controlli */}
                        <div className="flex justify-center space-x-6 mb-6">
                            <button
                                onClick={toggleAudio}
                                className={`p-4 rounded-full ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} hover:bg-blue-600`}
                                title={isAudioMuted ? "Attiva Microfono" : "Disattiva Microfono"}
                            >
                                <MicrophoneIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} hover:bg-blue-600`}
                                title={isVideoMuted ? "Attiva Webcam" : "Disattiva Webcam"}
                            >
                                <CameraIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Chiamata - Termina e Riattiva */}
                        <div className="flex justify-center space-x-6">
                            <button
                                onClick={endCall}
                                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600"
                                title="Termina Chiamata"
                            >
                                <PhoneXMarkIcon className="w-6 h-6" />
                            </button>

                            {isCallEnded && (
                                <button
                                    onClick={resumeCall}
                                    className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600"
                                    title="Riprendi Chiamata"
                                >
                                    <PhoneIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCall;
