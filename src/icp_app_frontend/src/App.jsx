import { useState, useEffect } from 'react';
import { createActor } from 'declarations/icp_app_backend';
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent } from "@dfinity/agent";
import PriceContainer from './PriceContainer/PriceContainer';
import UserProfileDialog from './UserProfileDialog/UserProfileDialog';
import AppMenu from './AppMenu/AppMenu';
import WelcomeMessage from './WelcomeMessage/WelcomeMessage';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner'
import ToastComponent from './ToastComponent/ToastComponent'

const App = () => {
  const [isLoading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [price, setPrice] = useState(null);
  const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === "production" ? "ic" : "local");
  const internetIdentityUrl = network === "local" ? "http://" + process.env.CANISTER_ID_INTERNET_IDENTITY + ".localhost:4943/" : "https://identity.ic0.app"
  const [backendActor, setBackendActor] = useState(null);

  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const handleCloseUserProfileDialog = () => setShowUserProfileDialog(false);
  const handleShowUserProfileDialog = () => setShowUserProfileDialog(true);
  const [formDataUserProfileDialog, setFormDataUserProfileDialog] = useState({ principal: '', name: '', email: '' });
  const handleChangeFormDataUserProfileDialog = (e) => {
    const { name, value } = e.target;
    setFormDataUserProfileDialog((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  async function handleLogin(e) {
    e.preventDefault();

    let authClient = await AuthClient.create();

    if (authClient.isAuthenticated() && ((await authClient.getIdentity().getPrincipal().isAnonymous()) === false)) {
      handleAuthenticated(authClient);
    } else {
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
      const identity = authClient.getIdentity();
      const _principal = identity.getPrincipal().toString();

      setIsAuthenticated(true);

      const requestData = {
        name: [],
        email: []
      };
      const agent = new HttpAgent({ identity });
      let _backendActor = await createActor(process.env.CANISTER_ID_ICP_APP_BACKEND, {
        agent,
      });
      setBackendActor(_backendActor);

      _backendActor.createUser(requestData).then(([response]) => {
        const responseObj = {
          principal: _principal,
          name: response.name.length > 0 ? response.name[0] : null,
          email: response.email.length > 0 ? response.email[0] : null
        };
        console.log(responseObj);
        setUserData(responseObj);
        localStorage.setItem('userData', JSON.stringify(responseObj));

        let _name = responseObj.principal;
        if (responseObj.name && responseObj.name.length > 0) {
          _name = responseObj.name;
          setWelcomeMessage("Welcome " + _name);
        } else {
          setWelcomeMessage(null);
        }
      }).catch(error => {
        console.error(error);
      });
    }
  }

  async function handleLogout(e) {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setUserData(null);
    setIsAuthenticated(false);
    setWelcomeMessage(null);
    localStorage.removeItem('userData');
    window.location.reload();
  }

  function handleDialogShow() {
    setFormDataUserProfileDialog(userData);
  }

  function onUserProfileDialogSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const requestData = {
      name: [formDataUserProfileDialog.name],
      email: [formDataUserProfileDialog.email]
    };

    backendActor.updateUser(requestData)
      .then(response => {
        const _userData = {
          principal: userData.principal,
          name: formDataUserProfileDialog.name,
          email: formDataUserProfileDialog.email
        };
        setUserData(_userData);
        localStorage.setItem('userData', JSON.stringify(_userData));
        if (formDataUserProfileDialog.name && formDataUserProfileDialog.name.length > 0) {
          setWelcomeMessage("Welcome " + _userData.name);
        } else {
          setWelcomeMessage(null);
        }
        handleCloseUserProfileDialog();
        setLoading(false);
        loadToast('Profile saved successfully!')
      }).catch(error => {
        console.error(error);
        setLoading(false);
      });
  }

  function loadToast(msg) {
    setToastMessage(msg)
    setShowToast(true);
  }

  function setDefaultWelcomeMessage() {
    const userDataLS = localStorage.getItem("userData");
    if (userDataLS) {
      const userDataObj = JSON.parse(userDataLS);
      setUserData(userDataObj);
      let _name = userDataObj.principal;
      if (userDataObj.name && userDataObj.name.length > 0) {
        _name = userDataObj.name;
        setWelcomeMessage("Welcome " + _name);
      } else {
        setWelcomeMessage(null);
      }
    }
  }

  async function fetchICPPrice() {
    // creating new actor here to track user between login and logout.
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    let actor = createActor(process.env.CANISTER_ID_ICP_APP_BACKEND, {
      agent,
    });
    const jsonData = JSON.parse(await actor.getICPPrice()).data;
    let newPrice = Number(jsonData.amount);
    setPrice(newPrice);
  }

  useEffect(() => {
    console.log('Price will be fetched every 2 second');
    async function appInit() {
      const authClient = await AuthClient.create();
      var _isAuthenticated = authClient.isAuthenticated() && ((await authClient.getIdentity().getPrincipal().isAnonymous()) === false);
      try {
        const identity = authClient.getIdentity();
        const agent = new HttpAgent({ identity });
        let _backendActor = createActor(process.env.CANISTER_ID_ICP_APP_BACKEND, {
          agent,
        });
        setBackendActor(_backendActor);
        setIsAuthenticated(_isAuthenticated);
        setDefaultWelcomeMessage();

        await fetchICPPrice();
        const interval = setInterval(async () => {
          await fetchICPPrice();
        }, 2000);
        return () => {
          clearInterval(interval);
        };
      } catch (error) {
        console.error('useEffect, isAuthenticated :', error);
      }
    }

    appInit();
  }, []);

  return (
    <div className="App">
      <AppMenu
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        handleShowUserProfileDialog={handleShowUserProfileDialog} />
      <PriceContainer price={price} />
      <WelcomeMessage message={welcomeMessage} isAuthenticated={isAuthenticated} handleShowUserProfileDialog={handleShowUserProfileDialog} handleLogin={handleLogin} />
      <UserProfileDialog
        showUserProfileDialog={showUserProfileDialog}
        handleCloseUserProfileDialog={handleCloseUserProfileDialog}
        handleDialogShow={handleDialogShow}
        formDataUserProfileDialog={formDataUserProfileDialog}
        handleChangeFormDataUserProfileDialog={handleChangeFormDataUserProfileDialog}
        onUserProfileDialogSubmit={onUserProfileDialogSubmit} />
      <LoadingSpinner isLoading={isLoading} />
      <ToastComponent showToast={showToast} setShowToast={setShowToast} toastMessage={toastMessage} />
    </div>
  );
}

export default App;