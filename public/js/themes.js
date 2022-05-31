// function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    if(themeName==='default'){
        document.querySelector('body').className = `default`;
    } else {
        document.querySelector('body').className = `theme-${themeName} theme`;
    }
}

// Immediately invoked function to set the theme on initial load
(function () {
    if (localStorage.getItem('theme')) {
        const theme = localStorage.getItem('theme');
        setTheme(theme);
        document.getElementById(`pills-${theme}-tab`).classList.add('active');
    } else {
        setTheme('default');
        document.getElementById(`pills-default-tab`).classList.add('active');
    }
})();

const themeSelectors = document.getElementsByClassName("nav-link theme-select");
for (let button of themeSelectors) {
    button.addEventListener('click', function (e) {
        const theme = e.target.innerText.toLowerCase();
        setTheme(theme);
    });
}