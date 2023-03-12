(function(global) {

    const VALID_THEMES = ['default', 'colorblind'];

    // function to set a given theme/color-scheme
    function setTheme(themeName) {
        sessionStorage.setItem('theme', themeName);
        document.body.classList.remove('theme-default');
        document.body.classList.add(`theme-${themeName}`);
    }

    // function to load theme
    function loadTheme() {
        const theme = sessionStorage.getItem('theme');
        if(theme === null) {
            return;
        }
        if(!VALID_THEMES.includes(theme)) {
            sessionStorage.removeItem('theme');

        }

        setTheme(theme);
    }

    function getLevelColors() {
        const style = getComputedStyle(document.body);
        return [
            style.getPropertyValue('--level0-color'),
            style.getPropertyValue('--level1-color'),
            style.getPropertyValue('--level2-color'),
            style.getPropertyValue('--level3-color'),
            style.getPropertyValue('--level4-color'),
        ];
    }

    global.getLevelColors = getLevelColors;
    global.setTheme = setTheme;
    global.loadTheme = loadTheme;

})(window);