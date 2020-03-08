export default function (obj : any) {
	var k, cls = "";
	for (k in obj) {
		if (obj[k]) {
			if (cls) cls += " ";
			cls += k;
		}
	}
	return cls;
}