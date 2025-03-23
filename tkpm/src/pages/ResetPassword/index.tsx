import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as request from '../../utils/request'; // Import your request utility

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // Get token from URL

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            setMessage("Please fill in all fields.");
            return;
        }
    
        if (password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            return;
        }
    
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }
    
        if (!token) {
            setMessage("Invalid or expired reset link.");
            return;
        }
    
        setLoading(true);
    
        try {
            await request.put(`/user/resetpassword?token=${token}`, { password });
            setMessage("Password reset successfully. Please log in.");
            setLoading(false);
            navigate("/login");
        } catch (error) {
            console.error(error);
            setMessage("Error resetting password. Please try again.");
        }       
    };
    

    return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="p-4 bg-white shadow rounded" style={{ width: "350px" }}>
                <h2 className="text-center fw-bold">Reset Password</h2>
                <p className="text-muted text-center">Enter a new password for your account.</p>

                <label htmlFor="password" className="form-label fw-medium">New Password</label>
                <input 
                    type="password" 
                    id="password" 
                    className="form-control mb-3" 
                    placeholder="Enter new password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />

                <label htmlFor="confirmPassword" className="form-label fw-medium">Confirm Password</label>
                <input 
                    type="password" 
                    id="confirmPassword" 
                    className="form-control mb-3" 
                    placeholder="Confirm new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                />

                {message && <p className={`text-center ${message.includes("successfully") ? "text-success" : "text-danger"}`}>{message}</p>}

                <button 
                    className="btn btn-primary w-100" 
                    onClick={handleResetPassword} 
                    disabled={loading}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </div>
        </div>
    );
};

export default ResetPassword;
