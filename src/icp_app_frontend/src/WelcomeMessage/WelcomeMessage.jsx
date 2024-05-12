import React from 'react';
import styles from './WelcomeMessage.module.scss'; // Import the SCSS module

function WelcomeMessage({ message, isAuthenticated, handleShowUserProfileDialog }) {
    return (
        <div>
            {message !== null && <section className={styles.welcomeMessage}>{message}</section>}
            {/* {message === null && isAuthenticated && <section className={styles.welcomeMessage}>Welcome. Please complete your profile</section>} */}
            {message === null && isAuthenticated && <section className={styles.welcomeMessage}><a href='#' onClick={handleShowUserProfileDialog}>Welcome. Please complete your profile</a></section>}
            {message === null && !isAuthenticated && <section className={styles.welcomeMessage}>Welcome. Please login</section>}
        </div>
    );
};

export default WelcomeMessage;
