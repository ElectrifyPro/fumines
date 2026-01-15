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
	 * Grid of numbers representing which squares are part of a match and whether the amount of progress the timeline has made towards clearing them.
	 *
	 * If the corresponding element is `null`, there is no match. Otherwise, the element is a number from 0-1 representing a match's progress towards being queued for removal.
	 */
	matched: (number | null)[][] = [];

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

	/**
	 * Previous timeline position, with 0 being the start of the grid (leftmost edge) and COLS being the end of the grid (rightmost edge).
	 */
	previousTimelinePosition: number = 0;

	constructor(bpm: number) {
		this.grid = [];
		this.matched = [];
		for (let i = 0; i < COLS; ++i) {
			this.grid.push([]);
			this.matched.push([]);
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

			this.updateMatches();

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
	 * Reset and find all matches again.
	 */
	resetMatches() {
		this.matched = [];
		for (let i = 0; i < COLS; ++i) {
			this.matched.push([]);
		}
		this.updateMatches();
	}

	/**
	 * Find all 2x2 squares to be cleared from the grid.
	 */
	updateMatches() {
		for (let c = 0; c < this.matched.length; ++c) {
			const extraElements = this.grid[c].length - this.matched[c].length;
			if (extraElements > 0) {
				for (let i = 0; i < extraElements; ++i) {
					this.matched[c].push(null);
				}
			}
		}

		for (let c = 0; c < COLS - 1; ++c) {
			const colHeight = this.grid[c].length;
			const nextColHeight = this.grid[c + 1].length;
			const maxRow = Math.min(colHeight, nextColHeight) - 1;

			for (let r = 0; r < maxRow; ++r) {
				const color = this.grid[c][r];
				if (color === this.grid[c][r + 1] &&
					color === this.grid[c + 1][r] &&
					color === this.grid[c + 1][r + 1]) {
					if (this.matched[c][r] === null) this.matched[c][r] = 0;
					if (this.matched[c][r + 1] === null) this.matched[c][r + 1] = 0;
					if (this.matched[c + 1][r] === null) this.matched[c + 1][r] = 0;
					if (this.matched[c + 1][r + 1] === null) this.matched[c + 1][r + 1] = 0;
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

		// add matched progress for columns the timeline is passing
		const currentTimelinePosition = (this.time / 1000) * (this.bpm / 60) * 2 % COLS;
		const startCol = Math.floor(this.previousTimelinePosition);
		const endCol = Math.floor(currentTimelinePosition);

		for (let col = startCol; col <= endCol; ++col) {
			let progressThroughCol = currentTimelinePosition - Math.max(col, this.previousTimelinePosition);
			for (let row = 0; row < this.matched[col]?.length; ++row) {
				if (typeof this.matched[col][row] === 'number') {
					this.matched[col][row] += progressThroughCol;
				}
			}
		}

		// find clusters of columns that contain matched squares
		const groups: {start: number, end: number}[] = [];
		for (let c = 0; c < COLS; ++c) {
			if (this.matched[c]?.some(v => typeof v === 'number')) {
				if (c === groups[groups.length - 1]?.end + 1) {
					++groups[groups.length - 1].end;
				} else {
					groups.push({start: c, end: c});
				}
			}
		}

		// only if the timeline reaches the end of a cluster will it be cleared
		let hasRemoved = false;
		for (const group of groups) {
			if (currentTimelinePosition >= group.end + 1) {
				for (let col = group.start; col <= group.end; ++col) {
					// determine part of column with a match and remove it
					if (this.matched[col].some(v => typeof v === 'number' && v >= 1)) {
						hasRemoved = true;

						const rowsToRemove = this.matched[col]
							.map((progress, row) => {
								return {progress, row};
							})
							.filter(data => typeof data.progress === 'number' && data.progress >= 1)
							.reverse();

						console.log('col', col, 'rows to remove', rowsToRemove);
						for (const data of rowsToRemove) {
							this.grid[col].splice(data.row, 1);
							this.matched[col].splice(data.row, 1);
						}
					}
				}
			}
		}

		if (hasRemoved) {
			this.resetMatches();

			grid.render(this.grid, this.matched);
			console.log('bye')
		}
		// TODO:
			grid.render(this.grid, this.matched);
		// console.log(this.matched);
		// console.log(JSON.stringify(groups));
		
		this.previousTimelinePosition = currentTimelinePosition;
	}
}
