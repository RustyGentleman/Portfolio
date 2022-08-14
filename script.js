$(document).ready(function(){
	// ? ----------------- Constants ---------------- //
	const DEBUG = 1
	const PERSPECTIVE = 1500
	const isMobile = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches
	// ? --------------- Statekeepers --------------- //
	let offsets = []
	let mouse = {x: 0, y: 0, moved: false}
	// ? --------- Quick-access collections --------- //
	let $windows = Array.from(document.querySelectorAll('.window'))
	let $current_window_id = document.querySelector('.window.current').id
	let $panels = []
	let $panels_start = []
	// ? ------------ Performance guards ------------ //
	let interval = 16
	let face_calls = 0
	let allow_face_call = true
	let interval_fps_setter
	let interval_allowcall

	ResetIntervals()

	// ! -------------------------------------------- //
	// ! ------------------- Setup ------------------ //
	// ! -------------------------------------------- //
	// * Duplicate profile element
	// * Populate $panels and $panels_start collections
	$('.window').each((_, w) => {
		if (!$(w).children().filter('#profile')[0])
			$(w).children().first().before($('#profile').clone(true))
		if (w.id == 'window-start')
			$panels_start = Array.from(document.getElementById('window-start').getElementsByClassName('face'))
		Array.from(w.getElementsByClassName('face')).forEach((e, i) =>
			$panels.push([e, i, w.id]))
	})
	// * Flash on click CSS thing
	$panels.forEach((e, _) => 
		$(e[0]).on('click', () => 
			setTimeout(() => 
				document.activeElement.blur(), 100)))
	// * Create shadow and chromatic aberration duplicates
	$('.panel-lining').each((_, e) => {
		$(e).before($(e).clone().addClass('shadow'))
		$(e).before($(e).clone().addClass('shift up'))
		$(e).before($(e).clone().addClass('shift down'))
	})
	// * Call Face every 'interval' ms
	if (!isMobile())
		setInterval(() => Face(), interval)
	$(window).on('scroll', (event) => {
		mouse.moved = true
		Face()
	})
	$('.panel-lining.backface').toggle()
	
	// * Custom bars
	$('bar').replaceWith(function() {
		let container = $('<div class="bar-container"></div>')
		let filled = parseInt($(this).attr('value'))
		let caption = ''
		switch (filled) {
			case 1:
				caption = 'Beginner'
				break
			case 2:
				caption = 'Intermediate'
				break
			case 3:
				caption = 'Proficient'
				break
			case 4:
				caption = 'Expert'
				break
		}
		let bars = $('<div class="bars"></div>')
		for (let loop=0; loop<4; loop++){
			let bar = $(`<div class="bar"></div>`)
			if (filled > 0)
				bar.addClass('filled')
			bars.append(bar)
			filled--
		}
		container.append($(`<span class="caption">${caption}</span>`))
		container.append(bars)
		return container
	})

	// ! -------------------------------------------- //
	// ! ----------------- Listeners ---------------- //
	// ! -------------------------------------------- //

	// * Perspective mousemovement stuff
	if (!isMobile()) {
		$(window).on('resize', MouseLeave)
		$(document.body).on('mouseleave', MouseLeave)
		$(document.body).on('mouseenter', () => $panels.forEach((e) => $(e[0]).stop()))
		$(document.body).on('mousemove', (event) => {
			mouse.x = event.screenX
			mouse.y = event.screenY
			mouse.moved = true
		})
	}
	//* Page switches
	$('[data-link]').on('click', function(){SwitchPage($(this).data('link'))})
	//* Flippables
	$('.panel.flip').on('click', function(){FlipPanel(this)})

	MouseLeave()

	function Face(force = false){
		face_calls++
		if (!force) {
			if (!mouse.moved)
				return
			if (!allow_face_call)
				return
		}
		$panels_start.forEach((e, i) => {
			let rects = e.getBoundingClientRect()
			let offx = mouse.x - (rects.left + (rects.width / 2))
			let offy = mouse.y - (rects.top + (rects.height / 2))
			let angleh = Math.atan(offx / PERSPECTIVE)
			let anglev = Math.atan(offy / PERSPECTIVE)
			offsets[i] = {offx: angleh, offxa: Math.abs(angleh), offy: -anglev}
		})
		$panels.forEach((e) => {
			if (e[2] == $current_window_id){
				e[0].style.setProperty('--off-x', `${offsets[e[1]].offx}`)
				e[0].style.setProperty('--off-xa', `${offsets[e[1]].offxa}`)
				e[0].style.setProperty('--off-y', `${offsets[e[1]].offy}`)
			}
		})
		mouse.moved = false
		allow_face_call = false
	}
	function MouseLeave(){
		mouse.moved = false
		allow_face_call = false
		$panels.forEach((e) => {
			let rects = e[0].getBoundingClientRect()
			mouse.x = window.innerWidth/2
			mouse.y = window.innerHeight/2
			let offx = (window.innerWidth/2) - (rects.left + (rects.width / 2))
			let offy = (window.innerHeight/2) - (rects.top + (rects.height / 2))
			let angleh = parseFloat(e[0].style.getPropertyValue('--off-x'))
			let anglev = parseFloat(e[0].style.getPropertyValue('--off-y'))
			$(e[0]).css('left', angleh)
			$(e[0]).css('top', anglev)
			angleh = Math.atan(offx / PERSPECTIVE)
			anglev = Math.atan(offy / PERSPECTIVE)
			$(e[0]).animate({left: angleh}, {
				duration: 1000,
				queue: 'face',
				step: (now, fx) => {
					$(e[0]).css('--off-x', `${now}`)
					$(e[0]).css('--off-xa', `${Math.abs(now)}`)
				},
				complete: () => $(e[0]).css('left', '')
			}).dequeue('face')
			$(e[0]).animate({top: -anglev}, {
				duration: 1000,
				queue: 'face',
				step: (now, fx) => {
					$(e[0]).css('--off-y', `${now}`)
				},
				complete: () => $(e[0]).css('top', '')
			}).dequeue('face')
		})
	}
	function SwitchPage(id){
		if (document.getElementById(`window-${id}`)) {
			$('.current').children().find('.flip[style~="--flip:1;"]').click()
			$('.current').toggleClass('current')
			$(`#window-${id}`).toggleClass('current')
			$current_window_id = `window-${id}`
		}
		Face(force = true)
	}
	function FlipPanel(element){
		let deg = parseInt(Array.from($(element).css('--rot-y').match(/[0-9]+/g)).pop())
		if (deg == 1)
			deg = 0
		let final = deg + 180
		let toggled = false
		$(element).toggleClass('flipped')
		$({n: deg}).animate({n: final}, {
			duration: 500,
			step: (now) => {
				if ((now >= deg+((final-deg)/2)) && !toggled){
					$(element).find('.panel-lining').toggle()
					toggled = true
				}
				$(element).css('--rot-y', `calc(var(--off-x) * 1rad + ${now}deg)`)
			}
		})
		if (final == 360)
			$(element).css('--flip', '0')
		else
			$(element).css('--flip', '1')
	}
	function ResetIntervals() {
		clearInterval(interval_fps_setter)
		clearInterval(interval_allowcall)
		// interval_fps_setter = setInterval(() => {
		// 	interval = parseInt((1000/face_calls) * 0.8)
		// 	ResetIntervals()
		// 	face_calls = 0
		// }, 1000)
		interval_allowcall = setInterval(() =>
			allow_face_call = true, interval)
	}
})