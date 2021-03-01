define([],function(){
	function safeParseTuple(obj, reviver) {
	    var json
	    var error = null

	    try {
	        json = JSON.parse(obj, reviver)
	    } catch (err) {
	        error = err
	    }

	    return [error, json]
	}

	return 	safeParseTuple;
});

