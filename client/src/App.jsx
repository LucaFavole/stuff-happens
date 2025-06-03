import "bootstrap/dist/css/bootstrap.min.css";
import {useEffect, useState} from 'react'

import './App.css'
import MainPage from "./components/./MainPage.jsx";
import Game from "./components/Game";
import PersonalPage from "./components/PersonalPage";
import DefaultLayout from "./components/DefaultLayout.jsx";
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
            setMessage({msg: err, type: 'danger'});
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
          <Route element={ <DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} /> } >
              <Route path="/" element={loggedIn ? <Navigate to="/PersonalPage" /> : <MainPage />} />
              <Route path="/PersonalPage" element={loggedIn ? <PersonalPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/Game/:gameId?" element={loggedIn ? <Game user={user}/> : <Game isDemoMode={true} />} />
          </Route>
          <Route path='/login' element={loggedIn ? <Navigate replace to='/PersonalPage' /> : <LoginForm handleLogin={handleLogin} />} />
          <Route path="*" element={ <NotFound /> } />
      </Routes>

  )
}

export default App
