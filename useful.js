module.exports = {
		arrayRotate: function (arr, count) {
	  		count -= arr.length * Math.floor(count / arr.length);
	  		arr.push.apply(arr, arr.splice(0, count));
	  		return arr;
		}
}