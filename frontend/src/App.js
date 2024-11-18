import React, { useState, useRef, useEffect } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
} from "react-router-dom";

import Main from "./pages/Main.js";
import Stories from "./pages/Stories.js"
import FamilyView from "./pages/FamilyView.js"
import FamilyFeedback from "./pages/FamilyFeedback.js"
import Login from "./pages/Login.js"

function App() {
	return (
		<Router>
			<Routes>
				<Route exact path="/" element={<Login/>} />
				<Route exact path="/login" element={<Login/>} />
				<Route path="/main" element={<Main />} />
                <Route path = "/stories" element={<Stories/>}/>
				<Route path = "/familyview" element={<FamilyView/>}/>
				<Route path = "/familyfeedback" element = {<FamilyFeedback/>}/>
			</Routes>
		</Router>
	);
}

export default App;