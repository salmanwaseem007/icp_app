import { useState, useEffect } from 'react';
import { createActor, icp_app_backend } from 'declarations/icp_app_backend';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [price, setPrice] = useState(null);
  const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === "production" ? "ic" : "local");
  const internetIdentityUrl = network === "local" ? "http://" + process.env.CANISTER_ID_INTERNET_IDENTITY + ".localhost:4943/" : "https://identity.ic0.app"
  let backendActor = icp_app_backend;

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
  const onUserProfileDialogSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const requestData = {
      principal: userData.principal,
      name: [formDataUserProfileDialog.name],
      email: [formDataUserProfileDialog.email]
    };
    await icp_app_backend.updateUser(userData.principal, requestData)
      .then(response => {
        console.log(response);
        const _userData = {
          principal: userData.principal,
          name: formDataUserProfileDialog.name,
          email: formDataUserProfileDialog.email
        };
        setUserData(_userData);
        localStorage.setItem('userData', JSON.stringify(_userData));
        setWelcomeMessage("Welcome " + _userData.name);
        handleCloseUserProfileDialog(); // Close the dialog box after submission
        setLoading(false);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 1500);
      }).catch(error => {
        console.error(error);
        setLoading(false);
      });
  };
  function handleDialogShow() {
    setFormDataUserProfileDialog(userData);
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    let authClient = await AuthClient.create();

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
            setWelcomeMessage("Welcome " + _name);
          } else {
            setWelcomeMessage("Welcome. Please complete your profile");
          }
        })
        .catch(error => {
          console.error(error);
        });
    }

    const identity = authClient.getIdentity();
    const agent = new HttpAgent({ identity });
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
        setWelcomeMessage("Welcome " + _name);
      } else {
        setWelcomeMessage("Welcome. Please complete your profile");
      }
    }

    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/ICP-USD/spot/');
        const data = await response.json();
        let newPrice = Number(data.data.amount);
        setPrice(newPrice);
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };
    const fetchPriceBackend = async () => {
      try {
        const jsonData = JSON.parse(await icp_app_backend.getICPPrice()).data;
        let newPrice = Number(jsonData.amount);
        setPrice(newPrice);
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };
    console.log('Price will be fetched every 2 second');
    const interval = setInterval(() => {
      fetchPrice();
    }, 2000);
    return () => {
      fetchPrice();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="App">
      <AppMenu
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        handleShowUserProfileDialog={handleShowUserProfileDialog}
      />
      <PriceContainer price={price} />
      <WelcomeMessage message={welcomeMessage} />
      <UserProfileDialog
        showUserProfileDialog={showUserProfileDialog}
        handleCloseUserProfileDialog={handleCloseUserProfileDialog}
        handleDialogShow={handleDialogShow}
        formDataUserProfileDialog={formDataUserProfileDialog}
        handleChangeFormDataUserProfileDialog={handleChangeFormDataUserProfileDialog}
        onUserProfileDialogSubmit={onUserProfileDialogSubmit}
      />
      <LoadingSpinner isLoading={isLoading} />
      <ToastComponent showToast={showToast} />
    </div>
  );
}

export default App;