import {Container, Graphics} from 'pixi.js';

import {COLS, ROWS, SQUARE_SIZE, app} from './config';

const startX = (app.renderer.width - COLS * SQUARE_SIZE) / 2;
const startY = (app.renderer.height - ROWS * SQUARE_SIZE) / 2;
const endY = startY + ROWS * SQUARE_SIZE;

export const grid = {
	/**
	 * Graphics object that draws the Lumines grid.
	 */
	g: (() => {
		const grid = new Graphics();

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

		return grid;
	})(),
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
