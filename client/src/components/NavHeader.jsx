import { useEffect, useState } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';
import { Link } from "react-router";
import { LogoutButton } from './AuthComponents';

function NavHeader(props) {

    return(
        <Navbar bg='primary' data-bs-theme='dark'>
            <Container fluid>
                <Link to="/" className="navbar-brand">Stuff Happens</Link>
                <div className="ms-auto d-flex align-items-center">
                    {props.loggedIn && (
                        <Link to="/PersonalPage" className="btn btn-outline-light me-2">
                            Profilo
                        </Link>
                    )}
                    {props.loggedIn ?
                        <LogoutButton logout={props.handleLogout} /> :
                        <Link to='/login' className='btn btn-outline-light'>Login</Link>
                    }
                </div>
            </Container>
        </Navbar>
    );
}

export default NavHeader;