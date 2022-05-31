// Handles the redirect result from a redirect payment method (e.g. klarna) or 3DS1
const handleRedirect = async () => {
  const payload = {
    details: {
      redirectResult: parseQueryParameter('redirectResult')
    }
  };

  const paymentDetailsResponse = await postAdditionalDetails(payload);
  additionalDetailsComplete(paymentDetailsResponse);

  // clears the redirect result from the url to avoid sending again on refresh
  const newURL = window.location.href.split("?")[0].split("/")[3];
  window.history.pushState({}, document.title, "/" + newURL);
};

////////////////////
// CHECKOUT APIS //
//////////////////


// Triggered when the user submits the payment via drop-in or components
const handleOnSubmit = async (state, _passedComponent) => {

  // Hide the additional details accordion 
  hideAdditionalDetails();

  // Clears the additional details and removes from LS 
  clearAdditionalDetails();

  const data = state.data;
  data['threeDS'] = getThreeDS();
  data['allow3DS2'] = getAllow3DS2();
  data['recurringProcessingModel'] = getTokenizationSetting();
  data['shopperInteraction'] = getShopperInteraction();
  data['shopperReference'] = getShopperReference();
  data['amount'] = getAmount();
  data['countryCode'] = getCountryCode();
  data['merchantReference'] = getMerchantReference();

  // Klarna config
  if (state.data.paymentMethod.type.includes('klarna')) {
    data['lineItems'] = generateLineItems();
    data['deliveryAddress'] = generateAddress();
    data['billingAddress'] = generateAddress();
    data['shopperEmail'] = 'test@email.com';
    data['shopperName'] = generateShopperName();
    data['telephoneNumber'] = '5555555555'
  }

  // MBway config   
  if (state.data.paymentMethod.type === 'mbway') {
    data['shopperStatement'] = "MBWay shopper statement-c1"
  }

  postRequest('/makePayment', data)
    .then(response => {
      updatePaymentRequest(response.request);
      saveToLS('checkout-request', formatJSON(response.request));

      if (response.data.action) {
        if (type === 'dropin') {
          paymentComplete(response.data);
          component.handleAction(response.data.action);
        } else {
          paymentComplete(response.data);
          if (response.data.action.paymentMethodType === 'paypal') {
            component.handleAction(response.data.action);
          } else {
            checkout.createFromAction(response.data.action).mount('#component-container');
          }
        }
      } else {
        paymentComplete(response.data);
      }
    })
    .catch(err => {
      paymentComplete(err.message + "");
    });
}

// Handles the request to additional details for a redirect result or additional action (redirect LPM, 3DS, etc.)
const handleAdditionalDetails = async (state, component) => {
  // Makes the request to /payments/details
  const response = await postAdditionalDetails(state.data);

  if (response.action) {
    additionalDetailsComplete(response);
    component.handleAction(response.action);
  } else {
    component.setStatus('success', { message: 'Reload to make another payment request.' });
    additionalDetailsComplete(response);
  };
}

// Triggered when the additional details call is made 
const additionalDetailsComplete = (response) => {
  const { pspReference, resultCode } = response;

  if (type === 'dropin') {
    try {
      component.setStatus('success', { message: 'Reload to make another payment request.' });
    } catch (e) {
      console.log(e);
    }
  }

  // Close Payment response accordion 
  const collapseResponse = document.getElementById('collapseResponse');
  const paymentResponseField = new bootstrap.Collapse(collapseResponse, {
    toggle: false
  });
  paymentResponseField.hide();

  // Open API response accordion 
  const myCollapse = document.getElementById('collapseDetailsResponse');
  const detailsResponseField = new bootstrap.Collapse(myCollapse, {
    toggle: false
  });
  detailsResponseField.show();

  // Update pspReference on UI 
  updatePspReference(pspReference);
  saveToLS("checkout-pspReference", pspReference);

  // Update status on UI 
  updateStatus(resultCode);
  saveToLS('checkout-resultCode', resultCode);

  // Updates the request time on the UI 
  const date = updateRequestTime();
  saveToLS('checkout-requestTime', date);
};

// Triggered when the payment is completed
const paymentComplete = (response) => {
  const { pspReference, resultCode } = response;

  // Set status on dropin 
  if (type === 'dropin') {
    try {
      component.setStatus('success', { message: 'Reload to make another payment request.' });
    } catch (e) {
      console.log(e);
    }
  }

  // Update response time on UI 
  const date = updateRequestTime();
  saveToLS('checkout-requestTime', date);

  // Update response on UI 
  updatePaymentResponse(response);
  saveToLS('checkout-response', formatJSON(response));

  // Update pspReference on UI 
  updatePspReference(pspReference);
  saveToLS("checkout-pspReference", pspReference);

  // Update status on UI 

  if (resultCode === undefined) {
    updateStatus('Error');
    saveToLS('checkout-resultCode', 'Error');
  } else {
    updateStatus(resultCode);
    saveToLS('checkout-resultCode', resultCode);
  }


  // Opens the payment response accordion
  showPaymentResponse();

}

/////////////////////////
// DROPIN INTEGRATION //
///////////////////////

// Triggered when the user fills in their payment details
const handleOnChangeDropin = (state, dropin) => {

}

// Triggered when dropin is returned an error 
const handleErrorDropin = (error, component) => {
  console.log(error.name, error.message, error.stack, component);
  showToast(error.name, error.message, "error");
};

