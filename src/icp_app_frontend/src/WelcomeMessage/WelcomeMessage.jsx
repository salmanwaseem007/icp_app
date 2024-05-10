import React from 'react';
import styles from './WelcomeMessage.module.scss'; // Import the SCSS module

function WelcomeMessage({ message }) {
    return (
        <section className={styles.welcomeMessage}>
            {message}
        </section>
    );
};

export default WelcomeMessage;
