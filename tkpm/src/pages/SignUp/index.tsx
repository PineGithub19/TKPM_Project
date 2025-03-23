// import React from "react";
// import styles from './SignUp.module.css';
// import clsx from "clsx";

// const Signup: React.FC = () => {
    
//     return (
//         <div className="d-flex flex-row align-items-center rounded"
//             style={{
//                 backgroundImage: "url('signupbg.png')",
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//                 margin: "2rem",
//                 marginLeft: "0",
//                 height: "calc(100vh - 4rem)",
//                 width: "calc(100vw - 2rem)",
//             }}>
//             {/* Left Section */}
//             <div className="col-6 d-flex flex-column align-items-center justify-content-center text-black p-5"
//                 style={{
//                     height: "70vh",
//                 }}>
//                 <h1 className="display-4 fw-bold">Join ChillUS</h1>
//                 <p className="fs-5">Create an account to get started.</p>
//             </div>

//             {/* Right Section (Sign-Up Form) */}
//             <div className="col-5 d-flex flex-column justify-content-center align-items-center p-4 bg-light shadow-lg rounded"
//                 style={{
//                     height: "72vh",
//                 }}>
//                 <div className="w-100" style={{ background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
//                     <h2 className="text-center text-dark fw-bold">Register</h2>
//                     <p className="text-center text-muted">Create your account</p>

//                     <div className="mt-4">
//                         <div className="row1 d-flex flex-row justify-content-between align-items-center gap-4">
//                             <div className={clsx(styles.form_sign_up)}>
//                                 <label htmlFor="name" className="form-label fw-medium">
//                                     Name
//                                 </label>
//                                 <input type="text" id="name" className="form-control" placeholder="Enter your name" />
//                             </div>

//                             <div className={clsx(styles.form_sign_up)} style={{ width: "60%" }}>
//                                 <label htmlFor="email" className="form-label fw-medium">
//                                     Email
//                                 </label>
//                                 <input type="email" id="email" className="form-control" placeholder="Enter your email" />
//                             </div>
//                         </div>

//                         <label htmlFor="password" className="form-label fw-medium mt-3">
//                             Password
//                         </label>
//                         <input type="password" id="password" className="form-control" placeholder="Enter your password" />

//                         <label htmlFor="confirmPassword" className="form-label fw-medium mt-3">
//                             Confirm Password
//                         </label>
//                         <input type="confirmPassword" id="confirmPassword" className="form-control" placeholder="Enter your confirm password" />
//                     </div>

//                     <button className="btn btn-primary w-100 mt-4">Sign Up</button>

//                     <p className="mt-3 text-center">
//                         Already have an account? {" "}
//                         <a href="/login" className="text-primary fw-medium text-decoration-none">
//                             Sign In
//                         </a>
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Signup;

import React, { useState } from "react";
import styles from './SignUp.module.css';
import clsx from "clsx";
import * as request from '../../utils/request'; // Import your request utility

const Signup: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await request.post("/user/signup", {
                username: formData.name,
                email: formData.email,
                password: formData.password,
                role: "user",
            });

            setSuccess("Account created successfully! Please log in.");
        } catch {
            setError("Sign-up failed. Please try again.");
        }
    };

    return (
        <div className="d-flex flex-row align-items-center rounded"
            style={{
                backgroundImage: "url('signupbg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                margin: "2rem",
                marginLeft: "0",
                height: "calc(100vh - 4rem)",
                width: "calc(100vw - 2rem)",
            }}>
            {/* Left Section */}
            <div className="col-6 d-flex flex-column align-items-center justify-content-center text-black p-5"
                style={{ height: "70vh" }}>
                <h1 className="display-4 fw-bold">Join ChillUS</h1>
                <p className="fs-5">Create an account to get started.</p>
            </div>

            {/* Right Section (Sign-Up Form) */}
            <div className="col-5 d-flex flex-column justify-content-center align-items-center p-4 bg-light shadow-lg rounded"
                style={{ height: "72vh" }}>
                <div className="w-100" style={{ background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
                    <h2 className="text-center text-dark fw-bold">Register</h2>
                    <p className="text-center text-muted">Create your account</p>

                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mt-4">
                            <div className="row1 d-flex flex-row justify-content-between align-items-center gap-4">
                                <div className={clsx(styles.form_sign_up)}>
                                    <label htmlFor="name" className="form-label fw-medium">Name</label>
                                    <input type="text" id="name" className="form-control"
                                        placeholder="Enter your name" value={formData.name} onChange={handleChange} required />
                                </div>

                                <div className={clsx(styles.form_sign_up)} style={{ width: "60%" }}>
                                    <label htmlFor="email" className="form-label fw-medium">Email</label>
                                    <input type="email" id="email" className="form-control"
                                        placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                                </div>
                            </div>

                            <label htmlFor="password" className="form-label fw-medium mt-3">Password</label>
                            <input type="password" id="password" className="form-control"
                                placeholder="Enter your password" value={formData.password} onChange={handleChange} required />

                            <label htmlFor="confirmPassword" className="form-label fw-medium mt-3">Confirm Password</label>
                            <input type="password" id="confirmPassword" className="form-control"
                                placeholder="Enter your confirm password" value={formData.confirmPassword} onChange={handleChange} required />
                        </div>

                        <button type="submit" className="btn btn-primary w-100 mt-4">Sign Up</button>
                    </form>

                    <p className="mt-3 text-center">
                        Already have an account? {" "}
                        <a href="/login" className="text-primary fw-medium text-decoration-none">Sign In</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;

