import "bootstrap/dist/css/bootstrap.min.css";
import {useEffect, useState} from 'react'

import './App.css'
import Game from "./components/Game";
import PersonalPage from "./components/PersonalPage";
import DefaultLayout from "./components/DefaultLayout.jsx";
import GameDemo from "./components/GameDemo.jsx";
import GameRound from "./components/GameRound.jsx";
import GameEndRound from "./components/GameEndRound.jsx";
import GameEndGame from "./components/GameEndGame.jsx";
import { Routes, Route, Navigate } from "react-router";
import { LoginForm } from "./components/AuthComponents.jsx";
import NotFound from "./components/NotFound";
import API from "./API/API.mjs";
import {useNavigate} from "react-router-dom";
function App() {
    const navigate = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState('');
    useEffect(() => {
        const checkAuth = async () => {
            const user = await API.getUserInfo(); // we have the user info here
            setLoggedIn(true);
            setUser(user);
        };
        checkAuth().then();
    }, []);

    const handleLogin = async (credentials) => {
        try {
            const user = await API.logIn(credentials);
            setLoggedIn(true);
            setUser(user);
        }catch(err) {
            throw err;
        }
    };

    const handleLogout = async () => {
        await API.logOut();
        setLoggedIn(false);
        setMessage('');
        navigate('/');
    };
    return (
        <Routes>
            <Route element={
                <DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage}/>}>
                <Route path="/" element= <MainPage /> />
                <Route path="/PersonalPage" element={loggedIn ? <PersonalPage user={user} /> : <Navigate to="/login" />} />
            </Route>
            <Route path="/Game/:gameId">
                <Route path="demo" element={<GameDemo />} />
                <Route index element={loggedIn ? <Game user={user} /> : <Navigate to="/login" />} />
                <Route path="round/:roundId" element={loggedIn ? <GameRound user={user} /> : <Navigate to="/login" />} />
                <Route path="round/:roundId/endround" element={loggedIn ? <GameEndRound user={user} /> : <Navigate to="/login" />} />
                <Route path="endgame" element={loggedIn ? <GameEndGame user={user} /> : <Navigate to="/login" />} />
            </Route>
            <Route path="/login" element={loggedIn ? <Navigate replace to="/PersonalPage" /> : <LoginForm handleLogin={handleLogin} />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );

}



export default App
