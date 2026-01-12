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

/**
 * Handles logic for a falling piece.
 */
class Piece {
	/**
	 * Graphics object representing the piece.
	 */
	public g: Graphics;

	/**
	 * Colors used for the piece's squares. color1 is used for 0 bits in config,
	 * color2 for 1 bits.
	 */
	colors: {color1: number; color2: number};

	/**
	 * 4-bit number representing which squares use color1 (0) or color2 (1).
	 */
	config: number;

	/**
	 * Column index of the piece's left side, regardless of its rotation.
	 */
	column: number;

	/**
	 * Row index of the piece's top side, regardless of its rotation.
	 */
	row: number;

	/**
	 * Rotation state of the piece. Can go beyond 3 (or below 0) for multiple full rotations.
	 */
	rotation: number = 0;

	/**
	 * Create a new piece at the given column and row. When created, add the
	 * piece's graphics object to the stage for it to be rendered.
	 */
	constructor(
		column: number,
		row: number,
		colors: {color1: number; color2: number},
		config: number,
	) {
		/**
		 * Draw a square with padding around it.
		 * @param g object to draw on
		 * @param x
		 * @param y
		 * @param w
		 * @param h
		 * @param padding number of pixels to remove from each side of the square
		 */
		function paddedRect(
			g: Graphics,
			x: number,
			y: number,
			w: number,
			h: number,
			padding: number,
		) {
			g.rect(x + padding, y + padding, w - 2 * padding, h - 2 * padding);
		}

		/**
		 * Draw a 2x2 piece made of 4 squares.
		 * @param colors
		 * @param config 4-bit number representing which squares use color1 (0) or color2 (1).
		 * @returns graphics object representing the piece
		 */
		function drawPiece(
			colors: {color1: number; color2: number},
			config: number,
		) {
			const piece = new Graphics();
			const {color1, color2} = colors;

			for (let i = 0; i < 4; ++i) {
				const x = (i % 2) * squareSize;
				const y = Math.floor(i / 2) * squareSize;
				paddedRect(piece, x, y, squareSize, squareSize, 2);
				if ((config & (1 << i)) === 0) {
					piece.fill(color1);
				} else {
					piece.fill(color2);
				}
			}
			
			return piece;
		}

		this.g = drawPiece(colors, config);
		this.g.x = startX + (column + 1) * squareSize;
		this.g.y = startY + (row + 1) * squareSize;
		this.g.pivot.set(squareSize, squareSize); // center of piece

		this.colors = colors;
		this.config = config;
		this.column = column;
		this.row = row;
		this.rotation = 0;
	}

	/**
	 * Move the piece to the left or right by one column.
	 * @param direction 1 for right, -1 for left
	 */
	move(direction: 1 | -1) {
		this.column += direction;
	}

	/**
	 * Rotate the piece around its center.
	 * @param direction 1 for clockwise, -1 for counterclockwise
	 */
	rotate(direction: 1 | -1) {
		this.rotation += direction;
	}

	/**
	 * Update the graphics object's transform to match the piece's transform.
	 */
	animate() {
		const targetX = startX + (this.column + 1) * squareSize;
		this.g.x = this.g.x + (targetX - this.g.x) * 0.4;

		const targetRotation = this.rotation * (Math.PI / 2);
		this.g.rotation = this.g.rotation + (targetRotation - this.g.rotation) * 0.4;
	}
}

const piece = new Piece(7, -2, {color1: 0x35a99a, color2: 0xff5aae}, Math.floor(Math.random() * 16));
app.stage.addChild(piece.g);

setInterval(() => {
	piece.rotate(Math.random() < 0.5 ? -1 : 1);
	piece.move(Math.random() < 0.5 ? -1 : 1);
}, 1000);

const bpm = 138;

let time = 0;
const timeline = new Graphics();
timeline.setStrokeStyle({
	width: 4,
	color: 0xffffff,
	cap: 'round',
});
timeline.moveTo(startX, startY);
timeline.lineTo(startX, endY);
timeline.stroke();
app.stage.addChild(timeline);

app.ticker.add(ticker => {
	timeline.x = (time / 1000) * (bpm / 60) * (2 * squareSize) % (COLS * squareSize);

	// move timeline (2 columns = 1 beat)
	time += ticker.deltaMS;

	piece.animate();
});
