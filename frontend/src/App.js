import React, { useState, useRef, useEffect } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
} from "react-router-dom";

import Main from "./pages/Main.js";
import Stories from "./pages/Stories.js"

function App() {
	return (
		<Router>
			<Routes>
				<Route exact path="/" element={<Main/>} />
				<Route path="/main" element={<Main />} />
        <Route path = "/stories" element={<Stories/>}/>
			</Routes>
		</Router>
	);
}

export default App;