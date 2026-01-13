import {COLS, ROWS} from './config';
import Piece from './piece';

/**
 * State of a cell in the Lumines grid.
 */
export enum CellState {
	Empty,
	Color1,
	Color2,
}

/**
 * Lumines game state.
 */
export class State {
	/**
	 * The current grid state, which is always ROWS high (`grid.length === ROWS`) and COLS wide (`grid[r].length === COLS`).
	 *
	 * This only includes placed pieces, not the falling piece.
	 */
	grid: CellState[][];

	/**
	 * The piece currently falling.
	 */
	piece: Piece;

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

	constructor(bpm: number) {
		this.grid = Array.from({length: ROWS}, () =>
			Array.from({length: COLS}, () => CellState.Empty),
		);

		this.queue = [];
		for (let i = 0; i < 16; ++i) {
			const piece = new Piece(7, -2, {color1: 0x35a99a, color2: 0xff5aae}, Math.floor(Math.random() * 16));
			this.queue.push(piece);
		}
		this.piece = this.queue.shift()!;

		this.bpm = bpm;
	}
}
