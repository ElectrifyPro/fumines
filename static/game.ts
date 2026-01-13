import {Container} from 'pixi.js';

import {app} from './config';
import {FixedLoop} from './game_loop';
import {dropGuide, grid, timeline} from './graphics';
import {State} from './game_state';
import {DroppedPiece, Piece} from './piece';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

const bpm = 138;
const state = new State(bpm);
state.grid[7] = [0, 0];
dropGuide.alignToColumn(state.piece.column);

// container for the piece graphics
const container = new Container();
if (state.piece instanceof Piece) {
	// TODO: ALWAYS TRUE
	container.addChild(state.piece.g);
}

let i = 0;
setInterval(() => {
	if (i === 0) {
		state.rotate(Math.random() < 0.5 ? -1 : 1);
		state.move(Math.random() < 0.5 ? -1 : 1);
		dropGuide.alignToColumn(state.piece.column);
	} else if (i === 1) {
		state.startDrop();
		if (state.piece instanceof DroppedPiece) {
			// TODO: ALWAYS TRUE
			container.removeChildren();
			container.addChild(state.piece.g.left, state.piece.g.right);
		}
	}
	i += 1;
}, 300);

app.stage.addChild(dropGuide.g, grid.g, container, timeline.g);

app.ticker.add(_ => {
	state.piece.animate();
	timeline.update(state.time, state.bpm);
});

const loop = new FixedLoop(() => {
	// piece.row += 0.01;
	// move timeline (2 columns = 1 beat)
	state.tick();
	state.time += 1000 / 64;
}, 1000 / 64);
loop.start();
