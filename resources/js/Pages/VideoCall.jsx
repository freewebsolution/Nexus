import React, { useState, useEffect, useRef } from "react";
import {
    PhoneIcon,
    PhoneXMarkIcon,
    MicrophoneIcon,
    CameraIcon,
} from "@heroicons/react/24/solid";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

const VideoCall = ({ pin, userName, user, onEndCall }) => {
    const [enteredPin, setEnteredPin] = useState("");
    const [isPinValid, setIsPinValid] = useState(false);
    const [pinError, setPinError] = useState("");
    const [localStream, setLocalStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isCallEnded, setIsCallEnded] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false); // stato di connessione WebSocket

    const userXVideoRef = useRef(null);
    const userYVideoRef = useRef(null);

    const handlePinChange = (e) => {
        const value = e.target.value;
        if (value.length <= 5 && /^\d*$/.test(value)) {
            setEnteredPin(value);
        }
    };

    const handlePinSubmit = () => {
        if (enteredPin.length !== 5) {
            setPinError("Il PIN deve essere di 5 cifre!");
            return;
        }

        if (String(enteredPin) === String(pin)) {
            setIsPinValid(true);
            setPinError("");
            startCall();
        } else {
            setPinError("PIN errato. Riprova.");
        }
    };

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8085");

        ws.onopen = () => {
            console.log("WebSocket connesso");
            setIsSocketConnected(true);
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (!peerConnection) return;

            if (data.type === "offer") {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: "answer", answer }));
            } else if (data.type === "answer") {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.type === "candidate") {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        ws.onclose = () => {
            console.log("WebSocket chiuso");
            setIsSocketConnected(false);
        };

        ws.onerror = (error) => {
            console.error("Errore WebSocket:", error);
            setIsSocketConnected(false);
        };

        setSocket(ws);

        return () => {
            // Chiudi il WebSocket quando il componente è smontato
            if (ws) {
                ws.close();
            }
        };
    }, [peerConnection]);

    const startCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            if (userXVideoRef.current) {
                userXVideoRef.current.srcObject = stream;
            }

            const pc = new RTCPeerConnection();
            setPeerConnection(pc);

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (userYVideoRef.current) {
                    userYVideoRef.current.srcObject = event.streams[0];
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && socket?.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "offer", offer }));
            }
        } catch (err) {
            console.error("Errore media:", err);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const track = localStream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsAudioMuted(!track.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const track = localStream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoMuted(!track.enabled);
            }
        }
    };

    const endCall = () => {
        if (peerConnection) peerConnection.close();
        if (localStream) localStream.getTracks().forEach((t) => t.stop());
        setPeerConnection(null);
        setLocalStream(null);
        setIsCallEnded(true);
    };

    const resumeCall = () => {
        setIsCallEnded(false);
        startCall();
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Nexus</h2>}>
            <Head title="Nexus" />
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
                    {!isPinValid ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-4">
                                Inserisci il PIN ricevuto via email per avviare la chiamata con {userName}
                            </h2>
                            <input
                                type="password"
                                value={enteredPin}
                                onChange={handlePinChange}
                                placeholder="PIN (5 cifre)"
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
                            <div className="flex justify-center space-x-4 mb-4">
                                <div className="w-48 h-48 bg-gray-300 rounded-full overflow-hidden">
                                    <video
                                        ref={userXVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="w-48 h-48 bg-gray-300 rounded-full overflow-hidden">
                                    <video
                                        ref={userYVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center space-x-6 mb-6">
                                <button
                                    onClick={toggleAudio}
                                    className={`p-4 rounded-full ${isAudioMuted ? "bg-red-500" : "bg-blue-500"} text-white hover:bg-blue-600`}
                                    title={isAudioMuted ? "Attiva microfono" : "Disattiva microfono"}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`p-4 rounded-full ${isVideoMuted ? "bg-red-500" : "bg-blue-500"} text-white hover:bg-blue-600`}
                                    title={isVideoMuted ? "Attiva webcam" : "Disattiva webcam"}
                                >
                                    <CameraIcon className="w-6 h-6" />
                                </button>
                            </div>
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
        </AuthenticatedLayout>
    );
};

export default VideoCall;