// Triggered when the shopper removes a stored payment method
const handleDisableStoredPaymentMethod = async (recurringDetailReference, resolve, reject) => {
  const shopperReference = getShopperReference();
  postRequest('/disablePaymentMethod', { recurringDetailReference, shopperReference })
    .then(result => {
      showToast('Payment Method', 'Successfully disabled.');
      resolve();
    })
    .catch(e => {
      reject();
    })
}

// Triggered when the shopper selects a payment method
const handleSelectMethod = component => {

};

// Creates the dropin configuration object
const createDropinConfig = paymentMethodsResponse => {
  return {
    paymentMethodsResponse,
    shopperReference: getShopperReference(),
    clientKey: config.clientKey,
    locale: getShopperLocale(),
    environment: "test",
    onChange: handleOnChangeDropin,
    onSubmit: handleOnSubmit,
    onError: handleErrorDropin,
    onAdditionalDetails: handleAdditionalDetails,
    translations: getTranslations(),
    paymentMethodsConfiguration: {
      storedCard: {
        hideCVC: false
      },
      card: {
        hasHolderName: false,
        holderNameRequired: false,
        enableStoreDetails: false,
        billingAddressRequired: false,
        hideCVC: false,
        name: "Credit or Debit Card",
      },
      threeDS2: { // Web Components 4.0.0 and above: sample configuration for the threeDS2 action type
        challengeWindowSize: '02'
        // Set to any of the following:
        // '02': ['390px', '400px'] -  The default window size
        // '01': ['250px', '400px']
        // '03': ['500px', '600px']
        // '04': ['600px', '400px']
        // '05': ['100%', '100%']
      }
    }
  };
};

// Creates additional dropin properties 
const createDropinProps = () => {
  return {
    showPaymentMethods: true,
    openFirstStoredPaymentMethod: true,
    openFirstPaymentMethod: true,
    showStoredPaymentMethods: true,
    showRemovePaymentMethodButton: true,
    onDisableStoredPaymentMethod: handleDisableStoredPaymentMethod,
    onSelect: handleSelectMethod
  }
}

const renderDropin = async (paymentMethodsResponse) => {
  checkout = await AdyenCheckout(createDropinConfig(paymentMethodsResponse));
  const props = createDropinProps();
  component = checkout.create('dropin', props).mount('#component-container');
}

/////////////////////////////
// COMPONENTS INTEGRATION //
///////////////////////////

const createComponentConfig = paymentMethodsResponse => {
  return {
    paymentMethodsResponse,
    shopperReference: getShopperReference(),
    clientKey: config.clientKey,
    locale: config.shopperLocale,
    environment: "test",
    showPayButton: true,
    amount: getAmount(),
    onSubmit: handleOnSubmit,
    onAdditionalDetails: handleAdditionalDetails,
    paymentMethodsConfiguration: {
      paypal: {
        style: {
          color: "blue",
          label: "checkout",
          shape: "pill",
        }
      }
    }
  }
};

const renderComponent = async (paymentMethodsResponse) => {
  checkout = await AdyenCheckout(createComponentConfig(paymentMethodsResponse));
  component = checkout.create(type).mount('#component-container');
}

// Gets all required items from LS and updates them on the dom for page load.
const getItemsFromLS = () => {

  // Get PSP Reference and render 
  const pspReference = getFromLS('checkout-pspReference');
  updatePspReference(pspReference);

  // Get result code and render 
  const resultCode = getFromLS('checkout-resultCode');
  updateStatus(resultCode);

  // Get checkout request and render
  try {
    const paymentRequest = JSON.parse(getFromLS('checkout-request'));
    updatePaymentRequest(paymentRequest);
  } catch (e) {
    console.log(e);
  }

  // Get checkout response and render
  try {
    const paymentResponse = JSON.parse(getFromLS('checkout-response'));
    updatePaymentResponse(paymentResponse);
  } catch (e) {
    console.log(e);
  }

  // Get request time and render 
  let requestTime = getFromLS('checkout-requestTime');
  if (!requestTime) requestTime = "";
  updateRequestTime(requestTime);

  // Get additional details call and render 
  const detailsRequest = JSON.parse(getFromLS('checkout-details-request'));
  updateDetailsRequest(detailsRequest);

  const detailsResponse = JSON.parse(getFromLS('checkout-details-response'));
  updateDetailsResponse(detailsResponse);

  if(detailsRequest && detailsResponse) showAdditionalDetails();

}

// Remounts the components and cleans up the page for a new request
const resetPage = async () => {

  // Close API response accordion 
  let myCollapse = document.getElementById('collapseResponse');
  let paymentResponseField = new bootstrap.Collapse(myCollapse, {
    toggle: false
  });
  paymentResponseField.hide();

  // Close payments details API response
  const collapseDetails = document.getElementById('collapseDetailsResponse');
  const detailsResponseField = new bootstrap.Collapse(collapseDetails, {
    toggle: false
  });
  detailsResponseField.hide();

  const paymentMethods = await getPaymentMethods();
  if (type === 'dropin') {
    renderDropin(paymentMethods);
  } else {
    console.log(`Rendering ${type} component`)
    renderComponent(paymentMethods);
  }
}

// Page load
window.addEventListener('load', async e => {
  // Retrieves fields from Local Storage and sets them on the DOM (status, pspRef, etc.)
  getItemsFromLS();

  // Returns true if redirect result is present
  const isRedirect = /redirectResult/.test(document.location.search);

  // Gets the integration type from LS 
  type = getFromLS('type');

  // If type exists - set type, else set dropin
  type ? updateType(type) : updateType('dropin');

  // If redirect, handle the redirect (submits the redirect result)
  isRedirect ? await handleRedirect() : false;
});