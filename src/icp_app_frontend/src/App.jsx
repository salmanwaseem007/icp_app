import { useState, useEffect } from 'react';
import { createActor, icp_app_backend } from 'declarations/icp_app_backend';
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent } from "@dfinity/agent";
import { Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { BoxArrowInRight } from 'react-bootstrap-icons';
import PriceContainer from './PriceContainer/PriceContainer';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [price, setPrice] = useState("loading");
  const [previousPrice, setPreviousPrice] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('');
  const [loading, setLoading] = useState(false);
  const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === "production" ? "ic" : "local");
  const internetIdentityUrl = network === "local" ? "http://" + process.env.CANISTER_ID_INTERNET_IDENTITY + ".localhost:4943/" : "https://identity.ic0.app"
  let backendActor = icp_app_backend;

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [formData, setFormData] = useState({ principal: '', name: '', email: '' });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onProfileDialogSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission here

    const requestData = {
      principal: userData.principal,
      name: [formData.name],
      email: [formData.email]
    };
    await icp_app_backend.updateUser(userData.principal, requestData)
      .then(response => {
        console.log(response);
        const _userData = {
          principal: userData.principal,
          name: formData.name,
          email: formData.email
        };
        setUserData(_userData);
        localStorage.setItem('userData', JSON.stringify(_userData));
        document.getElementById("principal").innerText = "Welcome " + _userData.name;
        handleClose(); // Close the dialog box after submission
      })
      .catch(error => {
        console.error(error);
      });
  };

  function handleDialogShow() {
    setFormData(userData);
  }

  const changeBackgroundColor = (color) => {
    setBackgroundColor(color); // Change color
    setTimeout(() => {
      setBackgroundColor(null); // reset color
    }, 600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // create an auth client
    let authClient = await AuthClient.create();

    // Check if the user is already authenticated in
    if (authClient.isAuthenticated() && ((await authClient.getIdentity().getPrincipal().isAnonymous()) === false)) {
      handleAuthenticated(authClient);
    } else {
      // Log in
      await new Promise((resolve) => {
        authClient.login({
          identityProvider: internetIdentityUrl,
          onSuccess: () => {
            handleAuthenticated(authClient);
          }
        });
      });
    }

    async function handleAuthenticated(authClient) {
      const identity = await authClient.getIdentity();
      const _principal = identity.getPrincipal().toString();
      console.log("logged in user principal", _principal);

      setIsAuthenticated(true);

      const _userData = {
        "principal": _principal
      };
      // setUserData(_userData);
      // Save updated user data to local storage
      // localStorage.setItem('userData', JSON.stringify(_userData));

      const requestData = {
        principal: _principal,
        name: [],
        email: []
      };
      await icp_app_backend.createUser(requestData)
        .then(([response]) => {
          const responseObj = {
            principal: response.principal,
            name: response.name.length > 0 ? response.name[0] : null,
            email: response.email.length > 0 ? response.email[0] : null
          };
          console.log(responseObj);
          setUserData(responseObj);
          localStorage.setItem('userData', JSON.stringify(responseObj));

          let _name = responseObj.principal;
          if (responseObj.name && responseObj.name.length > 0) {
            _name = responseObj.name;
            document.getElementById("principal").innerText = "Welcome " + _name;
          } else {
            document.getElementById("principal").innerText = "Welcome. Please complete your profile";
          }
        })
        .catch(error => {
          console.error(error);
        });
    }

    // At this point we're authenticated, and we can get the identity from the auth client:
    const identity = authClient.getIdentity();
    // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
    const agent = new HttpAgent({ identity });
    // Using the interface description of our webapp, we create an actor that we use to call the service methods.
    backendActor = createActor(process.env.CANISTER_ID_ICP_APP_BACKEND, {
      agent,
    });
  };

  const handleLogout = async (e) => {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setUserData(null);
    localStorage.removeItem('userData');
    window.location.reload();
  };

  useEffect(() => {
    const userDataLS = localStorage.getItem("userData");
    if (userDataLS) {
      const userDataObj = JSON.parse(userDataLS);
      setUserData(userDataObj);
      setIsAuthenticated(true);
      let _name = userDataObj.principal;
      if (userDataObj.name && userDataObj.name.length > 0) {
        _name = userDataObj.name;
        document.getElementById("principal").innerText = "Welcome " + _name;
      } else {
        document.getElementById("principal").innerText = "Welcome. Please complete your profile";
      }
    }
    const fetchPrice = async () => {
      if (loading) return; // Cancel if waiting for a new count
      try {
        setLoading(true);
        const response = await icp_app_backend.getICPPrice();
        let jsonData = JSON.parse(response).data;
        let newPrice = Number(jsonData.amount);

        if (previousPrice !== null && newPrice > previousPrice) {
          // If new price is greater, trigger fade effect
          changeBackgroundColor('green');
        } else if (previousPrice !== null && newPrice < previousPrice) {
          changeBackgroundColor('red');
        }

        setPreviousPrice(newPrice);
        setPrice(newPrice);
      } finally {
        setLoading(false);
      }
    };
    const interval = setInterval(() => {
      console.log('Price will be fetched every 2 second');
      fetchPrice();
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [previousPrice]);

  return (
    <div className="App">
      <main>
        {/* {!isAuthenticated && <Button title='Login' id='login' onClick={handleLogin} variant="outline-secondary"><BoxArrowInRight /></Button>}
        {isAuthenticated && <Button title='Logout' id='logout' onClick={handleLogout} variant="outline-secondary"><BoxArrowInLeft /></Button>} */}
        <br />
        <PriceContainer price={price} backgroundColor={backgroundColor} />
        <section id="principal"></section>
        <Dropdown id="main-dropdown">
          <Dropdown.Toggle as="a" id="dropdown-basic">
            <BoxArrowInRight />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {!isAuthenticated && <Dropdown.Item onClick={handleLogin}>Login</Dropdown.Item>}
            {isAuthenticated && <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>}
            {isAuthenticated && <Dropdown.Item onClick={handleShow}>Edit Profile</Dropdown.Item>}
          </Dropdown.Menu>
        </Dropdown>
      </main>
      <Modal show={show} onShow={handleDialogShow} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '20px' }}>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={onProfileDialogSubmit}>
            <Form.Group controlId="formPrincipal">
              <Form.Label>Principal</Form.Label>
              <Form.Control
                type="text"
                name="principal"
                value={formData.principal}
                disabled
              />
            </Form.Group>
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onProfileDialogSubmit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


export default App;
