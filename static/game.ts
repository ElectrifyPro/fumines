import {app} from './config';
import {FixedLoop} from './game_loop';
import {State} from './game_state';
import {dropGuide, grid, pieceContainer, queue, timeline} from './graphics';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

const bpm = 138;
const state = new State(bpm);

app.stage.addChild(dropGuide.g, grid.c, queue.c, pieceContainer, timeline.g);

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
