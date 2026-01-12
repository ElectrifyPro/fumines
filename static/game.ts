import {Application, Graphics} from 'pixi.js';

const ROWS = 10;
const COLS = 16;

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

const grid = new Graphics();
grid.setStrokeStyle({
	width: 2,
	color: 0xaaaaaa,
})

const squareSize = 50;
const startX = (app.renderer.width - COLS * squareSize) / 2;
const startY = (app.renderer.height - ROWS * squareSize) / 2;
const endY = startY + ROWS * squareSize;

for (let r = 0; r <= ROWS; ++r) {
	grid.moveTo(startX, startY + r * squareSize);
	grid.lineTo(startX + COLS * squareSize, startY + r * squareSize);
	grid.stroke();
}

for (let c = 0; c <= COLS; ++c) {
	// 4-column guides
	if (c % 4 === 0) {
		grid.setStrokeStyle({
			width: 2,
			color: 0xffffff,
		});
		grid.moveTo(startX + c * squareSize, startY - 20);
		grid.lineTo(startX + c * squareSize, startY - 10);
		grid.moveTo(startX + c * squareSize, endY + 10);
		grid.lineTo(startX + c * squareSize, endY + 20);
		grid.stroke();

		grid.setStrokeStyle({
			width: 2,
			color: 0xaaaaaa,
		});
	}

	grid.moveTo(startX + c * squareSize, startY);
	grid.lineTo(startX + c * squareSize, startY + ROWS * squareSize);
	grid.stroke();
}

app.stage.addChild(grid);

app.ticker.add(_ => {

});
