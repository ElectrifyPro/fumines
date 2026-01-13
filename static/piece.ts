import {Graphics} from 'pixi.js';

import {FixedLoop} from './game_loop';
import {keys} from './keys';
import {COLS, ROWS, SQUARE_SIZE, app} from './config';

const startX = (app.renderer.width - COLS * SQUARE_SIZE) / 2;
const startY = (app.renderer.height - ROWS * SQUARE_SIZE) / 2;

/**
 * Handles logic for a falling piece.
 */
export default class Piece {
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
	 *
	 * The row index can have a fractional component to represent falling between rows.
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
				const x = (i % 2) * SQUARE_SIZE;
				const y = Math.floor(i / 2) * SQUARE_SIZE;
				paddedRect(piece, x, y, SQUARE_SIZE, SQUARE_SIZE, 2);
				if ((config & (1 << i)) === 0) {
					piece.fill(color1);
				} else {
					piece.fill(color2);
				}
			}
			
			return piece;
		}

		this.g = drawPiece(colors, config);
		this.g.x = startX + (column + 1) * SQUARE_SIZE;
		this.g.y = startY + (row + 1) * SQUARE_SIZE;
		this.g.pivot.set(SQUARE_SIZE, SQUARE_SIZE); // center of piece

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
		const targetX = startX + (this.column + 1) * SQUARE_SIZE;
		this.g.x = this.g.x + (targetX - this.g.x) * 0.4;

		const targetRotation = this.rotation * (Math.PI / 2);
		this.g.rotation = this.g.rotation + (targetRotation - this.g.rotation) * 0.4;

		// no interpolation of vertical movement
		this.g.y = startY + (this.row + 1) * SQUARE_SIZE;
	}
}
