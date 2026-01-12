import * as React from 'react';
import {useState} from 'react';
import {createRoot} from 'react-dom/client';

function App() {
	return <h1>hi</h1>;
}

const root = createRoot(document.getElementById('ui')!);
root.render(<App/>);
