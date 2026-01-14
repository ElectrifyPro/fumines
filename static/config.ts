import {Application} from 'pixi.js';

/**
 * Size of each square in the grid, in pixels.
 */
export let SQUARE_SIZE = 50;

/**
 * Standard number of rows in the grid.
 */
export const ROWS = 10;

/**
 * Standard number of columns in the grid.
 */
export const COLS = 16;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

export const app = new Application();
await app.init({
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0x333333,
	antialias: true,
	canvas,
	resizeTo: canvas,
});

/**
 * DAS: Number of game ticks to wait when a key is held down before triggering auto-repeat movement.
 */
export const DAS_TICKS = 10;

/**
 * ARR: Number of game ticks between each auto-repeat movement when a key is held down.
 */
export const ARR_TICKS = 1;
