import {COLS, ROWS} from './config';
import {dropGuide, grid, pieceContainer, queue} from './graphics';
import {keys} from './keys';
import {HandlingState, applyDropCompletion, applyHandling, idle} from './movement';
import {DroppedPiece, Piece} from './piece';

/**
 * Lumines game state.
 */
export class State {
	/**
	 * The current grid state in column-major order (an array of COLS columns). The values in the inner arrays are raw color values for the square.
	 *
	 * Each column has a variable length representing the pieces stacked in that column.
	 *
	 * This only includes placed pieces, not the falling piece.
	 */
	grid: number[][];

	/**
	 * Grid of booleans representing which squares are part of a match and should be cleared when the timeline passes over them.
	 *
	 * The shape of this array matches the `grid` array.
	 */
	matched: boolean[][] = [];

	/**
	 * The current piece.
	 */
	piece: Piece | DroppedPiece;

	/**
	 * The queue of upcoming pieces. The first piece in the queue will be the next piece to fall.
	 */
	queue: Piece[] = [];

	/**
	 * Time elapsed since the start of the game, in milliseconds.
	 */
	time: number = 0;

	/**
	 * BPM of the timeline.
	 */
	bpm: number;

	/**
	 * State machine that handles DAS and ARR.
	 */
	movement: HandlingState;

	/**
	 * Keys pressed in the previous tick.
	 */
	previousKeys: Set<string> = new Set();

	constructor(bpm: number) {
		this.grid = [];
		for (let i = 0; i < COLS; ++i) {
			this.grid.push([]);
		}

		this.queue = [];
		for (let i = 0; i < 16; ++i) {
			const piece = new Piece(7, -2, {color1: 0x35a99a, color2: 0xff5aae}, Math.floor(Math.random() * 16));
			this.queue.push(piece);
		}
		this.piece = this.queue.shift()!;

		pieceContainer.addChild(this.piece.g);
		dropGuide.alignToColumn(this.piece.column);
		queue.setPieces(this.queue);

		this.bpm = bpm;
		this.movement = idle();
	}

	/**
	 * Returns the height of the given column in the grid.
	 * @param column column index
	 * @returns height of the column
	 */
	columnHeight(column: number): number {
		return this.grid[column].length;
	}

	/**
	 * Move the current piece to the left or right by one column. Movement is instantaneous.
	 *
	 * This is a no-op if there is no current piece.
	 *
	 * @param direction 1 for right, -1 for left
	 */
	move(direction: 1 | -1) {
		if (this.piece instanceof Piece) {
			if ((direction === -1 && this.piece.column <= 0) ||
				(direction === 1 && this.piece.column >= COLS - 2)) {
				return;
			}

			this.piece.move(direction);
			dropGuide.alignToColumn(this.piece.column);
		}
	}

	/**
	 * Rotate the current piece around its center. Rotation is instantaneous.
	 *
	 * This is a no-op if there is no current piece.
	 *
	 * @param direction 1 for clockwise, -1 for counterclockwise
	 */
	rotate(direction: 1 | -1) {
		if (this.piece instanceof Piece) {
			this.piece.rotate(direction);
		}
	}

	/**
	 * Drop the current piece in the grid. Dropping is NOT instantaneous; the piece will fall over time.
	 */
	startDrop() {
		if (this.piece instanceof Piece) {
			this.piece = new DroppedPiece(this.piece);
			pieceContainer.removeChildren();
			pieceContainer.addChild(this.piece.g.left, this.piece.g.right);
		}
	}

	/**
	 * Finish dropping the current piece immediately.
	 */
	finishDrop() {
		if (this.piece instanceof DroppedPiece) {
			// add to grid
			const colors = this.piece.columnColors();
			this.grid[this.piece.column].push(...colors.left);
			this.grid[this.piece.column + 1].push(...colors.right);

			// cut off full columns (Arise only)
			for (let c = 0; c < COLS; ++c) {
				this.grid[c].splice(ROWS, this.grid[c].length - ROWS);
			}

			this.setMatches();

			grid.render(this.grid, this.matched);

			// spawn new piece
			this.piece = this.queue.shift()!;
			queue.dequeue();
			const newPiece = new Piece(7, -2, {color1: 0x35a99a, color2: 0xff5aae}, Math.floor(Math.random() * 16));
			this.queue.push(newPiece);
			queue.enqueue(newPiece);

			pieceContainer.removeChildren();
			pieceContainer.addChild(this.piece.g);
			dropGuide.alignToColumn(this.piece.column);

			this.movement = applyDropCompletion(this.movement);
		}
	}

	/**
	 * Find all 2x2 squares to be cleared from the grid.
	 */
	setMatches() {
		this.matched = this.grid.map(col => new Array(col.length).fill(false));

		for (let c = 0; c < COLS - 1; ++c) {
			const colHeight = this.grid[c].length;
			const nextColHeight = this.grid[c + 1].length;
			const maxRow = Math.min(colHeight, nextColHeight) - 1;

			for (let r = 0; r < maxRow; ++r) {
				const color = this.grid[c][r];
				if (color === this.grid[c][r + 1] &&
					color === this.grid[c + 1][r] &&
					color === this.grid[c + 1][r + 1]) {
					this.matched[c][r] = true;
					this.matched[c][r + 1] = true;
					this.matched[c + 1][r] = true;
					this.matched[c + 1][r + 1] = true;
				}
			}
		}
	}

	/**
	 * Update the game state.
	 */
	tick() {
		// keys held this frame
		const keysHeld = [...keys];

		// keys just pressed this frame
		const justPressed = [...keys.difference(this.previousKeys)];

		// handle movement with DAS and ARR
		const result = applyHandling(this.movement, keysHeld, justPressed);
		this.movement = result.state;
		for (const action of result.actions) {
			if ('rotate' in action) {
				this.rotate(action.rotate);
			}
			if ('move' in action) {
				this.move(action.move);
			}
			if ('startDrop' in action) {
				this.startDrop();
			}
		}

		this.previousKeys = new Set(keys);

		if (this.piece instanceof Piece) {
			// TODO: gravity
		} else if (this.piece instanceof DroppedPiece) {
			// falls at constant rate
			this.piece.row.left += 0.75;
			this.piece.row.right += 0.75;

			let leftLanded = false;
			let rightLanded = false;

			const leftColumnHeight = this.columnHeight(this.piece.column);
			const rightColumnHeight = this.columnHeight(this.piece.column + 1);

			if (this.piece.row.left >= ROWS - leftColumnHeight - 2) {
				this.piece.row.left = ROWS - leftColumnHeight - 2;
				leftLanded = true;
			}

			if (this.piece.row.right >= ROWS - rightColumnHeight - 2) {
				this.piece.row.right = ROWS - rightColumnHeight - 2;
				rightLanded = true;
			}

			if (leftLanded && rightLanded) {
				this.finishDrop();
			}
		}
	}
}
