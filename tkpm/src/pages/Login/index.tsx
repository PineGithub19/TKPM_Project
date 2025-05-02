import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [videoInformation, setVideoInformation] = useState<any[]>([]);

    const handleLogin = () => {
        setError("Chưa hỗ trợ chức năng đăng nhập này");
        setTimeout(() => setError(""), 10000);
    };

    const handleGoogleLogin = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        onSuccess: async (tokenResponse) => {
            try {
                // Lấy thông tin người dùng từ Google API
                const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                });
    
                const { email, name } = res.data;
    
                // Lưu token vào localStorage để sử dụng cho các lần truy cập sau
                localStorage.setItem('googleToken', tokenResponse.access_token);

                // Lưu thời gian hết hạn token (ví dụ: 30 phút từ thời điểm đăng nhập)
                const expirationTime = new Date().getTime() + 30 * 60 * 1000; // 30 phút
                localStorage.setItem('tokenExpiration', expirationTime.toString());

                // Cài đặt hẹn giờ để tự động xóa token sau 30 phút
                setTimeout(() => {
                    localStorage.removeItem('googleToken');
                    localStorage.removeItem('tokenExpiration');
                    navigate('/login'); // Chuyển hướng về trang login
                }, 30 * 60 * 1000); // 30 phút
    
                // Gửi thông tin người dùng về server để đăng nhập (nếu cần thiết)
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/user/google-login`, { email, name }, {
                    withCredentials: true,
                });
    
                if (response.data.status === 'OK') {
                    // Lấy video từ tài khoản người dùng thông qua YouTube API
                    const youtubeResponse = await axios.get(
                        'https://www.googleapis.com/youtube/v3/search',
                        {
                            params: {
                                part: 'snippet',
                                forMine: true,
                                type: 'video',
                                maxResults: 10,
                            },
                            headers: {
                                Authorization: `Bearer ${tokenResponse.access_token}`,
                            },
                        }
                    );
    
                    const videoItems = youtubeResponse.data.items;
                    console.log("Received user videos:", videoItems);
    
                    // Lấy chi tiết video (view/like/comment) từ videoIds
                    const videoIds = videoItems.map((v: any) => v.id.videoId).join(',');
    
                    const statsResponse = await axios.get(
                        'https://www.googleapis.com/youtube/v3/videos',
                        {
                            params: {
                                part: 'snippet,statistics',
                                id: videoIds,
                            },
                            headers: {
                                Authorization: `Bearer ${tokenResponse.access_token}`,
                            },
                        }
                    );
    
                    const videoStats = statsResponse.data.items.map((video: any) => ({
                        title: video.snippet.title,
                        videoId: video.id,
                        views: video.statistics.viewCount,
                        likes: video.statistics.likeCount,
                        comments: video.statistics.commentCount,
                        publishedAt: video.snippet.publishedAt,
                    }));
    
                    // Lưu dữ liệu video vào localStorage để sử dụng cho các lần tải lại trang
                    localStorage.setItem('videoInformation', JSON.stringify(videoStats));
    
                    // Cập nhật state videoInformation trong component
                    setVideoInformation(videoStats);
    
                    console.log("Video stats being sent to dashboard:", videoStats);
    
                    // Điều hướng người dùng đến trang dashboard, và truyền video information
                    navigate('/dashboard', { state: { videoInformation: videoStats } });
                } else {
                    // Nếu login với Google không thành công
                    setError('Google login failed on server');
                }
            } catch (err) {
                console.error(err);
                // Thông báo lỗi nếu có lỗi trong quá trình đăng nhập hoặc lấy thông tin
                setError('Google login failed');
            }
        },
        onError: () => {
            // Nếu có lỗi xảy ra trong quá trình đăng nhập với Google
            setError('Google login failed');
        },
    });
    

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
                style={{ height: "70vh" }}>
                <h1 className="display-4 fw-bold">Welcome to ChillUS</h1>
                <p className="fs-5">Your journey starts here.</p>
            </div>

            {/* Right Section */}
            <div className="col-3 d-flex flex-column justify-content-center align-items-center p-4 bg-light shadow-lg rounded"
                style={{ height: "70vh" }}>
                <div className="w-100" style={{
                    maxWidth: "400px",
                    background: "#f0f0f0",
                    padding: "30px",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)"
                }}>
                    <h2 className="text-center text-dark fw-bold">Sign In</h2>
                    <p className="text-center text-muted">Please enter your credentials</p>

                    {error && <p className="text-danger text-center">{error}</p>}

                    <div className="mt-4">
                        <label htmlFor="email" className="form-label fw-medium">Email</label>
                        <input type="text" id="email" className="form-control"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label htmlFor="password" className="form-label fw-medium mt-3">Password</label>
                        <input type="password" id="password" className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <a href="/forgot-password" className="text-primary text-decoration-none">Forgot password?</a>
                    </div>

                    <button className="btn btn-primary w-100 mt-4" onClick={handleLogin}>Login</button>

                    {/* Google Sign In */}
                    <button
                        className="btn w-100 mt-3"
                        onClick={() => handleGoogleLogin()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            backgroundColor: '#fff',
                            color: '#000',
                            padding: '12px 0',
                            borderRadius: '5px',
                        }}
                    >
                        <img src="/iconGoogle.png" alt="Google Icon" style={{ width: '20px' }} />
                        Sign in with Google
                    </button>

                    <p className="mt-3 text-center">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-primary fw-medium text-decoration-none">Sign Up</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
