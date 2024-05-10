// ProfileDialog.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styles from './UserProfileModal.module.scss';

function UserProfileDialog ({ showUserProfileDialog, handleDialogShow, handleCloseUserProfileDialog, formDataUserProfileDialog, handleChangeFormDataUserProfileDialog, onUserProfileDialogSubmit }) {
  return (
    <Modal show={showUserProfileDialog} onShow={handleDialogShow} onHide={handleCloseUserProfileDialog}>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '20px' }}>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onUserProfileDialogSubmit}>
          <Form.Group controlId="formPrincipal">
            <Form.Label>Principal</Form.Label>
            <Form.Control
              type="text"
              name="principal"
              value={formDataUserProfileDialog.principal}
              disabled
            />
          </Form.Group>
          <Form.Group controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              name="name"
              value={formDataUserProfileDialog.name}
              onChange={handleChangeFormDataUserProfileDialog}
            />
          </Form.Group>
          <Form.Group controlId="formEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              name="email"
              value={formDataUserProfileDialog.email}
              onChange={handleChangeFormDataUserProfileDialog}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseUserProfileDialog}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onUserProfileDialogSubmit}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UserProfileDialog;
