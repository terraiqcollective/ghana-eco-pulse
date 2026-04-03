"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const EEContext = createContext({
    ee: null,
    isInitialized: false,
    error: null,
});

export const useEE = () => useContext(EEContext);

export const EEProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    const [eeInstance, setEeInstance] = useState(null);

    useEffect(() => {
        const initEE = async () => {
            try {
                // Dynamically import GEE to avoid SSR issues
                const ee = (await import('@google/earthengine')).default;

                // Fetch token from our backend
                const response = await fetch('/api/gee/auth');
                if (!response.ok) throw new Error('Failed to fetch auth token');

                const { token, project_id, config } = await response.json();

                console.log('EE Auth received:', { project_id, tokenLength: token?.length });

                if (!token || !project_id) {
                    throw new Error('Missing token or project_id from auth response');
                }

                // Authenticate
                ee.data.setAuthToken(
                    '',
                    'Bearer',
                    token,
                    3600,
                    [],
                    undefined,
                    true // updateAuth = true
                );

                // Explicitly set project (if method exists) or rely on initialize
                if (ee.data.setProject) {
                    ee.data.setProject(project_id);
                }

                console.log('Token set, starting initialize...');

                await new Promise((resolve, reject) => {
                    ee.initialize(
                        null,
                        null,
                        () => {
                            console.log('EE Initialized successfully');
                            setEeInstance(ee);
                            setIsInitialized(true);
                            ee.config = config;
                            resolve();
                        },
                        (err) => {
                            console.error('EE initialize() failed:', err);
                            reject(err);
                        }
                    );
                });

            } catch (err) {
                console.error('EE Initialization Error:', err);
                setError(err);
            }
        };

        if (!isInitialized && !error) {
            initEE();
        }
    }, [isInitialized, error]);

    return (
        <EEContext.Provider value={{ ee: eeInstance, isInitialized, error }}>
            {children}
        </EEContext.Provider>
    );
};
