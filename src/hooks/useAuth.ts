import { useNavigate } from "react-router-dom";
import { setAuth } from "../api";
import { getUserRole } from "../utils/userRole";

export function useAuth() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    const role = getUserRole(user);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuth(null); 
        navigate("/login");
    };

    return {
        user,
        token,
        role,
        isAuthenticated: !!token,
        isAdmin: role === "admin",
        isCliente: role === "cliente",
        logout,
    };
}