import React from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex flex-row align-items-center rounded"
            style={{
                backgroundImage: "url('loginbg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                margin: "2rem",
                marginLeft: "0",
                height: "calc(100vh - 4rem)",
                width: "calc(100vw - 2rem)",
            }}>
            {/* Left Section */}
            <div className="col-7 d-flex flex-column align-items-center justify-content-center text-white p-5"
                style={{
                    height: "70vh",
                }}>
                <h1 className="display-4 fw-bold">Welcome to ChillUS</h1>
                <p className="fs-5">Your journey starts here.</p>
            </div>

            {/* Right Section (Login Form) */}
            <div className="col-3 d-flex flex-column justify-content-center align-items-center p-4 bg-light shadow-lg rounded"
                style={{
                    height: "70vh",
                }}>
                <div className="w-100" style={{ maxWidth: "400px", background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
                    <h2 className="text-center text-dark fw-bold">Sign In</h2>
                    <p className="text-center text-muted">Please enter your credentials</p>

                    <div className="mt-4">
                        <label htmlFor="email" className="form-label fw-medium">
                            Email
                        </label>
                        <input type="text" id="email" className="form-control" placeholder="Enter your email" />

                        <label htmlFor="password" className="form-label fw-medium mt-3">
                            Password
                        </label>
                        <input type="password" id="password" className="form-control" placeholder="Enter your password" />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <a href="/forgot-password" className="text-primary text-decoration-none">
                            Forgot password?
                        </a>
                    </div>

                    <button className="btn btn-primary w-100 mt-4"  onClick={() => {
                        console.log("Navigating to /dashboard...");
                        navigate("/dashboard");
                    }}>Click to Dashboard</button>

                    <p className="mt-3 text-center">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-primary fw-medium text-decoration-none">
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
