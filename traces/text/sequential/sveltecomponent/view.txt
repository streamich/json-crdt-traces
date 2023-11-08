<script lang="ts">
import type { HtmlTag } from 'svelte/internal';
import type { GameConfig } from './shared';

import * as topicIcons from './topicicons.json'
import topicSpecial from './topicspecial'

export let room: string

export let connection: 'waiting' | 'connecting' | 'connected'

export let game_config: GameConfig
// export let state // loading, waiting, playing, paused.
// export let start_time
// export let topic
// export let meditate
// export let players
// export let rounds
// export let seconds_per_bead
// export let paused_progress

export let _active_sessions: number
export let _magister: true | null
export let _clock_offset: number

// let game_completed = false // Derived from other properties

let round_audio: HTMLAudioElement
let complete_audio: HTMLAudioElement
let topic_img: HTMLElement
let topic_text: HTMLElement

round_audio = new Audio()
round_audio.src = "/lo-metal-tone.mp3"
complete_audio = new Audio()
complete_audio.src = "/hi-metal-tone.mp3"
// round_audio.preload = 'auto'
	// <audio bind:this={complete_audio} src="/hi-metal-tone.mp3" preload="auto"><track kind="captions"></audio>


let state: GameConfig['state']
$: state = game_config.state

$: console.log('Game configuration changed', game_config)

	// export let state

const ARCHETOPICS = [
  'Truth', 'Human', 'Energy', 'Beauty', 'Beginning', 'End', 'Birth', 'Death',
  'Ego', 'Attention', 'Art', 'Empathy', 'Eutopia', 'Future', 'Game', 'Gift',
  'History', 'Cosmos', 'Time', 'Life', 'Addiction', 'Paradox', 'Shadow', 'Society'
]



let audio_works = true

function test_audio() {
	// This ugly monstrosity brought to you by iOS Safari. 
	// This seems to be the only way to bless the audio
	// objects to be able to play during the game. :/
	
	// let a = new Audio()
	// a.volume = 0.1
	const round_src = round_audio.src
	const complete_src = complete_audio.src
	round_audio.src = complete_audio.src = '/silence.mp3'
	// a.play().then(
	complete_audio.play()
	round_audio.play().then(
		() => {
			audio_works = true
			round_audio.src = round_src
			complete_audio.src = complete_src
			console.log('Audio works')
		},
		() => {
			audio_works = false
			round_audio.src = round_src
			complete_audio.src = complete_src
			console.log('Audio does not work')
		}
	)
}
function fix_audio() {
	console.log('fixxx')
	test_audio()
}
setTimeout(test_audio, 0)
document.onclick = () => {
	if (!audio_works) test_audio()
}

const fixed_rand = Math.random()
const randInt = (n: number) => Math.floor(fixed_rand * n)
function randItem<T>(arr: T[]) {return arr[randInt(arr.length)] }

$: {
	if (topic_img && topic_text) {
		const topic = game_config.topic.toLocaleLowerCase()
		const svgContent = topicIcons[topic as keyof typeof topicIcons]
		const textContent = topicSpecial[topic as keyof typeof topicSpecial]

		if (svgContent) {
			topic_img.innerHTML = svgContent
			topic_text.innerText = ''
		} else if (textContent) {
			topic_img.innerHTML = ''
			topic_text.innerText = randItem(textContent)
		} else {
			topic_img.innerHTML = ''
			topic_text.innerText = game_config.topic
		}
	}
}

// Could make configurable. Eh.
const MEDITATION_SECONDS = 60

interface GameStage {
	label: string,
	type: 'waiting' | 'bead' | 'breath' | 'meditate' | 'contemplation' | 'complete',
	duration: number,
	no_sound?: true,
	r?: number, p?: number,
	id?: string
}

