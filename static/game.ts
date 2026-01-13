import {app} from './config';
import {FixedLoop} from './game_loop';
import {dropGuide, grid, timeline} from './graphics';
import {State} from './game_state';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

const bpm = 138;
const state = new State(bpm);
dropGuide.alignToColumn(state.piece.column);

setInterval(() => {
	state.piece.rotate(Math.random() < 0.5 ? -1 : 1);
	state.piece.move(Math.random() < 0.5 ? -1 : 1);
	dropGuide.alignToColumn(state.piece.column);
}, 1000);

app.stage.addChild(dropGuide.g, grid.g, state.piece.g, timeline.g);

app.ticker.add(_ => {
	state.piece.animate();
	timeline.update(state.time, state.bpm);
});

const loop = new FixedLoop(() => {
	// piece.row += 0.01;
	// move timeline (2 columns = 1 beat)
	state.time += 1000 / 64;
}, 1000 / 64);
loop.start();
