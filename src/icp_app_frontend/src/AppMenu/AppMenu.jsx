import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { BoxArrowInRight } from 'react-bootstrap-icons';
import './AppMenu.scss';

const AppMenu = ({ isAuthenticated, handleLogin, handleLogout, handleShowUserProfileDialog }) => {
    return (
        <div>
            {!isAuthenticated &&
                <div id='loginContainer' title='Login'>
                    <a onClick={handleLogin}><BoxArrowInRight /></a>
                </div>
            }
            {isAuthenticated &&
                <Dropdown id="main-dropdown">
                    <Dropdown.Toggle as="a" id="dropdown-basic">
                        <BoxArrowInRight />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                        <Dropdown.Item onClick={handleShowUserProfileDialog}>Edit Profile</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>}
        </div>
    );
};

export default AppMenu;