let game_stages: GameStage[] = []
$: {
	game_stages = [{
		label: `${game_config.meditate ? 'Meditation' : 'Game'} starting...`,
		type: 'waiting',
		duration: 3,
		no_sound: true
	}]
	if (game_config.meditate) game_stages.push({
		label: 'Meditate',
		type: 'meditate',
		duration: MEDITATION_SECONDS,
	})
	for (let r = 0; r < game_config.rounds; r++) {
		for (let p = 0; p < game_config.players; p++) {
			if (game_config.seconds_between_bead && (r > 0 || p > 0)) game_stages.push({
				label: 'Breathe',
				duration: game_config.seconds_between_bead,
				type: 'breath',
				id: `b ${r} ${p}`
			})

			game_stages.push({
				label: '',
				// label: game_config.players > 1 ? `Round ${r+1} player ${p+1}` : `Round ${r+1}`,
				duration: game_config.seconds_per_bead,
				type: 'bead', r, p,
				id: `s ${r} ${p}`
			})
		}
	}

	if (game_config.contemplation) game_stages.push({
		label: "Contemplate the game's passing",
		type: 'contemplation',
		duration: MEDITATION_SECONDS,
	})


	console.log('game stages', game_stages, game_config.seconds_between_bead)
}

let total_game_length: number
$: total_game_length = game_stages.reduce((x, s) => x + s.duration, 0)

// Used for the overall game progress indicator.
let inner_game_stages: GameStage[]
$: inner_game_stages = game_stages.filter(s => s.type === 'breath' || s.type === 'bead')
let inner_game_length: number
$: inner_game_length = inner_game_stages.reduce((x, s) => x + s.duration, 0)

// TODO: The protocol for these update methods doesn't use game_state properly.
const update_state = async (patch: Record<string, string | number | boolean | null>) => {
	await fetch(`${room}/configure`, {
		method: 'POST',
		mode: 'same-origin',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(patch)
	})
}

const upd = (k: string, v: string | number | boolean | null) => () => update_state({[k]: v})

const config = (k: string): svelte.JSX.FormEventHandler<HTMLInputElement> => (e) => {
	// console.log('k', k, e.data, e.value, e.target.value, e.target.type)
	const target = e.target as HTMLInputElement
	const raw_value = target.value
	const value = target.type === 'number' ? ~~raw_value
		: target.type === 'checkbox' ? target.checked
		: raw_value
	update_state({[k]: value})
}

const roundish = (x: number) => Math.round(x * 10) / 10


const waiting_stage: GameStage = { label: 'Waiting to start', type: 'waiting', duration: Infinity }
const complete_stage: GameStage = { label: 'Game complete', type: 'complete', duration: Infinity }
const get_current_stage = (offset_ms: number): {stage: GameStage, stage_idx: number, offset_sec: number} => {
	if (state === 'waiting') return {stage: waiting_stage, stage_idx: -1, offset_sec: 0}

	let offset_sec = Math.round(offset_ms / 1000)
	for (let s = 0; s < game_stages.length; s++) {
		let stage = game_stages[s]
		if (stage.duration > offset_sec) {
			return {stage, stage_idx: s, offset_sec}
		}
		offset_sec -= stage.duration
	}
	return {
		stage: complete_stage, stage_idx: game_stages.length, offset_sec
	}
}

// Urgh kinda ugly storing state for both the index and stage itself. Better to
// have one derive the other.
let current_stage: GameStage | null = null, current_stage_idx: number = -1, offset_sec: number
$: console.log('current stage', current_stage)
// $: console.log('idx', current_stage_idx)

const tick = (play_audio: boolean) => {
	console.log('tick')
	// console.log('state', state, 'completed', state && state.complete)

	const time = state === 'playing' ? Date.now() + _clock_offset - game_config.start_time
		: state === 'paused' ? game_config.paused_progress!
		: 0
	const {stage: new_stage, stage_idx: new_stage_idx, offset_sec: new_offs} = get_current_stage(time)
	// state_label = state.label

	offset_sec = new_offs
	if (new_stage !== current_stage) {
		console.log('state changed', new_stage.label, new_stage.type === 'complete')

		// This happens sometimes with other kinds of configuration changes -
		// eg if a user enters or leaves the room, or the room is reconfigured.
		// Only make a sound if the *stage* changes.
		let changed = current_stage == null || (new_stage.id ?? new_stage.type) !== (current_stage.id ?? current_stage.type)
		// console.log(new_stage, current_stage, changed)

		current_stage = new_stage
		current_stage_idx = new_stage_idx
		// completed = new_game_state.complete
		// if (!state.complete) round_audio.play()

		if (play_audio && !new_stage.no_sound && changed) {
			if (current_stage.type === 'complete' || current_stage.type === 'contemplation') complete_audio.play()
			else round_audio.play()
		}
	}
}

