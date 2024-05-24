import React from 'react';
import styles from './WelcomeMessage.module.scss'; // Import the SCSS module

function WelcomeMessage({ message, isAuthenticated, handleShowUserProfileDialog, handleLogin }) {
    return (
        <div>
            {message !== null && <section className={styles.welcomeMessage}>{message}</section>}
            {/* {message === null && isAuthenticated && <section className={styles.welcomeMessage}>Welcome. Please complete your profile</section>} */}
            {message === null && isAuthenticated && <section className={styles.welcomeMessage}>Welcome. <a href='#' onClick={handleShowUserProfileDialog}>Please complete your profile</a></section>}
            {message === null && !isAuthenticated && <section className={styles.welcomeMessage}>Welcome. Please <a href='#' onClick={handleLogin}>Login</a></section>}
        </div>
    );
};

export default WelcomeMessage;
