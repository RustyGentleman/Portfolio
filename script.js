$(document).ready(function(){
	const DEBUG = 1
	const PERSPECTIVE = 1500
	let mouse = {x: 0, y: 0, moved: false}
	let $panels = $('.face')

	// Setup
	$panels.each((i, e) => {
		$(e).on('click', () => setTimeout(() => document.activeElement.blur(), 100))
		$(e).css('--bg-anim-delay', Math.floor(Math.random()*10)+'ms')
	})
	$('.window').each((_, w) => {
		$(w).children().each((pi, pe) => {
			$(pe).on('mouseenter', function() {
				$('.window').each((ci, ce) => $($(ce).children()[pi].firstElementChild).addClass('hovered'))
			})
			.on('mouseleave', function() {
				$('.window').each((ci, ce) => $($(ce).children()[pi].firstElementChild).removeClass('hovered'))
			})
		})
	})
	$('.panel-lining').each((_, e) => {
		$(e).before($(e).clone().addClass('shadow'))
		$(e).before($(e).clone().addClass('shift up'))
		$(e).before($(e).clone().addClass('shift down'))
	})
	setInterval(() => Face(), 16)
	$(window).on('scroll', (event) => Face())
	$('.panel-lining.backface').toggle()

	// Perspective mousemovement stuff
	$(window).on('resize', () => {
		MouseLeave()
	})
	$(document.body).on('mouseleave', MouseLeave)
	$(document.body).on('mouseenter', () => $panels.each((i, e) => $(e).stop()))
	$(document.body).on('mousemove', (event) => {
		if (event.screenX == mouse.x && event.screenY == mouse.y)
			mouse.moved = false
		else{
			mouse.x = event.screenX
			mouse.y = event.screenY
			mouse.moved = true
		}
	})
	// Page switches
	$('[data-link]').on('click', function(){SwitchPage($(this).data('link'))})
	// Custom bars
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
	// Flippables
	$('.panel.flip').on('click', function(){FlipPanel(this)})
	
	MouseLeave()
	
	function Face(){
		// face_calls++
		if (!mouse.moved) return
		else $panels.each((i, e) => {
			let rects = e.getBoundingClientRect()
			let offx = mouse.x - (rects.left + (rects.width / 2))
			let offy = mouse.y - (rects.top + (rects.height / 2))
			let angleh = Math.atan(offx / PERSPECTIVE)
			let anglev = Math.atan(offy / PERSPECTIVE)
			$(e).css('--off-x', `${angleh}`)
			$(e).css('--off-xa', `${Math.abs(angleh)}`)
			$(e).css('--off-y', `${-anglev}`)
		})
	}
	function MouseLeave(){
		mouse.moved = false
		$panels.each((i, e) => {
			let rects = e.getBoundingClientRect()
			mouse.x = window.innerWidth/2
			mouse.y = window.innerHeight/2
			let offx = (window.innerWidth/2) - (rects.left + (rects.width / 2))
			let offy = (window.innerHeight/2) - (rects.top + (rects.height / 2))
			let angleh = parseFloat($(e).css('--off-x'))
			let anglev = parseFloat($(e).css('--off-y'))
			$(e).css('left', angleh)
			$(e).css('top', anglev)
			angleh = Math.atan(offx / PERSPECTIVE)
			anglev = Math.atan(offy / PERSPECTIVE)
			$(e).animate({left: angleh}, {
				duration: 1000,
				queue: 'face',
				step: (now, fx) => {
					$(e).css('--off-x', `${now}`)
					$(e).css('--off-xa', `${Math.abs(now)}`)
				},
				complete: () => $(e).css('left', '')
			}).dequeue('face')
			$(e).animate({top: -anglev}, {
				duration: 1000,
				queue: 'face',
				step: (now, fx) => {
					$(e).css('--off-y', `${now}`)
				},
				complete: () => $(e).css('top', '')
			}).dequeue('face')
		})
	}
	function SwitchPage(id){
		if (document.getElementById(`window-${id}`)) {
			$('.current').toggleClass('current')
			$(`#window-${id}`).toggleClass('current')
		}
	}
	function FlipPanel(element){
		let deg = ($(element).css('--flip') == '1')? 180 : 0
		let final = ($(element).css('--flip') == '1')? 360 : 180
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
		if (final == 360){
			$(element).css('--flip', '0')
		}else{
			$(element).css('--flip', '1')
		}
	}
})