let timer: number | null | any // Timeout?
$: {
	// Sadly we can't use internal_state here because it generates a cyclic dependancy.
	let completed = current_stage ? current_stage.type === 'complete' : false
	// console.log('xx', state, timer, completed, current_stage)

	// if (state !== 'loading') tick(false)

	if (state === 'playing' && timer == null && !completed) {
		// setTimeout needed to get around some weird race condition.
		// There's probably better ways to structure this :/
		setTimeout(() => tick(false))
		timer = setInterval(() => {
			tick(true)
		}, 1000)
	} else if ((completed || state !== 'playing') && timer != null) {
		console.log('cancelled interval timer')
		clearInterval(timer)
		timer = null
	} else if (state === 'waiting' || state === 'paused') {
		setTimeout(() => tick(false))
	}
}

let game_completed: boolean
$: {
	// console.log('updating game_completed', current_stage)
	game_completed = (state !== 'playing' || current_stage == null) ? false
	: (current_stage.type === 'complete')
}

let internal_state: GameConfig['state'] | 'completed'
$: internal_state = game_completed ? 'completed' : state

let bar_width = 0
$: bar_width = current_stage == null ? 0
	: state === 'waiting' ? 0
	: current_stage.type === 'complete' ? 100
	: 100 * offset_sec / current_stage.duration

let stage_label: string
$: stage_label = internal_state === 'waiting' ? 'Waiting to start'
	: current_stage == null ? 'unknown' : current_stage.label


const progress_class = (stage_idx: number, baseline_idx: number): 's-done' | 's-active' | 's-waiting' => {
	if (current_stage == null || baseline_idx < 0) return 's-waiting'

	return stage_idx < baseline_idx ? 's-done'
		: stage_idx === baseline_idx ? 's-active'
		: 's-waiting'
}

// This will get more complex in time. For now, pause the game to fiddle.
$: settings_disabled = state === 'playing'

let config_open = false

$: if (_magister === true) config_open = true

// The first user has the config open by default.
// $: if (_active_sessions === 1) config_open = true

// The magister box is fully visible once there's a critical mass of players in the room
$: magister_opaque = _magister === true || _active_sessions >= 6

</script>

