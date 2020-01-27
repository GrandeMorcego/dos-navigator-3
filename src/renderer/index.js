import React from 'react';
import {render} from 'react-dom';
import { AppContext } from '../common/Context';
import Main from './Main'; 


// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
render(
    <AppContext.Provider value={{ appName: "Dos Navigator III" }}>
        <Main />  
    </AppContext.Provider>
    , document.getElementById('app') );

