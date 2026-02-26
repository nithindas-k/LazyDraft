import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { API_BASE_URL } from "../constants/routes";


interface User {
    _id: string;
    googleId: string;
    name: string;
    email: string;
    profilePic: string;
    isEmailVerified?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => void;
    logout: () => void;
    updateProfile: (name: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    axios.defaults.withCredentials = true;


    const checkAuth = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/auth/me`);
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);


    const loginWithGoogle = () => {

        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    const logout = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/logout`);
            setUser(null);
            localStorage.removeItem("token"); 
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (name: string) => {
        try {
            const { data } = await axios.put(`${API_BASE_URL}/auth/me`, { name });
            if (data.success && data.user) {
                setUser(data.user);
                return { success: true, message: data.message || "Profile updated successfully." };
            }
            return { success: false, message: data.message || "Failed to update profile." };
        } catch (error: any) {
            console.error("Update profile failed", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update profile."
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