<svelte:head>
	{#if _magister}
		<style>
body {
	background-color: var(--bg-highlight);
}
		</style>
	{/if}
</svelte:head>

<!-- <main class:magister={_magister}> -->
<main>
	<!-- <audio bind:this={round_audio} src="/lo-metal-tone.mp3" preload="auto" autoplay><track kind="captions"></audio>
	<audio bind:this={complete_audio} src="/hi-metal-tone.mp3" preload="auto"><track kind="captions"></audio> -->

	{#if !audio_works}
		<button id='fixaudio' on:click={fix_audio}>Audio muted. Click to unmute</button>
	{/if}

	{#if internal_state === 'loading'}
		<h1>Loading game state</h1>
	{:else}
		<!-- <h1>Glass Bead Game Timer</h1> -->
		<!-- <h1>{topic}</h1> -->

		<div id='topic'>
			<div id='topicimg' bind:this={topic_img}></div>
			<div id='topictext' bind:this={topic_text}></div>
		</div>

		<h1 id='stagelabel'>{stage_label}</h1>
		<div id='progresscontainer'>
			<div id='progress_time'>{((internal_state === 'playing' || internal_state === 'paused') && current_stage) ? current_stage.duration - offset_sec : ''}</div>
			<div id='progress' style='width: {bar_width}%'></div>
		</div>

		<div id='gameprogress'>
			{#each game_stages as s, i}
				{#if s.type === 'bead' || s.type === 'breath'}
					<span class={'prog-' + s.type + ' ' + progress_class(i, current_stage_idx)} style='width: {100 * s.duration / inner_game_length}%'></span>
				{/if}
			{/each}
		</div>

		{#if (_magister == null || _magister == true)}
			{#if internal_state == 'waiting'}
				<button on:click={upd('state', 'playing')}>Start</button>
			{:else if internal_state == 'playing'}
				<button on:click={upd('state', 'paused')}>Pause</button>
			{:else if internal_state == 'paused'}
				<button on:click={upd('state', 'playing')}>Resume</button>
			{/if}
		{/if}

		<div style='height: 400px;'></div>

		<details>
			<!-- I'm not ready to delete these UI elements but we might not use them -->
			<summary>Info</summary>

			<h1>{game_config.topic}</h1>
			<h4>Room: <em>{room}</em> <a href="../..">(leave)</a></h4>

			<div>
				{state === 'waiting' ? 'Waiting for the game to start'
				: state === 'paused' ? 'GAME PAUSED'
				: state === 'playing' ? 'Game in progress'
				: ''}
			</div>
			{#if connection !== 'connected'}
				<div>DISCONNECTED FROM GAME SERVER</div>
			{:else}
				{#if _active_sessions == 1}
					<div>You are alone in the room</div>
				{:else}
					<div>{_active_sessions} players are in this room</div>
				{/if}
			{/if}
		</details>

		{#if _magister == null || _magister == true}
			<details class='config' bind:open={config_open}>
				<summary>Game controls</summary>

				<p>
					{#if _magister == null}
						This will effect all players. Will you borrow power? Will you steal it?
					{:else}
						You are master of the games. These controls are yours alone.
					{/if}
				</p>

				{#if internal_state == 'waiting'}
					<button on:click={upd('state', 'playing')}>Start</button>
				{:else if internal_state == 'playing'}
					<button on:click={upd('state', 'paused')}>Pause</button>
				{:else if internal_state == 'paused'}
					<button on:click={upd('state', 'playing')}>Resume</button>
				{/if}

				{#if internal_state == 'paused' || internal_state == 'completed' }
					<button on:click={upd('state', 'waiting')}>Restart game</button>
				{/if}

				<label>
					<span>Topic</span>
					<input disabled={settings_disabled} type='text' value={game_config.topic} on:input={config('topic')} list='archetopics' >
					<datalist id='archetopics'>
						{#each ARCHETOPICS as topic}
							<option value={topic}>
						{/each}
					</datalist>
				</label>

				<label>
					<span>Pre-game meditation</span>
					<input disabled={settings_disabled} type='checkbox' checked={game_config.meditate} on:input={config('meditate')} >
				</label>

				<label>
					<span>Post game contemplation</span>
					<input disabled={settings_disabled} type='checkbox' checked={game_config.contemplation} on:input={config('contemplation')} >
				</label>

				<label>
					<span>Number of players</span>
					<input disabled={settings_disabled} type='number' pattern='[0-9]*' value={game_config.players} on:input={config('players')} min=1 max=12 >
				</label>

				<label>
					<span>Number of rounds</span>
					<input disabled={settings_disabled} type='number' pattern='[0-9]*' value={game_config.rounds} on:input={config('rounds')} min=1 max=20>
				</label>

				<label>
					<span>Seconds per bead</span>
					<input disabled={settings_disabled} type='number' pattern='[0-9]*' value={game_config.seconds_per_bead} on:input={config('seconds_per_bead')}>
				</label>

				<label>
					<span>Seconds between beads</span>
					<input disabled={settings_disabled} type='number' pattern='[0-9]*' value={game_config.seconds_between_bead} on:input={config('seconds_between_bead')}>
				</label>

				<div style='margin-top: 1em;'>
					(Total game length: {roundish(
						game_stages.reduce((x, s) => x + s.duration, 0) / 60
					)} minutes)
				</div>

				<div id='magister_box' class:magister_opaque>
					{#if _magister == null}
						<button on:click={upd('_magister', true)}>Assume the mantle of Magister Ludi</button>
						<p><i>Advanced - for large games</i></p>
						<p>When present, the Magister Ludi (master of the games) has exclusive control of the game.</p>
					{:else if _magister == true}
						<button on:click={upd('_magister', null)}>Abdicate Magister Ludi status</button>
						<p>You are the master of the games. You have exclusive control over playing, pausing and configuring this game.</p>
						<p>Do not close this browser window or you will be dethroned.</p>
					{/if}
				</div>
			</details>
		{:else}
			<p class='config'>Magister Ludi is managing this game.</p>
		{/if}
	{/if}
</main>

<style>

main {
	/* margin-bottom: 3em; */
	text-align: center;
}

#fixaudio {
	z-index: 1;
	color: var(--fg-color);
	background-color: var(--bg-highlight);
	position: absolute;
	bottom: 2px;
	width: 300px;
	padding: 0.5em 1em;
	left: 50%;
	transform: translateX(-50%);
	font-size: 130%;
}

#topicimg {
	width: 300px;
	display: inline-block;
}
#topictext:not(:empty) {
	padding: 3em 0 2em 0;
	font-size: 130%;
	font-style: italic;
}

/* .magister {
	background-color: var(--bg-highlight);
} */

/* h1 {
	margin-top: 1em;
} */

#stagelabel:empty {
	height: 1.2em;
}

#progresscontainer {
	/* width: calc(100% - 50px); */
	position: relative;
	margin: 10px 25px;
	height: 5em;
	border: 2px solid var(--fg-color);
	/* margin-bottom: 0; */
}

#progress_time {
	position: absolute;
	/* color: red; */
	/* font-size: var(--bg-color); */
	color: white;
	/* color: white; */
	font-size: 54px;
	margin-left: 5px;
	mix-blend-mode: difference;
}

#progress {
	background-color: var(--fg-color);
	/* width: 50%; */
	height: 100%;
	/* transition: width 1s linear; */
}

#gameprogress {
	/* width: 300px; */
	margin: 25px;
	height: 15px;
	/* background-color: blue; */
	margin-top: 0;
}

#gameprogress > span {
	display: inline-block;
	/* height: 10px; */
	background-color: var(--fg-color);
	/* border-left: 1px solid var(--bg-color);
	border-right: 1px solid var(--bg-color); */
}

/* .prog-waiting {
	height: 100%;
} */
/* .prog-meditate, .prog-contemplation {
	height: 50%;
} */
.prog-bead {
	height: 100%;
}
/* .prog-breath {
} */

.s-done {
	opacity: 20%;
}
/* .s-active {

} */
.s-waiting {
	opacity: 50%;
}


/***** Game config *****/
.config {
	margin-top: 2em;
}

summary {
	text-decoration: underline;
	cursor: pointer;
}

button {
	font-size: 140%;
	margin: 10px 0;
	color: var(--bg-color);
	/* color: var(--fg-color); */
}

details > :first-child {
	margin-bottom: 1em;
}

label {
	margin-bottom: 3px;
}
label > :first-child {
	display: inline-block;
	min-width: 14em;
}

input {
	width: 7em;
	font-size: 16px;
	/* color: var(--bg-color); */
	border: 2px solid #686868;
}

input[type=checkbox] {
	height: 1em;
}

label {
	display: block;
}

#magister_box {
	border: 1px dashed var(--fg-color);
	/* margin: 1em 0; */
	margin: 1em auto;
	padding: 0.8em;
	max-width: 500px;
	background-color: var(--bg-highlight);
	opacity: 40%;
	transition: opacity 0.3s ease-out;
}

#magister_box.magister_opaque, #magister_box:hover {
	opacity: 100%;
}

#magister_box > button {
	display: block;
	font-size: 100%;
	width: 100%;
	margin-top: 0;
	padding: 3px 0;
}

</style>