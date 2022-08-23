const paymentComplete = (result, _passedComponent) => {
  const {resultCode} = result;

  console.log(result);
  
  // Set status on dropin 
  if (type === 'dropin') {
    try {
      component.setStatus('success', { message: 'Reload to make another payment request.' });
    } catch (e) {
      console.log(e);
    }
  }

  const collapseResponse = document.getElementById('collapseResponse');
  const sessionsResponseField = new bootstrap.Collapse(collapseResponse, {
    toggle: false
  });
  sessionsResponseField.hide();

  updateStatus(resultCode);
  saveToLS('sessions-result',resultCode);

  let time = updateRequestTime();
  saveToLS('sessions-time',time);
}

////////////////////
// DROPIN CONFIG // 
//////////////////

const createDropinConfig = (session) => {
  return {
    environment: 'test',
    clientKey: config.clientKey,
    session,
    onPaymentCompleted: paymentComplete,
    onError: (error, component) => {
      console.error(error.name, error.message, error.stack, component);
    }
  }
}

const renderDropin = async (session) => {
  checkout = await AdyenCheckout(createDropinConfig(session));
  component = checkout.create('dropin').mount('#component-container');
}

////////////////////////
// COMPONENTS CONFIG // 
//////////////////////

const createComponentConfig = (session) => {
  return {
    environment: 'test',
    showPayButton: true,
    clientKey: config.clientKey,
    session,
    onPaymentCompleted: (result, component) => {
      console.info(result, component);
    },
    onError: (error, component) => {
      console.error(error.name, error.message, error.stack, component);
    }
  }
}

const renderComponent = async (session) => {
  checkout = await AdyenCheckout(createComponentConfig(session));
  component = checkout.create(type).mount('#component-container');
}

////////////////////
// SESSIONS APIS //
//////////////////

const getSession = async () => {
  let payload = {};
  payload = updatePayloadWithSelectedOptions(payload);

  // Line items for Klarna
  payload['lineItems'] = generateLineItems();
  payload['deliveryAddress'] = generateAddress();
  payload['billingAddress'] = generateAddress();
  payload['shopperEmail'] = 'test@email.com';
  payload['shopperName'] = generateShopperName();
  payload['telephoneNumber'] = '5555555555'
  

  
  const sessionsResponse = await postRequest('/sessions', payload);
  updateSessionsRequest(sessionsResponse.request);
  updateSessionsResponse(sessionsResponse.data);
  // Close sessions response accordion 
  const collapseResponse = document.getElementById('collapseResponse');
  const paymentResponseField = new bootstrap.Collapse(collapseResponse, {
    toggle: false
  });
  paymentResponseField.show();

  return sessionsResponse.data;
}

/////////////////
// PAGE SETUP //
///////////////
const getItemsFromLS = () => {
  const resultCode = getFromLS('sessions-result');
  if (resultCode) updateStatus(resultCode);

  const time = getFromLS('sessions-time');
  updateRequestTime(time);

}

const resetPage = async () => {
  const sessionResponse = await getSession();
  const session = {
    id: sessionResponse.id,
    sessionData: sessionResponse.sessionData
  }

  if (type === 'dropin') {
    renderDropin(session);
  } else {
    console.log(`Rendering ${type} component`)
    renderComponent(session);
  }
};

const handleRedirect = async () => {
  const id = parseQueryParameter('sessionId');
  const redirectResult = parseQueryParameter('redirectResult');

  const session = {
    id: id
  }

  if (type === 'dropin') {
    checkout = await AdyenCheckout(createDropinConfig(session))
  } else {
    checkout = await AdyenCheckout(createComponentConfig(session));
  }

  checkout.submitDetails({ details: { redirectResult } })

  const newURL = window.location.href.split("?")[0].split("/")[3];
  window.history.pushState({}, document.title, "/" + newURL);
}

window.addEventListener('load', async e => {

  // Retrieves fields from Local Storage and sets them on the DOM (status, pspRef, etc.)
  getItemsFromLS();

  // Is redirect result present? 
  const isRedirect = /redirectResult/.test(document.location.search);

  // Gets the integration type from LS 
  type = getFromLS('type');

  // If type exists - set type, else set dropin
  type ? updateType(type, false) : updateType('dropin', false);

  // If redirect, handle the redirect (submits the redirect result)
  isRedirect ? await handleRedirect() : resetPage();
});