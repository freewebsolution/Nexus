import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import VideoCall from "./VideoCall"; // Assicurati che il path sia corretto

const Home = ({ users = [] }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pin, setPin] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [calledUser, setCalledUser] = useState(null);

    if (!users || users.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-6 max-w-md w-full">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Nexus videochat
                    </h1>
                    <p>No users available.</p>
                </div>
            </div>
        );
    }

    const handleVideoCall = async (calledUserId, userName) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/generate-pin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
                body: JSON.stringify({ id: calledUserId }),
            });

            const data = await response.json();

            if (response.ok) {
                setPin(data.pin);
                localStorage.setItem("user_pin", data.pin);
                setCalledUser({ id: calledUserId, name: userName });
                setInCall(true);
            } else {
                setError(data.error || "Errore nella generazione del PIN");
            }
        } catch (error) {
            setError("Errore durante la generazione del PIN.");
        } finally {
            setLoading(false);
        }
    };

    // 🔙 Per uscire dalla videochiamata
    const handleEndCall = () => {
        setInCall(false);
        setPin(null);
        setCalledUser(null);
    };

    // 🎥 Mostra VideoCall se è attiva
    if (inCall && pin && calledUser) {
        return (
            <VideoCall 
                pin={pin} 
                userName={calledUser.name}  // Passiamo il nome dell'utente chiamato
                user={calledUser} 
                onEndCall={handleEndCall} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-6 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800">
                    Nexus videochat
                </h1>
                <p>Utenti online</p>

                {error && <p className="text-red-500">{error}</p>}

                <div className="space-y-4">
                    {users.map((user) => (
                        <button
                            key={user.id}
                            className="w-full mb-3 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition duration-200 transform hover:scale-105 shadow-lg flex items-center justify-start"
                            onClick={() => handleVideoCall(user.id, user.name)}
                            disabled={loading}
                        >
                            <UserIcon className="w-6 h-6 mr-3 text-white" />
                            <span>{user.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
