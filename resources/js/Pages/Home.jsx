// resources/js/Pages/Home.jsx
import React from 'react';
import { Link } from '@inertiajs/react';  // Usa il Link di Inertia.js per la navigazione

const Home = () => {
    return (
        <div>
            <h1>Benvenuto nella tua App</h1>
            {/* Usa il Link di Inertia per navigare a VideoCall */}
            <Link href="/video-call">
                <button>Vai alla Videochiamata</button>
            </Link>
        </div>
    );
};

export default Home;
