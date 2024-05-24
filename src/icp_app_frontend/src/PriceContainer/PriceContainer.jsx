import React, { useState, useEffect } from 'react';
import styles from './PriceContainer.module.scss';

function PriceContainer({ price }) {
  const [backgroundColor, setBackgroundColor] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);

  // Function to run when price changes
  const handlePriceChange = (newPrice) => {
    console.log('Price has changed to:', newPrice);
    if (newPrice > previousPrice) {
      changeBackgroundColor("green");
    } else if (newPrice < previousPrice) {
      changeBackgroundColor("red");
    }
  };

  const changeBackgroundColor = (color) => {
    setBackgroundColor(color); // Change color
    setTimeout(() => {
      setBackgroundColor(null); // reset
    }, 600);
  };

  function isNumber(value) {
    return typeof value === 'number';
  }

  useEffect(() => {
    setPreviousPrice(price);
    if (price == null || !isNumber(price)) {
      // Not processing further because price is not correct
      return;
    }
    handlePriceChange(price);
  }, [price]);

  return (
    <div className={styles['price-container']} style={{ backgroundColor }}>
      <label>Current ICP-USD Price:</label>
      {price !== null && (<label>{price}</label>)}
      {price == null && (<label>Loading</label>)}
      {price !== null && (<label>USD</label>)}
    </div>
  );
}

export default PriceContainer;