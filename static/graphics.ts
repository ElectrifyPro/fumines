import {Container, Graphics} from 'pixi.js';

import {COLS, ROWS, SQUARE_SIZE, app} from './config';
import {Piece, drawPiece, paddedRect} from './piece';

const startX = (app.renderer.width - COLS * SQUARE_SIZE) / 2;
const startY = (app.renderer.height - ROWS * SQUARE_SIZE) / 2;
const endY = startY + ROWS * SQUARE_SIZE;

export const grid = {
	/**
	 * Graphics container object that holds the Lumines grid and the pieces rendered on it.
	 */
	c: (() => {
		const container = new Container();
		const grid = new Graphics();
		container.addChild(grid);

		grid.setStrokeStyle({
			width: 2,
			color: 0xaaaaaa,
		})

		for (let r = 0; r <= ROWS; ++r) {
			grid.moveTo(startX, startY + r * SQUARE_SIZE);
			grid.lineTo(startX + COLS * SQUARE_SIZE, startY + r * SQUARE_SIZE);
			grid.stroke();
		}

		for (let c = 0; c <= COLS; ++c) {
			// 4-column guides
			if (c % 4 === 0) {
				grid.setStrokeStyle({
					width: 2,
					color: 0xffffff,
				});
				grid.moveTo(startX + c * SQUARE_SIZE, startY - 20);
				grid.lineTo(startX + c * SQUARE_SIZE, startY - 10);
				grid.moveTo(startX + c * SQUARE_SIZE, endY + 10);
				grid.lineTo(startX + c * SQUARE_SIZE, endY + 20);
				grid.stroke();

				grid.setStrokeStyle({
					width: 2,
					color: 0xaaaaaa,
				});
			}

			grid.moveTo(startX + c * SQUARE_SIZE, startY);
			grid.lineTo(startX + c * SQUARE_SIZE, startY + ROWS * SQUARE_SIZE);
			grid.stroke();
		}

		return container;
	})(),

	/**
	 * Render the pieces in the grid to the graphics object.
	 * @param grid 2D array representing the grid state
	 */
	render(grid: number[][]) {
		if (this.c.children.length > 1) {
			this.c.removeChildren(1); // remove all but the grid lines
		}

		const pieces = new Graphics();
		this.c.addChild(pieces);

		for (let c = 0; c < COLS; ++c) {
			for (let r = 0; r < grid[c].length; ++r) {
				const color = grid[c][r];
				if (color === undefined) continue;

				paddedRect(
					pieces,
					startX + c * SQUARE_SIZE,
					startY + (ROWS - 1 - r) * SQUARE_SIZE,
					SQUARE_SIZE,
					SQUARE_SIZE,
					2,
				);
				pieces.fill(color);

				// pieces.rect(
				// 	startX + c * SQUARE_SIZE + 2,
				// 	startY + (ROWS - 1 - r) * SQUARE_SIZE + 2,
				// 	SQUARE_SIZE - 4,
				// 	SQUARE_SIZE - 4,
				// );
				// pieces.fill(color);
			}
		}
	},
};

/**
 * The queue of upcoming pieces.
 */
export const queue = {
	/**
	 * Container to render the pieces in the queue.
	 */
	c: (() => {
		const container = new Container();
		container.x = startX - (2 * SQUARE_SIZE) - 20;
		container.y = startY;
		return container;
	})(),

	/**
	 * Pieces currently in the queue.
	 */
	pieces: [] as Piece[],

	/**
	 * Override the pieces in the queue.
	 */
	setPieces(pieces: Piece[]) {
		this.c.removeChildren();

		this.pieces = pieces.slice();
		
		for (let i = 0; i < pieces.length; ++i) {
			const g = drawPiece(pieces[i].colors, pieces[i].config);
			g.x = 0;
			g.y = i * (2 * SQUARE_SIZE + 10);
			this.c.addChild(g);
		}
	},

	/**
	 * Remove the piece at the front of the queue.
	 */
	dequeue() {
		this.c.removeChildAt(0);
		this.pieces.shift();

		for (let i = 0; i < this.c.children.length; ++i) {
			this.c.children[i].y = i * (2 * SQUARE_SIZE + 10);
		}
	},

	/**
	 * Add a new piece to the end of the queue.
	 */
	enqueue(piece: Piece) {
		this.pieces.push(piece);
		const g = drawPiece(piece.colors, piece.config);
		g.x = 0;
		g.y = (this.pieces.length - 1) * (2 * SQUARE_SIZE + 10);
		this.c.addChild(g);
	},
};

/**
 * Drop guide indicating where the piece will land.
 */
export const dropGuide = {
	/**
	 * Graphics object representing the drop guide.
	 */
	g: (() => {
		const guide = new Graphics();
		guide.rect(startX, startY, 2 * SQUARE_SIZE, ROWS * SQUARE_SIZE);
		guide.fill({
			color: 0,
			alpha: 0.5,
		});
		return guide;
	})(),

	/**
	 * Align the drop guide with the given column index.
	 */
	alignToColumn(column: number) {
		this.g.x = column * SQUARE_SIZE;
	},
}

/**
 * Timeline that moves across the grid at a fixed BPM.
 */
export const timeline = {
	/**
	 * Graphics object representing the timeline.
	 */
	g: (() => {
		const timeline = new Graphics();
		timeline.setStrokeStyle({
			width: 4,
			color: 0xffffff,
			cap: 'round',
		});
		timeline.moveTo(startX, startY);
		timeline.lineTo(startX, endY);
		timeline.stroke();
		return timeline;
	})(),

	/**
	 * Move the timeline to the correct position based on elapsed time and BPM.
	 */
	update(time: number, bpm: number) {
		this.g.x = (time / 1000) * (bpm / 60) * (2 * SQUARE_SIZE) % (COLS * SQUARE_SIZE);
	},
};

/**
 * Container for piece graphics.
 */
export const pieceContainer = new Container();
