import {Graphics} from 'pixi.js';

import {COLS, ROWS, SQUARE_SIZE, app} from './config';

const startX = (app.renderer.width - COLS * SQUARE_SIZE) / 2;
const startY = (app.renderer.height - ROWS * SQUARE_SIZE) / 2;

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
		if ((config & (1 << (3 - i))) === 0) {
			piece.fill(color1);
		} else {
			piece.fill(color2);
		}
	}
	
	return piece;
}

/**
 * Draw two 1x2 columns representing a dropped piece.
 * @param colors
 * @param config 2-bit numbers representing which squares use color1 (0) or color2 (1).
 * @returns graphics object representing the dropped piece
 */
function drawDroppedPiece(
	colors: {color1: number; color2: number},
	config: {left: number; right: number},
) {
	const {color1, color2} = colors;
	
	// left column
	const left = new Graphics();
	for (let i = 0; i < 2; ++i) {
		const y = i * SQUARE_SIZE;
		paddedRect(left, 0, y, SQUARE_SIZE, SQUARE_SIZE, 2);
		if ((config.left & (1 << (1 - i))) === 0) {
			left.fill(color1);
		} else {
			left.fill(color2);
		}
	}

	// right column
	const right = new Graphics();
	for (let i = 0; i < 2; ++i) {
		const y = i * SQUARE_SIZE;
		paddedRect(right, 0, y, SQUARE_SIZE, SQUARE_SIZE, 2);
		if ((config.right & (1 << (1 - i))) === 0) {
			right.fill(color1);
		} else {
			right.fill(color2);
		}
	}

	return {left, right};
}

/**
 * 4-bit bitboard rotations.
 */
const rotate = {
	/**
	 * Rotate a 4-bit bitboard representing a 2x2 piece clockwise.
	 */
	right(config: number): number {
		const topLeft = (config & 0b1000) >> 3;
		const topRight = (config & 0b0100) >> 2;
		const bottomLeft = (config & 0b0010) >> 1;
		const bottomRight = config & 0b0001;
		return (bottomLeft << 3) | (topLeft << 2)
			| (bottomRight << 1) | topRight;
	},

	/**
	 * Rotate a 4-bit bitboard representing a 2x2 piece counterclockwise.
	 */
	left(config: number): number {
		const topLeft = (config & 0b1000) >> 3;
		const topRight = (config & 0b0100) >> 2;
		const bottomLeft = (config & 0b0010) >> 1;
		const bottomRight = config & 0b0001;
		return (topRight << 3) | (bottomRight << 2)
			| (topLeft << 1) | bottomLeft;
	},

	/**
	 * Rotate a 4-bit bitboard representing a 2x2 piece 180 degrees.
	 */
	twice(config: number): number {
		const topLeft = (config & 0b1000) >> 3;
		const topRight = (config & 0b0100) >> 2;
		const bottomLeft = (config & 0b0010) >> 1;
		const bottomRight = config & 0b0001;
		return (bottomRight << 3) | (bottomLeft << 2)
			| (topRight << 1) | topLeft;
	},

	/**
	 * Rotate a 4-bit bitboard representing a 2x2 piece given its rotation state.
	 */
	by(config: number, rotation: number): number {
		let result = config;
		const turns = (4 + (rotation % 4)) % 4; // positive mod 4
		switch (turns) {
			case 0: return result;
			case 1: return this.right(result);
			case 2: return this.twice(result);
			case 3: return this.left(result);
			default: throw new Error('unreachable');
		}
	}
};

/**
 * Handles logic for a piece.
 */
export class Piece {
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

/**
 * Handles logic for a piece that has been dropped and is currently falling.
 */
export class DroppedPiece {
	/**
	 * Graphics objects representing the piece.
	 */
	public g: {
		/**
		 * Graphics object representing the left column of the piece.
		 */
		left: Graphics;

		/**
		 * Graphics object representing the right column of the piece.
		 */
		right: Graphics;
	};

	/**
	 * Colors used for the piece's squares.
	 */
	colors: {
		/**
		 * Color used for 0-bit squares.
		 */
		color1: number;

		/**
		 * Color used for 1-bit squares.
		 */
		color2: number;
	};

	/**
	 * 2-bit numbers representing which squares use color1 (0) or color2 (1).
	 */
	config: {
		/**
		 * 2-bit number for the left column.
		 */
		left: number;

		/**
		 * 2-bit number for the right column.
		 */
		right: number;
	};

	/**
	 * Column index of the piece's left side.
	 */
	column: number;

	/**
	 * Row indices of the piece's top side.
	 *
	 * Row indices can have a fractional component to represent falling between rows.
	 */
	row: {
		/**
		 * Row index of the left column.
		 */
		left: number;

		/**
		 * Row index of the right column.
		 */
		right: number;
	};

	/**
	 * Create a new falling piece from a normal piece. When created, add the
	 * piece's graphics object to the stage for it to be rendered.
	 */
	constructor(piece: Piece) {
		const newConfig = rotate.by(piece.config, piece.rotation);

		this.colors = piece.colors;
		this.config = {
			left: (newConfig & 0b1000) >> 2 | (newConfig & 0b0010) >> 1,
			right: (newConfig & 0b0100) >> 1 | (newConfig & 0b0001),
		};
		this.column = piece.column;
		this.row = {
			left: piece.row,
			right: piece.row,
		};

		this.g = drawDroppedPiece(this.colors, this.config);
		this.g.left.y = startY + this.row.left * SQUARE_SIZE;
		this.g.right.y = startY + this.row.right * SQUARE_SIZE;

		// if the piece was in the middle of interpolation when dropped, use
		// those x-positions
		this.g.left.x = piece.g.x - SQUARE_SIZE;
		this.g.right.x = piece.g.x + 0;
	}

	columnColors() {
		const colorByIdx = [this.colors.color1, this.colors.color2];
		const topLeft = (this.config.left & 0b10) >> 1;
		const bottomLeft = this.config.left & 0b01;
		const topRight = (this.config.right & 0b10) >> 1;
		const bottomRight = this.config.right & 0b01;
		return {
			left: [colorByIdx[bottomLeft], colorByIdx[topLeft]],
			right: [colorByIdx[bottomRight], colorByIdx[topRight]],
		};
	}

	/**
	 * Update the graphics object's transform to match the piece's transform.
	 */
	animate() {
		const leftTargetX = startX + this.column * SQUARE_SIZE;
		this.g.left.x = this.g.left.x + (leftTargetX - this.g.left.x) * 0.4;

		const rightTargetX = startX + (this.column + 1) * SQUARE_SIZE;
		this.g.right.x = this.g.right.x + (rightTargetX - this.g.right.x) * 0.4;

		this.g.left.y = startY + this.row.left * SQUARE_SIZE;
		this.g.right.y = startY + this.row.right * SQUARE_SIZE;
	}
}
