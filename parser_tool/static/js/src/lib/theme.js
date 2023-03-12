(function(global) {

    const VALID_THEMES = ['default', 'colorblind'];

    function setTheme(themeName) {
        if(VALID_THEMES.includes(themeName)) {
            document.body.classList.remove('theme-default');
            document.body.classList.add(`theme-${themeName}`);
        } else {
            console.log(`Invalid themeName: ${themeName}`);
        }
    }

    function setDefaultTheme() {
        setTheme('default');
    }

    function getLevelColors() {
        // Level colors are defined in CSS vars in base.css.
        // The current level color depends on the theme applied to the body.
        const style = getComputedStyle(document.body);
        return [
            style.getPropertyValue('--level0-color'),
            style.getPropertyValue('--level1-color'),
            style.getPropertyValue('--level2-color'),
            style.getPropertyValue('--level3-color'),
            style.getPropertyValue('--level4-color'),
        ];
    }

    global.app = global.app || {};
    global.app.theme = {
        getLevelColors,
        setTheme,
        setDefaultTheme
    };
})(window);