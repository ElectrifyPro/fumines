import {Application, Graphics} from 'pixi.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const app = new Application();
await app.init({
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0x333333,
	antialias: true,
	canvas,
	resizeTo: canvas,
});

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

app.ticker.add(_ => {

});
