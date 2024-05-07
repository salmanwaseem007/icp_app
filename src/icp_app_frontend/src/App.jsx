import { useState, useEffect } from 'react';
import { createActor, icp_app_backend } from 'declarations/icp_app_backend';
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent } from "@dfinity/agent";

const App = () => {
  const [userData, setUserData] = useState(null);
  const [price, setPrice] = useState("loading");
  const [previousPrice, setPreviousPrice] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('');
  const [loading, setLoading] = useState(false);
  const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === "production" ? "ic" : "local");
  const internetIdentityUrl = network === "local" ? "http://" + process.env.CANISTER_ID_INTERNET_IDENTITY + ".localhost:4943/" : "https://identity.ic0.app"
  let backendActor = icp_app_backend;


  const changeBackgroundColor = (color) => {
    setBackgroundColor(color); // Change color
    setTimeout(() => {
      setBackgroundColor(null); // reset color
    }, 600);
  };

  const handleClick = async (e) => {
    e.preventDefault();

    // create an auth client
    let authClient = await AuthClient.create();

    // start the login process and wait for it to finish
    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: resolve,
      });
    }).then(() => {
      getPrincipal();
    });

    // At this point we're authenticated, and we can get the identity from the auth client:
    const identity = authClient.getIdentity();
    // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
    const agent = new HttpAgent({ identity });
    // Using the interface description of our webapp, we create an actor that we use to call the service methods.
    backendActor = createActor(process.env.CANISTER_ID_ICP_APP_BACKEND, {
      agent,
    });
  };

  const getPrincipal = async () => {
    const principal = await icp_app_backend.getPrincipal();

    document.getElementById("login").style.display = "none";
    document.getElementById("principal").innerText = "Welcome " +principal;

    const userData = {
      "id": principal
    };
    setUserData(userData);
    // Save updated user data to local storage
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  useEffect(() => {
    const userDataLS = localStorage.getItem("userData");
    if (userDataLS) {
      const userDataObj = JSON.parse(userDataLS);
      setUserData(userDataObj);
      // Hide the button
      document.getElementById("login").style.display = "none";
      document.getElementById("principal").innerText = "Welcome " + userDataObj.id;
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
        var currencyLabel = document.getElementById("currency");
        currencyLabel.style.display = "block";
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
        <button id='login' onClick={handleClick}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="currentColor"><path d="M19.5 31.65q-.45-.45-.45-1.1 0-.65.45-1.05l4-4h-16q-.65 0-1.075-.425Q6 24.65 6 24q0-.65.425-1.075Q6.85 22.5 7.5 22.5h15.9l-4.05-4.05q-.4-.4-.4-1.025 0-.625.45-1.075.45-.45 1.075-.45t1.075.45L28.2 23q.25.25.35.5.1.25.1.55 0 .3-.1.55-.1.25-.35.5l-6.6 6.6q-.4.4-1.025.4-.625 0-1.075-.45ZM25.95 42q-.65 0-1.075-.425-.425-.425-.425-1.075 0-.65.425-1.075Q25.3 39 25.95 39H39V9H25.95q-.65 0-1.075-.425-.425-.425-.425-1.075 0-.65.425-1.075Q25.3 6 25.95 6H39q1.2 0 2.1.9.9.9.9 2.1v30q0 1.2-.9 2.1-.9.9-2.1.9Z"></path></svg></button>
        <img src="/logo2.svg" alt="DFINITY logo" />
        <br />
        <div className='price-container' style={{ backgroundColor }}>
          <label >Current ICP-USD Price: </label>
          <label id="price">{price}</label>
          <label id='currency'>USD</label>
        </div>
        <section id="principal"></section>
      </main>
    </div>
  );
}


export default App;
