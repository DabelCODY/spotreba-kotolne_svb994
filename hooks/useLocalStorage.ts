// FIX: Import `React` to make its namespace available for type annotations.
import React, { useState, useEffect } from 'react';

function getValue<T,>(key: string, initialValue: T): T {
    const saved = window.localStorage.getItem(key);
    if (saved !== null) {
        try {
            return JSON.parse(saved);
        } catch {
            return initialValue;
        }
    }
    return initialValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getValue(key, initialValue);
    });

    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}