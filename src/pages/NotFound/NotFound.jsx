import React from 'react';
import { Link } from 'react-router-dom';

import Navbar from "../../components/Navigation/Navbar";

export default function NotFound() {
    return (
        <>
            <Navbar active="404" />
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 sm:px-8">
                <div className="max-w-2xl mx-auto">
                    {/* Illustration SVG */}
                    <div className="mb-8 opacity-90">
                        <svg
                            className="mx-auto"
                            width="200"
                            height="200"
                            viewBox="0 0 200 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" className="text-primary" />
                            <path d="M70 80 L70 110 M70 95 L85 95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-primary" />
                            <circle cx="130" cy="95" r="15" stroke="currentColor" strokeWidth="6" fill="none" className="text-secondary" />
                            <path d="M60 140 Q100 160 140 140" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" className="text-primary" />
                        </svg>
                    </div>

                    {/* Code 404 avec gradient */}
                    <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none mb-6">
                        404
                    </h1>

                    {/* Titre */}
                    <h2 className="text-3xl sm:text-4xl font-bold text-base-content mb-4">
                        Page non trouvée
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-base-content/70 mb-8 leading-relaxed max-w-md mx-auto">
                        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                    </p>

                    {/* Bouton avec DaisyUI */}
                    <Link
                        to="/"
                        className="btn btn-primary btn-lg gap-2 inline-flex hover:scale-105 transition-transform"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Retour à l'accueil
                    </Link>

                    {/* Suggestions alternatives (optionnel) */}
                    <div className="mt-12 pt-8 border-t border-base-300">
                        <p className="text-sm text-base-content/60 mb-4">Vous cherchez peut-être :</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Link to="/" className="btn btn-ghost btn-sm">Accueil</Link>
                            <Link to="/bibliotheque" className="btn btn-ghost btn-sm">Bibliothèque</Link>
                            <Link to="/civilisations" className="btn btn-ghost btn-sm">Civilisations</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
