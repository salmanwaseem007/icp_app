import React, { useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import './ToastComponent.scss';

function ToastComponent({ showToast, setShowToast, toastMessage }) {
  const toggleToast = () => setShowToast(!showToast);

  return (
    <Toast show={showToast} onClose={toggleToast} delay={2500} autohide className="position-fixed bottom-0 start-50 translate-middle-x">
      <Toast.Body className="custom-toast">{toastMessage}</Toast.Body>
    </Toast>
  );
}

export default ToastComponent;