import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Cookies from 'js-cookie'

export interface SignInResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  user_sub: string
}
interface AuthContextType {
    isAuthenticated: boolean;
    userEmail: string | null;
    tempEmail: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [tempEmail, setTempEmail] = useState<string | null>(null);
    const navigate = useNavigate();
    let valid_token = false


    useEffect(() => {
        const token = Cookies.get('id_token');
        const storedEmail = Cookies.get('userEmail');

        if (token && storedEmail) {
           axios.get("http://localhost:8000/api/validate-token", {
                headers: { Authorization: `Bearer ${token}`}
            }).then((res)=>{
                valid_token = res.data.valid_token
                setIsAuthenticated(valid_token)
                setUserEmail(storedEmail)
            }).catch((err) => {
                console.log(err)
                Cookies.remove('id_token')
                Cookies.remove('userEmail')
                setIsAuthenticated(valid_token)
            })
        }
    }, []);
    const signIn = async (email: string, password: string) => {
        try {
            const response = await axios.post<SignInResponse>('http://localhost:8000/api/signin', {
                email,
                password,
            });

            Cookies.set('id_token', response.data.id_token)
            Cookies.set('userEmail', email)

            setIsAuthenticated(true);
            setUserEmail(email);
            setTempEmail(email);
        } catch (error) {
            throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) throw new Error('Sign up failed');

            setTempEmail(email);
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const confirmSignUp = async (email: string, confirmationCode: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/confirm-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email || tempEmail,
                    confirmation_code: confirmationCode
                }),
            });

            if (!response.ok) throw new Error('Confirmation failed');

            setTempEmail(email);
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const signOut = () => {
        Cookies.remove('id_token');
        Cookies.remove('userEmail');
        Cookies.remove('chatHistory');

        setIsAuthenticated(false);
        setUserEmail(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userEmail,
            tempEmail,
            signIn,
            signUp,
            confirmSignUp,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 