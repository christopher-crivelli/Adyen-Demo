
// Page load
window.addEventListener('load', async e => {
    document.getElementById("visualizeAfP").addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Visualization reloading');
        console.log(event);

        postRequest('/getAccountHolder', {
            accountHolderId: document.getElementById('accountHolderId').value
        })
    })
});