import React from 'react';
import styles from './PriceContainer.module.scss';

function PriceContainer({ price, backgroundColor }) {

  return (
    <div className={styles['price-container']} style={{ backgroundColor }}>
      <label>Current ICP-USD Price:</label>
      <label>{price}</label>
      {typeof price === 'number' && <label>USD</label>}
    </div>
  );
}

export default PriceContainer;