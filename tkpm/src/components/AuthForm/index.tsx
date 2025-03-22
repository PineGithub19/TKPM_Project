import React from "react";

interface AuthFormProps {
  title: string;
  description: string;
  buttonText: string;
  linkText: string;
  linkHref: string;
  linkDescription: string;
  backgroundImage: string;
  textColor: string;
  backgroundColor: string;
  btnColor: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  title,
  description,
  buttonText,
  linkText,
  linkHref,
  linkDescription,
  backgroundImage,
  textColor,
  backgroundColor,
  btnColor,
}) => {
  return (
    <div
      className="d-flex flex-row align-items-center rounded"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        margin: "2rem",
        marginLeft: "0",
        height: "calc(100vh - 4rem)",
        width: "calc(100vw - 2rem)",
      }}
    >
      {/* Left Section */}
      <div
        className="col-7 d-flex flex-column align-items-center justify-content-center p-5"
        style={{ height: "70vh", color: textColor }}
      >
        <h1 className="display-4 fw-bold">{title}</h1>
        <p className="fs-5">{description}</p>
      </div>

      {/* Right Section (Form) */}
      <div
        className="col-3 d-flex flex-column justify-content-center align-items-center p-4 shadow-lg rounded"
        style={{ height: "70vh", backgroundColor: "wheat" }}
        >
        <div
          className="w-100"
          style={{
            maxWidth: "400px",
            backgroundColor,
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 className="text-center text-dark fw-bold">{title}</h2>
          <p className="text-center text-muted">{description}</p>

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
            <a href="#" style={{color: textColor}}className="text-decoration-none">
              Forgot password?
            </a>
          </div>

          <button className="btn w-100 mt-4"
          style={{backgroundColor: btnColor, color: textColor}}>{buttonText}</button>

          <p className="mt-3 text-center">
            {linkDescription}{" "}
            <a href={linkHref} style={{color: textColor}}className="fw-medium text-decoration-none">
              {linkText}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
