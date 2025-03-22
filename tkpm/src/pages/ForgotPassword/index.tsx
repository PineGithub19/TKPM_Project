import React, { useState } from "react";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);
    const [timer, setTimer] = useState(60);

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSendResetLink = () => {
        if (!email) {
            setMessage("Please enter your email.");
            return;
        }

        if (!isValidEmail(email)) {
            setMessage("Invalid email format. Please enter a valid email.");
            return;
        }

        // Fake API call
        console.log("Sending reset link to:", email);
        setMessage("Reset link sent! You can resend after 1 minute.");
        setIsDisabled(true);

        let countdown = 60;
        setTimer(countdown);
        const interval = setInterval(() => {
            countdown--;
            setTimer(countdown);
            if (countdown === 0) {
                clearInterval(interval);
                setIsDisabled(false);
                setMessage("");
            }
        }, 1000);
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="p-4 bg-white shadow rounded" style={{ width: "400px", minHeight: "300px" }}>
                <h2 className="text-center fw-bold">Forgot Password</h2>
                <p className="text-muted text-center">Enter your email to reset your password.</p>

                <label htmlFor="email" className="form-label fw-medium">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    className="form-control mb-3" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />

                {message && <p className={`text-center ${message.includes("Invalid") ? "text-danger" : "text-success"}`}>{message}</p>}

                <button 
                    className="btn btn-primary w-100" 
                    onClick={handleSendResetLink} 
                    disabled={isDisabled}
                >
                    {isDisabled ? `Resend in ${timer}s` : "Send Reset Link"}
                </button>
                <p className="mt-3 text-center">
                    <a href="/login" className="text-primary fw-medium text-decoration-none">Back to Login</a>
                </p>
                <p className="mt-3 text-center">
                    <a href="/reset-password?token=1" className="text-primary fw-medium text-decoration-none">Test reset password page</a>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
