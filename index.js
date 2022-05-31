require('dotenv').config();
const path = require('path');
const express = require('express');
const axios = require('axios');
const ejs = require('ejs');

// require https for api requests
const https = require('https');

// require fs to write to pspRef file
const fs = require('fs');

const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const { PORT, API_KEY, MERCHANT_ACCOUNT, ENVIRONMENT } = require('./config');
const { AccountInfo } = require('@adyen/api-library/lib/src/typings/checkout/accountInfo');
const { Agent } = require('http');

// This is the server-side configuration.  It pulls the information supplied in the .env file to create an instance of the checkout API
const config = new Config();
// Set your X-API-KEY with the API key from the Customer Area.
config.apiKey = API_KEY;
config.merchantAccount = MERCHANT_ACCOUNT;
const client = new Client({ config });
client.setEnvironment(ENVIRONMENT);
const checkout = new CheckoutAPI(client);

// URLs for API calls 
const checkoutUrl = 'https://checkout-test.adyen.com/v68';

const app = express();
app.use(express.json());

app.set('view engine', 'ejs');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/public'));

const createReferenceNumber = (prefix) => {
  const date = Date.now();
  return `${prefix}-${date}`;
}

////////////
// Routes //
////////////

app.get('/', (req, res) => {
  res.render('checkout.ejs', { currentPage: 'checkout' });
});

app.get('/checkout', (req, res) => {
  res.render('checkout.ejs', { currentPage: 'checkout' });
});

app.get('/sessions', (req, res) => {
  res.render('sessions.ejs', { currentPage: 'sessions' });
});

app.get('/customcard', (req, res) => {
  res.render('customcard.ejs', { currentPage: 'customcard' });
});

app.get('/platforms', (req, res) => {
  res.render('platforms.ejs', { currentPage: 'platforms'})
});

app.get('/notifications', (req, res) => {
  res.render('notifications.ejs', { currentPage: 'notifications' });
});

/////////////////
// POST CALLS // 
///////////////

const createAdditionalData = (threeDS, allow3DS2=false) => {
  const additionalData = {};
  threeDS ? additionalData['executeThreeD'] = true : additionalData['executeThreeD'] = false;
  additionalData['allow3DS2'] = allow3DS2;

  return additionalData;
};

// Initiates a payment session 
app.post('/sessions', (req, res) => { 
  const { countryCode, shopperLocale, amount, shopperReference, threeDS, merchantReference } = req.body;
  const additionalData = createAdditionalData(threeDS);

  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    countryCode,
    shopperLocale,
    amount,
    shopperReference,
    additionalData,
    reference: merchantReference ? merchantReference : createReferenceNumber('sessions'),
    returnUrl: req.headers.referer
  };
  
  checkout.sessions(payload)
  .then(sessionsResponse => {
    const response = {};
    response['data']=sessionsResponse;
    response['request']=payload;
    res.json(response);
  })
  .catch(err => { 
    res.status(err.statusCode);
    res.json({ message: err.message});
  })
});

// Get payment methods to initialize dropin or components 
app.post('/getPaymentMethods', (req, res) => {
  const { countryCode, shopperLocale, amount, shopperReference, threeDS } = req.body;

  checkout.paymentMethods({
    merchantAccount: MERCHANT_ACCOUNT,
    countryCode,
    shopperLocale,
    shopperReference,
    amount,
    channel: "Web"
  })
    .then(paymentMethodsResponse => res.json(paymentMethodsResponse))
    .catch((err) => {
      res.status(err.statusCode);
      res.json({ message: err.message });
    });
});

// Makes the payment with the paymentMethod object passed from the front end 
app.post('/makePayment', (req, res) => {
  const { paymentMethod, allow3DS2, threeDS, browserInfo, recurringProcessingModel, shopperInteraction, 
    shopperReference, amount, lineItems, shopperEmail, billingAddress, deliveryAddress, 
    shopperName, countryCode, shopperStatement, merchantReference} = req.body;
  const additionalData = createAdditionalData(threeDS, allow3DS2);

  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    amount,
    reference: merchantReference ? merchantReference : createReferenceNumber('checkout-payment'),
    paymentMethod,
    billingAddress,
    deliveryAddress,
    countryCode,
    shopperEmail,
    shopperName,
    lineItems,
    browserInfo,
    additionalData,
    recurringProcessingModel,
    storePaymentMethod: recurringProcessingModel ? true : false,
    shopperInteraction,
    shopperReference,
    channel: 'Web',
    shopperStatement,
    returnUrl: req.headers.referer,
    origin: req.headers.referer
  };

  checkout.payments(payload)
    // Successful payment 
    .then(paymentResponse => {
      const response = {};
      response['data']=paymentResponse;
      response['request']=payload;
      res.json(response);
    })
    // Payment error
    .catch((err) => {
      const response = {};
      response['request']=payload;
      response['message']=err.message;
      res.status(err.statusCode);
      res.json(response);
    });
});

app.post('/additionalDetails', async (req, res) => {

  // Stringify request body to pass to /payments/details
  const payload = req.body;
  const url = "https://checkout-test.adyen.com/v68/payments/details";

  postRequest(url, payload)
    .then(response => {
      res.json(response);
    })
    .catch(e => {
      console.log(e);
    })
});

// Disables a payment method 
app.post('/disablePaymentMethod', (req, res) => {
  const { recurringDetailReference, shopperReference } = req.body;
  const url = 'https://pal-test.adyen.com/pal/servlet/Recurring/v68/disable';
  const payload = {
    shopperReference,
    recurringDetailReference,
    merchantAccount: MERCHANT_ACCOUNT
  };

  postRequest(url, payload)
    .then(response => {
      res.json({ response });
    })
    .catch(e => {
      res.status(e['status'].toString()).json(e.data);
    })
});

////////////////////
// Modifications //
//////////////////

app.post('/capture', async (req, res) => {
  const { pspReference, value, currency } = req.body;
  const url = `${checkoutUrl}/payments/${pspReference}/captures`
  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    reference: createReferenceNumber('checkout-capture'),
    amount: {
      value,
      currency
    }
  };

  const captureResponse = await postRequest(url, payload);
  res.json(captureResponse);
});

app.get('*', (req, res) => {
  res.render('404', {currentPage:""});
});

//////////
// API //
////////

app.post('/api/notifications', (req, res) => {

});


// Start server
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});



//////////////////////////
// Additional Functions //
//////////////////////////

const postRequest = async (url, payload) => {
  const config = {
    headers: { 'X-API-Key': API_KEY }
  };

  const res = await axios.post(url, payload, config);
  return res.data;
}
