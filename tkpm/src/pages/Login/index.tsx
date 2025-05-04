declare global {
    interface Window {
        google?: any;
        gapi?: any;
    }
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [videoInformation, setVideoInformation] = useState<any[]>([]);

    useEffect(() => {
        // Xóa dữ liệu lưu trữ mỗi khi trang login được truy cập
        localStorage.removeItem('googleToken');
        localStorage.removeItem('token');
        localStorage.removeItem('videoInformation');
        sessionStorage.clear();  // Clear sessionStorage nếu cần

        // Reset state để đảm bảo không có dữ liệu cũ
        setEmail('');
        setPassword('');
        setError('');
    }, []);

    const handleLogin = () => {
        // Xử lý đăng nhập với email và mật khẩu
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/user/signin`, { email, password }, {
            withCredentials: true,
        })
            .then((response) => {
                if (response.data.status === 'OK') {
                    // Lưu token vào localStorage để sử dụng cho các lần truy cập sau
                    localStorage.setItem('token', response.data.token);
                    navigate('/dashboard'); // Chuyển hướng đến trang dashboard
                } else {
                    setError('Login failed');
                }
            })
            .catch((err) => {
                console.error(err);
                setError('Login failed');
            });
    };

    const handleGoogleLogin = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
        prompt: 'consent',
        onSuccess: async (tokenResponse) => {
            clearGoogleSession(); // Xoá session trước khi làm gì
    
            try {
                // Lấy thông tin người dùng
                const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                });
    
                const { email, name } = res.data;
    
                // Lưu token và thời gian hết hạn
                localStorage.setItem('googleToken', tokenResponse.access_token);
                const expirationTime = new Date().getTime() + 10 * 24 * 60 * 60 * 1000;
                localStorage.setItem('tokenExpiration', expirationTime.toString());
    
                // Gửi thông tin user về server để xử lý
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/user/google-login`, { email, name }, {
                    withCredentials: true,
                });
    
                if (response.data.status === 'OK') {
                    // Lấy thông tin kênh YouTube
                    const channelRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
                        params: {
                            part: "contentDetails",
                            mine: true
                        },
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    });
    
                    const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;
    
                    const playlistItemsRes = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
                        params: {
                            part: "snippet",
                            maxResults: 10,
                            playlistId: uploadsPlaylistId,
                        },
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    });
    
                    const videoIds = playlistItemsRes.data.items.map(
                        (item: any) => item.snippet.resourceId.videoId
                    ).join(',');
    
                    const statsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
                        params: {
                            part: "snippet,statistics",
                            id: videoIds,
                        },
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    });
    
                    const videoStats = statsRes.data.items.map((video: any) => ({
                        title: video.snippet.title,
                        videoId: video.id,
                        views: video.statistics.viewCount,
                        likes: video.statistics.likeCount,
                        comments: video.statistics.commentCount,
                        publishedAt: video.snippet.publishedAt,
                    }));
    
                    localStorage.setItem('videoInformation', JSON.stringify(videoStats));
                    setVideoInformation(videoStats);
    
                    navigate('/dashboard', { state: { videoInformation: videoStats } });
                } else {
                    setError('Google login failed on server');
                }
            } catch (err) {
                console.error(err);
                setError('Google login failed');
            }
        },
        onError: () => {
            setError('Google login failed');
        },
    });
    
    
    const clearGoogleSession = () => {
        localStorage.removeItem('googleToken');
        localStorage.removeItem('tokenExpiration');
        localStorage.removeItem('videoInformation');
    
        // Xoá session tự động ghi nhớ tài khoản Google
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }
    
        // Nếu dùng gapi
        if (window.gapi?.auth2) {
            const auth2 = window.gapi.auth2.getAuthInstance();
            if (auth2) {
                auth2.signOut().then(() => auth2.disconnect());
            }
        }
    };
    

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
                        onClick={
                            
                            () => handleGoogleLogin()}
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
