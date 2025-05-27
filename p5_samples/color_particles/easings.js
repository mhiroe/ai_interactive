// https://easings.net/
const easingFuncs = [easeInOutCubic, easeInCubic, easeOutCubic];
const easingFuncs_ = [easeInOutCubic, easeInCubic, easeOutCubic, easeInOutElastic, easeOutBounce, easeInOutBack];

function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeInCubic(x) {
	return x * x * x;
}
function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

function easeInOutElastic(x) {
	const c5 = (2 * Math.PI) / 4.5;
	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5
		? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
		: (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}
function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
			return n1 * x * x;
	} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}
function easeInOutBack(x){
	const c1 = 1.70158;
	const c2 = c1 * 1.525;

	return x < 0.5
		? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
		: (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}