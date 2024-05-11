import React, { useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import './ToastComponent.scss';

function ToastComponent({ showToast, toastMessage }) {
  return (
    <Toast show={showToast} delay={3000} autohide className="position-fixed bottom-0 start-50 translate-middle-x">
      <Toast.Body className="custom-toast">{toastMessage}</Toast.Body>
    </Toast>
  );
}

export default ToastComponent;